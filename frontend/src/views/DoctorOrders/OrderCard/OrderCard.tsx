import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import EtasuPopUp from './EtasuPopUp/EtasuPopUp';
import './OrderCard.css';
import PickedUpButton from './PickedUpButton';
import VerifyButton from './VerifyButton';

export type DoctorOrder = {
  caseNumber: string;
  dispenseStatus: TabStatus;
  doctorContact: string;
  doctorEmail: string;
  doctorID: string;
  doctorName: string;
  drugNames: string;
  drugPrice: number;
  metRequirements: ({
    completed: boolean;
    metRequirementId: string;
    requirementDescription: string;
    requirementName: string;
    stakeholderId: string;
  } & { _id: string })[];
  patientDOB: string;
  patientName: string;
  pickupDate: string;
  quantities: string;
  total: number;
} & { _id: string };

export enum TabStatus {
  PickedUp = 'Picked Up',
  Approved = 'Approved',
  Pending = 'Pending'
}

export type OrderCardProps = {
  tabStatus: TabStatus;
};

const OrderCard = (props: OrderCardProps) => {
  const [doctorOrders, setDoctorOrders] = useState<DoctorOrder[]>([]);

  const deleteAllDoctorOrders = async () => {
    // TODO: This endpoint should be renamed/updated to reflect that it mutates the MongoDB database and that it returns an empty array, because its current name doesn't reflect the latter.
    const response = await axios.delete('/doctorOrders/api/deleteAll');
    setDoctorOrders(response.data);
    console.log('Deleting all Doctor Orders');
  };
  const url = '/doctorOrders/api/getRx';

  // Running after component renders to call api
  useEffect(() => {
    getAllDoctorOrders();
  }, []);

  const getAllDoctorOrders = () => {
    axios
      .get(url)
      .then(response => {
        setDoctorOrders(response.data);
      })
      .catch(error => console.error(`Error: ${error}`));
  };

  if (doctorOrders.length > 0) {
    return (
      <Card sx={{ bgcolor: '#F5F5F7' }}>
        {doctorOrders.map(row => (
          <Card key={row.caseNumber} sx={{ minWidth: 275, margin: 2, boxShadow: '10px' }}>
            {/* TODO: We should add an endpoint with the ability to fetch doctor orders based on the tab/dispense status instead of fetching all doctor orders and filtering them out on the frontend. */}
            {props.tabStatus === row.dispenseStatus && (
              <Card>
                <CardContent>
                  <Box>
                    <Typography variant="h5" component="div" data-testid="patientName">
                      {row.patientName}
                    </Typography>
                    <Typography
                      variant="h5"
                      component="div"
                      color="text.secondary"
                      data-testid="patientDOB"
                    >
                      DOB: {row.patientDOB}
                    </Typography>
                    <Typography component="div" sx={{ mb: 2 }} variant="h6" data-testid="drugNames">
                      {row.drugNames}
                    </Typography>
                  </Box>
                  <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                      <TableHead sx={{ fontWeight: 'bold' }}>
                        <TableRow sx={{ fontWeight: 'bold' }}>
                          <TableCell align="left">Dispense Status</TableCell>
                          <TableCell align="right">Quanitities</TableCell>
                          <TableCell align="right">Drug Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="right">Doctor Name</TableCell>
                          <TableCell align="right">Doctor ID</TableCell>
                          <TableCell align="right">Doctor Contact</TableCell>
                          <TableCell align="right">Doctor Email</TableCell>
                          <TableCell align="right">Pickup Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell align="left" data-testid="dispenseStatus">
                            {row.dispenseStatus}
                          </TableCell>
                          <TableCell align="right" data-testid="quantities">
                            {row.quantities}
                          </TableCell>
                          <TableCell align="right" data-testid="drugPrice">
                            {row.drugPrice}
                          </TableCell>
                          <TableCell align="right" data-testid="total">
                            {row.total}
                          </TableCell>
                          <TableCell align="right" data-testid="doctorName">
                            {row.doctorName}
                          </TableCell>
                          <TableCell align="right" data-testid="doctorID">
                            {row.doctorID}
                          </TableCell>
                          <TableCell align="right" data-testid="doctorContact">
                            {row.doctorContact}
                          </TableCell>
                          <TableCell align="right" data-testid="doctorEmail">
                            {row.doctorEmail}
                          </TableCell>
                          <TableCell align="right" data-testid="pickupDate">
                            {row.pickupDate}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
                <CardActions>
                  <Box sx={{ marginLeft: 'auto', mr: '8px' }}>
                    <EtasuPopUp data={row} />
                    {props.tabStatus === TabStatus.Pending && (
                      <VerifyButton row={row} getAllDoctorOrders={getAllDoctorOrders} />
                    )}
                    {props.tabStatus === TabStatus.Approved && (
                      <PickedUpButton row={row} getAllDoctorOrders={getAllDoctorOrders} />
                    )}
                  </Box>
                </CardActions>
              </Card>
            )}
          </Card>
        ))}
        <Box
          sx={{
            marginLeft: 'auto',
            m: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Button
            onClick={deleteAllDoctorOrders}
            variant="outlined"
            color="error"
            size="small"
            sx={{ mr: '10px' }}
          >
            Remove All
          </Button>
        </Box>
      </Card>
    );
  } else {
    return (
      <Card sx={{ margin: 2 }}>
        <h1>No orders yet.</h1>
      </Card>
    );
  }
};

export default OrderCard;
