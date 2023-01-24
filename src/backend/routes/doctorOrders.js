const express = require('express');
const router = express.Router();
const xml2js = require('xml2js');
const data = require('../data');

//middleware
// app.use(xmlparser());

/**
 * Route : '/api/add`
 * Description : "Adding new doctorOrder to database"
 */
// router.post("/api/add", (req, res, next) => {
//     const doctorOrder = {
//         patientName: req.body.patientName,
//         patientDOB: req.body.patientDOB,
//         doctorName: req.body.doctorName,
//         doctorContact: req.body.doctorContact,
//         doctorID: req.body.doctorId,
//         doctorEmail: req.body.doctorEmail,
//         drugId: req.body.drugId,
//         drugNames: req.body.drugName,
//         drugPrice: req.body.drugPrice,
//         drugQuantity: req.body.drugQuantity,
//         realQuantity: req.body.realQuantity,
//         totalAmount: req.body.totalAmount,
//         pickupDate: req.body.pickupDate,
//         dispenseStatus: "N/A",
//     };

//     console.log("POST DoctorOrder: ");
//     console.log(doctorOrder);
//     res.send(doctorOrder);
// })

router.post("/api/add", (req, res, next) => {
    const doctorOrder = parseNCPDPScript(req.body);

    console.log("POST DoctorOrder: ");
    console.log(doctorOrder);
    res.send(doctorOrder);
});

/**
 * Route : '/api/:id`
 * Description : "Fetching data using patientDOB"
 */
//  router.get('/api/:id', (req, res) => {
//     const id = req.params.id

//     console.log("GET DoctorOrder: ");
//     console.log(doctorOrder);
//     res.send(data[id])
// })

function parseNCPDPScript(requestBody, existingDocOrder = undefined) {
    var parser = new xml2js.Parser();
    var extractedData = "";
    var parser = new xml2js.Parser();
    parser.parseString(requestBody, function (err, result) {
        //Need to extract the values from the data element
        extractedData = result['config']['data'];
        console.log(extractedData);
    });

    // //patientName
    // const patient = getResource(complianceBundle, parameterReference.parameter.find(param => param.name === "source-patient").reference);
    // const _patientName = patient?.name[0]?.given?.join(" ") + " "
    //                     + patient?.name[0]?.family;

    // //patientDOB
    // const _patientDOB = patient?.birthDate;

    // // doctorName
    // const doctor = getResource(complianceBundle, parameterReference.parameter.find(param => param.name === "prescriber").reference);

    // const _doctorName = doctor?.name[0]?.prefix[0] + " "
    //   + doctor?.name[0]?.given.join(" ")  + " "
    //   + doctor?.name[0]?.family;

    // // doctorContact
    // const _doctorContact = doctor?.telecom?.find(telecom => telecom.system === "phone").value;

    // // doctorEmail
    // const _doctorEmail = doctor?.telecom?.find(telecom => telecom.system === "email").value;

    // // doctorId
    // const _doctorId = doctor?.identifier[0]?.value;

    // // drugId
    // const presciption = getResource(complianceBundle, parameterReference.parameter.find(param => param.name === "prescription").reference);

    // //come back and verify rxnorm 
    // const _drugId = presciption?.medicationCodeableConcept?.coding[0]?.code;

    // // drugNames
    // const _drugNames = presciption?.medicationCodeableConcept?.coding[0]?.display;

    // // drugPrice
    // const _drugPrice = 200.00;

    // // drugQuantity
    // const _drugQuantity = presciption?.dispenseRequest?.quantity.value;

    // // realQuantity
    // const _realQuantity = presciption?.dosageInstruction[0]?.doseAndRate[0]?.doseQuantity?.value
    //   + presciption?.dosageInstruction[0]?.doseAndRate[0]?.doseQuantity.unit;

    // // totalAmount
    // // make this the 90 
    // const _totalAmount = _drugQuantity * _drugPrice;

    // // pickupDate
    // const _pickupDate = new Date().toDateString();

    // let docOrder = existingDocOrder;

    // if (existingDocOrder) {
    //   docOrder.patientName = _patientName;
    //   docOrder.patientDOB = _patientDOB;
    //   docOrder.doctorName = _doctorName;
    //   docOrder.doctorContact = _doctorContact;
    //   docOrder.doctorID = _doctorId;
    //   docOrder.doctorEmail = _doctorEmail;
    //   docOrder.drugId = _drugId;
    //   docOrder.drugNames = _drugNames;
    //   docOrder.drugPrice = _drugPrice;
    //   docOrder.drugQuantity = _drugQuantity;
    //   docOrder.realQuantity = _realQuantity;
    //   docOrder.totalAmount = _totalAmount;
    //   docOrder.pickupDate = _pickupDate;
    //   docOrder.dispenseStatus = requestBody?.status;
    //   docOrder.caseNumber = requestBody?.case_number;
    // } else {
    //   docOrder = new DoctorOrder({
    //     patientName: _patientName,
    //     patientDOB: _patientDOB,
    //     doctorName: _doctorName,
    //     doctorContact: _doctorContact,
    //     doctorID: _doctorId,
    //     doctorEmail: _doctorEmail,
    //     drugId: _drugId,
    //     drugNames: _drugNames,
    //     drugPrice: _drugPrice,
    //     drugQuantity: _drugQuantity,
    //     realQuantity: _realQuantity,
    //     totalAmount: _totalAmount,
    //     pickupDate: _pickupDate,
    //     dispenseStatus: requestBody?.status,
    //     caseNumber: requestBody?.case_number,
    //   }); 
    // }
    return doctorOrder;
}

module.exports = router;