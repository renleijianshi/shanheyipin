import { createSSRApp } from 'vue';
import App from './App.vue';
import './styles/tokens.css';

// H5 uses viewport-based rpx. Keep its desktop preview at V19's 390px phone width.
// #ifdef H5
function syncDesktopPreview() {
  const desktop = window.innerWidth >= 600;
  document.body.classList.toggle('v19-desktop-preview', desktop);
  if (!desktop) return;
  const scale = 390 / window.innerWidth;
  document.documentElement.style.setProperty('--v19-preview-scale', String(scale));
  document.documentElement.style.setProperty('--v19-preview-inverse', String(1 / scale));
}
syncDesktopPreview();
window.addEventListener('resize', syncDesktopPreview);
// #endif

export function createApp() {
  const app = createSSRApp(App);
  return { app };
}
