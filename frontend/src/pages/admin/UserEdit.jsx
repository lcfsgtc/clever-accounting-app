import React, { useState, useEffect, useCallback } from 'react';
// IMPORTANT: Please ensure the path to MainLayout.jsx is correct relative to this file.
// For example: If UserEdit.jsx is in 'src/pages/admin/', and MainLayout.jsx is in 'src/',
// then '../../MainLayout.jsx' is correct. If your project uses path aliases (e.g., @/),
// you might need to adjust this path based on your project's configuration (e.g., '@/MainLayout.jsx').
import MainLayout from '../MainLayout.jsx'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming shadcn/ui Card components
import  Button  from '@/components/ui/button'; // Assuming shadcn/ui Button component
import  Input  from '@/components/ui/input'; // Assuming shadcn/ui Input component
import  Label  from '@/components/ui/label'; // Assuming shadcn/ui Label component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Assuming shadcn/ui Select component
import { User, Mail, ShieldCheck, ArrowLeft, Save, CheckCircle, XCircle } from 'lucide-react'; // Using lucide-react for icons

const UserEdit = ({ userId: propUserId }) => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState('false'); // Stored as string 'true' or 'false' from select
  const [loading, setLoading] = useState(true); // For initial data fetch
  const [saving, setSaving] = useState(false); // For form submission
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // Extract userId from URL if not provided as prop (e.g., direct access via URL)
  // Assumes URL structure like /admin/users/edit/:id
  const currentUserId = propUserId || window.location.pathname.split('/').pop();

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch(`/api/admin/users/${currentUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user details');
      }

      setUser(data); // Assuming data directly contains user object
      setUsername(data.username);
      setEmail(data.email);
      setIsAdmin(data.isAdmin ? 'true' : 'false'); // Convert boolean to string for select

    } catch (err) {
      console.error('Error fetching user:', err);
      setMessage({ type: 'error', text: `加载用户数据失败: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchUser();
    } else {
      setMessage({ type: 'error', text: '未提供用户ID。' });
      setLoading(false);
    }
  }, [currentUserId, fetchUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Frontend validation (basic)
    if (!username || !email) {
      setMessage({ type: 'error', text: '用户名和邮箱是必填项。' });
      setSaving(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: '请输入有效的邮箱地址。' });
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/users/${currentUserId}`, {
        method: 'PUT', // Use PUT method for updating existing resources
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          email,
          isAdmin: isAdmin === 'true' // Convert string back to boolean for API payload
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更新用户失败。');
      }

      setMessage({ type: 'success', text: data.message || '用户更新成功！' });
      // Optionally redirect after a short delay
      setTimeout(() => {
        window.location.href = '/admin/users'; // Redirect to user list after successful update
      }, 1500);

    } catch (err) {
      console.error('Update user error:', err);
      setMessage({ type: 'error', text: err.message || '更新用户失败，请稍后再试。' });
    } finally {
      setSaving(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <MainLayout pageTitle="编辑用户">
        <div className="container mx-auto p-4 text-center">加载用户数据中...</div>
      </MainLayout>
    );
  }

  // Render error message if user data could not be fetched
  if (message && message.type === 'error' && !user) {
    return (
      <MainLayout pageTitle="编辑用户">
        <div className="container mx-auto p-4 text-center text-red-500">
          {message.text}
        </div>
      </MainLayout>
    );
  }

  // Render if user is not found after loading finishes
  if (!user) {
    return (
      <MainLayout pageTitle="编辑用户">
        <div className="container mx-auto p-4 text-center text-red-500">用户未找到。</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="编辑用户"> {/* Wrap the entire page content with MainLayout */}
      <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Card className="w-full max-w-md shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <User className="mr-2 h-7 w-7" />编辑用户
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <Button
              onClick={() => window.location.href = '/admin/users'}
              className="mb-6 bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow-md w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />返回用户列表
            </Button>
            <hr className="mb-6 border-t-2 border-gray-200" />

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
                <Label htmlFor="isAdmin" className="block text-sm font-medium text-gray-700 mb-1">
                  <ShieldCheck className="inline-block w-4 h-4 mr-1 text-gray-500" /> 是否是管理员:
                </Label>
                <Select
                  value={isAdmin}
                  onValueChange={(value) => setIsAdmin(value)}
                >
                  <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">是</SelectItem>
                    <SelectItem value="false">否</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end mt-6">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md py-2 text-base font-semibold" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />{saving ? '保存中...' : '保存'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default UserEdit;
