import { useState } from 'react';

export default function SimpleLogin() {
  const [email, setEmail] = useState('employee@acme.com');
  const [password, setPassword] = useState('password123');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Logging in...');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Login successful! User: ' + data.data.user.fullName);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('tokens', JSON.stringify(data.data.tokens));

        // Redirect to dashboard after 1 second
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        setMessage('❌ Login failed: ' + (data.error?.message || 'Unknown error'));
      }
    } catch (error: any) {
      setMessage('❌ Error: ' + error.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <img
            src="/images/aurora-logo.svg"
            alt="AuroraHR"
            style={{ height: '50px', width: 'auto' }}
          />
          <p style={{ margin: '10px 0 0', color: '#666', fontSize: '14px' }}>Modern HRMS Platform</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#333' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#333' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: '20px',
            padding: '10px',
            background: message.includes('✅') ? '#d4edda' : '#f8d7da',
            color: message.includes('✅') ? '#155724' : '#721c24',
            borderRadius: '5px',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: '25px', fontSize: '12px', color: '#666', borderTop: '1px solid #eee', paddingTop: '15px' }}>
          <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}>Test Credentials:</p>
          <p style={{ margin: '3px 0' }}>Admin: admin@acme.com</p>
          <p style={{ margin: '3px 0' }}>HR: hr@acme.com</p>
          <p style={{ margin: '3px 0' }}>Manager: manager@acme.com</p>
          <p style={{ margin: '3px 0' }}>Employee: employee@acme.com</p>
          <p style={{ margin: '8px 0 0', fontWeight: 'bold' }}>Password: password123</p>
        </div>
      </div>
    </div>
  );
}
