/* NCPDP SCRIPT v2017071 Support */
import { XMLBuilder } from 'fast-xml-parser';

export default function buildRxStatus(caseNumber, doctorName, drugNames) {
  var time = new Date();
  var rxStatus = {
    RxStatus: [
      {
        Message: [
          {
            Header: [
              {
                To: doctorName
              },
              {
                From: 'Pharmacy' // Placeholder: This is dependant on individual pharmacy
              },
              {
                Message: 'NewRx Request Received For: ' + drugNames
              },
              {
                RelatesToMessageID: caseNumber // Placeholder: This is dependant on individual pharmacy, using Case Number
              },
              {
                Time: time
              }
            ]
          },
          {
            Body: [
              {
                Status: [
                  {
                    Code: '200' // Placeholder: This is dependant on individual pharmacy
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };
  const builder = new XMLBuilder({ oneListGroup: 'true' });
  var RxStatus = builder.build(rxStatus);

  return RxStatus;
}
