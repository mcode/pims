import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { Box, Typography } from '@mui/material';

//Delete me 
const tempData = [
  {
    stakeholderId: 'Patient/pat017',
    completed: true,
    metRequirementId: '63e537032f410a5ad56cf302',
    requirementName: 'Patient Enrollment',
    requirementDescription: 'Submit Patient Enrollment form to the REMS Administrator'
  },
  {
    stakeholderId: 'Practitioner/pra1234',
    completed: true,
    metRequirementId: '63e537032f410a5ad56cf303',
    requirementName: 'Prescriber Enrollment',
    requirementDescription: 'Submit Prescriber Enrollment form to the REMS Administrator'
  },
  {
    stakeholderId: 'Organization/pharm0111',
    completed: true,
    metRequirementId: '63e536c52f410a5ad56cf301',
    requirementName: 'Pharmacist Enrollment',
    requirementDescription: null
  }
];


const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction='up' ref={ref} {...props} />;
});

export default function EtasuPopUp() {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Button variant='outlined' size='small' onClick={handleClickOpen}>
        VIEW ETASU
      </Button>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby='alert-dialog-slide-description'
      >
        <DialogTitle>{'Elements to Assure Safe Use (ETASU)'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-slide-description'>
            <Box>
              {tempData.map((etasuElement) => 
                <Box key={etasuElement.stakeholderId}>
                  <Typography>{etasuElement.requirementName}</Typography>
                  <Typography>{etasuElement.completed ? '✅'  : '❌'}</Typography>
                </Box>
              )}
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}