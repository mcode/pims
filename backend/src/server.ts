import express from 'express';
import doctorOrders from './routes/doctorOrders.js';
const app = express();

import cors from 'cors';
import mongoose from 'mongoose';
import env from 'var';
import https from 'https';
import fs from 'fs';

//middleware and configurations
import bodyParser from 'body-parser';

main().catch(err => console.log(err));

async function main() {
  const port = env.BACKEND_PORT;

  const options: cors.CorsOptions = {
    origin: env.ALLOWED_ORIGIN
  };

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cors(options));
  app.use('/doctorOrders', doctorOrders);

  let server: any = app;

  if (env.USE_HTTPS) {
    console.log("Enabling HTTPS HTTPS")
    const credentials = {
      key: fs.readFileSync(env.HTTPS_KEY_PATH),
      cert: fs.readFileSync(env.HTTPS_CERT_PATH)
    };
    server = https.createServer(credentials, app);
  } 

  server.listen(port, () => console.log(`Listening on port ${port}`));

  const mongoHost = env.MONGO_URL;

  await mongoose.connect(mongoHost, {
    authSource: env.AUTH_SOURCE,
    user: env.MONGO_USERNAME,
    pass: env.MONGO_PASSWORD
  });
}
