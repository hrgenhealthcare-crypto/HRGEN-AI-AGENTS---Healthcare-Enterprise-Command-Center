import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { StaffCrmPortal } from './components/StaffCrmPortal.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.debug('SW registration info:', err));
  });
}

// Isolated staff staging route: loads without the legacy dashboard API calls.
// This is only a client-side route; actual authorization happens on the server.
const isStaffCrmRoute = window.location.pathname === '/staff-crm';
if (isStaffCrmRoute) {
  document.title = 'HRGen Staff CRM — Staging';
  const robots = document.createElement('meta');
  robots.name = 'robots';
  robots.content = 'noindex, nofollow';
  document.head.append(robots);
}
createRoot(document.getElementById('root')!).render(
  isStaffCrmRoute ? <StaffCrmPortal /> : <App />
);
