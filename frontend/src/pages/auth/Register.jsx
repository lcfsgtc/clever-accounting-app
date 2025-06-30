// src/pages/auth/Register.jsx

import React, { useState } from 'react';
// 1. 导入 apiClient
import apiClient from '../../api/apiClient'; // 调整路径以匹配您的项目结构

// 导入UI组件和图标 (保持不变)
import MainLayout from '../MainLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { User, Mail, Lock, LogIn, CheckCircle, XCircle } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 前端验证逻辑 (保持不变)
    if (!username || !email || !password) {
      setMessage({ type: 'error', text: '所有字段都是必填项。' });
      setLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: '请输入有效的邮箱地址。' });
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: '密码长度至少为6个字符。' });
      setLoading(false);
      return;
    }

    try {
      // 2. 使用 apiClient 发起请求
      const response = await apiClient.post('/register', {
        username,
        email,
        password,
      });

      // 3. 从 response.data 获取成功消息
      setMessage({ type: 'success', text: response.data.message || '注册成功！正在跳转至登录页...' });
      
      // 4. 注册成功后，通常不直接登录，而是引导用户去登录。
      //    我们不再在这里处理 token。
      //    使用 replace 重定向到登录页。
      setTimeout(() => {
        window.location.replace('/login');
      }, 2000);

    } catch (err) {
      console.error('Registration error:', err);
      // 5. 从 Axios 错误对象中获取后端返回的错误信息（例如“用户名已存在”）
      const errorMessage = err.response?.data?.message || err.message || '注册失败，请稍后再试。';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // 注册页面和登录页面一样，通常是独立的，不包含 MainLayout
  // 这里也修改为独立布局，以保持一致性
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-blue-600 text-white text-center py-5">
          <CardTitle className="text-2xl font-bold flex items-center justify-center">
            <User className="mr-2 h-7 w-7" />创建新账户
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
                placeholder="创建您的用户名"
              />
            </div>
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="inline-block w-4 h-4 mr-1 text-gray-500" /> 邮箱
              </Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="请输入您的邮箱地址"
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
                placeholder="设置您的密码 (至少6位)"
              />
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md py-2 text-base font-semibold" disabled={loading}>
                {loading ? '注册中...' : '立即注册'}
              </Button>
              <Button type="button" onClick={() => window.location.href = '/login'} variant="outline" className="w-full text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2 text-base font-semibold">
                <LogIn className="mr-2 h-4 w-4" />已有账号？去登录
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;