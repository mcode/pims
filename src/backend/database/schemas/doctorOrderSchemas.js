const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    caseNumber: String,
    patientName: String,
    patientDOB: String,
    doctorName: String,
    doctorContact: String,
    doctorID: String,
    doctorEmail: String,
    drugNames: String,
    drugPrice: Number,
    quanitities: String,
    total: Number,
    pickupDate: String,
    dispenseStatus: String
});

// Compound index is used to prevent duplicates based off of the given parameters
// orderSchema.index({ caseNumber: 1, patientName: 1 }, { unique: true });// schema level

const doctorOrder = mongoose.model('doctorOrder', orderSchema);

module.exports = doctorOrder;

