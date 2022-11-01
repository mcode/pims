import React from 'react';
import './App.css';
import Login from './views/Login/Login';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme'

function App() {
  return (

    <div className="App">
      <ThemeProvider theme={theme}>
        <Login />
      </ThemeProvider>
    </div>
  );
}

export default App;
