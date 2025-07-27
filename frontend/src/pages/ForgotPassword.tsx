import React, { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, Link, InputAdornment } from '@mui/material';
import CustomToast from '../components/CustomToast';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { useNavigate, useLocation } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state && location.state.email) ? location.state.email : '';
  const [email, setEmail] = useState(initialEmail);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Improved email validation
    const emailPattern = /^[^@\s]+@[^@\s]+\.(com|in|org|net|co|edu|gov|info|io|me|us|uk|biz|xyz|pro|tech|ai|app|dev|cloud|store|site|online|space|website|solutions|digital|group|company|agency|media|systems|network|today|live|center|world|global|academy|capital|consulting|finance|health|law|partners|support|ventures|zone|email|events|expert|guru|host|jobs|mobi|name|press|social|software|team|tools|works|design|marketing|photography|pictures|productions|recipes|services|training|travel|vacations|video|vision|watch|webcam|wiki|wine|yoga|club|shop)$/i;
    if (!email || !emailPattern.test(email)) {
      setError('Please enter a valid email address');
      setShowToast(true);
      return;
    }
    setError('');
    setShowToast(false);
    setSubmitted(true);
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
              Forgot Password
            </Typography>
          </Box>
          {submitted ? (
            <Typography sx={{ mb: 2, textAlign: 'center' }} color="primary">
              If your email is registered, you will receive password reset instructions.
            </Typography>
          ) : (
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
                required
                autoFocus
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
                  backgroundColor: '#43a047',
                  '&:hover': { backgroundColor: '#388e3c' },
                }}
              >
                Send Reset Link
              </Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  href="#"
                  underline="hover"
                  onClick={e => {
                    e.preventDefault();
                    navigate('/login', { state: { email } });
                  }}
                >
                  Back to Login
                </Link>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
