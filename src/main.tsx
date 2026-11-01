/**
 * ENTRY POINT: Client React Application
 * WHAT: Bootstraps the React DOM and wraps the core App component with Context Providers or routing wrappers.
 * WHY: This is the standard Vite React entry point that mounts the Single Page Application onto the HTML document.
 */
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
