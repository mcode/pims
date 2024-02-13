/* NCPDP SCRIPT v2017071 Support */
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

export function buildRxStatus(newRxMessageConvertedToJSON) {
  const { Message } = newRxMessageConvertedToJSON;
  const { Header, Body } = Message;
  const time = new Date();
  const rxStatus = {
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
            Message:
              'NewRx Request Received For: ' + Body.NewRx.MedicationPrescribed.DrugDescription
          },
          { RelatesToMessageID: Header.MessageID },
          { SentTime: time.toISOString() },
          { PrescriberOrderNumber: Header.PrescriberOrderNumber }
        ]
      },
      {
        Body: [
          {
            Status: [
              {
                Code: '000' // Placeholder: This is dependent on individual pharmacy
              }
            ]
          }
        ]
      }
    ]
  };

  const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
  return builder.build(rxStatus);
}

export const buildRxFill = newRx => {
  const { Message } = JSON.parse(newRx.serializedJSON);
  const { Header, Body } = Message;
  console.log('Message', Message);
  const time = new Date();
  const message = {
    Message: {
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
                NCPDPID: MOCK_VALUE,
                NPI: MOCK_VALUE
              },
              BusinessName: Header.To._,
              Address: {
                AddressLine1: MOCK_VALUE,
                City: MOCK_VALUE,
                StateProvince: MOCK_VALUE,
                PostalCode: MOCK_VALUE,
                Country: MOCK_VALUE
              },
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
