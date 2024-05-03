import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from '~/entrypoints/common/components/Root.tsx';
import App from './App.tsx';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root>
      <App />
    </Root>
  </React.StrictMode>,
);
