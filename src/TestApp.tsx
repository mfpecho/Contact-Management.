import React from 'react';

const TestApp = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px', 
      backgroundColor: '#000', 
      color: '#fff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Test App is Working!</h1>
      <p>If you can see this, React is rendering correctly.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
};

export default TestApp;