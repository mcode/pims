import express from 'express';
const router = express.Router();
// XML Parsing Middleware used for NCPDP SCRIPT
import bodyParser from 'body-parser';
import bpx from 'body-parser-xml';

import { processNewRx } from './doctorOrders.js';
import { buildRxError } from '../ncpdpScriptBuilder/buildScript.v2017071.js';

bpx(bodyParser);
router.use(
  bodyParser.xml({
    xmlParseOptions: {
      normalize: true, // Trim whitespace inside text nodes
      explicitArray: false // Only put nodes in array if >1
    }
  })
);
router.use(bodyParser.urlencoded({ extended: false }));

/**
 * Route: 'ncpdp/script'
 * Description : 'Supports NCPDP SCRIPT messages, currntly only NewRx'
 */
router.post('/script', async (req, res) => {
  // Parsing incoming NCPDP SCRIPT XML to JSON
  console.log('received /ncpdp/script message');
  const newRxMessageConvertedToJSON = req.body;
  let message = newRxMessageConvertedToJSON?.Message;
  let body = message?.Body;
  let status = null;
  if (body?.NewRx) {
    // process NewRx message
    status = await processNewRx(newRxMessageConvertedToJSON);
  } else {
    let errorStr = 'unknown message type';
    console.log('/ncpdp/script ' + errorStr);
    status = buildRxError(newRxMessageConvertedToJSON, errorStr);
  }

  res.send(status);
  console.log('Sent Status/Error');
});

export default router;
