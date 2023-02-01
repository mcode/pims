const express = require('express');
const router = express.Router();


//database
const DATABASE = '/Users/zrobin/dev/REMS/drlsroot/pims/src/backend/database/database.js';
const database = require(DATABASE); // replace me with correct database

// XML Parsing Middleware
const bodyParser = require("body-parser");
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



// delete me 
router.get('/api/getRx', (req, res) => {

    console.log("Database return:");
    console.log(database[1675064515782]);
    res.json(database);
});




router.post("/api/addRx", (req, res, next) => {

    // Parsing incoming NCPDP SCRIPT XML to doctorOrder JSON
    const doctorOrder = parseNCPDPScript(req.body);

    const { caseNumber,
        patientName,
        patientDOB,
        doctorName,
        doctorContact,
        doctorID,
        doctorEmail,
        drugNames,
        drugPrice,
        quanitities,
        total,
        pickupDate,
        dispenseStatus } = parseNCPDPScript(req.body)

    // Storing the data in the database will be replaced with mongodb 
    database.push({
        caseNumber,
        patientName,
        patientDOB,
        doctorName,
        doctorContact,
        doctorID,
        doctorEmail,
        drugNames,
        drugPrice,
        quanitities,
        total,
        pickupDate,
        dispenseStatus
    });

    console.log("POST DoctorOrder: ");
    console.log(database);
    res.send(database);
})

/**
 * Route : 'doctorOrders/api/getRx/:caseNumber`
 * Description : "Fetches doctor order bases on caseNumber"
 */
router.get('/api/getRx/:caseNumber', (req, res) => {
    const id = req.params.caseNumber;

    console.log("GET DoctorOrder: ");
    console.log(database);
    res.json(database);
});

/**
 * Description : "Returns parsed NCPDP NewRx as JSON"
 * In : NCPDP XML
 * Return : JSON doctorOrder
 */
function parseNCPDPScript(newRx) {
    var doctorOrder = {
        caseNumber: newRx.Message.Header.MessageID.toString(), // Will need to return to this and use actual pt identifier or uuid
        patientName: newRx.Message.Body.NewRx.Patient.HumanPatient.Names.Name.FirstName + ' ' + newRx.Message.Body.NewRx.Patient.HumanPatient.Names.Name.LastName,
        patientDOB: newRx.Message.Body.NewRx.Patient.HumanPatient.DateOfBirth.Date,
        doctorName: 'Dr. ' + newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.Names.Name.FirstName + ' ' + newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.Names.Name.LastName,
        doctorContact: newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.CommunicationNumbers.PrimaryTelephone.Number,
        doctorID: newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.Identification.NPI,
        doctorEmail: newRx.Message.Body.NewRx.Prescriber.NonVeterinarian.CommunicationNumbers.ElectronicMail,
        drugNames: newRx.Message.Body.NewRx.MedicationPrescribed.DrugDescription,
        drugPrice: 200, // Add later?
        quanitities: newRx.Message.Body.NewRx.MedicationPrescribed.Quantity.Value,
        total: 1800,
        pickupDate: 'Tue Dec 13 2022', // Add later?
        dispenseStatus: 'Pending'
    };
    return doctorOrder;
}

module.exports = router;