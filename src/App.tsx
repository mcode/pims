import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import { Button } from '@mui/material';
import Box from '@mui/material/Box';
import { Container } from '@mui/system';
import {
  BrowserRouter as Router, Link, Route, Routes
} from 'react-router-dom';
import './App.css';
import DoctorOrders from './views/DoctorOrders/DoctorOrders';
import Login from './views/Login/Login';


function App() {
  return (
    <Box >
      <Router >
        <div className="App">
          <Container className="NavContainer" maxWidth="xl">
            <div className="containerg">
              <div className="logo">
                <LocalPharmacyIcon sx={{ color: 'white', fontSize: 40, paddingTop: 2.5, paddingRight: 2.5 }} />
                <h1>Pharmacy</h1>
              </div>
              <div className="links">
                <Link className="NavButtons" to="/DoctorOrders"><Button variant="contained">Doctor Orders</Button></Link>
                <Link className="NavButtons" to="/Login"><Button variant="contained">Login</Button></Link>
              </div>
            </div>
          </Container>
        </div>
        <Routes>
          {/* Initial load to login page, will need to change to check for user authentication to load to correct page  */}
          <Route path="/" element={<Login />} />
          <Route path='/Login' element={< Login />}></Route>
          <Route path='/DoctorOrders' element={< DoctorOrders />}></Route>
        </Routes>
      </Router>
    </Box >
  );
}

export default App;
