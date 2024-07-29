import express from 'express';
const router = express.Router();
import { doctorOrder, orderSchema } from '../database/schemas/doctorOrderSchemas.js';
import axios from 'axios';
// XML Parsing Middleware used for NCPDP SCRIPT
import bodyParser from 'body-parser';
import bpx from 'body-parser-xml';
import env from 'var';
import { buildRxStatus, buildRxFill } from '../ncpdpScriptBuilder/buildScript.v2017071.js';
import { NewRx } from '../database/schemas/newRx.js';
import { medicationRequestToRemsAdmins } from '../database/data.js';

bpx(bodyParser);
router.use(
  bodyParser.xml({
    xmlParseOptions: {
      normalize: true, // Trim whitespace inside text nodes
      explicitArray: false // Only put nodes in array if >1
    }
  })
);
router.use(bodyParser.urlencoded({ extended: false }));

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
 * Route: 'doctorOrders/api/addRx'
 * Description : 'Saves a new Doctor Order to db'
 */
router.post('/api/addRx', async (req, res) => {
  // Parsing incoming NCPDP SCRIPT XML to doctorOrder JSON
  const newRxMessageConvertedToJSON = req.body;
  const newOrder = await parseNCPDPScript(newRxMessageConvertedToJSON);

  try {
    const newRx = new NewRx({
      prescriberOrderNumber: newRxMessageConvertedToJSON.Message.Header.PrescriberOrderNumber,
      serializedJSON: JSON.stringify(newRxMessageConvertedToJSON)
    });
    await newRx.save();
    console.log('Saved NewRx');
  } catch (error) {
    console.log('Could not store the NewRx', error);
    return error;
  }

  try {
    await newOrder.save();
    console.log('DoctorOrder was saved');
  } catch (error) {
    console.log('ERROR! duplicate found, prescription already exists', error);
    return error;
  }

  const RxStatus = buildRxStatus(newRxMessageConvertedToJSON);
  res.send(RxStatus);
  console.log('Sent RxStatus');
});

/**
 * Route: 'doctorOrders/api/updateRx/:id'
 * Description : 'Updates prescription based on mongo id, used in etasu'
 */
router.patch('/api/updateRx/:id', async (req, res) => {
  try {
    // Finding by id
    const order = await doctorOrder.findById(req.params.id).exec();
    console.log('Found doctor order by id! --- ', order);

    const guidanceResponse = await getGuidanceResponse(order);
    const metRequirements =
      guidanceResponse?.contained?.[0]?.['parameter'] || order.metRequirements;
    const dispenseStatus = getDispenseStatus(order, guidanceResponse);

    // Saving and updating
    const newOrder = await doctorOrder.findOneAndUpdate(
      { _id: req.params.id },
      { dispenseStatus, metRequirements },
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
 * Description : 'Updates prescription dispense status based on mongo id to be picked up '
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

  try {
    // Reach out to EHR to update dispense status as XML
    const newRx = await NewRx.findOne({
      prescriberOrderNumber: prescriberOrderNumber
    });
    const rxFill = buildRxFill(newRx);
    const status = await axios.post(env.EHR_RXFILL_URL, rxFill, {
      headers: {
        Accept: 'application/xml', // Expect that the Status that the EHR returns back is in XML
        'Content-Type': 'application/xml' // Tell the EHR that the RxFill is in XML
      }
    });
    console.log('Sent RxFill to EHR and received status from EHR', status.data);
  } catch (error) {
    console.log('Could not send RxFill to EHR', error);
    return error;
  }
});

/**
 * Route : 'doctorOrders/api/getRx/patient/:patientName/drug/:simpleDrugName`
 * Description : 'Fetches first available doctor order based on patientFirstName, patientLastName and patientDOB'
 *     'To retrieve a specific one for a drug on a given date, supply the drugNdcCode and rxDate in the query parameters'
 *     'Required Parameters : patientFirstName, patientLastName patientDOB are part of the path'
 *     'Optional Parameters : all remaining values in the orderSchema as query parameters (?drugNdcCode=0245-0571-01,rxDate=2020-07-11)'
 */
router.get('/api/getRx/:patientFirstName/:patientLastName/:patientDOB', async (req, res) => {
  var searchDict = {
    patientFirstName: req.params.patientFirstName,
    patientLastName: req.params.patientLastName,
    patientDOB: req.params.patientDOB
  };

  if (req.query && Object.keys(req.query).length > 0) {
    // add the query parameters
    for (const prop in req.query) {
      // verify that the parameter is in the orderSchema
      if (orderSchema.path(prop) != undefined) {
        // add the parameters to the search query
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

const getEtasuUrl = order => {
  let baseUrl;

  if (env.USE_INTERMEDIARY) {
    baseUrl = env.INTERMEDIARY_ETASU_MET;
  } else {
    const rxnorm = order.drugRxnormCode;
    const remsDrug = medicationRequestToRemsAdmins.find(entry => {
      return Number(rxnorm) === Number(entry.rxnorm);
    });
    baseUrl = remsDrug?.remsAdminFhirUrl;
  }

  const etasuUrl = baseUrl + '/GuidanceResponse/$rems-etasu';
  return baseUrl ? etasuUrl : null;
};

const getGuidanceResponse = async order => {
  const etasuUrl = getEtasuUrl(order);

  if (!etasuUrl) {
    return null;
  }

  // Make the etasu call with the auth number if it exists, if not call with patient and medication
  let body = {};
  if (order.authNumber !== '') {
    body = {
      resourceType: 'Parameters',
      parameter: [
        {
          name: 'authNumber',
          valueString: order.authNumber
        }
      ]
    };
  } else {
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
              coding: [
                {
                  system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                  code: order.drugRxnormCode,
                  display: order.drugNames
                }
              ]
            }
          }
        }
      ]
    };
  }

  const response = await axios.post(etasuUrl, body, {
    headers: {
      'content-type': 'application/json'
    }
  });
  console.log('Retrieved order', etasuUrl);
  const responseResource = response.data.parameter[0].resource;
  return responseResource;
};

const getDispenseStatus = (order, guidanceResponse) => {
  const isNotRemsDrug = !guidanceResponse;
  const isRemsDrugAndMetEtasu = guidanceResponse?.status === 'success';
  const isPickedUp = order.dispenseStatus === 'Picked Up';
  if (isNotRemsDrug && order.dispenseStatus === 'Pending') return 'Approved';
  if (isRemsDrugAndMetEtasu) return 'Approved';
  if (isPickedUp) return 'Picked Up';
  return 'Pending';
};

/**
 * Description : 'Returns parsed NCPDP NewRx as JSON'
 * In : NCPDP SCRIPT XML <NewRx>
 * Return : Mongoose schema of a newOrder
 */
async function parseNCPDPScript(newRx) {
  // Parsing  XML NCPDP SCRIPT from EHR
  const incompleteOrder = {
    caseNumber: newRx.Message.Header.MessageID.toString(), // Will need to return to this and use actual pt identifier or uuid
    authNumber: newRx.Message.Header.AuthorizationNumber,
    prescriberOrderNumber: newRx.Message.Header.PrescriberOrderNumber,
    patientName:
      newRx.Message.Body.NewRx.Patient.HumanPatient.Name.FirstName +
      ' ' +
      newRx.Message.Body.NewRx.Patient.HumanPatient.Name.LastName,
    patientFirstName: newRx.Message.Body.NewRx.Patient.HumanPatient.Name.FirstName,
    patientLastName: newRx.Message.Body.NewRx.Patient.HumanPatient.Name.LastName,
    patientDOB: newRx.Message.Body.NewRx.Patient.HumanPatient.DateOfBirth.Date,
    patientCity: newRx.Message.Body.NewRx.Patient.HumanPatient.Address.City,
    patientStateProvince: newRx.Message.Body.NewRx.Patient.HumanPatient.Address.StateProvince,
    patientPostalCode: newRx.Message.Body.NewRx.Patient.HumanPatient.Address.PostalCode,
    patientCountry: newRx.Message.Body.NewRx.Patient.HumanPatient.Address.Country,
    doctorName:
      'Dr. ' +
      newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.Name.FirstName +
      ' ' +
      newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.Name.LastName,
    doctorContact:
      newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.CommunicationNumbers.PrimaryTelephone
        ?.Number,
    doctorID: newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.Identification.NPI,
    doctorEmail:
      newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.CommunicationNumbers.ElectronicMail,
    drugNames: newRx.Message.Body.NewRx.MedicationPrescribed.DrugDescription,
    simpleDrugName: newRx.Message.Body.NewRx.MedicationPrescribed.DrugDescription.split(' ')[0],
    drugNdcCode: newRx.Message.Body.NewRx.MedicationPrescribed.DrugCoded.ProductCode.Code,
    drugRxnormCode: newRx.Message.Body.NewRx.MedicationPrescribed.DrugCoded.DrugDBCode.Code,
    rxDate: newRx.Message.Body.NewRx.MedicationPrescribed.WrittenDate.Date,
    drugPrice: 200, // Add later?
    quantities: newRx.Message.Body.NewRx.MedicationPrescribed.Quantity.Value,
    total: 1800,
    pickupDate: 'Tue Dec 13 2022', // Add later?
    dispenseStatus: 'Pending'
  };

  const isRemsDrug = !!getEtasuUrl(incompleteOrder);
  const metRequirements = isRemsDrug ? [] : null;
  const order = new doctorOrder({ ...incompleteOrder, metRequirements });
  return order;
}

export default router;
