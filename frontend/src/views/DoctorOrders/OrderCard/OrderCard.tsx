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

interface DoctorOrder {
  caseNumber?: string;
  patientName?: string;
  patientDOB?: string;
  doctorName?: string;
  doctorContact?: string;
  doctorID?: string;
  doctorEmail?: string;
  drugNames?: string;
  drugPrice?: number;
  quantities?: string;
  total?: number;
  pickupDate?: string;
  dispenseStatus?: string;
  metRequirements: {
    name: string;
    resource: {
      status: string;
      moduleUri: string;
      resourceType: string;
      note: [{ text: string }];
      subject: {
        reference: string;
      };
    };
  }[];
}

const OrderCard = (props: any) => {
  const [doctorOrder, setDoctorOrders] = useState<DoctorOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  //remove all doctorOrders
  const deleteAll = async () => {
    const orders = await axios.delete('/doctorOrders/api/deleteAll');
    setDoctorOrders(orders.data);
    console.log('Deleting all Doctor Orders');
  };
  const url = '/doctorOrders/api/getRx';

  // Running after component renders to call api
  useEffect(() => {
    getAllDoctorOrders();
  }, []);

  const getAllDoctorOrders = async () => {
    await axios
      .get(url)
      .then(function (response) {
        const allDoctorOrders = response.data;
        setIsLoading(false);
        setDoctorOrders(allDoctorOrders);
      })
      .catch(error => {
        setIsLoading(false);
        console.error(`Error: ${error}`);
      });
  };

  if (doctorOrder.length < 1 && !isLoading) {
    return (
      <Card style={{ padding: '15px' }}>
        <h1>No orders yet.</h1>
      </Card>
    );
  } else {
    return (
      <Card sx={{ bgcolor: '#F5F5F7' }}>
        {doctorOrder.map(row => (
          <Card key={row.caseNumber} sx={{ minWidth: 275, margin: 2, boxShadow: '10px' }}>
            {/* Checking dispense status for the right tab to display it correctly */}
            {/* TODO: We should add an endpoint with the ability to fetch doctor orders based on the 
            tab/dispense status instead of fetching all doctor orders and filtering them out on the frontend. */}
            {props.tabStatus === row.dispenseStatus && (
              <Card>
                <CardContent>
                  <Box>
                    <Typography variant="h5" component="div">
                      {row.patientName}
                    </Typography>
                    <Typography variant="h5" component="div" color="text.secondary">
                      DOB: {row.patientDOB}
                    </Typography>
                    <Typography component="div" sx={{ mb: 2 }} variant="h6">
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
                          <TableCell align="left">{row.dispenseStatus}</TableCell>
                          <TableCell align="right">{row.quantities}</TableCell>
                          <TableCell align="right">{row.drugPrice}</TableCell>
                          <TableCell align="right">{row.total}</TableCell>
                          <TableCell align="right">{row.doctorName}</TableCell>
                          <TableCell align="right">{row.doctorID}</TableCell>
                          <TableCell align="right">{row.doctorContact}</TableCell>
                          <TableCell align="right">{row.doctorEmail}</TableCell>
                          <TableCell align="right">{row.pickupDate}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
                <CardActions>
                  <Box sx={{ marginLeft: 'auto', mr: '8px' }}>
                    <EtasuPopUp data={row} />
                    {props.tabStatus === 'Pending' && (
                      <VerifyButton data={{ row, getAllDoctorOrders }} />
                    )}
                    {props.tabStatus === 'Approved' && (
                      <PickedUpButton data={{ row, getAllDoctorOrders }} />
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
            onClick={deleteAll}
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
  }
};

export default OrderCard;
