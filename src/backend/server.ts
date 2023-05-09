import express from 'express';
import doctorOrders from './routes/doctorOrders.js';
const app = express();

import cors from 'cors';
import mongoose from 'mongoose';
import { env } from 'var';

//middleware and configurations
import bodyParser from 'body-parser';

main().catch(err => console.log(err));

async function main() {
  const port = env.PORT;

  const options: cors.CorsOptions = {
    origin: env.ALLOWED_ORIGIN
  };

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cors(options));
  app.listen(port, () => console.log(`Listening on port ${port}`));
  app.use('/doctorOrders', doctorOrders);

  const mongoHost = env.MONGO_HOSTNAME;

  await mongoose.connect(mongoHost, {
    authSource: env.AUTH_SOURCE,
    user: env.MONGO_USERNAME,
    pass: env.MONGO_PASSWORD
  });
}
