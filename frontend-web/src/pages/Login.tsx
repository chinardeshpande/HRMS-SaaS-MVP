import { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // If login succeeds, navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during login';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 3 }}>
            <img
              src="/images/aurora-logo.svg"
              alt="AuroraHR"
              style={{ height: '60px', width: 'auto' }}
            />
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Modern HRMS Platform
          </Typography>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Test Credentials:
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Admin: admin@acme.com
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                HR: hr@acme.com
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Manager: manager@acme.com
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Employee: employee@acme.com
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>
                Password: password123
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'white' }}>
            © 2026 HRMS SaaS. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
