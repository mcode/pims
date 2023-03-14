import mongoose from 'mongoose';
export const orderSchema = new mongoose.Schema({
  caseNumber: String,
  patientName: String,
  patientFirstName: String,
  patientLastName: String,
  patientDOB: String,
  patientCity: String,
  patientStateProvince: String,
  patientPostalCode: String,
  patientCountry: String,
  doctorName: String,
  doctorContact: String,
  doctorID: String,
  doctorEmail: String,
  drugNames: String,
  simpleDrugName: String,
  rxDate: String,
  drugPrice: Number,
  drugNdcCode: String,
  quanitities: String,
  total: Number,
  pickupDate: String,
  dispenseStatus: String,
  metRequirements: [
    {
      stakeholderId: String,
      completed: Boolean,
      metRequirementId: String,
      requirementName: String,
      requirementDescription: String
    }
  ]
});

// Compound index is used to prevent duplicates based off of the given parameters
orderSchema.index({ simpleDrugName: 1, patientName: 1 }, { unique: true }); // schema level

export const doctorOrder = mongoose.model('doctorOrder', orderSchema);
