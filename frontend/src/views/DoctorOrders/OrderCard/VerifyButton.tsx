import Button from '@mui/material/Button';
import axios from 'axios';
import { DoctorOrder } from './OrderCard';

type VerifyButtonProps = { row: DoctorOrder; getAllDoctorOrders: () => Promise<void> };

const VerifyButton = (props: VerifyButtonProps) => {
  // verify the order
  const verifyOrder = () => {
    const url = '/doctorOrders/api/updateRx/' + props.row._id;
    axios
      .patch(url)
      .then(function (response) {
        props.getAllDoctorOrders();
        console.log(response.data);
      })
      .catch(error => console.error('Error', error));
  };

  return (
    <Button variant="contained" size="small" onClick={verifyOrder}>
      Verify Order
    </Button>
  );
};

export default VerifyButton;
