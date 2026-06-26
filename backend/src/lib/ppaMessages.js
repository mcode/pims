const PPA_DOMAIN = 'PPA';
const PPA_VERSION = '2.0';

const now = () => new Date().toISOString();
const messageId = prefix => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const getMessage = body => body?.Message || body?.MessageType || null;
const getAttribute = (message, name) => message?.[`@${name}`] || message?.[name];

const getDrugCoded = medicationPrescribed =>
  medicationPrescribed?.Product?.DrugCoded || medicationPrescribed?.Product?.drugCoded;

const getNonDrugCoded = medicationPrescribed =>
  medicationPrescribed?.Product?.NonDrugCoded || medicationPrescribed?.Product?.nonDrugCoded;

const getProductCode = coded => coded?.ProductCode?.Code || coded?.ProductCode?.ProductCode || null;

export function getPpaMessage(body) {
  return getMessage(body);
}

export function getPpaTransactionType(body) {
  const message = getMessage(body);
  if (message?.Body?.PPARequest) return 'PPARequest';
  if (message?.Body?.PPAResponse) return 'PPAResponse';
  if (message?.Body?.Error) return 'Error';
  return 'Unknown';
}

export function extractPpaRequest(body) {
  const message = getMessage(body);
  const errors = [];

  if (!message) {
    errors.push('Missing Message');
    return { message: null, request: null, errors };
  }

  if (getAttribute(message, 'TransactionDomain') !== PPA_DOMAIN) {
    errors.push('Message TransactionDomain must be PPA');
  }

  if (getAttribute(message, 'TransactionVersion') !== PPA_VERSION) {
    errors.push('Message TransactionVersion must be 2.0');
  }

  const header = message.Header;
  if (!header) {
    errors.push('Missing Header');
  } else {
    ['To', 'From', 'MessageID', 'SentTime'].forEach(key => {
      if (!header[key]) errors.push(`Missing Header.${key}`);
    });
    [
      'SenderSoftwareDeveloper',
      'SenderSoftwareProduct',
      'SenderSoftwareVersionRelease',
      'SenderSoftwareOperator'
    ].forEach(key => {
      if (!header.SenderSoftware?.[key]) errors.push(`Missing Header.SenderSoftware.${key}`);
    });
  }

  const request = message.Body?.PPARequest;
  if (!request) {
    errors.push('Missing Body.PPARequest');
    return { message, request: null, errors };
  }

  const medicationPrescribed = request.MedicationPrescribed;
  if (!medicationPrescribed) {
    errors.push('Missing PPARequest.MedicationPrescribed');
  }

  const quantity = medicationPrescribed?.Quantity;
  if (!quantity?.QuantityValue) {
    errors.push('Missing MedicationPrescribed.Quantity.QuantityValue');
  }

  if (!quantity?.QuantityCodeListQualifier) {
    errors.push('Missing MedicationPrescribed.Quantity.QuantityCodeListQualifier');
  }

  if (!quantity?.QuantityUnitOfMeasure?.Code) {
    errors.push('Missing MedicationPrescribed.Quantity.QuantityUnitOfMeasure.Code');
  }

  if (!request.PatientPreference?.StateProvince) {
    errors.push('Missing PPARequest.PatientPreference.StateProvince');
  }

  const drugCoded = getDrugCoded(medicationPrescribed);
  const nonDrugCoded = getNonDrugCoded(medicationPrescribed);
  const ndc = drugCoded?.NDC || getProductCode(drugCoded) || nonDrugCoded?.NDC || getProductCode(nonDrugCoded);
  if (!ndc) {
    errors.push('Missing product NDC or ProductCode');
  }

  return {
    message,
    request,
    errors,
    normalized: {
      ndc,
      drugDescription: medicationPrescribed?.DrugDescription,
      quantityRequested: Number(quantity?.QuantityValue || 0),
      quantityCodeListQualifier: quantity?.QuantityCodeListQualifier || '38',
      quantityUnitCode: quantity?.QuantityUnitOfMeasure?.Code,
      substitutionAllowed: String(medicationPrescribed?.Substitution) === '0'
    }
  };
}

function buildHeader({ requestHeader, from, to, relatesToMessageId, prefix }) {
  return {
    To: to || requestHeader?.From,
    From: from || requestHeader?.To,
    MessageID: messageId(prefix),
    RelatesToMessageID: relatesToMessageId || requestHeader?.MessageID,
    SentTime: now(),
    SenderSoftware: {
      SenderSoftwareDeveloper: 'REMS Prototype',
      SenderSoftwareProduct: 'PIMS',
      SenderSoftwareVersionRelease: '1',
      SenderSoftwareOperator: from || requestHeader?.To || 'PIMS Pharmacy'
    }
  };
}

const quantityResponse = (quantityAvailable, unitCode) => ({
  QuantityValue: String(quantityAvailable),
  QuantityCodeListQualifier: '38',
  QuantityUnitOfMeasure: {
    Code: unitCode
  }
});

const selectedProductExtension = result => {
  if (!result?.selectedItem) return [];

  return [
    {
      URL: 'http://codex.mitre.org/rems/ppa/selected-product',
      NDC: result.selectedItem.ndc,
      DrugDescription: result.selectedItem.display,
      PharmacyID: result.selectedItem.pharmacyId,
      PharmacyName: result.selectedItem.pharmacyName,
      Substitution: result.substitution ? 'true' : 'false',
      REMSAdminHint: result.selectedItem.remsAdminHint
    }
  ];
};

export function buildPpaResponse(message, result) {
  const requestHeader = message.Header;
  const approved = result.status === 'APPROVED';
  const selectedItem = result.selectedItem;
  const payload = {
    ReasonCode: result.reasonCode
  };

  if (result.reasonCode === 'KB' && selectedItem) {
    if (selectedItem.availabilityDate) payload.AvailabilityDate = selectedItem.availabilityDate;
    payload.Quantity = quantityResponse(result.quantityAvailable, selectedItem.quantityUnitCode);
  }

  if (result.reasonCode === 'BJ' && selectedItem?.availabilityDate) {
    payload.AvailabilityDate = selectedItem.availabilityDate;
  }

  const extensions = selectedProductExtension(result);
  if (extensions.length > 0) {
    payload.Extension = extensions;
  }

  return {
    Message: {
      '@TransactionDomain': PPA_DOMAIN,
      '@TransactionVersion': PPA_VERSION,
      Header: buildHeader({ requestHeader, prefix: 'PPAResponse' }),
      Body: {
        PPAResponse: {
          Response: approved ? { Approved: payload } : { Denied: payload }
        }
      }
    }
  };
}

export function buildPpaError(message, transactionErrorCode, description) {
  const requestHeader = message?.Header || {};
  const error = {
    TransactionErrorCode: transactionErrorCode
  };

  if (description) {
    error.Description = description;
  }

  return {
    Message: {
      '@TransactionDomain': PPA_DOMAIN,
      '@TransactionVersion': PPA_VERSION,
      Header: buildHeader({
        requestHeader,
        from: requestHeader.To || 'PIMS Pharmacy',
        to: requestHeader.From || 'Unknown',
        prefix: 'PPAError'
      }),
      Body: {
        Error: error
      }
    }
  };
}
