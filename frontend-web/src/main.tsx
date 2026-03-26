import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('===== LOADING AuroraHR APPLICATION =====');

const root = document.getElementById('root');

if (!root) {
  document.body.innerHTML = '<div style="padding: 50px; color: red;">ERROR: Root element not found!</div>';
} else {
  try {
    const reactRoot = ReactDOM.createRoot(root);

    reactRoot.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    console.log('===== AuroraHR APPLICATION LOADED =====');
  } catch (error) {
    console.error('===== RENDER ERROR =====', error);
    document.body.innerHTML = `
      <div style="padding: 50px; color: red; font-family: Arial;">
        <h1>Render Error</h1>
        <pre>${error}</pre>
      </div>
    `;
  }
}
