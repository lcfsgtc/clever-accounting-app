// src/pages/auth/Login.jsx

import React, { useState } from 'react';
// 1. 导入 useAppContext 和 apiClient
import { useAppContext } from '../../AppContext'; // 调整路径以匹配您的项目结构
import apiClient from '../../api/apiClient'; // 调整路径以匹配您的项目结构

// 导入UI组件和图标 (保持不变)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { User, Lock, LogIn, CheckCircle, XCircle } from 'lucide-react';

const Login = () => {
  // 2. 使用 useAppContext 获取 setAuthStatus 方法
  const { setAuthStatus } = useAppContext();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // 3. 使用 apiClient 发起请求，它会自动处理 baseURL
      //    请求地址现在只需要写相对路径 '/login'
      const response = await apiClient.post('/login', {
        username,
        password,
      });

      // apiClient 默认会在响应成功时返回整个 response 对象
      // 我们从 response.data 中获取数据
      const data = response.data;

      setMessage({ type: 'success', text: data.message || '登录成功！正在跳转...' });
      
      // 4. 使用 setAuthStatus 统一更新全局状态和 localStorage
      //    将所有认证相关的数据传递给它
      if (data.token) {
        setAuthStatus({
          token: data.token,
          userId: data.userId,
          isAdmin: data.isAdmin,
        });
      }

      // 5. 使用 window.location.replace 重定向，它不会在历史记录中留下登录页
      setTimeout(() => {
        window.location.replace('/dashboard');
      }, 1500);

    } catch (err) {
      console.error('Login error:', err);
      // 6. 从 Axios 错误对象中获取更准确的错误信息
      const errorMessage = err.response?.data?.message || err.message || '登录失败，请检查用户名或密码。';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // 登录页面通常不应该包含 MainLayout，因为它本身就是“外部”页面
  // 但如果您的设计如此，可以保留。这里假设登录页是独立的全屏页面。
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-blue-600 text-white text-center py-5">
          <CardTitle className="text-2xl font-bold flex items-center justify-center">
            <LogIn className="mr-2 h-7 w-7" />
            用户登录
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          {message && (
            <div className={`p-3 rounded-md mb-4 text-sm flex items-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message.type === 'error' ? <XCircle className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                <User className="inline-block w-4 h-4 mr-1 text-gray-500" /> 用户名
              </Label>
              <Input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="请输入您的用户名"
              />
            </div>
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                <Lock className="inline-block w-4 h-4 mr-1 text-gray-500" /> 密码
              </Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="请输入您的密码"
              />
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md py-2 text-base font-semibold" disabled={loading}>
                {loading ? '登录中...' : '立即登录'}
              </Button>
              <Button type="button" onClick={() => window.location.href = '/register'} variant="outline" className="w-full text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2 text-base font-semibold">
                没有账号？去注册
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;