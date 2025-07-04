// src/pages/auth/ChangePassword.jsx

import React, { useState } from 'react';
// 1. 导入 apiClient
import apiClient from '../../api/apiClient'; // 调整路径以匹配您的项目结构

// 导入UI组件和图标 (保持不变)
import MainLayout from '../MainLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { KeyRound, Lock, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 前端验证逻辑 (保持不变)
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
      // 2. 使用 apiClient 发起请求
      // - 它会自动附加 Authorization 请求头
      // - 它会自动处理 baseURL
      const response = await apiClient.post('/change-password', {
        oldPassword,
        newPassword,
        confirmPassword,
      });

      // 3. 从 response.data 获取成功消息
      setMessage({ type: 'success', text: response.data.message || '密码修改成功！' });
      
      // 清空输入框
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // 4. 使用 replace 重定向，提升用户体验
      setTimeout(() => {
        window.location.replace('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('修改密码错误:', err);
      // 5. 从 Axios 错误对象中获取后端返回的错误信息
      const errorMessage = err.response?.data?.message || err.message || '修改密码失败，请稍后再试。';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };
  
  // UI 部分保持不变
  return (
    <MainLayout pageTitle="修改密码">
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
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="inline-block w-4 h-4 mr-1 text-gray-500" /> 新密码:
                </Label>
                <Input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="inline-block w-4 h-4 mr-1 text-gray-500" /> 确认密码:
                </Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-4 mt-6">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md py-2 text-base font-semibold" disabled={loading}>
                  {loading ? '保存中...' : '确认修改'}
                </Button>
                <Button type="button" onClick={() => window.location.href = '/dashboard'} variant="outline" className="w-full text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2 text-base font-semibold">
                  <ArrowLeft className="mr-2 h-4 w-4" />返回
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