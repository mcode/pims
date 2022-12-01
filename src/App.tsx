import React from 'react';
import logo from './logo.svg';
import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';
import DoctorOrders from './views/DoctorOrders/DoctorOrders';
import Login from './views/Login/Login';
import Box from '@mui/material/Box';
import { Button, Grid, Paper, styled } from '@mui/material';
import { Container, Stack } from '@mui/system';
import { red } from '@mui/material/colors';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';


function App() {
  return (
    <Box >
      <Router >
        <div className="App">
          <Container className="NavContainer" maxWidth="xl">
            <div className="containerg">
              <div className="a">
              <LocalPharmacyIcon sx={{color:'white', fontSize: 40, paddingTop:2.5, paddingRight:2.5}}/>
                <h1>Pharmacy</h1>
                
              </div>
              <div className="b">
                <Link className="NavButtons" to="/DoctorOrders"><Button variant="contained">Doctor Orders</Button></Link>
                <Link className="NavButtons" to="/Login"><Button variant="contained">Login</Button></Link>
              </div>
            </div>


          </Container>
        </div>
        <Routes>
          <Route path='/Login' element={< Login />}></Route>
          <Route path='/DoctorOrders' element={< DoctorOrders />}></Route>
        </Routes>
      </Router>
    </Box >

  );
}

export default App;
