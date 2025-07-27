import React, { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Link, Paper, InputAdornment } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate, useLocation } from 'react-router-dom';
import CustomToast from '../components/CustomToast';

const Login: React.FC = () => {
  const location = useLocation();
  const initialEmail = (location.state && location.state.email) ? location.state.email : '';
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    // Improved email validation: must contain @ and end with .com, .in, .org, .net, .co, .edu, .gov, .info, .io, .me, .us, .uk, .biz, .xyz, .pro, .tech, .ai, .app, .dev, .cloud, .store, .site, .online, .space, .website, .solutions, .digital, .group, .company, .agency, .media, .systems, .network, .today, .live, .center, .world, .global, .academy, .capital, .consulting, .finance, .health, .law, .partners, .support, .ventures, .zone, .email, .events, .expert, .guru, .host, .jobs, .mobi, .name, .press, .social, .software, .team, .tools, .works, .design, .marketing, .photography, .pictures, .productions, .recipes, .services, .solutions, .training, .travel, .vacations, .video, .vision, .watch, .webcam, .wiki, .wine, .yoga, .club, .shop, .site, .store, .tech, .online, .space, .website, .solutions, .digital, .group, .company, .agency, .media, .systems, .network, .today, .live, .center, .world, .global, .academy, .capital, .consulting, .finance, .health, .law, .partners, .support, .ventures, .zone, .email, .events, .expert, .guru, .host, .jobs, .mobi, .name, .press, .social, .software, .team, .tools, .works, .design, .marketing, .photography, .pictures, .productions, .recipes, .services, .solutions, .training, .travel, .vacations, .video, .vision, .watch, .webcam, .wiki, .wine, .yoga, .club, .shop
    const emailPattern = /^[^@\s]+@[^@\s]+\.(com|in|org|net|co|edu|gov|info|io|me|us|uk|biz|xyz|pro|tech|ai|app|dev|cloud|store|site|online|space|website|solutions|digital|group|company|agency|media|systems|network|today|live|center|world|global|academy|capital|consulting|finance|health|law|partners|support|ventures|zone|email|events|expert|guru|host|jobs|mobi|name|press|social|software|team|tools|works|design|marketing|photography|pictures|productions|recipes|services|training|travel|vacations|video|vision|watch|webcam|wiki|wine|yoga|club|shop)$/i;
    if (!email || !emailPattern.test(email)) {
      setEmailError(true);
      hasError = true;
    } else {
      setEmailError(false);
    }
    if (!password) {
      setPasswordError(true);
      hasError = true;
    } else {
      setPasswordError(false);
    }
    if (hasError) {
      setError('Please enter a valid email and password');
      setShowToast(true);
      return;
    }
    setError('');
    setShowToast(false);
    // TODO: Connect to backend API for authentication
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: "''",
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `url('/login-bg.png') center center / cover no-repeat`,
          filter: 'blur(3px)',
          zIndex: 0,
        },
        background: '#fafbfc',
      }}
    >
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(255,255,255,0.18)',
        zIndex: 1,
      }} />
      <Typography
        variant="h3"
        sx={{
          mb: 4,
          fontWeight: 900,
          letterSpacing: 2,
          color: '#fff',
          fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
          textShadow: '0 2px 16px rgba(30, 60, 120, 0.18), 0 0 2px #000',
          position: 'relative',
          zIndex: 2,
        }}
      >
        eDrop WMS
      </Typography>
      <Container maxWidth="xs" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <Paper elevation={18} sx={{ p: 3, borderRadius: 5, boxShadow: '0 12px 48px rgba(60,60,120,0.28)', width: 400, position: 'relative', zIndex: 3, background: 'rgba(255,255,255,0.92)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: 'uppercase',
                fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
                color: '#212121',
                mb: 1,
              }}
              gutterBottom
            >
              LOGIN
            </Typography>
          </Box>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {showToast && (
              <CustomToast
                open={true}
                message={error}
                type="error"
                onClose={() => setShowToast(false)}
                variant="inline"
              />
            )}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
              margin="none"
              autoFocus
              error={emailError}
              helperText={emailError ? 'Email is required' : ''}
              sx={{
                '& .MuiInputBase-root': {
                  borderRadius: 6,
                  height: 40,
                  background: '#fff',
                  boxSizing: 'border-box',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              margin="none"
              error={passwordError}
              helperText={passwordError ? 'Password is required' : ''}
              sx={{
                '& .MuiInputBase-root': {
                  borderRadius: 6,
                  height: 40,
                  background: '#fff',
                  boxSizing: 'border-box',
                },
                // Hide the default password icon
                '& input[type="password"]::-ms-reveal, & input[type="password"]::-ms-clear': {
                  display: 'none',
                },
                '& input[type="password"]': {
                  // Remove default icon for Chrome/Edge
                  'paddingRight': '0',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#43a047' }} />
                  </InputAdornment>
                ),
                endAdornment: password.length > 0 ? (
                  <InputAdornment position="end">
                    <Button
                      onClick={() => setShowPassword((show) => !show)}
                      tabIndex={-1}
                      sx={{ minWidth: 0, p: 0, color: '#43a047' }}
                    >
                      {showPassword ? <VisibilityOff sx={{ color: '#43a047' }} /> : <Visibility sx={{ color: '#43a047' }} />}
                    </Button>
                  </InputAdornment>
                ) : undefined,
              }}
            />
            {/* Error message now handled by CustomToast, always rendered for toast control */}
            {/* CustomToast moved above for visibility */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: 6,
                fontWeight: 700,
                fontSize: '1rem',
                mt: 1,
                backgroundColor: '#43a047', // sustainable green
                '&:hover': { backgroundColor: '#388e3c' },
              }}
            >
              Log in
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                href="#"
                underline="hover"
                onClick={e => {
                  e.preventDefault();
                  navigate('/forgot-password', { state: { email } });
                }}
              >
                Forgot password?
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
