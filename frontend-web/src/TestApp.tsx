// Minimal test component to verify React is working
export default function TestApp() {
  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h1>✅ React is Working!</h1>
      <p>If you can see this, React is rendering correctly.</p>
      <a href="/login" style={{ color: 'blue', textDecoration: 'underline' }}>
        Go to Login Page
      </a>
    </div>
  );
}
