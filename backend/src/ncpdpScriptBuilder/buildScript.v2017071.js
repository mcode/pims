/* NCPDP SCRIPT v2017071 Support */
import { XMLBuilder } from 'fast-xml-parser';


export default function buildRxStatus(newOrder) {
  var time = new Date();
  var rxStatus = {
    Message: [
      {
        Header: [
          {
            To: {
              '#text': newOrder.doctorID,
              '@@Qualifier': 'C'
            }
          },
          {
            From: {
              '#text': 'Pharmacy', // Placeholder: This is dependant on individual pharmacy
              '@@Qualifier': 'P'
            }
          },
          {
            Message: 'NewRx Request Received For: ' + newOrder.drugNames
          },
          {
            RelatesToMessageID: newOrder.caseNumber // Placeholder: This is dependant on individual pharmacy, using Case Number
          },
          {
            SentTime: time.toISOString()
          },
          {
            PrescriberOrderNumber: newOrder.prescriberOrderNumber
          }
        ]
      },
      {
        Body: [
          {
            Status: [
              {
                Code: '000' // Placeholder: This is dependant on individual pharmacy
              }
            ]
          }
        ]
      }
    ]
  };
  const options = {
    ignoreAttributes: false,
    attributeNamePrefix: "@@",
    format: true,
    oneListGroup: 'true'
  };
  const builder = new XMLBuilder(options);
  var RxStatus = builder.build(rxStatus);

  return RxStatus;
}
