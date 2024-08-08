import express from 'express';
import { doctorOrder, orderSchema } from '../database/schemas/doctorOrderSchemas.js';
import axios from 'axios';
import bodyParser from 'body-parser'; // XML Parsing Middleware used for NCPDP SCRIPT
import bpx from 'body-parser-xml';
import env from 'var';
import { buildRxStatus, buildRxFill } from '../ncpdpScriptBuilder/buildScript.v2017071.js';
import { NewRx } from '../database/schemas/newRx.js';
import { medicationRequestToRemsAdmins } from '../database/data.js';

const router = express.Router();

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
TODO:
 - need to update the calls to api endpoint would look something like this:
 
axios.post('/api/rx', {
  action: 'updateStatus',
  id: 'prescriptionId'
  })

  or 

axios.post('/api/rx', { action: 'getRx' })
*/

/**
 * Unified Route: 'doctorOrders/api/rx'
 * Description: Handles all operations related to prescriptions
 * Operations: 
 *   - Fetch all prescriptions grouped by status
 *   - Add a new prescription
 *   - Update a prescription
 */
router.post('/api/rx', async (req, res) => {
  try {
    const { action, id, rxData } = req.body;

    switch (action) {
      case 'getRx':
        return await getRx(req, res, stat);

      case 'getPatientRx':
        return await getPatientRx(req, res);

      case 'addRx':
        return await addRx(req, res);

      case 'updateRx':
        return await updateRx(req, res);

      case 'updateRxMetRequirements':
        return await updateRxMetRequirements(req, res);

      case 'deleteAll':
        return await deleteAll(req, res);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

/**
 * fetch all prescriptions grouped by status or if not specified for all of them
 */
/**
TODO: Update the call to endpoint 
for all status: axios.post('/api/rx', { action: 'getStatus' })
for an individual status: axios.post('/api/rx', { action: 'getStatus', status: 'Pending' })
 */
const getRx = async (_req, res, stat) => {
  try {
    const validStatuses = ['Pending', 'Approved', 'Picked Up'];

    // Check if a specific status is requested and validate it
    if (stat && !validStatuses.includes(stat)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
  
  //getting a particular status 
  let orders;
  if (stat) {
    orders = await doctorOrder.find({ dispenseStatus: stat });
  }
  //return all of them
  else {
    const pendingOrders = await doctorOrder.find({ dispenseStatus: 'Pending' });
    const approvedOrders = await doctorOrder.find({ dispenseStatus: 'Approved' });
    const pickedUpOrders = await doctorOrder.find({ dispenseStatus: 'Picked Up' });

    orders = {
      pending: pendingOrders,
      approved: approvedOrders,
      pickedUp: pickedUpOrders
    };
  }
    
    console.log('Database returned orders for status:', stat || 'all');
    return res.json(orders);
  } catch (error) {
    console.error('Error retrieving orders:', error);
    return res.status(500).json({ error: 'Failed to retrieve orders' });
  }
};

/**
 * Add a new prescription (saves Doctor Order to db)
 */
const addRx = async (req, res) => {
  try {
    const newRxMessageConvertedToJSON = req.body.rxData;
    const newOrder = await parseNCPDPScript(newRxMessageConvertedToJSON);

    const newRx = new NewRx({
      prescriberOrderNumber: newRxMessageConvertedToJSON.Message.Header.PrescriberOrderNumber,
      serializedJSON: JSON.stringify(newRxMessageConvertedToJSON)
    });

    await newRx.save();
    console.log('Saved NewRx');
    await newOrder.save();
    console.log('DoctorOrder was saved');

    const RxStatus = buildRxStatus(newRxMessageConvertedToJSON);
    return res.send(RxStatus);
  } catch (error) {
    console.error('Error adding prescription:', error);
    return res.status(500).json({ error: 'Failed to add prescription' });
  }
};

/**
 * Update prescription status based on mongo id, used in etasu 
 */
const updateRx = async (req, res) => {
  try {
    const { id } = req.body;
    const order = await doctorOrder.findById(id).exec();
    console.log('Found doctor order by id! --- ', order);

    const guidanceResponse = await getGuidanceResponse(order);
    const metRequirements = guidanceResponse?.contained?.[0]?.['parameter'] || order.metRequirements;
    const dispenseStatus = getDispenseStatus(order, guidanceResponse);

    const newOrder = await doctorOrder.findOneAndUpdate(
      { _id: id },
      { dispenseStatus, metRequirements },
      { new: true }
    );

    return res.send(newOrder);
  } catch (error) {
    console.error('Error updating prescription status:', error);
    return res.status(500).json({ error: 'Failed to update prescription status' });
  }
};


/**
 * Update prescription metRequirements based on mongo id
 */
const updateRxMetRequirements = async (req, res) => {
  try {
    const { id } = req.body;
    const order = await doctorOrder.findById(id).exec();
    console.log('Found doctor order by id! --- ', order);

    const guidanceResponse = await getGuidanceResponse(order);
    const metRequirements = guidanceResponse?.contained?.[0]?.['parameter'] || order.metRequirements;

    const newOrder = await doctorOrder.findOneAndUpdate(
      { _id: id },
      { metRequirements },
      { new: true }
    );

    return res.send(newOrder);
  } catch (error) {
    console.error('Error updating prescription metRequirements:', error);
    return res.status(500).json({ error: 'Failed to update prescription metRequirements' });
  }
};

// /*******
//  * Route: 'doctorOrders/api/updateRx/:id/pickedUp'
//  * Description : 'Updates prescription dispense status based on mongo id to be picked up '
//  */
// router.patch('/api/updateRx/:id/pickedUp', async (req, res) => {
//   let prescriberOrderNumber = null;
//   try {
//     const newOrder = await doctorOrder.findOneAndUpdate(
//       { _id: req.params.id },
//       { dispenseStatus: 'Picked Up' },
//       { new: true }
//     );
//     res.send(newOrder);
//     prescriberOrderNumber = newOrder.prescriberOrderNumber;
//     console.log('Updated dispense status to picked up');
//   } catch (error) {
//     console.log('Could not update dispense status', error);
//     return error;
//   }

//   try {
//     // Reach out to EHR to update dispense status as XML
//     const newRx = await NewRx.findOne({
//       prescriberOrderNumber: prescriberOrderNumber
//     });
//     const rxFill = buildRxFill(newRx);
//     const status = await axios.post(env.EHR_RXFILL_URL, rxFill, {
//       headers: {
//         Accept: 'application/xml', // Expect that the Status that the EHR returns back is in XML
//         'Content-Type': 'application/xml' // Tell the EHR that the RxFill is in XML
//       }
//     });
//     console.log('Sent RxFill to EHR and received status from EHR', status.data);
//   } catch (error) {
//     console.log('Could not send RxFill to EHR', error);
//     return error;
//   }
// });

/**
 * Fetch prescription based on patient details such as patientFirstName, patientLastName and patientDOB
 */
const getPatientRx = async (req, res) => {
  try {
    const { patientFirstName, patientLastName, patientDOB } = req.body;
    const searchDict = { patientFirstName, patientLastName, patientDOB };

    if (req.query && Object.keys(req.query).length > 0) {
      // Add query parameters if available
      for (const prop in req.query) {
        if (orderSchema.path(prop) != undefined) {
          searchDict[prop] = req.query[prop];
        }
      }
    }

    const prescription = await doctorOrder.findOne(searchDict).exec();
    console.log('Found doctor order');
    return res.send(prescription);
  } catch (error) {
    console.error('Error finding prescription:', error);
    return res.status(500).json({ error: 'Failed to find prescription' });
  }
};

/**
 * Delete all prescriptions in PIMS
 */
const deleteAll = async (_req, res) => {
  try {
    await doctorOrder.deleteMany({});
    console.log('All doctor orders deleted in PIMS!');
    await NewRx.deleteMany({});
    console.log("All NewRx's deleted in PIMS!");
    return res.send([]);
  } catch (error) {
    console.error('Error deleting all prescriptions:', error);
    return res.status(500).json({ error: 'Failed to delete all prescriptions' });
  }
};

const getEtasuUrl = order => {
  let baseUrl;

  if (env.USE_INTERMEDIARY) {
    baseUrl = env.INTERMEDIARY_FHIR_URL;
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
  console.log('Retrieved order', response);
  console.log('URL', etasuUrl);
  const responseResource = response.data.parameter?.[0]?.resource;
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

  const metRequirements = isRemsDrug(incompleteOrder) ? [] : null;
  const order = new doctorOrder({ ...incompleteOrder, metRequirements });
  return order;
}

export default router;
