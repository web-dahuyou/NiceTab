import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from '~/entrypoints/common/components/Root.tsx';
import '~/assets/css/reset.css';
import '~/assets/css/index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root pageContext="newtabPage">
      <App />
    </Root>
  </React.StrictMode>,
);
