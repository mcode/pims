import express from 'express';
const router = express.Router();
import { doctorOrder, orderSchema } from '../database/schemas/doctorOrderSchemas.js';
import axios from 'axios';
// XML Parsing Middleware used for NCPDP SCRIPT
import bodyParser from 'body-parser';
import bpx from 'body-parser-xml';
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
    // Finding by id
    const order = await doctorOrder.findById(req.params.id).exec();
    console.log('found by id!');

    // Reaching out to REMS Admin finding by pt name and drug name
    // '/etasu/met/patient/:patientFirstName/:patientLastName/:patientDOB/drug/:drugName',

    const remsBase = process.env.REMS_ADMIN_BASE
      ? process.env.REMS_ADMIN_BASE
      : 'http://localhost:8090';
    const url =
      remsBase +
      '/etasu/met/patient/' +
      order?.patientFirstName +
      '/' +
      order?.patientLastName +
      '/' +
      order?.patientDOB +
      '/drug/' +
      order?.simpleDrugName;
    console.log(url);
    const response = await axios.get(url);
    console.log(response.data);

    // Saving and updating
    const newOrder = await doctorOrder.findOneAndUpdate(
      { _id: req.params.id },
      { dispenseStatus: response.data.status, metRequirements: response.data.metRequirements },
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
  const searchDict: any = {
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
function parseNCPDPScript(newRx: any) {
  // Parsing  XML NCPDP SCRIPT from EHR
  const Patient = newRx.Message.Body.NewRx.Patient.HumanPatient;
  const PatientName = Patient.Name;
  const PatientAddress = Patient.Address;
  const Provider = newRx.Message.Body.NewRx.Prescriber.NonVeterinarian;
  const ProviderName = Provider.Name;
  const MedicationPrescribed = newRx.Message.Body.NewRx.MedicationPrescribed;
  const newOrder = new doctorOrder({
    caseNumber: newRx.Message.Header.MessageID.toString(), // Will need to return to this and use actual pt identifier or uuid
    patientName: `${PatientName.FirstName} ${PatientName.LastName}`,
    patientFirstName: PatientName.FirstName,
    patientLastName: PatientName.LastName,
    patientDOB: Patient?.DateOfBirth?.Date,
    patientCity: PatientAddress.City,
    patientStateProvince: PatientAddress.StateProvince,
    patientPostalCode: PatientAddress.PostalCode,
    patientCountry: PatientAddress.Country,
    doctorName: `Dr ${ProviderName.FirstName} ${ProviderName.LastName}`,
    doctorContact: Provider.CommunicationNumbers.PrimaryTelephone.Number,
    doctorID: Provider.Identification.NPI,
    doctorEmail: Provider.CommunicationNumbers.ElectronicMail,
    drugNames: MedicationPrescribed.DrugDescription,
    simpleDrugName: MedicationPrescribed.DrugDescription.split(' ')[0],
    drugNdcCode: MedicationPrescribed.DrugCoded.ProductCode.Code,
    rxDate: MedicationPrescribed.WrittenDate.Date,
    drugPrice: 200, // Add later?
    quanitities: MedicationPrescribed.Quantity.Value,
    total: 1800,
    pickupDate: 'Tue Dec 13 2022', // Add later?
    dispenseStatus: 'Pending',
    metRequirements: [] // will fill later
  });

  return newOrder;
}

export default router;
