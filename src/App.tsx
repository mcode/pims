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
import NewOrders from './views/DoctorOrders/NewOrders/NewOrders';
import VerifiedOrders from './views/DoctorOrders/VerifiedOrders/VerifiedOrders';
import PickedUpOrders from './views/DoctorOrders/PickedUpOrders/PickedUpOrders';

function App() {
  return (
    <Router>
      <div className="App">
        <ul>
          <li>
            <Link to="/Login">Login</Link>
          </li>
          <li>
            <Link to="/DoctorOrders">Doctor Orders</Link>
          </li>
          <li>
            <Link to="/NewOrders">New Orders</Link>
          </li>
          <li>
            <Link to="/VerifiedOrders">Verified Orders</Link>
          </li>
          <li>
            <Link to="/PickedUpOrders">Picked Up Orders</Link>
          </li>
        </ul>
      </div>
      <Routes>
        <Route  path='/Login' element={< Login />}></Route>
        <Route  path='/DoctorOrders' element={< DoctorOrders />}></Route>
        <Route path='/NewOrders' element={< NewOrders />}></Route>
        <Route path='/VerifiedOrders' element={< VerifiedOrders />}></Route>
        <Route path='/PickedUpOrders' element={< PickedUpOrders />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
