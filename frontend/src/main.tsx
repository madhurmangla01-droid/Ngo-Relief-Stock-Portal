import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import '../../src/index.css';

export function mountFrontend() {
  createRoot(document.getElementById('root')!).render(<App />);
}
