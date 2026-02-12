import Button from '@mui/material/Button';
import axios from 'axios';
import { useState } from 'react';
import { DoctorOrder } from './OrderCard';
import DenialNotification from './DenialNotification';

type VerifyButtonProps = { row: DoctorOrder; getAllDoctorOrders: () => Promise<void> };

const VerifyButton = (props: VerifyButtonProps) => {
  const [showDenial, setShowDenial] = useState(false);
  const [denialCode, setDenialCode] = useState<string | undefined>();
  const [remsNote, setRemsNote] = useState<string | undefined>();

  const verifyOrder = () => {
    const url = '/doctorOrders/api/updateRx/' + props.row._id;
    axios
      .patch(url)
      .then(function (response) {
        const updatedOrder = response.data;
        
        // Check if the order was denied by NCPDP REMS
        if (updatedOrder.denialReasonCode) {
          setDenialCode(updatedOrder.denialReasonCode);
          setRemsNote(updatedOrder.remsNote);
          setShowDenial(true);
        }
        
        props.getAllDoctorOrders();
        console.log(response.data);
      })
      .catch(error => {
        console.error('Error', error);
      });
  };

  const handleCloseDenial = () => {
    setShowDenial(false);
  };

  return (
    <>
      <Button variant="contained" size="small" onClick={verifyOrder}>
        Verify Order
      </Button>
      <DenialNotification
        open={showDenial}
        onClose={handleCloseDenial}
        denialCode={denialCode}
        remsNote={remsNote}
      />
    </>
  );
};

export default VerifyButton;