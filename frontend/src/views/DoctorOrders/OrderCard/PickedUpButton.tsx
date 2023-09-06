import Button from '@mui/material/Button';
import axios from 'axios';
import { DoctorOrder } from './OrderCard';

<<<<<<< Updated upstream


// interface DoctorOrder {
//     caseNumber?: string;
//     patientName?: string;
//     patientDOB?: string;
//     doctorName?: string;
//     doctorContact?: string;
//     doctorID?: string;
//     doctorEmail?: string;
//     drugNames?: string;
//     drugPrice?: number;
//     quanitities?: string;
//     total?: number;
//     pickupDate?: string;
//     dispenseStatus?: string;
//     metRequirements: {
//         stakeholderId: string,
//         completed: boolean,
//         metRequirementId: string,
//         requirementName: string,
//         requirementDescription: string,
//         _id: string
//     }[]
// }

const PickedUpButton = (props: any) => {
    

    //verify the order
    const verifyOrder = () => {
        const url = '/doctorOrders/api/updateRx/' + props.data.row._id + '/pickedUp';
        axios.patch(url)
            .then(function (response) {
                props.data.getAllDoctorOrders();
                console.log(response.data);
            })
            .catch(error => console.error('Error: $(error'));
    };

    return (
        <Button variant="contained" size="small" onClick={verifyOrder}>Mark as Picked Up</Button>
    );
=======
type PickedUpButtonProps = {
  row: DoctorOrder;
  getAllDoctorOrders: () => void;
>>>>>>> Stashed changes
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
