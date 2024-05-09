export const medicationRequestToRemsAdmins = Object.freeze([
  {
    rxnorm: 2183126,
    display: 'Turalio 200 MG Oral Capsule',
    remsAdminFhirUrl: process.env.REMS_ADMIN_FHIR_URL || 'http://localhost:8090/4_0_0'
  },
  {
    rxnorm: 6064,
    display: 'Isotretinoin 20 MG Oral Capsule',
    remsAdminFhirUrl: process.env.REMS_ADMIN_FHIR_URL || 'http://localhost:8090/4_0_0'
  },
  {
    rxnorm: 1237051,
    display: 'TIRF 200 UG Oral Transmucosal Lozenge',
    remsAdminFhirUrl: process.env.REMS_ADMIN_FHIR_URL || 'http://localhost:8090/4_0_0'
  },
  {
    rxnorm: 1666386,
    display: 'Addyi 100 MG Oral Tablet',
    remsAdminFhirUrl: process.env.REMS_ADMIN_FHIR_URL || 'http://localhost:8090/4_0_0'
  }
]);
