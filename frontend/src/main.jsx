import React from 'react';
import ReactDOM from 'react-dom/client';

// IMPORTANT: 请确保以下文件的路径相对于此 'main.jsx' 文件是正确的。
// 如果 'App.jsx'、'AppContext.jsx' 和 'index.css' 与 'main.jsx' 在同一目录中，
// 那么当前 './' 路径是正确的。如果它们在子目录中，您需要更新路径，例如 './components/App.jsx'。
import App from './App.jsx';
import { AppProvider } from './AppContext.jsx'; // 导入 AppProvider

// 导入 Tailwind CSS 的主文件
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 使用 AppProvider 包装整个 App，使认证上下文在整个应用中可用 */}
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);
