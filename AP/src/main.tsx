/**
 * 進入點：先載入 design token 再載入全域基礎樣式，
 * 以 DatasetProvider > AppStateProvider > App 掛載到 #root。
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './App';
import { DatasetProvider } from './data/DatasetProvider';
import { AppStateProvider } from './state/AppStateProvider';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('找不到 #root 掛載點');

createRoot(rootElement).render(
  <StrictMode>
    <DatasetProvider>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </DatasetProvider>
  </StrictMode>,
);
