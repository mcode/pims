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
import { getConfig, updateConfig, getNCPDPEndpoint, getETASUEndpoint, getRxFillEndpoint } from '../lib/pharmacyConfig.js';

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
          remsNote: initiationResponse.remsNote
        };

        if (initiationResponse.caseNumber) {
          updateData.caseNumber = initiationResponse.caseNumber;
          console.log('Received REMS Case Number:', initiationResponse.caseNumber);
        }

        if (initiationResponse.remsPatientId) {
          console.log('Received REMS Patient ID:', initiationResponse.remsPatientId);
        }

        if (initiationResponse.status === 'CLOSED') {
          updateData.denialReasonCode = initiationResponse.reasonCode;
          console.log('REMSInitiation CLOSED:', initiationResponse.reasonCode);
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
  console.log('processNewRx NCPDP SCRIPT message');
  console.log(JSON.stringify(req.body));
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
      dispenseStatus: getDispenseStatus(order, ncpdpResponse)
    };

    if (ncpdpResponse.status === 'APPROVED') {
      updateData.authorizationNumber = ncpdpResponse.authorizationNumber;
      updateData.authorizationExpiration = ncpdpResponse.authorizationExpiration;
      updateData.caseNumber = ncpdpResponse.caseId;
      
      // Format approval note with ETASU summary
      let approvalNote = `APPROVED - Authorization: ${ncpdpResponse.authorizationNumber}, Expires: ${ncpdpResponse.authorizationExpiration}`;
      updateData.remsNote = approvalNote;
      updateData.denialReasonCode = null;
      console.log('APPROVED:', ncpdpResponse.authorizationNumber);
    } else if (ncpdpResponse.status === 'DENIED') {
      updateData.denialReasonCode = ncpdpResponse.reasonCode;
      updateData.remsNote = ncpdpResponse.remsNote;
      updateData.caseNumber = ncpdpResponse.caseId;
      console.log('DENIED:', ncpdpResponse.reasonCode);
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
 * Description : 'Updates prescription metRequirements based on mongo id'
 */
router.patch('/api/updateRx/:id/metRequirements', async (req, res) => {
  try {
    // Finding by id
    const order = await doctorOrder.findById(req.params.id).exec();
    console.log('Found doctor order by id! --- ', order);

    const guidanceResponse = await getGuidanceResponse(order);
    const metRequirements =
      guidanceResponse?.contained?.[0]?.['parameter'] || order.metRequirements;

    // Saving and updating
    const newOrder = await doctorOrder.findOneAndUpdate(
      { _id: req.params.id },
      { metRequirements },
      { new: true }
    );

    res.send(newOrder);
    console.log('Updated order');
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
      
    const config = getConfig();

    if (config.useIntermediary) {
      // Send to intermediary - it will forward to both EHR and REMS Admin
      const endpoint = getRxFillEndpoint();
      console.log(`Sending RxFill to intermediary: ${endpoint}`);
      await axios.post(endpoint, rxFill, {
        headers: { 'Content-Type': 'application/xml' }
      });
    } else {
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
  console.log(order);
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
 * Get FHIR ETASU URL for the order
 * Used for GuidanceResponse calls (View ETASU)
 */
const getEtasuUrl = order => {
  let baseUrl;

  if (env.USE_INTERMEDIARY) {
    baseUrl = env.INTERMEDIARY_FHIR_URL;
  } else {
    const remsDrug = medicationRequestToRemsAdmins.find(entry => {
      if (order.drugNdcCode && entry.ndc) {
        return order.drugNdcCode === entry.ndc;
      }

      if (order.drugRxnormCode && entry.rxnorm) {
        return Number(order.drugRxnormCode) === Number(entry.rxnorm);
      }

      return false;
    });
    baseUrl = remsDrug?.remsAdminFhirUrl;
  }

  const etasuUrl = baseUrl + '/GuidanceResponse/$rems-etasu';
  return baseUrl ? etasuUrl : null;
};

/**
 * Get FHIR GuidanceResponse for ETASU requirements
 * Used by View ETASU button
 */
const getGuidanceResponse = async order => {
  const etasuUrl = getEtasuUrl(order);

  if (!etasuUrl) {
    return null;
  }

  // Make the etasu call with the case number if it exists, if not call with patient and medication
  let body = {};
  if (order.caseNumber && !env.USE_INTERMEDIARY) {
    body = {
      resourceType: 'Parameters',
      parameter: [
        {
          name: 'caseNumber',
          valueString: order.caseNumber
        }
      ]
    };
  } else {
    let medicationCoding = [];

    if (order.drugNdcCode) {
      medicationCoding.push({
        system: 'http://hl7.org/fhir/sid/ndc',
        code: order.drugNdcCode,
        display: order.drugNames
      });
    }

    if (order.drugRxnormCode) {
      medicationCoding.push({
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: order.drugRxnormCode,
        display: order.drugNames
      });
    } else {
      const remsDrug = medicationRequestToRemsAdmins.find(entry => {
        return order.drugNdcCode && entry.ndc && order.drugNdcCode === entry.ndc;
      });

      if (remsDrug && remsDrug.rxnorm) {
        medicationCoding.push({
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: remsDrug.rxnorm.toString(),
          display: order.drugNames
        });
      }
    }

    body = {
      resourceType: 'Parameters',
      parameter: [
        {
          name: 'patient',
          resource: {
            resourceType: 'Patient',
            id: order.prescriberOrderNumber,
            name: [
              {
                family: order.patientLastName,
                given: order.patientName.split(' '),
                use: 'official'
              }
            ],
            birthDate: order.patientDOB
          }
        },
        {
          name: 'medication',
          resource: {
            resourceType: 'Medication',
            id: order.prescriberOrderNumber,
            code: {
              coding: medicationCoding
            }
          }
        }
      ]
    };
  }

  try {
    const response = await axios.post(etasuUrl, body, {
        headers: {
        'content-type': 'application/json'
      }
    });
    console.log('Retrieved FHIR GuidanceResponse', JSON.stringify(response.data, null, 4));
    console.log('URL', etasuUrl);
    const responseResource = response.data.parameter?.[0]?.resource;
    return responseResource;
  } catch (error) {
    console.log('Error fetching FHIR GuidanceResponse:', error.message);
    return null;
  }
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

    const endpoint = getNCPDPEndpoint();
    console.log(`Sending REMSInitiationRequest to: ${endpoint}`);
    
    const response = await axios.post(
      endpoint,
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
    console.log(remsRequest)

    const endpoint = getNCPDPEndpoint();
    console.log(`Sending REMSRequest to: ${endpoint}`);
    
    const response = await axios.post(
      endpoint,
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
  const message = parsedXml?.message;
  const body = message?.body;
  const initResponse = body?.remsinitiationresponse;
  console.log(message);
  console.log(initResponse);

  if (!initResponse) {
    console.log('No REMSInitiationResponse found');
    return null;
  }

  const response = initResponse.response;
  const responseStatus = response?.responsestatus;

  // Check for Closed status (requirements not met)
  const closed = responseStatus?.closed;
  if (closed) {
    const reasonCode = closed.reasoncode;
    const remsNote = closed.remsnote || '';

    return {
      status: 'CLOSED',
      reasonCode: reasonCode,
      remsNote: remsNote,
    };
  }

  // Extract case ID and patient ID from successful initiation
  const patient = initResponse.patient;
  const humanPatient = patient?.humanpatient;
  const identification = humanPatient?.identification;
  const remsPatientId = identification?.remspatientid;

  // Check if there's a case number in the response
  let caseNumber = null;
  const medication = initResponse.medicationprescribed;
  if (medication) {
    // Some implementations include case number in initiation success
    caseNumber = remsPatientId; // Often the case number is returned as patient ID
  }

  return {
    status: 'OPEN',
    remsPatientId: remsPatientId,
    caseNumber: caseNumber,
  };
};

/**
 * Parse NCPDP REMSResponse per spec
 * Extracts authorization status, case ID, and NCPDP rejection code
 */
const parseREMSResponse = parsedXml => {
  const message = parsedXml?.message;
  const body = message?.body;
  const remsResponse = body?.remsresponse;
  console.log(message);
  console.log(remsResponse);

  if (!remsResponse) {
    console.log('No REMSResponse found');
    return null;
  }

  const request = remsResponse.request;

  const response = remsResponse.response;
  const responseStatus = response?.responsestatus;

  // Check for APPROVED status
  const approved = responseStatus?.approved;
  if (approved) {
    const caseId = approved.remscaseid;
    const authNumber = approved.remsauthorizationnumber;
    const authPeriod = approved.authorizationperiod;
    const expiration = authPeriod?.expirationdate?.date;

    return {
      status: 'APPROVED',
      caseId: caseId,
      authorizationNumber: authNumber,
      authorizationExpiration: expiration,
      remsNote: 'All REMS requirements have been met and verified. Authorization granted for dispensing.',
    };
  }

  // Check for DENIED status
  const denied = responseStatus?.denied;
  if (denied) {
    const caseId = denied.remscaseid;
    const reasonCode = denied.deniedreasoncode;
    const remsNote = denied.remsnote || '';

 

    return {
      status: 'DENIED',
      caseId: caseId,
      reasonCode: reasonCode,
      remsNote: remsNote,
    };
  }

  return null;
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

/**
 * Route: 'doctorOrders/api/config'
 * Description: 'Get current pharmacy configuration'
 */
router.get('/api/config', async (_req, res) => {
  const config = getConfig();
  console.log('Returning configuration:', config);
  res.json(config);
});

/**
 * Route: 'doctorOrders/api/config'
 * Description: 'Update pharmacy configuration'
 */
router.post('/api/config', async (req, res) => {
  const newConfig = updateConfig(req.body);
  console.log('Configuration updated:', newConfig);
  res.json(newConfig);
});


export default router;