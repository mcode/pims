/* NCPDP SCRIPT v2017071 Support - Enhanced for Full REMS Compliance */
import { XMLBuilder } from 'fast-xml-parser';
import { v4 as uuidv4 } from 'uuid';

const MOCK_VALUE = 'MOCK_VALUE';
const PICKED_UP = 'Picked up';

const XML_BUILDER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@@',
  format: true,
  oneListGroup: 'true'
};

/**
 * Build base NCPDP message structure
 */
function buildMessage(inputMessage, body) {
  const { Message } = inputMessage;
  const { Header, Body } = Message;
  const time = new Date();
  const message = {
    Message: [
      {
        Header: [
          {
            To: {
              '#text': Header.To._,
              '@@Qualifier': Header.To.$.Qualifier
            }
          },
          {
            From: {
              '#text': Header.From._,
              '@@Qualifier': Header.From.$.Qualifier
            }
          },
          {
            MessageID: Header.MessageID
          },
          {
            Message: 'NewRx Request Received For: ' + Body.NewRx.MedicationPrescribed.DrugDescription
          },
          { RelatesToMessageID: Header.MessageID },
          { SentTime: time.toISOString() },
          { PrescriberOrderNumber: Header.PrescriberOrderNumber }
        ]
      },
      {
        Body: body
      }
    ]
  };
  return message;
}

/**
 * Build NCPDP Status message (success response)
 */
export function buildRxStatus(newRxMessageConvertedToJSON) {
  const body = [
    {
      Status: [
        {
          Code: '000'
        }
      ]
    }
  ];
  const rxStatus = buildMessage(newRxMessageConvertedToJSON, body);
  const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
  return builder.build(rxStatus);
}

/**
 * Build NCPDP Error message
 */
export function buildRxError(newRxMessageConvertedToJSON, errorMessage) {
  const body = [
    {
      Error: [
        {
          Code: 900,
          DescriptionCode: 1000,
          Description: errorMessage
        }
      ]
    }
  ];
  const rxStatus = buildMessage(newRxMessageConvertedToJSON, body);
  const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
  return builder.build(rxStatus);
}

/**
 * Build NCPDP RxFill message
 * Per NCPDP spec: Sent when medication is dispensed/picked up
 * Must be sent to both EHR and REMS Admin for REMS drugs
 */
export const buildRxFill = newRx => {
  const { Message } = JSON.parse(newRx.serializedJSON);
  const { Header, Body } = Message;
  console.log('Building RxFill per NCPDP SCRIPT');
  const time = new Date();

  // Extract medication data from NewRx
  const medicationPrescribed = Body.NewRx.MedicationPrescribed;
  const drugCoded = medicationPrescribed.DrugCoded;

  const medicationDispensed = {
    DrugDescription: medicationPrescribed.DrugDescription,
    DrugCoded: {
      ProductCode: drugCoded.ProductCode ? {
        Code: drugCoded.ProductCode.Code,
        Qualifier: drugCoded.ProductCode.Qualifier
      } : undefined,
      Strength: drugCoded.Strength ? {
        StrengthValue: drugCoded.Strength.StrengthValue,
        StrengthForm: drugCoded.Strength.StrengthForm,
        StrengthUnitOfMeasure: drugCoded.Strength.StrengthUnitOfMeasure
      } : undefined
    },
    Quantity: {
      Value: medicationPrescribed.Quantity.Value,
      CodeListQualifier: medicationPrescribed.Quantity.CodeListQualifier || '87',
      QuantityUnitOfMeasure: medicationPrescribed.Quantity.QuantityUnitOfMeasure
    },
    DaysSupply: medicationPrescribed.DaysSupply,
    WrittenDate: medicationPrescribed.WrittenDate,
    Substitutions: medicationPrescribed.Substitutions?.Substitutions || 
                   medicationPrescribed.Substitutions || '0',
    NumberOfRefills: medicationPrescribed.Refills?.Quantity || 
                     medicationPrescribed.NumberOfRefills || 0,
    Sig: medicationPrescribed.Sig
  };

  const message = {
    Message: {
      '@@DatatypesVersion': '20170715',
      '@@TransportVersion': '20170715',
      '@@TransactionDomain': 'SCRIPT',
      '@@TransactionVersion': '20170715',
      '@@StructuresVersion': '20170715',
      '@@ECLVersion': '20170715',
      Header: [
        {
          To: {
            '#text': Header.From._,
            '@@Qualifier': Header.From.$.Qualifier
          }
        },
        {
          From: {
            '#text': Header.To._,
            '@@Qualifier': Header.To.$.Qualifier
          }
        },
        { MessageID: uuidv4() },
        { RelatesToMessageID: Header.MessageID },
        { SentTime: time.toISOString() },
        { RxReferenceNumber: Header.MessageID },
        { PrescriberOrderNumber: Header.PrescriberOrderNumber }
      ],
      Body: [
        {
          RxFill: {
            FillStatus: {
              Dispensed: {
                Note: PICKED_UP
              }
            },
            Patient: Body.NewRx.Patient,
            Pharmacy: {
              Identification: {
                NCPDPID: Header.To._ || MOCK_VALUE,
                NPI: MOCK_VALUE
              },
              BusinessName: Header.To._ || 'Pharmacy',
              Address: {
                AddressLine1: MOCK_VALUE,
                City: MOCK_VALUE,
                StateProvince: MOCK_VALUE,
                PostalCode: MOCK_VALUE,
                CountryCode: 'US'
              },
              CommunicationNumbers: {
                PrimaryTelephone: {
                  Number: MOCK_VALUE
                }
              }
            },
            Prescriber: Body.NewRx.Prescriber,
            MedicationDispensed: medicationDispensed
          }
        }
      ]
    }
  };
  const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
  return builder.build(message);
};

/**
 * Build NCPDP REMSInitiationRequest
 */
export const buildREMSInitiationRequest = newRx => {
  const { Message } = JSON.parse(newRx.serializedJSON);
  const { Header, Body } = Message;
  const time = new Date();

  // Extract NDC from medication (prioritize NDC, fallback to other codes)
  const drugCoded = Body.NewRx.MedicationPrescribed.DrugCoded;
  const ndcCode =
    drugCoded?.NDC || drugCoded?.ProductCode?.Code;
  const humanPatient = Body.NewRx.Patient.HumanPatient;
  const patient = {
    HumanPatient: {
      Identification: {},  
      Names: humanPatient.Names,
      GenderAndSex: humanPatient.GenderAndSex,
      DateOfBirth: humanPatient.DateOfBirth,
      Address: humanPatient.Address
    }
  };

  const message = {
    Message: {
      '@@DatatypesVersion': '2024011',
      '@@TransportVersion': '2024011',
      '@@TransactionDomain': 'SCRIPT',
      '@@TransactionVersion': '2024011',
      '@@StructuresVersion': '2024011',
      '@@ECLVersion': '2024011',
      Header: [
        {
          To: {
            '#text': ndcCode,
            '@@Qualifier': 'ZZZ'
          }
        },
        {
          From: {
            '#text': Header.To._ || 'PIMS Pharmacy',
            '@@Qualifier': 'REMS'
          }
        },
        { MessageID: uuidv4() },
        { SentTime: time.toISOString() },
        {
          Security: {
            Sender: {
              SecondaryIdentification: 'PASSWORDR'
            }
          }
        },
        {
          SenderSoftware: {
            SenderSoftwareDeveloper: 'PIMS',
            SenderSoftwareProduct: 'PharmacySystem',
            SenderSoftwareVersionRelease: '1'
          }
        },
        { TestMessage: 'false' }
      ],
      Body: [
        {
          REMSInitiationRequest: {
            REMSReferenceID: uuidv4().replace(/-/g, '').substring(0, 25),
            Patient: patient,
            Pharmacy: {
              Identification: {
                NCPDPID: Header.To._ || MOCK_VALUE,
                NPI: MOCK_VALUE
              },
              BusinessName: Header.To._ || 'PIMS Pharmacy',
              CommunicationNumbers: {
                PrimaryTelephone: {
                  Number: MOCK_VALUE
                }
              }
            },
            Prescriber: Body.NewRx.Prescriber,
            MedicationPrescribed: Body.NewRx.MedicationPrescribed
          }
        }
      ]
    }
  };

  const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
  return builder.build(message);
};

/**
 * Build NCPDP REMSRequest
 */
export const buildREMSRequest = (newRx, caseNumber) => {
  const { Message } = JSON.parse(newRx.serializedJSON);
  const { Header, Body } = Message;
  const time = new Date();
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 7); 

  // Extract NDC from medication
  const drugCoded = Body.NewRx.MedicationPrescribed.DrugCoded;
  const ndcCode =
    drugCoded?.NDC || drugCoded?.ProductCode?.Code || '66215050130';

  const message = {
    Message: {
      '@@DatatypesVersion': '2024011',
      '@@TransportVersion': '2024011',
      '@@TransactionDomain': 'SCRIPT',
      '@@TransactionVersion': '2024011',
      '@@StructuresVersion': '2024011',
      '@@ECLVersion': '2024011',
      Header: [
        {
          To: {
            '#text': ndcCode,
            '@@Qualifier': 'ZZZ'
          }
        },
        {
          From: {
            '#text': Header.To._ || 'PIMS Pharmacy',
            '@@Qualifier': 'REMS'
          }
        },
        { MessageID: uuidv4() },
        { SentTime: time.toISOString() },
        {
          Security: {
            Sender: {
              SecondaryIdentification: 'PASSWORD'
            }
          }
        },
        {
          SenderSoftware: {
            SenderSoftwareDeveloper: 'PIMS',
            SenderSoftwareProduct: 'PharmacySystem',
            SenderSoftwareVersionRelease: '1'
          }
        },
        { TestMessage: 'false' }
      ],
      Body: [
        {
          REMSRequest: {
            REMSReferenceID: uuidv4().replace(/-/g, '').substring(0, 25),
            Patient: Body.NewRx.Patient,
            Pharmacy: {
              Identification: {
                NCPDPID: Header.To._ || MOCK_VALUE,
                NPI: MOCK_VALUE
              },
              BusinessName: Header.To._ || 'PIMS Pharmacy',
              CommunicationNumbers: {
                PrimaryTelephone: {
                  Number: MOCK_VALUE
                }
              }
            },
            Prescriber: Body.NewRx.Prescriber,
            MedicationPrescribed: Body.NewRx.MedicationPrescribed,
            Request: {
              SolicitedModel: {
                REMSCaseID: caseNumber,
                DeadlineForReply: {
                  Date: deadlineDate.toISOString().split('T')[0]
                }
              }
            }
          }
        }
      ]
    }
  };

  const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
  return builder.build(message);
};