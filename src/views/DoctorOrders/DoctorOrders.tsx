import React from 'react';
import './DoctorOrders.css';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import NewOrders from './NewOrders/NewOrders';
import PickedUpOrders from './PickedUpOrders/PickedUpOrders';
import VerifiedOrders from './VerifiedOrders/VerifiedOrders';
import { Container } from '@mui/system';

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
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{
        width: "100%",
        border: 1,
        borderRadius: '5px',
        borderWidth:4,
        borderColor: '#F1F3F4',

      }}>
        <Box sx={{ backgroundColor:"#F1F3F4", borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" centered>
            <Tab label="New Orders" {...a11yProps(0)} />
            <Tab label="Picked Up Orders" {...a11yProps(1)} />
            <Tab label="Verified Orders" {...a11yProps(2)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <NewOrders></NewOrders>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <PickedUpOrders></PickedUpOrders>
        </TabPanel>
        <TabPanel value={value} index={2}>
          <VerifiedOrders></VerifiedOrders>
        </TabPanel>
      </Box>
    </Container>
  );
}