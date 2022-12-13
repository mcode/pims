import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import './OrderCard.css';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

function createData(
  patientName: string,
  patientDOB: string,
  doctorName: string,
  doctorContact: string,
  doctorID: number,
  doctorEmail: string,
  drugNames: string,
  drugPrice: number,
  quanitities: number,
  total: number,
  pickupDate: string,
  caseNumber: string,
  dispenseStatus: string,
) {
  return { patientName, patientDOB, doctorName, doctorContact, doctorID, doctorEmail, drugNames, drugPrice, quanitities, total, pickupDate, caseNumber, dispenseStatus };
}

const rows = [
  createData( "John Snow", '10/22/1980', 'Dr. Jane Betty Doe', '716-873-1557', 1122334455, 'jane.betty@myhospital.com', 'Isotretinoin 200 MG Oral Capsule', 200, 90, 18000, 'Tue Dec 13 2022', '43f575fe0ae14558976e4a71b7483242', 'Pending'),

];

export default function OrderCard() {
  return (
    <Card sx={{ minWidth: 275, mb: '10px' }}>
      <CardContent>
        {rows.map((row) => (
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
        ))}
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
              {rows.map((row) => (
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
      <CardActions>
        <Box sx={{marginLeft: 'auto', mr:'8px'}}>
        <Button variant="outlined" size="small" sx={{mr:'10px'}}>View ETASU</Button>
        <Button variant="contained" size="small" >Verify Order</Button>
        </Box>
      </CardActions>
    </Card>
  );
}