import { Box, Button, Card, CardActions, CardContent, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import './OrderCard.css';
import JsonData from '../data.json'; // This file will be deleted once the api is fully implemented
import axios from 'axios';
import { useEffect, useState } from 'react';

// type DoctorOrder = {
//   caseNumber: string;
//   patientName: string;
//   patientDOB: string;
//   doctorName: string;
//   doctorContact: string;
//   doctorID: string;
//   doctorEmail: string;
//   drugNames: string;
//   drugPrice: number;
//   quanitities: string;
//   total: number;
//   pickupDate: string;
//   dispenseStatus: string;
// };

// type AllDoctorOrder = {
//     id: string;
//     doctorOrder: DoctorOrder[];
// }

// async function getDoctorOrders(): Promise<DoctorOrder>{
//   const response = await axios.get<DoctorOrder>('/doctorOrders/api/getRx');
//   console.log(response.data);
//   return response.data;
// }


export default function OrderCard() {
  // const [post, setPost] = useState(null);

  // let temp;
  // useEffect(() => {
  //   axios.get('/doctorOrders/api/getRx')
  //   .then((response) => {
  //     setPost(response.data);
  //     console.log(response.data);
  //     something(response.data);
  //   });
  // }, []);

  // if (!post) return null;

  // const something: (arg0: any) => void(data: any){
  //   console.log(data);
  // }


  // const [doctorOrder, setDoctorOrders] = useState<[] | DoctorOrder[]>([]);

  // useEffect(() => {
  //   (async () => {
  //     const doctorOrder = await getDoctorOrders();
  //     setDoctorOrders(doctorOrder[1675064515782]);
  //     console.log(doctorOrder);
  //   })();
  // }, []);

  // console.log(doctorOrder);

  // return (
  //   <Card>
  //     <h1>orders: {doctorOrder[1675064515782]}</h1>

  //       <ul>
  //         {doctorOrder.map((doctorOrder: DoctorOrder) => (
  //           <li>one</li>
  //         ))}
  //       </ul>

  //   </Card>
  // );

  // Get doctorOrder from dataBase
  const CASENUMBER = 1675064515782;
  let prescription = {};

  const getAllDoctorOrders = () => {
    axios.get('/doctorOrders/api/getRx')
    .then(function (response){

      console.log('Prescription: ');
      console.log(response.data[CASENUMBER]);
      prescription = response.data[CASENUMBER];
    })
    .catch(error => console.error('Error: $(error'));
  };
  getAllDoctorOrders();

  return (
    <Card sx={{ bgcolor: '#F5F5F7' }}>
      {JsonData.map((row) =>
        <Card key={row.caseNumber} sx={{ minWidth: 275, margin: 2, boxShadow: '10px' }}>
          <CardContent>
            <Box>
              <Typography variant="h5" component="div">
                {row.patientName}
              </Typography>
              <Typography color="text.secondary">
                DOB: {row.patientDOB}
              </Typography>
              <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                Case # {row.caseNumber}
              </Typography>
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
              <Button variant="outlined" size="small" sx={{ mr: '10px' }}>View ETASU</Button>
              <Button variant="contained" size="small" >Verify Order</Button>
            </Box>
          </CardActions>
        </Card>
      )}
    </Card>
  );
}