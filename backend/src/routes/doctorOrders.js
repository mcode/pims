import express from 'express';
const router = express.Router();
import { doctorOrder, orderSchema } from '../database/schemas/doctorOrderSchemas.js';
import axios from 'axios';
// XML Parsing Middleware used for NCPDP SCRIPT
import bodyParser from 'body-parser';
import bpx from 'body-parser-xml';
import env from 'var';
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
 * Route: 'doctorOrders/api/getRx'
 * Description : 'Returns all documents in database for PIMS'
 */
router.get('/api/getRx', async (req, res) => {
  //  finding all and adding it to the db
  const order = await doctorOrder.find();

  console.log('Database return: ');
  console.log(order);
  res.json(order);
});

/**
 * Route: 'doctorOrders/api/addRx'
 * Description : 'Saves a new Doctor Order to db'
 */
router.post('/api/addRx', async (req, res) => {
  // Parsing incoming NCPDP SCRIPT XML to doctorOrder JSON
  const newOrder = parseNCPDPScript(req.body);

  try {
    await newOrder.save(); //updating the object or adding to it
  } catch (error) {
    console.log('ERROR! duplicate found, prescription already exists');
    return error;
  }

  console.log('POST DoctorOrder: ');
  console.log(newOrder);
  res.send(newOrder);
});

/**
 * Route: 'doctorOrders/api/updateRx/:_id'
 * Description : 'Updates prescription based on mongo id, used in etasu'
 */
router.patch('/api/updateRx/:id', async (req, res) => {
  try {
    const dontUpdateStatusBool = req.query.dontUpdateStatus;
    // Finding by id
    const order = await doctorOrder.findById(req.params.id).exec();
    console.log('found by id!');

    console.log('order', order);

    // Reaching out to REMS Admin finding by pt name and drug name
    // '/etasu/met/patient/:patientFirstName/:patientLastName/:patientDOB/drug/:drugName',

    const remsBase = env.REMS_ADMIN_BASE;
    const url =
      remsBase +
      '/etasu/met/patient/' +
      order.patientFirstName +
      '/' +
      order.patientLastName +
      '/' +
      order.patientDOB +
      '/drug/' +
      order.simpleDrugName;
    console.log(url);
    const response = await axios.get(url);
    console.log(response.data);

    // Saving and updating
    const newOrder = await doctorOrder.findOneAndUpdate(
      { _id: req.params.id },
      {
        dispenseStatus:
          dontUpdateStatusBool || order.dispenseStatus === 'Picked Up'
            ? order.dispenseStatus
            : response.data.status,
        metRequirements: response.data.metRequirements
      },
      {
        new: true
      }
    );
    console.log('NEWORDER');
    console.log(newOrder);
    res.send(newOrder);
  } catch (error) {
    console.log('ERROR!');
    console.log(error);
    return error;
  }
});

/**
 * Route: 'doctorOrders//api/updateRx/:id/pickedUp'
 * Description : 'Updates prescription dispense status based on mongo id to be picked up '
 */
router.patch('/api/updateRx/:id/pickedUp', async (req, res) => {
  try {
    const newOrder = await doctorOrder.findOneAndUpdate(
      { _id: req.params.id },
      { dispenseStatus: 'Picked Up' },
      {
        new: true
      }
    );
    res.send(newOrder);
  } catch (error) {
    console.log(error);
    console.log('ERROR! Could not find id');
    return error;
  }

  // console.log(newOrder);
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

  console.log('GET DoctorOrder: ');
  console.log(prescription);
  res.send(prescription);
});

/**
 * Description : 'Deletes all documents and prescriptions in PIMS'
 */
router.delete('/api/deleteAll', async (req, res) => {
  await doctorOrder.deleteMany({});
  console.log('All doctorOrders deleted in PIMS!');
  res.send([]);
});

/**
 * Description : 'Returns parsed NCPDP NewRx as JSON'
 * In : NCPDP SCRIPT XML <NewRx>
 * Return : Mongoose schema of a newOrder
 */
function parseNCPDPScript(newRx) {
  // Parsing  XML NCPDP SCRIPT from EHR
  var newOrder = new doctorOrder({
    caseNumber: newRx.Message.Header.MessageID.toString(), // Will need to return to this and use actual pt identifier or uuid
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
    rxDate: newRx.Message.Body.NewRx.MedicationPrescribed.WrittenDate.Date,
    drugPrice: 200, // Add later?
    quanitities: newRx.Message.Body.NewRx.MedicationPrescribed.Quantity.Value,
    total: 1800,
    pickupDate: 'Tue Dec 13 2022', // Add later?
    dispenseStatus: 'Pending',
    metRequirements: [] // will fill later
  });

  return newOrder;
}

export default router;
