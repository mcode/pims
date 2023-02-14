const express = require('express');
const router = express.Router();
const doctorOrder = require('../database/schemas/doctorOrderSchemas.js');
const axios = require('axios');

// XML Parsing Middleware used for NCPDP SCRIPT 
const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);
router.use(
    bodyParser.xml({
        xmlParseOptions: {
            normalize: true, // Trim whitespace inside text nodes
            explicitArray: false, // Only put nodes in array if >1
        },
    }),
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
        await newOrder.save();  //updating the object or adding to it 
    } catch (error) {
        console.log('ERROR! douplicate found, prescription already exists already exists');
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
        const remsBase = process.env.REMS_ADMIN_BASE ? process.env.USER_KEY: 'http://localhost:8090';
        const url = remsBase + '/etasu/met/patient/' + order.patientName + '/drug/' + order.simpleDrugName;
        console.log(url);
        const response = await axios.get(url);
        console.log(response.data);

        // Saving and updating
        const newOrder = await doctorOrder.findOneAndUpdate({ _id: req.params.id }, { dispenseStatus: response.data.status, metRequirements: response.data.metRequirements }, {
            new: true
        });
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
        const newOrder = await doctorOrder.findOneAndUpdate({ _id: req.params.id }, { dispenseStatus: 'Picked Up' }, {
            new: true
        });
    } catch (error) {
        console.log('ERROR! Could not find id');
        return error;
    }

    // console.log(newOrder);
    // res.send(newOrder);
});

/**
 * Route : 'doctorOrders/api/getRx/patient/:patientName/drug/:simpleDrugName`
 * Description : 'Fetches doctor order bases on patientName and Drug name'
 */
router.get('/api/getRx/patient/:patientName/drug/:simpleDrugName', async (req, res) => {

    const prescription = await doctorOrder.findOne({ patientName: req.params.patientName, simpleDrugName: req.params.simpleDrugName }).exec();

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
    res.send('DELETE Request Called');
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
        patientName: newRx.Message.Body.NewRx.Patient.HumanPatient.Name.FirstName + ' ' + newRx.Message.Body.NewRx.Patient.HumanPatient.Name.LastName,
        patientDOB: newRx.Message.Body.NewRx.Patient.HumanPatient.DateOfBirth.Date,
        doctorName: 'Dr. ' + newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.Name.FirstName + ' ' + newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.Name.LastName,
        doctorContact: newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.CommunicationNumbers.PrimaryTelephone.Number,
        doctorID: newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.Identification.NPI,
        doctorEmail: newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.CommunicationNumbers.ElectronicMail,
        drugNames: newRx.Message.Body.NewRx.MedicationPrescribed.DrugDescription,
        simpleDrugName: newRx.Message.Body.NewRx.MedicationPrescribed.DrugDescription.split(' ')[0],
        drugPrice: 200, // Add later?
        quanitities: newRx.Message.Body.NewRx.MedicationPrescribed.Quantity.Value,
        total: 1800,
        pickupDate: 'Tue Dec 13 2022', // Add later?
        dispenseStatus: 'Pending',
        metRequirements: [] // will fill later
    });

    return newOrder;
}

module.exports = router;