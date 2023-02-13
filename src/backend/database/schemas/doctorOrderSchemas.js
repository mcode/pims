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
    simpleDrugName: String,
    drugPrice: Number,
    quanitities: String,
    total: Number,
    pickupDate: String,
    dispenseStatus: String,
    metRequirements: [{
        stakeholderId: String,
        completed: Boolean,
        metRequirementId: String,
        requirementName: String,
        requirementDescription:String
    }]
});

// Compound index is used to prevent duplicates based off of the given parameters
//orderSchema.index({ simpleDrugName: 1, patientName: 1 });// schema level

const doctorOrder = mongoose.model('doctorOrder', orderSchema);

module.exports = doctorOrder;

