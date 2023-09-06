import { Box, Tab, Tabs } from '@mui/material';
import { Container } from '@mui/system';
import React from 'react';
import './DoctorOrders.css';
import NewOrders from './NewOrders/NewOrders';
import PickedUpOrders from './PickedUpOrders/PickedUpOrders';
import VerifiedOrders from './VerifiedOrders/VerifiedOrders';

// This function is from https://mui.com/material-ui/react-tabs/
// "a11y" is a common web development abbreviation for "accessibility", according to https://developer.mozilla.org/en-US/docs/Web/Accessibility
function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

export default function DoctorOrders() {
  const [tabIndex, setValue] = React.useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          width: '100%',
          border: 1,
          borderRadius: '5px',
          borderWidth: 4,
          borderColor: '#F1F3F4',
          backgroundColor: '#E7EBEF'
        }}
      >
        <Box sx={{ backgroundColor: '#F1F3F4', borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={handleChange} aria-label="basic tabs example" centered>
            <Tab label="New Orders" {...a11yProps(0)} />
            <Tab label="Verified Orders" {...a11yProps(1)} />
            <Tab label="Picked Up Orders" {...a11yProps(2)} />
          </Tabs>
        </Box>

        <Box>
          <Box sx={{ padding: 2 }}>
            {tabIndex === 0 && (
              <Box>
                <NewOrders />
              </Box>
            )}
            {tabIndex === 1 && (
              <Box>
                <VerifiedOrders />
              </Box>
            )}
            {tabIndex === 2 && (
              <Box>
                <PickedUpOrders />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
