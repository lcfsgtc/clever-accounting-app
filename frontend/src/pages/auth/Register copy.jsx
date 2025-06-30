import React, { useState } from 'react';
// IMPORTANT: Please ensure the path to MainLayout.jsx is correct relative to this file.
// For example: If Register.jsx is in 'src/pages/auth/' and MainLayout.jsx is in 'src/',
// then '../../MainLayout.jsx' is correct. If your project uses path aliases (e.g., @/),
// you might need to adjust this path based on your project's configuration (e.g., '@/MainLayout.jsx').
import MainLayout from '../MainLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming shadcn/ui Card components
import  Button  from '@/components/ui/button'; // Assuming shadcn/ui Button component
import  Input  from '@/components/ui/input'; // Assuming shadcn/ui Input component
import  Label  from '@/components/ui/label'; // Assuming shadcn/ui Label component
import { User, Mail, Lock, LogIn, CheckCircle, XCircle } from 'lucide-react'; // Using lucide-react for icons

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // Added for email field
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null); // Clear previous messages

    // Basic frontend validation
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
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }), // Include email
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '注册失败。');
      }

      setMessage({ type: 'success', text: data.message || '注册成功！正在跳转至登录页...' });
      // Store token (if any) and redirect
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        // In a more complex app, you might also store userId and isAdmin
        // localStorage.setItem('userId', data.userId);
        // localStorage.setItem('isAdmin', data.isAdmin);
      }
      setTimeout(() => {
        window.location.href = '/login'; // Redirect to login page
      }, 2000);

    } catch (err) {
      console.error('Registration error:', err);
      setMessage({ type: 'error', text: err.message || '注册失败，请稍后再试。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout pageTitle="注册"> {/* Wrap with MainLayout */}
      <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Card className="w-full max-w-md shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <User className="mr-2 h-7 w-7" />注册
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {message && (
              <div className={`p-3 rounded-md mb-4 text-sm flex items-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline-block w-4 h-4 mr-1 text-gray-500" /> 用户名:
                </Label>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="inline-block w-4 h-4 mr-1 text-gray-500" /> 邮箱:
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="inline-block w-4 h-4 mr-1 text-gray-500" /> 密码:
                </Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>

              <div className="flex flex-col gap-4 mt-6">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md py-2 text-base font-semibold" disabled={loading}>
                  {loading ? '注册中...' : '注册'}
                </Button>
                <Button type="button" onClick={() => window.location.href = '/login'} variant="outline" className="w-full text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2 text-base font-semibold">
                  <LogIn className="mr-2 h-4 w-4" />已有账号？ 登录
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Register;
