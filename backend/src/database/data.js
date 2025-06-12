export const medicationRequestToRemsAdmins = Object.freeze([
  {
    rxnorm: 2183126,
    ndc: '65597-407-20',
    display: 'Turalio 200 MG Oral Capsule',
    remsAdminFhirUrl: process.env.REMS_ADMIN_FHIR_URL || 'http://localhost:8090/4_0_0'
  },
  {
    rxnorm: 6064,
    ndc: '0245-0571-01',
    display: 'Isotretinoin 20 MG Oral Capsule',
    remsAdminFhirUrl: process.env.REMS_ADMIN_FHIR_URL || 'http://localhost:8090/4_0_0'
  },
  {
    rxnorm: 1237051,
    ndc: '63459-502-30',
    display: 'TIRF 200 UG Oral Transmucosal Lozenge',
    remsAdminFhirUrl: process.env.REMS_ADMIN_FHIR_URL || 'http://localhost:8090/4_0_0'
  },
  {
    rxnorm: 1666386,
    ndc: '58604-214-30',
    display: 'Addyi 100 MG Oral Tablet',
    remsAdminFhirUrl: process.env.REMS_ADMIN_FHIR_URL || 'http://localhost:8090/4_0_0'
  }
]);