import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import axios from 'axios';
import * as React from 'react';
import { useState } from 'react';

type Requirement = {
  name: string;
  resource: {
    status: string;
    moduleUri: string;
    resourceType: string;
    note: [
      {
        text: string;
      }
    ];
    subject: {
      reference: string;
    };
  };
};

type AuthNumber = {
  name: 'auth_number';
  valueString: string;
};

type MetRequirements = Requirement | AuthNumber;

export type DoctorOrder = {
  caseNumber?: string;
  patientName?: string;
  patientDOB?: string;
  doctorName?: string;
  doctorContact?: string;
  doctorID?: string;
  doctorEmail?: string;
  drugNames?: string;
  drugPrice?: number;
  drugRxNormCode: number;
  quantities?: string;
  total?: number;
  pickupDate?: string;
  dispenseStatus?: string;
  metRequirements: MetRequirements[];
};

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EtasuPopUp = (props: any) => {
  const [open, setOpen] = React.useState(false);

  const [doctorOrder, setDoctorOrder] = useState<DoctorOrder>();

  const etasuElements = (
    (doctorOrder?.metRequirements || []).filter(m => m.name !== 'auth_number') as Requirement[]
  ).sort((first: Requirement, second: Requirement) => {
    // Keep the other forms unsorted.
    if (second.name.includes('Patient Status Update')) {
      // Sort the Patient Status Update forms in descending order of timestamp.
      return second.name.localeCompare(first.name);
    }
    return 0;
  });

  const handleClickOpen = () => {
    setOpen(true);
    const url = '/doctorOrders/api/updateRx/' + props.data._id + '/metRequirements';
    axios
      .patch(url)
      .then(function (response) {
        setDoctorOrder(response.data);
      })
      .catch(error => console.error('Error', error));
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box>
      <Button variant="outlined" size="small" onClick={handleClickOpen}>
        VIEW ETASU
      </Button>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle>{'Elements to Assure Safe Use (ETASU)'}</DialogTitle>
        <DialogContent>
          <DialogContentText component="div" id="alert-dialog-slide-description">
            <Box>
              {etasuElements.map(({ name, resource }) => (
                <Box key={name}>
                  <Typography component="div">{name}</Typography>
                  <Typography component="div">
                    {resource.status === 'success' ? '✅' : '❌'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EtasuPopUp;
