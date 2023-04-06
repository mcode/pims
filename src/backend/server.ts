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
  const allowedOrigins = ['http://localhost:3000/', 'http://localhost:3008/'];

  const options: cors.CorsOptions = {
    origin: allowedOrigins
  };

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cors(options));
  app.listen(port, () => console.log(`Listening on port ${port}`));
  app.use('/doctorOrders', doctorOrders);

  const mongoHost = process.env.MONGO_HOSTNAME
    ? process.env.MONGO_HOSTNAME
    : 'mongodb://localhost:27017/pims';

  await mongoose.connect(mongoHost, {
    authSource: 'admin',
    user: process.env.MONGO_USERNAME ? process.env.MONGO_USERNAME : 'rems-admin-pims-root',
    pass: process.env.MONGO_PASSWORD ? process.env.MONGO_PASSWORD : 'rems-admin-pims-password'
  });
}
