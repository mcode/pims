import express from 'express';
import doctorOrders from './routes/doctorOrders.js';
const app = express();
const port = process.env.PORT || 5051;
import cors from 'cors';
import mongoose from 'mongoose';

//middleware and configurations
import bodyParser from 'body-parser';

main().catch(err => console.log(err));

async function main() {
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cors(['http://localhost:3000/', 'http://localhost:3008/']));
  app.listen(port, () => console.log(`Listening on port ${port}`));
  app.use('/doctorOrders', doctorOrders);

  await mongoose.connect('mongodb://pims_remsadmin_mongo:27017/pims', {
    authSource: 'admin',
    user: 'rems-admin-pims-root',
    pass: 'rems-admin-pims-password'
  });
}
