import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/archivo/500.css';
import '@fontsource/archivo/700.css';
import '@fontsource/archivo/900.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import './styles/tokens.css';
import './styles/app.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
