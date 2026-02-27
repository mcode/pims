import { IconButton, Menu, MenuItem, Switch, Typography, Box, Divider, TextField, Button } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface PharmacyConfig {
  useIntermediary: boolean;
  intermediaryUrl: string;
  remsAdminUrl: string;
  ehrUrl: string;
}

export default function ConfigToggle() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [config, setConfig] = useState<PharmacyConfig>({
    useIntermediary: false,
    intermediaryUrl: '',
    remsAdminUrl: '',
    ehrUrl: '',
  });
  const open = Boolean(anchorEl);

  // Load config from backend on mount
  useEffect(() => {
    axios.get<PharmacyConfig>('/doctorOrders/api/config')
      .then(({ data }) => setConfig(data))
      .catch(() => console.error('Failed to load config'));
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggle = () => {
    setConfig(prev => ({ ...prev, useIntermediary: !prev.useIntermediary }));
  };

  const handleSave = async () => {
    try {
      await axios.post('/doctorOrders/api/config', config);
      console.log('Configuration updated:', config);
      handleClose();
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
          sx: { minWidth: 300, p: 1 }
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
            <Switch checked={config.useIntermediary} size="small" />
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Use Intermediary
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {config.useIntermediary ? 'Routing via intermediary' : 'Direct to REMS Admin'}
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        <Divider />
        <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            label="Intermediary URL"
            size="small"
            fullWidth
            value={config.intermediaryUrl}
            onChange={e => setConfig(prev => ({ ...prev, intermediaryUrl: e.target.value }))}
          />
          <TextField
            label="REMS Admin URL"
            size="small"
            fullWidth
            value={config.remsAdminUrl}
            onChange={e => setConfig(prev => ({ ...prev, remsAdminUrl: e.target.value }))}
          />
          <TextField
            label="EHR URL"
            size="small"
            fullWidth
            value={config.ehrUrl}
            onChange={e => setConfig(prev => ({ ...prev, ehrUrl: e.target.value }))}
          />
          <Button variant="contained" size="small" onClick={handleSave} sx={{ alignSelf: 'flex-end' }}>
            Save
          </Button>
        </Box>
      </Menu>
    </>
  );
}