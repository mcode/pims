import { Schema, model } from 'mongoose';

enum TabStatus {
  PickedUp = 'Picked Up',
  Approved = 'Approved',
  Pending = 'Pending'
}

export interface IOrder {
  caseNumber: string;
  dispenseStatus: TabStatus;
  doctorContact: string;
  doctorEmail: string;
  doctorID: string;
  doctorName: string;
  drugNames: string;
  drugNdcCode: string; //
  drugPrice: number;
  metRequirements: [
    {
      completed: boolean;
      metRequirementId: string;
      requirementDescription: string;
      requirementName: string;
      stakeholderId: string;
    }
  ];
  patientCity: string; //
  patientCountry: string; //
  patientDOB: string;
  patientFirstName: string; //
  patientLastName: string; //
  patientName: string;
  patientPostalCode: string; //
  patientStateProvince: string; //
  pickupDate: string;
  quantities: string; //
  rxDate: string; //
  simpleDrugName: string; //
  total: number;
}

export const orderSchema = new Schema<IOrder>({
  caseNumber: String,
  dispenseStatus: String,
  doctorContact: String,
  doctorEmail: String,
  doctorID: String,
  doctorName: String,
  drugNames: String,
  drugNdcCode: String, //
  drugPrice: Number,
  metRequirements: [
    {
      completed: Boolean,
      metRequirementId: String,
      requirementDescription: String,
      requirementName: String,
      stakeholderId: String
    }
  ],
  patientCity: String, //
  patientCountry: String, //
  patientDOB: String,
  patientFirstName: String, //
  patientLastName: String, //
  patientName: String,
  patientPostalCode: String, //
  patientStateProvince: String, //
  pickupDate: String,
  quantities: String, //
  rxDate: String, //
  simpleDrugName: String, //
  total: Number
});

// Compound index is used to prevent duplicates based off of the given parameters
orderSchema.index({ simpleDrugName: 1, patientName: 1 }, { unique: true }); // schema level

export const Order = model<IOrder>('Order', orderSchema);
