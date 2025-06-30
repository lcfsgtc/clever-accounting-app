// src/api/apiClient.js

import axios from 'axios';

// 1. 创建一个 axios 实例
const apiClient = axios.create({
  // 2. 使用环境变量来设置基础 URL
  //    - 开发环境: 'http://localhost:5173/api' (经过 vite.config.js 代理)
  //    - 生产环境: 'https://api.lcfsgtc.chat'
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // 提供一个默认值
});

// 3. 添加一个请求拦截器 (Request Interceptor)
apiClient.interceptors.request.use(
  (config) => {
    // 在每个请求发送之前，从 localStorage 获取 token
    const token = localStorage.getItem('authToken');
    if (token) {
      // 如果 token 存在，就将其添加到 Authorization 请求头中
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 4. 添加一个响应拦截器 (Response Interceptor)
apiClient.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么 (例如，直接返回 response.data)
    return response;
  },
  (error) => {
    // 对响应错误做点什么
    if (error.response && error.response.status === 401) {
      // 如果收到 401 (未授权) 错误
      console.error('API request Unauthorized. Logging out.');
      // 清除本地存储的认证信息
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('isAdmin');
      // 重定向到登录页面
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

// 5. 导出配置好的 axios 实例
export default apiClient;