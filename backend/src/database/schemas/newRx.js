import { Schema, model } from 'mongoose';
const schema = new Schema({
  prescriberOrderNumber: String,
  serializedJSON: String
});

schema.index({ prescriberOrderNumber: 1 }, { unique: true });
export const NewRx = model('NewRx', schema);
