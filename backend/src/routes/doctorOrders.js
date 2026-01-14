import express from 'express';
const router = express.Router();
import { doctorOrder, orderSchema } from '../database/schemas/doctorOrderSchemas.js';
import axios from 'axios';
// XML Parsing Middleware used for NCPDP SCRIPT
import bodyParser from 'body-parser';
import bpx from 'body-parser-xml';
import { parseStringPromise } from "xml2js";
import env from 'var';
import {
  buildRxStatus,
  buildRxFill,
  buildRxError,
  buildREMSInitiationRequest,
  buildREMSRequest
} from '../ncpdpScriptBuilder/buildScript.v2017071.js';
import { NewRx } from '../database/schemas/newRx.js';
import { medicationRequestToRemsAdmins } from '../database/data.js';

bpx(bodyParser);
router.use(
  bodyParser.xml({
    type: ['application/xml'],
    xmlParseOptions: {
      normalize: true, 
      explicitArray: false
    }
  })
);
router.use(bodyParser.urlencoded({ extended: false }));

const XML2JS_OPTS = {
  explicitArray: false,
  trim: true,
  normalize: true,
  normalizeTags: true, // <-- makes all tag names lower case
};

/**
 * Route: 'doctorOrders/api/getRx/pending'
 * Description: 'Returns all pending documents in database for PIMS'
 */
router.get('/api/getRx/pending', async (_req, res) => {
  const order = await doctorOrder.find({ dispenseStatus: 'Pending' });
  console.log('Database returned with new orders');
  res.json(order);
});

/**
 * Route: 'doctorOrders/api/getRx/approved'
 * Description: 'Returns all approved documents in database for PIMS'
 */
router.get('/api/getRx/approved', async (_req, res) => {
  const order = await doctorOrder.find({ dispenseStatus: 'Approved' });
  console.log('Database returned with approved orders');
  res.json(order);
});

/**
 * Route: 'doctorOrders/api/getRx/pickedUp'
 * Description: 'Returns all picked up documents in database for PIMS'
 */
router.get('/api/getRx/pickedUp', async (_req, res) => {
  const order = await doctorOrder.find({ dispenseStatus: 'Picked Up' });
  console.log('Database returned with picked up orders');
  res.json(order);
});

/**
 * Description: Process addRx / NewRx NCPDP message.
 */
export async function processNewRx(newRxMessageConvertedToJSON) {
  console.log('processNewRx NCPDP SCRIPT message');
  console.log(JSON.stringify(newRxMessageConvertedToJSON));
  const newOrder = await parseNCPDPScript(newRxMessageConvertedToJSON);

  try {
    const newRx = new NewRx({
      prescriberOrderNumber: newRxMessageConvertedToJSON.Message.Header.PrescriberOrderNumber,
      serializedJSON: JSON.stringify(newRxMessageConvertedToJSON)
    });
    await newRx.save();
    console.log('Saved NewRx');
  } catch (error) {
    let errorStr = 'Could not store the NewRx';
    console.log(errorStr, error);
    return buildRxError(newRxMessageConvertedToJSON, errorStr);
  }

  try {
    await newOrder.save();
    console.log('DoctorOrder was saved');
  } catch (error) {
    let errorStr = 'ERROR! duplicate found, prescription already exists';
    console.log(errorStr, error);
    return buildRxError(errorStr);
  }

  const rxStatus = buildRxStatus(newRxMessageConvertedToJSON);
  console.log('Returning RxStatus');
  console.log(rxStatus);

  // If REMS drug, send REMSInitiationRequest per NCPDP spec
  if (isRemsDrug(newOrder)) {
    console.log('REMS drug detected - sending REMSInitiationRequest per NCPDP workflow');
    try {
      const initiationResponse = await sendREMSInitiationRequest(newOrder);

      if (initiationResponse) {
        const updateData = {
          remsNote: initiationResponse.remsNote,
          metRequirements: initiationResponse.metRequirements || []
        };

        if (initiationResponse.caseNumber) {
          updateData.caseNumber = initiationResponse.caseNumber;
          console.log('Received REMS Case Number:', initiationResponse.caseNumber);
        }

        if (initiationResponse.remsPatientId) {
          console.log('Received REMS Patient ID:', initiationResponse.remsPatientId);
        }

        if (initiationResponse.status === 'CLOSED') {
          updateData.denialReasonCodes = initiationResponse.reasonCodes.join(',');
          console.log('REMSInitiation CLOSED:', initiationResponse.reasonCodes);
        }

        await doctorOrder.updateOne({ _id: newOrder._id }, updateData);
        console.log('Updated order with REMSInitiation response');
      }
    } catch (error) {
      console.log('Error processing REMSInitiationRequest:', error);
    }
  }
  return rxStatus;
}

/**
 * Route: 'doctorOrders/api/addRx'
 * Description : 'Saves a new Doctor Order to db'
 */
router.post('/api/addRx', async (req, res) => {
  // Parsing incoming NCPDP SCRIPT XML to doctorOrder JSON
  const newRxMessageConvertedToJSON = req.body;
  const status = await processNewRx(newRxMessageConvertedToJSON);
  res.send(status);
  console.log('Sent Status/Error');
});

/**
 * Route: 'doctorOrders/api/updateRx/:id'
 * Description : 'Updates prescription based on mongo id, sends NCPDP REMSRequest for authorization'
 */
router.patch('/api/updateRx/:id', async (req, res) => {
  try {
    const order = await doctorOrder.findById(req.params.id).exec();
    console.log('Found doctor order by id! --- ', order);

    // Non-REMS drugs auto-approve
    if (!isRemsDrug(order)) {
      const newOrder = await doctorOrder.findOneAndUpdate(
        { _id: req.params.id },
        { dispenseStatus: 'Approved' },
        { new: true }
      );
      res.send(newOrder);
      console.log('Non-REMS drug - auto-approved');
      return;
    }

    // REMS drugs - send NCPDP REMSRequest per spec
    console.log('REMS drug - sending REMSRequest for authorization per NCPDP workflow');
    const ncpdpResponse = await sendREMSRequest(order);

    if (!ncpdpResponse) {
      res.send(order);
      console.log('NCPDP REMSRequest failed');
      return;
    }

    // Update based on NCPDP response
    const updateData = {
      dispenseStatus: getDispenseStatus(order, ncpdpResponse),
      metRequirements: ncpdpResponse.metRequirements || order.metRequirements
    };

    if (ncpdpResponse.status === 'APPROVED') {
      updateData.authorizationNumber = ncpdpResponse.authorizationNumber;
      updateData.authorizationExpiration = ncpdpResponse.authorizationExpiration;
      updateData.caseNumber = ncpdpResponse.caseId;
      
      // Format approval note with ETASU summary
      let approvalNote = `APPROVED - Authorization: ${ncpdpResponse.authorizationNumber}, Expires: ${ncpdpResponse.authorizationExpiration}`;
      if (ncpdpResponse.etasuSummary) {
        approvalNote += `\n\nETASU Requirements Met:\n${ncpdpResponse.etasuSummary}`;
      }
      updateData.remsNote = approvalNote;
      updateData.denialReasonCodes = null;
      console.log('APPROVED:', ncpdpResponse.authorizationNumber);
    } else if (ncpdpResponse.status === 'DENIED') {
      updateData.denialReasonCodes = ncpdpResponse.reasonCodes.join(',');
      updateData.remsNote = ncpdpResponse.remsNote;
      updateData.caseNumber = ncpdpResponse.caseId;
      console.log('DENIED:', ncpdpResponse.reasonCodes);
    }

    const newOrder = await doctorOrder.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      { new: true }
    );

    res.send(newOrder);
    console.log('Updated order with NCPDP response');
  } catch (error) {
    console.log('Error', error);
    return error;
  }
});

/**
 * Route: 'doctorOrders/api/updateRx/:id/metRequirements'
 * Description : 'Refreshes metRequirements via NCPDP REMSRequest'
 */
router.patch('/api/updateRx/:id/metRequirements', async (req, res) => {
  try {
    const order = await doctorOrder.findById(req.params.id).exec();
    console.log('Found doctor order by id! --- ', order);

    // Non-REMS drugs have no requirements
    if (!isRemsDrug(order)) {
      res.send(order);
      return;
    }

    // Check if we have a case number
    if (!order.caseNumber) {
      console.log('No case number available - need REMSInitiation first');
      res.send(order);
      return;
    }

    // REMS drugs with case number - refresh via REMSRequest
    console.log('Refreshing REMS requirements via REMSRequest for case:', order.caseNumber);
    const remsResponse = await sendREMSRequest(order);

    if (!remsResponse) {
      res.send(order);
      console.log('REMSRequest failed');
      return;
    }

    const updateData = {
      metRequirements: remsResponse.metRequirements || order.metRequirements,
      remsNote: remsResponse.remsNote
    };

    if (remsResponse.status === 'APPROVED') {
      // Don't change dispense status here - only update requirements info
      updateData.authorizationNumber = remsResponse.authorizationNumber;
      updateData.authorizationExpiration = remsResponse.authorizationExpiration;
    } else if (remsResponse.status === 'DENIED') {
      updateData.denialReasonCodes = remsResponse.reasonCodes.join(',');
    }

    const newOrder = await doctorOrder.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      { new: true }
    );

    res.send(newOrder);
    console.log('Updated metRequirements from NCPDP REMSRequest');
  } catch (error) {
    console.log('Error', error);
    return error;
  }
});

/**
 * Route: 'doctorOrders/api/updateRx/:id/pickedUp'
 * Description : 'Updates prescription dispense status to picked up and sends RxFill per NCPDP spec'
 */
router.patch('/api/updateRx/:id/pickedUp', async (req, res) => {
  let prescriberOrderNumber = null;
  try {
    const newOrder = await doctorOrder.findOneAndUpdate(
      { _id: req.params.id },
      { dispenseStatus: 'Picked Up' },
      { new: true }
    );
    res.send(newOrder);
    prescriberOrderNumber = newOrder.prescriberOrderNumber;
    console.log('Updated dispense status to picked up');
  } catch (error) {
    console.log('Could not update dispense status', error);
    return error;
  }

  // Send RxFill per NCPDP spec to BOTH EHR and REMS Admin
  try {
    const newRx = await NewRx.findOne({
      prescriberOrderNumber: prescriberOrderNumber
    });
    
    if (!newRx) {
      console.log('NewRx not found for RxFill');
      return;
    }

    const rxFill = buildRxFill(newRx);
    console.log('Sending RxFill per NCPDP workflow');

    // Send to EHR
    try {
      const ehrStatus = await axios.post(env.EHR_RXFILL_URL, rxFill, {
        headers: {
          Accept: 'application/xml',
          'Content-Type': 'application/xml'
        }
      });
      console.log('Sent RxFill to EHR, received status:', ehrStatus.data);
    } catch (ehrError) {
      console.log('Failed to send RxFill to EHR:', ehrError.message);
    }

    // Send to REMS Admin (required by NCPDP spec for REMS drugs)
    const order = await doctorOrder.findOne({ prescriberOrderNumber });
    if (isRemsDrug(order)) {
      try {
        const remsAdminStatus = await axios.post(
          env.REMS_ADMIN_NCPDP,
          rxFill,
          {
            headers: {
              Accept: 'application/xml',
              'Content-Type': 'application/xml'
            }
          }
        );
        console.log('Sent RxFill to REMS Admin, received status:', remsAdminStatus.data);
      } catch (remsError) {
        console.log('Failed to send RxFill to REMS Admin:', remsError.message);
      }
    }
  } catch (error) {
    console.log('Error in RxFill workflow:', error);
  }
});

/**
 * Route : 'doctorOrders/api/getRx/patient/:patientName/drug/:simpleDrugName`
 * Description : 'Fetches first available doctor order based on patientFirstName, patientLastName and patientDOB'
 */
router.get('/api/getRx/:patientFirstName/:patientLastName/:patientDOB', async (req, res) => {
  var searchDict = {
    patientFirstName: req.params.patientFirstName,
    patientLastName: req.params.patientLastName,
    patientDOB: req.params.patientDOB
  };

  if (req.query && Object.keys(req.query).length > 0) {
    for (const prop in req.query) {
      if (orderSchema.path(prop) != undefined) {
        searchDict[prop] = req.query[prop];
      }
    }
  }

  const prescription = await doctorOrder.findOne(searchDict).exec();
  console.log('Found doctor order');

  res.send(prescription);
});

/**
 * Description : 'Deletes all documents and prescriptions in PIMS'
 */
router.delete('/api/deleteAll', async (req, res) => {
  await doctorOrder.deleteMany({});
  console.log('All doctor orders deleted in PIMS!');
  await NewRx.deleteMany({});
  console.log("All NewRx's deleted in PIMS!");
  res.send([]);
});

const isRemsDrug = order => {
  return medicationRequestToRemsAdmins.some(entry => {
    if (order.drugNdcCode && entry.ndc) {
      return order.drugNdcCode === entry.ndc;
    }

    if (order.drugRxnormCode && entry.rxnorm) {
      return Number(order.drugRxnormCode) === Number(entry.rxnorm);
    }

    return false;
  });
};

/**
 * Send NCPDP REMSInitiationRequest to REMS Admin
 * Per NCPDP spec: Sent when prescription arrives to check REMS case status
 */
const sendREMSInitiationRequest = async order => {
  try {
    const newRx = await NewRx.findOne({
      prescriberOrderNumber: order.prescriberOrderNumber
    });

    if (!newRx) {
      console.log('NewRx not found for REMSInitiationRequest');
      return null;
    }

    const initiationRequest = buildREMSInitiationRequest(newRx);
    console.log('Sending REMSInitiationRequest to REMS Admin');

    console.log(initiationRequest)

    const response = await axios.post(
      env.REMS_ADMIN_NCPDP,
      initiationRequest,
      {
        headers: {
          Accept: 'application/xml',
          'Content-Type': 'application/xml'
        }
      }
    );

    const parsedResponse = await parseStringPromise(response.data, XML2JS_OPTS);

    console.log('Received REMSInitiationResponse');    
    console.log('Response:', response.data);

    return parseREMSInitiationResponse(parsedResponse);
  } catch (error) {
    console.log('Error sending REMSInitiationRequest:', error.message);
    return null;
  }
};

/**
 * Send NCPDP REMSRequest to REMS Admin for authorization
 * Per NCPDP spec: Sent at pickup time for authorization check
 */
const sendREMSRequest = async order => {
  try {
    const newRx = await NewRx.findOne({
      prescriberOrderNumber: order.prescriberOrderNumber
    });

    if (!newRx) {
      console.log('NewRx not found for REMSRequest');
      return null;
    }

    if (!order.caseNumber) {
      console.log('No case number - need REMSInitiationRequest first');
      return null;
    }

    const remsRequest = buildREMSRequest(newRx, order.caseNumber);
    console.log('Sending REMSRequest to REMS Admin for case:', order.caseNumber);

    const response = await axios.post(
      env.REMS_ADMIN_NCPDP,
      remsRequest,
      {
        headers: {
          Accept: 'application/xml',
          'Content-Type': 'application/xml'
        }
      }
    );

    const parsedResponse = await parseStringPromise(response.data, XML2JS_OPTS);

    console.log('Received REMSResponse');
    console.log('Response:', response.data);
    return parseREMSResponse(parsedResponse);
  } catch (error) {
    console.log('Error sending REMSRequest:', error.message);
    return null;
  }
};

/**
 * Parse NCPDP REMSInitiationResponse per spec
 * Extracts case info, status, and requirements
 */
const parseREMSInitiationResponse = parsedXml => {
  const message = parsedXml?.Message || parsedXml?.message;
  const body = message?.Body || message?.body;
  const initResponse = body?.REMSInitiationResponse || body?.remsinitiationresponse;
  console.log(message);
  console.log(initResponse);

  if (!initResponse) {
    console.log('No REMSInitiationResponse found');
    return null;
  }

  const response = initResponse.Response || initResponse.response;
  const responseStatus = response?.ResponseStatus || response?.responsestatus;

  // Check for Closed status (requirements not met)
  const closed = responseStatus?.Closed || responseStatus?.closed;
  if (closed) {
    let reasonCodes = closed.ReasonCode || closed.reasoncode;
    if (!Array.isArray(reasonCodes)) {
      reasonCodes = [reasonCodes];
    }
    const remsNote = closed.REMSNote || closed.remsnote || '';

    return {
      status: 'CLOSED',
      reasonCodes: reasonCodes,
      remsNote: remsNote,
      metRequirements: parseReasonCodesToRequirements(reasonCodes, remsNote)
    };
  }

  // Extract case ID and patient ID from successful initiation
  const patient = initResponse.Patient || initResponse.patient;
  const humanPatient = patient?.HumanPatient || patient?.humanpatient;
  const identification = humanPatient?.Identification || humanPatient?.identification;
  const remsPatientId = identification?.REMSPatientID || identification?.remspatientid;

  // Check if there's a case number in the response
  let caseNumber = null;
  const medication = initResponse.MedicationPrescribed || initResponse.medicationprescribed;
  if (medication) {
    // Some implementations include case number in initiation success
    caseNumber = remsPatientId; // Often the case number is returned as patient ID
  }

  return {
    status: 'OPEN',
    remsPatientId: remsPatientId,
    caseNumber: caseNumber,
    metRequirements: [] // No outstanding requirements
  };
};

/**
 * Parse NCPDP REMSResponse per spec
 * Extracts authorization status, case ID, and ETASU requirements from QuestionSet
 */
const parseREMSResponse = parsedXml => {
  const message = parsedXml?.Message || parsedXml?.message;
  const body = message?.Body || message?.body;
  const remsResponse = body?.REMSResponse || body?.remsresponse;
  console.log(message);
  console.log(remsResponse);

  if (!remsResponse) {
    console.log('No REMSResponse found');
    return null;
  }

  const request = remsResponse.Request || remsResponse.request;
  const solicitedModel = request?.SolicitedModel || request?.solicitedmodel;
  const questionSet = solicitedModel?.QuestionSet || solicitedModel?.questionset;

  const response = remsResponse.Response || remsResponse.response;
  const responseStatus = response?.ResponseStatus || response?.responsestatus;

  // Check for APPROVED status
  const approved = responseStatus?.Approved || responseStatus?.approved;
  if (approved) {
    const caseId = approved.REMSCaseID || approved.remscaseid;
    const authNumber = approved.REMSAuthorizationNumber || approved.remsauthorizationnumber;
    const authPeriod = approved.AuthorizationPeriod || approved.authorizationperiod;
    const expiration =
      authPeriod?.ExpirationDate?.Date ||
      authPeriod?.expirationdate?.date ||
      authPeriod?.expirationdate?.Date;

    // Parse QuestionSet to extract ETASU that were checked
    const etasuInfo = questionSet ? parseQuestionSetToETASU(questionSet) : null;

    // Create summary of met requirements
    let etasuSummary = '';
    let metRequirements = [];

    if (etasuInfo && etasuInfo.questions.length > 0) {
      etasuSummary = etasuInfo.questions
        .map(q => `• ${q.questionText}: ${q.answer}`)
        .join('\n');

      // Convert questions to metRequirements format
      metRequirements = etasuInfo.questions.map((q, idx) => ({
        name: q.questionText,
        resource: {
          status: 'success',
          resourceType: 'Observation',
          moduleUri: q.questionId,
          note: [{ text: `Verified: ${q.answer}` }],
          subject: {
            reference: 'patient'
          }
        }
      }));
    }

    return {
      status: 'APPROVED',
      caseId: caseId,
      authorizationNumber: authNumber,
      authorizationExpiration: expiration,
      remsNote: 'All REMS requirements have been met and verified. Authorization granted for dispensing.',
      etasuSummary: etasuSummary,
      metRequirements: metRequirements
    };
  }

  // Check for DENIED status
  const denied = responseStatus?.Denied || responseStatus?.denied;
  if (denied) {
    const caseId = denied.REMSCaseID || denied.remscaseid;
    let reasonCodes = denied.DeniedReasonCode || denied.deniedreason || denied.deniedreason.code;
    if (!Array.isArray(reasonCodes)) {
      reasonCodes = [reasonCodes];
    }
    const remsNote = denied.REMSNote || denied.remsnote || '';

    // Parse QuestionSet if present to show which ETASU failed
    const etasuInfo = questionSet ? parseQuestionSetToETASU(questionSet) : null;

    // Convert to metRequirements with failure status
    let metRequirements = parseReasonCodesToRequirements(reasonCodes, remsNote);

    // Add QuestionSet information if available
    if (etasuInfo && etasuInfo.questions.length > 0) {
      const questionReqs = etasuInfo.questions.map((q, idx) => ({
        name: q.questionText,
        resource: {
          status: 'pending',
          resourceType: 'Task',
          moduleUri: q.questionId,
          note: [{ text: `Required: ${q.questionText}` }],
          subject: {
            reference: 'patient'
          }
        }
      }));
      // Prepend question-based requirements
      metRequirements = [...questionReqs, ...metRequirements];
    }

    return {
      status: 'DENIED',
      caseId: caseId,
      reasonCodes: reasonCodes,
      remsNote: remsNote,
      metRequirements: metRequirements
    };
  }

  return null;
};

/**
 * Parse NCPDP QuestionSet to extract ETASU requirements
 * Per NCPDP spec: QuestionSet contains the REMS questions and answers
 */
const parseQuestionSetToETASU = questionSet => {
  const header = questionSet.Header || questionSet.header;
  const questions = questionSet.Question || questionSet.question;

  const questionArray = Array.isArray(questions) ? questions : [questions];

  const parsedQuestions = questionArray
    .filter(q => q) // Filter out null/undefined
    .map(q => {
      const questionId = q.QuestionID || q.questionid;
      const sequenceNumber = q.SequenceNumber || q.sequencenumber;
      const questionText = q.QuestionText || q.questiontext;
      const questionType = q.QuestionType || q.questiontype;

      // Extract answer if present
      let answer = 'Not answered';
      if (questionType) {
        const select = questionType.Select || questionType.select;
        if (select) {
          const answerObj = select.Answer || select.answer;
          if (answerObj) {
            const submittedAnswer =
              answerObj.SubmitterProvidedAnswer || answerObj.submitterprovided.answer;
            if (submittedAnswer) {
              const choiceId = submittedAnswer.ChoiceID || submittedAnswer.choiceid;

              // Find the choice text
              const choices = select.Choice || select.choice;
              const choiceArray = Array.isArray(choices) ? choices : [choices];

              const matchingChoice = choiceArray.find(c => {
                const cId = c.ChoiceID || c.choiceid;
                return cId === choiceId;
              });

              if (matchingChoice) {
                answer = matchingChoice.ChoiceText || matchingChoice.choicetext || choiceId;
              } else {
                answer = choiceId || 'Yes';
              }
            }
          }
        }
      }

      return {
        questionId,
        sequenceNumber,
        questionText,
        answer
      };
    });

  return {
    questionSetId: header?.QuestionSetID || header?.questionsetid,
    questionSetTitle: header?.QuestionSetTitle || header?.questionsettitle,
    questions: parsedQuestions
  };
};

/**
 * Convert NCPDP reason codes to metRequirements format
 * Per NCPDP spec: Reason codes indicate which stakeholder requirements are not met
 */
const parseReasonCodesToRequirements = (reasonCodes, remsNote) => {
  const codes = Array.isArray(reasonCodes) ? reasonCodes : [reasonCodes];
  const requirements = [];

  // NCPDP Reason Code mapping per spec
  const reasonCodeMap = {
    EM: { name: 'Patient Enrollment/Certification', stakeholder: 'patient' },
    ES: { name: 'Prescriber Enrollment/Certification', stakeholder: 'prescriber' },
    EO: { name: 'Pharmacy Enrollment/Certification', stakeholder: 'pharmacy' },
    EC: { name: 'Case Information', stakeholder: 'system' },
    ER: { name: 'REMS Program Error', stakeholder: 'system' },
    EX: { name: 'Prescriber Deactivated/Decertified', stakeholder: 'prescriber' },
    EY: { name: 'Pharmacy Deactivated/Decertified', stakeholder: 'pharmacy' },
    EZ: { name: 'Patient Deactivated/Decertified', stakeholder: 'patient' }
  };

  codes.forEach(code => {
    const mapping = reasonCodeMap[code] || {
      name: `REMS Requirement (${code})`,
      stakeholder: 'unknown'
    };

    requirements.push({
      name: mapping.name,
      resource: {
        status: 'pending',
        resourceType: 'Task',
        moduleUri: `rems-requirement-${code}`,
        note: [{ text: remsNote || `${mapping.name} required` }],
        subject: {
          reference: mapping.stakeholder
        }
      }
    });
  });

  return requirements;
};

/**
 * Determine dispense status based on NCPDP response
 */
const getDispenseStatus = (order, ncpdpResponse) => {
  // Non-REMS drugs auto-approve
  if (!ncpdpResponse) {
    if (order.dispenseStatus === 'Pending') return 'Approved';
    if (order.dispenseStatus === 'Picked Up') return 'Picked Up';
    return order.dispenseStatus;
  }

  // REMS drugs - check NCPDP response per spec
  if (ncpdpResponse.status === 'APPROVED') {
    return 'Approved';
  }

  if (order.dispenseStatus === 'Picked Up') {
    return 'Picked Up';
  }

  return 'Pending';
};

/**
 * Parse NCPDP SCRIPT NewRx to order format
 */
async function parseNCPDPScript(newRx) {
  // Parsing XML NCPDP SCRIPT from EHR
  const patient = newRx.Message.Body.NewRx.Patient;
  const prescriber = newRx.Message.Body.NewRx.Prescriber;
  const medicationPrescribed = newRx.Message.Body.NewRx.MedicationPrescribed;

  const incompleteOrder = {
    orderId: newRx.Message.Header.MessageID.toString(),
    caseNumber: newRx.Message.Header.AuthorizationNumber,
    prescriberOrderNumber: newRx.Message.Header.PrescriberOrderNumber,
    patientName: patient.HumanPatient.Name.FirstName + ' ' + patient.HumanPatient.Name.LastName,
    patientFirstName: patient.HumanPatient.Name.FirstName,
    patientLastName: patient.HumanPatient.Name.LastName,
    patientDOB: patient.HumanPatient.DateOfBirth.Date,
    patientCity: patient.HumanPatient.Address.City,
    patientStateProvince: patient.HumanPatient.Address.StateProvince,
    patientPostalCode: patient.HumanPatient.Address.PostalCode,
    patientCountry: patient.HumanPatient.Address.Country,
    doctorName:
      'Dr. ' +
      prescriber.NonVeterinarian.Name.FirstName +
      ' ' +
      prescriber.NonVeterinarian.Name.LastName,
    doctorContact: prescriber.NonVeterinarian.CommunicationNumbers.PrimaryTelephone?.Number,
    doctorID: prescriber.NonVeterinarian.Identification.NPI,
    doctorEmail: prescriber.NonVeterinarian.CommunicationNumbers.ElectronicMail,
    drugNames: medicationPrescribed.DrugDescription,
    simpleDrugName: medicationPrescribed.DrugDescription?.split(' ')[0],

    drugNdcCode:
      medicationPrescribed.DrugCoded.ProductCode?.Code || medicationPrescribed.DrugCoded.NDC || null,

    drugRxnormCode: medicationPrescribed.DrugCoded.DrugDBCode?.Code || null,

    rxDate: medicationPrescribed.WrittenDate.Date,
    drugPrice: 200,
    quantities: medicationPrescribed.Quantity.Value,
    total: 1800,
    pickupDate: 'Tue Dec 13 2022',
    dispenseStatus: 'Pending'
  };

  if (incompleteOrder.drugNames === undefined || incompleteOrder.drugNames === 'undefined') {
    incompleteOrder.drugNames = incompleteOrder.drugNdcCode;
    incompleteOrder.simpleDrugName = incompleteOrder.drugNdcCode;
  }

  const metRequirements = isRemsDrug(incompleteOrder) ? [] : null;
  const order = new doctorOrder({ ...incompleteOrder, metRequirements });
  return order;
}

export default router;