import React, { useState } from 'react';
// IMPORTANT: 请确保 MainLayout.jsx 的路径相对于此文件是正确的。
// 例如：如果 ChangePassword.jsx 在 'src/pages/auth/' 中，而 MainLayout.jsx 在 'src/' 中，
// 那么 '../../MainLayout.jsx' 是正确的。如果您的项目使用路径别名（例如，@/），
// 您可能需要根据您的项目配置调整此路径（例如，'@/MainLayout.jsx'）。
import MainLayout from '../MainLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // 假设使用 shadcn/ui Card 组件
import  Button  from '@/components/ui/button'; // 假设使用 shadcn/ui Button 组件
import  Input  from '@/components/ui/input'; // 假设使用 shadcn/ui Input 组件
import  Label  from '@/components/ui/label'; // 假设使用 shadcn/ui Label 组件
import { KeyRound, Lock, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'; // 使用 lucide-react 作为图标库

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null); // 清除之前的消息

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '新密码和确认密码不匹配。' });
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码长度至少为6个字符。' });
      setLoading(false);
      return;
    }

    if (oldPassword === newPassword) {
      setMessage({ type: 'error', text: '新密码不能与旧密码相同。' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 假设您有获取认证令牌的方法，例如从 localStorage
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '修改密码失败。');
      }

      setMessage({ type: 'success', text: data.message || '密码修改成功！' });
      // 可选地清除字段或重定向
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // 密码成功更改后重定向到仪表板或登录页
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (err) {
      console.error('修改密码错误:', err);
      setMessage({ type: 'error', text: err.message || '修改密码失败，请稍后再试。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout pageTitle="修改密码"> {/* 使用 MainLayout 包装整个页面内容 */}
      <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Card className="w-full max-w-md shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <KeyRound className="mr-2 h-7 w-7" />修改密码
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
                <Label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="inline-block w-4 h-4 mr-1 text-gray-500" /> 旧密码:
                </Label>
                <Input
                  type="password"
                  id="oldPassword"
                  name="oldPassword"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="inline-block w-4 h-4 mr-1 text-gray-500" /> 新密码:
                </Label>
                <Input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="inline-block w-4 h-4 mr-1 text-gray-500" /> 确认密码:
                </Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>

              <div className="flex flex-col gap-4 mt-6">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md py-2 text-base font-semibold" disabled={loading}>
                  {loading ? '保存中...' : '保存'}
                </Button>
                <Button type="button" onClick={() => window.location.href = '/dashboard'} variant="outline" className="w-full text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2 text-base font-semibold">
                  <ArrowLeft className="mr-2 h-4 w-4" />取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ChangePassword;
