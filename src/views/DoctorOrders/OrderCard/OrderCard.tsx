import { Box, Button, Card, CardActions, CardContent, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import './OrderCard.css';
import JsonData from '../data.json'; // This file will be deleted once the api is fully implemented

export default function OrderCard() {
  return (
    <Card>
      {JsonData.map((row) =>
        <Card sx={{ minWidth: 275, mb: '10px' }}>
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