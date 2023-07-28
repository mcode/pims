import Button from '@mui/material/Button';
import axios from 'axios';
import { DoctorOrder } from './OrderCard';

type PickedUpButtonProps = {
  row: DoctorOrder;
  getAllDoctorOrders: () => void;
};

const PickedUpButton = (props: PickedUpButtonProps) => {
  const verifyOrder = () => {
    const url = '/doctorOrders/api/updateRx/' + props.row._id + '/pickedUp';
    axios
      .patch(url)
      .then(function (response) {
        props.getAllDoctorOrders();
        console.log(response.data);
      })
      .catch(error => console.error(`Error: ${error}`));
  };

  return (
    <Button variant="contained" size="small" onClick={verifyOrder}>
      Mark as Picked
    </Button>
  );
};

export default PickedUpButton;
