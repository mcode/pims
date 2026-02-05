import { Alert, Snackbar } from '@mui/material';
import React from 'react';

// NCPDP Denial Reason Code mapping
const DENIAL_CODE_MESSAGES: Record<string, string> = {
  EM: 'Patient Enrollment/Certification Required',
  ES: 'Prescriber Enrollment/Certification Required',
  EO: 'Pharmacy Enrollment/Certification Required',
  EC: 'Case Information Missing or Invalid',
  ER: 'REMS Program Error',
  EX: 'Prescriber Deactivated/Decertified',
  EY: 'Pharmacy Deactivated/Decertified',
  EZ: 'Patient Deactivated/Decertified'
};

type DenialNotificationProps = {
  open: boolean;
  onClose: () => void;
  denialCode?: string;
  remsNote?: string;
}
const DenialNotification = (props: DenialNotificationProps) => {
  const getMessage = () => {
    if (props.remsNote) {
      return props.remsNote;
    }
    
    // Fallback to hardcoded messages if remsNote is empty
    if (props.denialCode) {
      return DENIAL_CODE_MESSAGES[props.denialCode] || `Denial Code: ${props.denialCode}`;
    }
    
    return 'Order verification denied';
  };

  return (
    <Snackbar
      open={props.open}
      autoHideDuration={6000}
      onClose={props.onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert onClose={props.onClose} severity="error" sx={{ width: '100%' }}>
        {getMessage()}
      </Alert>
    </Snackbar>
  );
};

export default DenialNotification;