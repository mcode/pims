
// Configuration state
let config = {
  useIntermediary: process.env.USE_INTERMEDIARY,
  intermediaryUrl: process.env.INTERMEDIARY_URL,
  remsAdminUrl: process.env.REMS_ADMIN_NCPDP,
  ehrUrl: process.env.EHR_NCPDP_URL
};



export function getConfig() {
  return { ...config };
}


export function updateConfig(newConfig) {
  config = { ...config, ...newConfig };
  console.log('Configuration updated:', config);
  return { ...config };
}

/**
 * Get the endpoint for NCPDP messages (REMS)
 */
export function getNCPDPEndpoint() {
  if (config.useIntermediary) {
    return `${config.intermediaryUrl}/ncpdp/script`;
  }
  return config.remsAdminUrl;
}

/**
 * Get the endpoint for ETASU requests
 */
export function getETASUEndpoint() {
  if (config.useIntermediary) {
    return `${config.intermediaryUrl}/etasu`;
  }
  // Direct ETASU endpoint to REMS Admin
  return config.remsAdminUrl.replace('/ncpdp', '/4_0_0/GuidanceResponse/$rems-etasu');
}

/**
 * Get the endpoint for RxFill messages (to EHR)
 * RxFill is sent to both EHR and REMS Admin
 * If using intermediary, send to intermediary (it forwards to both)
 * If not using intermediary, return EHR endpoint (caller must also send to REMS)
 */
export function getRxFillEndpoint() {
  if (config.useIntermediary) {
    // Intermediary handles forwarding to both EHR and REMS Admin
    return `${config.intermediaryUrl}/ncpdp/script`;
  }
  return config.ehrUrl;
}