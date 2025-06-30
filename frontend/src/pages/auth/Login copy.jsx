import React, { useState } from 'react';
// IMPORTANT: 请确保 MainLayout.jsx 的路径相对于此文件是正确的。
// 例如：如果 Login.jsx 在 'src/pages/auth/' 中，而 MainLayout.jsx 在 'src/' 中，
// 那么 '../../MainLayout.jsx' 是正确的。如果您的项目使用路径别名（例如，@/），
// 您可能需要根据您的项目配置调整此路径（例如，'@/MainLayout.jsx'）。
import MainLayout from '../MainLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // 假设使用 shadcn/ui Card 组件
import  Button  from '@/components/ui/button'; // 假设使用 shadcn/ui Button 组件
import  Input  from '@/components/ui/input'; // 假设使用 shadcn/ui Input 组件
import  Label  from '@/components/ui/label'; // 假设使用 shadcn/ui Label 组件
import { User, Lock, LogIn } from 'lucide-react'; // 使用 lucide-react 作为图标库

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null); // Clear previous messages

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '登录失败。');
      }

      setMessage({ type: 'success', text: data.message || '登录成功！正在跳转...' });
      // Store JWT token in local storage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        // Optionally store userId and isAdmin for client-side checks
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('isAdmin', data.isAdmin);
      }
      // Redirect to dashboard or home page after successful login
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);

    } catch (err) {
      console.error('Login error:', err);
      setMessage({ type: 'error', text: err.message || '登录失败，请检查用户名或密码。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout pageTitle="登录"> {/* Wrap with MainLayout */}
      <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Card className="w-full max-w-md shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <LogIn className="mr-2 h-7 w-7" />登录
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
                  {loading ? '登录中...' : '登录'}
                </Button>
                <Button type="button" onClick={() => window.location.href = '/register'} variant="outline" className="w-full text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2 text-base font-semibold">
                  <User className="mr-2 h-4 w-4" />没有账号？ 注册
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Login;
