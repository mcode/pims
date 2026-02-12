import { IconButton, Menu, MenuItem, Switch, Typography, Box, Divider } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ConfigToggle() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [useIntermediary, setUseIntermediary] = useState(false);
  const open = Boolean(anchorEl);

  // Load config on mount
  useEffect(() => {
    const saved = localStorage.getItem('useIntermediary');
    if (saved !== null) {
      setUseIntermediary(saved === 'true');
    }
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggle = async () => {
    const newValue = !useIntermediary;
    setUseIntermediary(newValue);
    localStorage.setItem('useIntermediary', String(newValue));

    // Update backend
    try {
      await axios.post('/doctorOrders/api/config', { useIntermediary: newValue });
      console.log('Configuration updated:', newValue ? 'Using Intermediary' : 'Direct Connection');
    } catch (error) {
      console.error('Failed to update backend config:', error);
    }
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: 'white',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
        }}
      >
        <SettingsIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 280, p: 1 }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            NCPDP Routing
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleToggle} sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Switch checked={useIntermediary} size="small" />
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Use Intermediary
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {useIntermediary
                  ? 'Routing via intermediary'
                  : 'Direct to REMS Admin'}
              </Typography>
            </Box>
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
}