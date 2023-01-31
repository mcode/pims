import { Box, Tab, Tabs, Typography } from '@mui/material';
import { Container } from '@mui/system';
import React from 'react';
import './DoctorOrders.css';
import NewOrders from './NewOrders/NewOrders';
import PickedUpOrders from './PickedUpOrders/PickedUpOrders';
import VerifiedOrders from './VerifiedOrders/VerifiedOrders';
import axios from 'axios';


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{
          p: 1,
        }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}


export default function DoctorOrders() {
  const [tabIndex, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // // Get doctorOrder from dataBase
  // const CASENUMBER = 1675064515782;
  // let prescription = {};

  // axios.get('/doctorOrders/api/getRx')
  // .then(function (response){

  //   console.log('Prescription: ');
  //   console.log(response.data[CASENUMBER]);
  //   prescription = response.data[CASENUMBER];
  // });

  return (
    <Container maxWidth="xl">
      <Box sx={{
        width: '100%',
        border: 1,
        borderRadius: '5px',
        borderWidth: 4,
        borderColor: '#F1F3F4',
        backgroundColor: '#E7EBEF',

      }}>
        <Box sx={{ backgroundColor: '#F1F3F4', borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={handleChange} aria-label="basic tabs example" centered>
            <Tab label="New Orders" {...a11yProps(0)} />
            <Tab label="Picked Up Orders" {...a11yProps(1)} />
            <Tab label="Verified Orders" {...a11yProps(2)} />
          </Tabs>
        </Box>

        <Box>
          <Box sx={{ padding: 2 }}>
            {tabIndex === 0 && (
              <Box>
                <NewOrders></NewOrders>
              </Box>
            )}
            {tabIndex === 1 && (
              <Box>
                <PickedUpOrders></PickedUpOrders>
              </Box>
            )}
            {tabIndex === 2 && (
              <Box>
                <VerifiedOrders></VerifiedOrders>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Container>
  );
}