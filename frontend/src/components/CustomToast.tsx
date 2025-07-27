import React from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface CustomToastProps {
  open: boolean;
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  variant?: 'inline' | 'snackbar';
}

const CustomToast: React.FC<CustomToastProps> = ({ open, message, type = 'info', onClose, duration = 3500, anchorOrigin = { vertical: 'top', horizontal: 'center' }, variant = 'snackbar' }) => {
  if (!open) return null;
  if (variant === 'inline') {
    return (
      <Alert
        severity={type}
        variant="filled"
        sx={{
          mb: 2,
        fontWeight: 600,
        fontSize: '0.92rem',
          borderRadius: 2,
          boxShadow: '0 4px 24px rgba(60,60,120,0.18)',
          backgroundColor:
            type === 'success' ? '#43a047' :
            type === 'error' ? '#d32f2f' :
            type === 'warning' ? '#ffa000' :
            '#1976d2',
          color: '#fff',
          letterSpacing: 1,
          fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
        }}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        elevation={6}
      >
        {message}
      </Alert>
    );
  }
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert
        severity={type}
        variant="filled"
        sx={{
          fontWeight: 600,
          fontSize: '1rem',
          borderRadius: 2,
          boxShadow: '0 4px 24px rgba(60,60,120,0.18)',
          backgroundColor:
            type === 'success' ? '#43a047' :
            type === 'error' ? '#d32f2f' :
            type === 'warning' ? '#ffa000' :
            '#1976d2',
          color: '#fff',
          letterSpacing: 1,
          fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
        }}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        elevation={6}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomToast;
