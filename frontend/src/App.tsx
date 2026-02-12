import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import { Button } from '@mui/material';
import Box from '@mui/material/Box';
import { Container } from '@mui/system';
import { BrowserRouter as Router, Link, Route, Routes } from 'react-router-dom';
import './App.css';
import DoctorOrders from './views/DoctorOrders/DoctorOrders';
import Login from './views/Login/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import ConfigToggle from './components/ConfigToggle';
import axios from 'axios';

axios.defaults.baseURL = process.env.REACT_APP_PIMS_BACKEND_URL
  ? process.env.REACT_APP_PIMS_BACKEND_URL
  : 'http://localhost:' +
    (process.env.REACT_APP_PIMS_BACKEND_PORT ? process.env.REACT_APP_PIMS_BACKEND_PORT : '5051');

const basename = process.env.REACT_APP_VITE_BASE?.replace(/\/$/, '') || '';

function App() {
  return (
    <AuthProvider>
      <Box>
        <Router basename={basename}>
          <div className="App">
            <Container className="NavContainer" maxWidth="xl">
              <div className="containerg">
                <div className="logo">
                  <LocalPharmacyIcon
                    sx={{ color: 'white', fontSize: 40, paddingTop: 2.5, paddingRight: 2.5 }}
                  />
                  <h1>Pharmacy</h1>
                </div>
                <div className="links">
                  <Link className="NavButtons" to="/DoctorOrders">
                    <Button variant="contained">Doctor Orders</Button>
                  </Link>
                  <Link className="NavButtons" to="/Login">
                    <Button variant="contained">Login</Button>
                  </Link>
                  <ConfigToggle />
                </div>
              </div>
            </Container>
          </div>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/Login" element={<Login />} />
            <Route
              path="/DoctorOrders"
              element={
                <ProtectedRoute>
                  <DoctorOrders />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </Box>
    </AuthProvider>
  );
}

export default App;