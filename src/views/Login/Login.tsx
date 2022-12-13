

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import config from '../../config.json';
import axios from 'axios';

export default function Login() {
  const [token, setToken] = React.useState<String | null>(null)
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const user = data.get('username')?.toString()
    const pass = data.get('password')?.toString()
    if (user && pass) {
      const params = new URLSearchParams();
      params.append('username', user);
      params.append('password', pass);
      params.append('grant_type', 'password');
      params.append('client_id', config.client);
      axios
        .post(
          `${config.auth}/realms/${config.realm}/protocol/openid-connect/token`,
          params,
          { withCredentials: true }
        )
        .then((result) => {
          // do something with the token
          const scope = result.data.scope.split(' ').includes(config.scopeId)
          if (scope) {
            setToken(result.data.access_token)
          } else {
            console.error("Unauthorized User")
          }
        })
        .catch(err => {
          if (err.response.status === 401) {
            console.error("Unknown user")
          } else {
            console.error(err)
          }
        });
    }
  };

  return (

    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {token ?
          <Avatar sx={{ m: 1, bgcolor: 'secondary.success' }}>
            <LockOpenOutlinedIcon />
          </Avatar>
          :
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
        }
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            fullWidth
            id="email"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
          />
          <TextField
            margin="normal"
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
        </Box>
      </Box>
    </Container>
  );
}