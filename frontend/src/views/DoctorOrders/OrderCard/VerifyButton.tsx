import Button from '@mui/material/Button';
import axios from 'axios';

const VerifyButton = (props: any) => {
  //verify the order
  const verifyOrder = () => {
    const url = '/doctorOrders/api/updateRx/' + props.data.row._id;
    axios
      .patch(url)
      .then(function (response) {
        props.data.getAllDoctorOrders();
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
