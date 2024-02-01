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
            Patient: {
              HumanPatient: {
                Name: {
                  LastName: Body.NewRx.Patient.HumanPatient.Name.LastName,
                  FirstName: Body.NewRx.Patient.HumanPatient.Name.FirstName
                },
                Gender: Body.NewRx.Patient.HumanPatient.Gender,
                DateOfBirth: { Date: Body.NewRx.Patient.HumanPatient.DateOfBirth.Date },
                Address: {
                  AddressLine1: Body.NewRx.Patient.HumanPatient.Address.AddressLine1,
                  City: Body.NewRx.Patient.HumanPatient.Address.City,
                  StateProvince: Body.NewRx.Patient.HumanPatient.Address.StateProvince,
                  PostalCode: Body.NewRx.Patient.HumanPatient.Address.PostalCode,
                  Country: Body.NewRx.Patient.HumanPatient.Address.Country
                }
              }
            },
            Pharmacy: {
              Identification: {
                NCPDPID: MOCK_VALUE,
                NPI: MOCK_VALUE
              },
              BusinessName: MOCK_VALUE,
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
            Prescriber: {
              NonVeterinarian: {
                Identification: Body.NewRx.Prescriber.NonVeterinarian.Identification.NPI
              },
              Name: {
                LastName: Body.NewRx.Prescriber.NonVeterinarian.Name.LastName,
                FirstName: Body.NewRx.Prescriber.NonVeterinarian.Name.FirstName
              },
              Address: {
                AddressLine1: Body.NewRx.Prescriber.NonVeterinarian.Address.AddressLine1,
                City: Body.NewRx.Prescriber.NonVeterinarian.Address.City,
                StateProvince: Body.NewRx.Prescriber.NonVeterinarian.Address.StateProvince,
                PostalCode: Body.NewRx.Prescriber.NonVeterinarian.Address.PostalCode,
                Country: Body.NewRx.Prescriber.NonVeterinarian.Address.Country
              },
              CommunicationNumbers: {
                PrimaryTelephone: {
                  Number:
                    Body.NewRx.Prescriber.NonVeterinarian.CommunicationNumbers.PrimaryTelephone
                      .Number
                },
                ElectronicMail:
                  Body.NewRx.Prescriber.NonVeterinarian.CommunicationNumbers.ElectronicMail
              }
            },
            MedicationPrescribed: {
              DrugDescription: Body.NewRx.MedicationPrescribed.DrugDescription,
              DrugCoded: {
                ProductCode: {
                  Code: Body.NewRx.MedicationPrescribed.DrugCoded.ProductCode.Code,
                  Qualifier: Body.NewRx.MedicationPrescribed.DrugCoded.ProductCode.Qualifier
                }
              },
              Quantity: {
                Value: Body.NewRx.MedicationPrescribed.Quantity.Value,
                CodeListQuantifier: Body.NewRx.MedicationPrescribed.Quantity.CodeListQuantifier,
                QuantityUnitOfMeasure: {
                  Code: Body.NewRx.MedicationPrescribed.Quantity.QuantityUnitOfMeasure.Code
                },
                WrittenDate: { Date: Body.NewRx.MedicationPrescribed.WrittenDate.Date },
                Substitutions: Body.NewRx.MedicationPrescribed.Substitutions,
                NumberOfRefills: Body.NewRx.MedicationPrescribed.NumberOfRefills,
                Sig: { SigText: Body.NewRx.MedicationPrescribed.Sig.SigText },
                PrescriberCheckedREMS: Body.NewRx.MedicationPrescribed.PrescriberCheckedREMS
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
