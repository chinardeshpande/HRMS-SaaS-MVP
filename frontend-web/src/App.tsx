import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './context/AuthContext';

// Placeholder pages (to be created)
// import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import EmployeeList from './pages/EmployeeList';
// ... other pages

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              {/* <Route path="/login" element={<Login />} /> */}
              <Route path="/login" element={<div>Login Page - To be implemented</div>} />

              {/* Protected routes */}
              {/* <Route path="/dashboard" element={<Dashboard />} /> */}
              {/* <Route path="/employees" element={<EmployeeList />} /> */}
              {/* ... other routes */}

              {/* Default route */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* 404 route */}
              <Route path="*" element={<div>404 - Page Not Found</div>} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
