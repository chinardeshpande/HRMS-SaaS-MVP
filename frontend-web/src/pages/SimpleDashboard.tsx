import { useEffect, useState } from 'react';

interface User {
  userId: string;
  email: string;
  fullName: string;
  role: string;
}

export default function SimpleDashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      // Redirect to login if no user
      window.location.href = '/login';
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div style={{ padding: '50px', fontFamily: 'Arial' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: '0 0 5px', color: '#1976d2', fontSize: '24px' }}>
            HRMS Dashboard
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Welcome, {user.fullName}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            background: '#dc004e',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Logout
        </button>
      </div>

      {/* User Info Card */}
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px', color: '#333', fontSize: '20px' }}>
          Your Profile
        </h2>
        <div style={{ fontSize: '14px', lineHeight: '2' }}>
          <p style={{ margin: '5px 0' }}>
            <strong>Email:</strong> {user.email}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Name:</strong> {user.fullName}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Role:</strong> <span style={{
              background: '#1976d2',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px'
            }}>{user.role}</span>
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>User ID:</strong> {user.userId}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px', color: '#333', fontSize: '20px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <ActionCard title="View Employees" description="Manage employee records" />
          <ActionCard title="Attendance" description="Track attendance" />
          <ActionCard title="Leave Requests" description="Manage leave requests" />
          <ActionCard title="Performance" description="Performance reviews" />
        </div>
      </div>

      {/* Status Message */}
      <div style={{
        background: '#d4edda',
        color: '#155724',
        padding: '15px',
        borderRadius: '10px',
        marginTop: '20px',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        ✅ Login successful! Dashboard is now working with user role: <strong>{user.role}</strong>
      </div>
    </div>
  );
}

function ActionCard({ title, description }: { title: string; description: string }) {
  return (
    <div style={{
      padding: '20px',
      border: '2px solid #e0e0e0',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = '#1976d2';
      e.currentTarget.style.background = '#f5f5f5';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = '#e0e0e0';
      e.currentTarget.style.background = 'white';
    }}>
      <h3 style={{ margin: '0 0 8px', color: '#1976d2', fontSize: '16px' }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
        {description}
      </p>
    </div>
  );
}
