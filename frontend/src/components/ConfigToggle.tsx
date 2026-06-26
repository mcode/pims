import { IconButton, Menu, MenuItem, Switch, Typography, Box, Divider, TextField, Button, FormControlLabel } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface PharmacyConfig {
  useIntermediary: boolean;
  intermediaryUrl: string;
  remsAdminUrl: string;
  ehrUrl: string;
}

interface InventoryItem {
  ndc: string;
  display: string;
  quantityOnHand: number;
  quantityUnitCode: string;
  equivalentGroup?: string;
  availabilityDate?: string | null;
  obtainable?: boolean;
  refuseToAnswer?: boolean;
}

export default function ConfigToggle() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [config, setConfig] = useState<PharmacyConfig>({
    useIntermediary: false,
    intermediaryUrl: '',
    remsAdminUrl: '',
    ehrUrl: '',
  });
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const open = Boolean(anchorEl);

  // Load config from backend on mount
  useEffect(() => {
    axios.get<PharmacyConfig>('/doctorOrders/api/config')
      .then(({ data }) => setConfig(data))
      .catch(() => console.error('Failed to load config'));
    axios.get<InventoryItem[]>('/doctorOrders/api/inventory')
      .then(({ data }) => setInventory(data))
      .catch(() => console.error('Failed to load inventory'));
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
      await axios.patch('/doctorOrders/api/inventory', { inventory });
      console.log('Configuration updated:', config);
      handleClose();
    } catch (error) {
      console.error('Failed to update backend config:', error);
    }
  };

  const updateInventoryItem = (index: number, changes: Partial<InventoryItem>) => {
    setInventory(prev => prev.map((item, i) => (i === index ? { ...item, ...changes } : item)));
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
          sx: { minWidth: 420, p: 1, maxHeight: '85vh' }
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
          <Divider />
          <Typography variant="subtitle2" fontWeight="bold">
            PPA Inventory
          </Typography>
          {inventory.map((item, index) => (
            <Box key={`${item.ndc}-${index}`} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                label="Product"
                size="small"
                fullWidth
                value={item.display}
                onChange={e => updateInventoryItem(index, { display: e.target.value })}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 1 }}>
                <TextField
                  label="NDC"
                  size="small"
                  value={item.ndc}
                  onChange={e => updateInventoryItem(index, { ndc: e.target.value })}
                />
                <TextField
                  label="Qty"
                  size="small"
                  type="number"
                  value={item.quantityOnHand}
                  onChange={e =>
                    updateInventoryItem(index, { quantityOnHand: Number(e.target.value) })
                  }
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <TextField
                  label="Equivalent Group"
                  size="small"
                  value={item.equivalentGroup || ''}
                  onChange={e => updateInventoryItem(index, { equivalentGroup: e.target.value })}
                />
                <TextField
                  label="Available Date"
                  size="small"
                  value={item.availabilityDate || ''}
                  onChange={e => updateInventoryItem(index, { availabilityDate: e.target.value })}
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={item.obtainable !== false}
                      onChange={e => updateInventoryItem(index, { obtainable: e.target.checked })}
                    />
                  }
                  label="Obtainable"
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={item.refuseToAnswer === true}
                      onChange={e => updateInventoryItem(index, { refuseToAnswer: e.target.checked })}
                    />
                  }
                  label="Refuse PPA"
                />
              </Box>
            </Box>
          ))}
          <Button variant="contained" size="small" onClick={handleSave} sx={{ alignSelf: 'flex-end' }}>
            Save
          </Button>
        </Box>
      </Menu>
    </>
  );
}
