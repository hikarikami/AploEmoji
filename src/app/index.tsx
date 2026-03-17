import React from 'react';
import { createRoot } from 'react-dom/client';
import { AploProvider } from '@aplo/ui';
import './styles/ui.css';
import App from './components/App';

document.addEventListener('DOMContentLoaded', function () {
  const container = document.getElementById('react-page');
  const root = createRoot(container!);
  root.render(
    <AploProvider>
      <App />
    </AploProvider>
  );
});
