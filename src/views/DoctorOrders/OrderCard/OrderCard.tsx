import { Box, Button, Card, CardActions, CardContent, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import './OrderCard.css';
import axios from 'axios';
import { useEffect, useState } from 'react';
import EtasuPopUp from './EtasuPopUp/EtasuPopUp';

interface DoctorOrder  {
  caseNumber?: string;
  patientName?: string;
  patientDOB?: string;
  doctorName?: string;
  doctorContact?: string;
  doctorID?: string;
  doctorEmail?: string;
  drugNames?: string;
  drugPrice?: number;
  quanitities?: string;
  total?: number;
  pickupDate?: string;
  dispenseStatus?: string;
  metRequirements?: {
    stakeholderId: string,
    completed: boolean,
    metRequirementId: string,
    requirementName: string,
    requirementDescription: string
  }[]
}


export default function OrderCard() {
  //remove all doctorOrders
  const deleteAll = () => {
    axios.delete('/doctorOrders/api/deleteAll');
    console.log('Deleting all Doctor Orders');
  };

  const [doctorOrder, getDoctorOrders] = useState<DoctorOrder[]>([]);

  const url = '/doctorOrders/api/getRx';

  // Running after component renders to call api 
  useEffect(() => {
    getAllDoctorOrders();
  }, []);

  const getAllDoctorOrders = () => {
    axios.get(url)
      .then(function (response) {

        // console.log('Prescription: ');
        // console.log(response.data);
        const AllDoctorOrders = response.data;
        //Adding data to state
        getDoctorOrders(AllDoctorOrders);
      })
      .catch(error => console.error('Error: $(error'));
  };

  if (doctorOrder.length < 0) {
    return (
      <Card>No orders yet.</Card>
    );
  } else {
    return (
      <Card sx={{ bgcolor: '#F5F5F7' }}>
        {doctorOrder.map((row) =>
          <Card key={row.caseNumber} sx={{ minWidth: 275, margin: 2, boxShadow: '10px' }}>
            <CardContent>
              <Box>
                <Typography variant="h5" component="div">
                  {row.patientName}
                </Typography>
                <Typography color="text.secondary">
                  DOB: {row.patientDOB}
                </Typography>
                {/* <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                  Case # {row.caseNumber}
                </Typography> */}
                <Typography sx={{ mb: 2 }} variant="h6">
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
                      <TableCell align="right">{row.quanitities}</TableCell>
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
                {/* <Button variant="outlined" size="small" sx={{ mr: '10px' }}>View ETASU</Button> */}
                <EtasuPopUp />
                <Button variant="contained" size="small" >Verify Order</Button>

              </Box>
            </CardActions>
          </Card>
        )}
        <Box sx={{ marginLeft: 'auto', m: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Button onClick={deleteAll} variant="outlined" color="error" size="small" sx={{ mr: '10px' }}>Remove All</Button>
        </Box>
      </Card>
    );
  }
}