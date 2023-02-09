const express = require('express');
const router = express.Router();
const doctorOrder = require('../database/schemas/doctorOrderSchemas.js');

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
router.get('/api/getRx', async(req, res) => {
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
 * Route : 'doctorOrders/api/getRx/:caseNumber`
 * Description : 'Fetches doctor order bases on caseNumber'
 */
// router.get('/api/getRx/:caseNumber', (req, res) => {
//     const id = req.params.caseNumber;

//     console.log('GET DoctorOrder: ');
//     console.log(database);
//     res.json(database);
// });

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
        drugPrice: 200, // Add later?
        quanitities: newRx.Message.Body.NewRx.MedicationPrescribed.Quantity.Value,
        total: 1800,
        pickupDate: 'Tue Dec 13 2022', // Add later?
        dispenseStatus: 'Pending'
    });

    return newOrder;
}

module.exports = router;