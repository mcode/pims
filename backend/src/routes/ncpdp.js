import express from 'express';
const router = express.Router();
// XML Parsing Middleware used for NCPDP SCRIPT
import bodyParser from 'body-parser';
import bpx from 'body-parser-xml';

import { processNewRx } from './doctorOrders.js';
import { buildRxError } from '../ncpdpScriptBuilder/buildScript.v2017071.js';
import { resolveAvailability } from '../lib/ppaInventory.js';
import {
  buildPpaError,
  buildPpaResponse,
  extractPpaRequest,
  getPpaMessage,
  getPpaTransactionType
} from '../lib/ppaMessages.js';

bpx(bodyParser);
router.use(
  bodyParser.xml({
    xmlParseOptions: {
      normalize: true, 
      explicitArray: false
    }
  })
);
router.use(bodyParser.urlencoded({ extended: false }));

const processPpa = (req, res, routeName) => {
  console.log(`received ${routeName} PPA message`);
  res.type('application/json');

  const parsed = extractPpaRequest(req.body);

  if (parsed.errors.length > 0) {
    console.log(`${routeName} PPA validation failed:`, parsed.errors.join('; '));
    return res.status(400).json(buildPpaError(parsed.message, '602', parsed.errors.join('; ')));
  }

  const result = resolveAvailability(parsed.normalized);
  console.log(`${routeName} PPA availability result:`, JSON.stringify(result));
  return res.json(buildPpaResponse(parsed.message, result));
};

/**
 * Route: 'ncpdp/script'
 * Description: Supports NCPDP SCRIPT XML and PPA Pilot 2.0 JSON messages.
 */
router.post('/script', async (req, res) => {
  console.log('received /ncpdp/script message');

  if (
    getPpaTransactionType(req.body) === 'PPARequest' ||
    getPpaMessage(req.body)?.['@TransactionDomain'] === 'PPA'
  ) {
    return processPpa(req, res, '/ncpdp/script');
  }

  const newRxMessageConvertedToJSON = req.body;
  let message = newRxMessageConvertedToJSON?.Message;
  let body = message?.Body;
  let status = null;
  if (body?.NewRx) {
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
