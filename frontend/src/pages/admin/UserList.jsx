import React, { useState, useEffect, useCallback } from 'react';
// IMPORTANT: Please ensure the path to MainLayout.jsx is correct relative to this file.
// For example: If UserList.jsx is in 'src/pages/admin/', and MainLayout.jsx is in 'src/',
// then '../../../MainLayout.jsx' or a path alias like '@/MainLayout.jsx' might be needed.
// For now, assuming '../MainLayout.jsx' for consistency with previous refactorings if this file is directly under pages.
import MainLayout from '../MainLayout.jsx'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import  Button  from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, ArrowLeft, Edit, Lock, Trash2, CheckCircle, XCircle } from 'lucide-react'; // Icons

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // Dialog state for confirmation
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState(null); // 'reset' or 'delete'
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      setUsers(data || []); // Assuming the API returns an array directly
    } catch (err) {
      console.error('Error fetching users:', err);
      setMessage({ type: 'error', text: `加载用户列表失败: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed as it's just fetching once

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // Run once on component mount

  const handleActionClick = (action, userId, username) => {
    setSelectedUserId(userId);
    setSelectedUserName(username);
    setDialogAction(action);
    setIsDialogOpen(true);
  };

  const confirmAction = async () => {
    setIsDialogOpen(false); // Close dialog immediately
    setMessage(null); // Clear previous messages

    const token = localStorage.getItem('authToken');
    let response;
    let data;

    try {
      if (dialogAction === 'reset') {
        response = await fetch(`/api/admin/users/reset-password/${selectedUserId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || '重置密码失败。');
        }
        setMessage({ type: 'success', text: data.message || `用户 ${selectedUserName} 的密码已成功重置为默认密码。` });
      } else if (dialogAction === 'delete') {
        response = await fetch(`/api/admin/users/${selectedUserId}`, { // Use DELETE method
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || '删除用户失败。');
        }
        setMessage({ type: 'success', text: data.message || `用户 ${selectedUserName} 已成功删除。` });
        // After deletion, refresh the list
        fetchUsers();
      }
    } catch (err) {
      console.error(`Error performing ${dialogAction} action:`, err);
      setMessage({ type: 'error', text: err.message || `执行操作失败，请稍后再试。` });
    }
  };

  // Dialog content based on action
  const getDialogContent = () => {
    if (dialogAction === 'reset') {
      return {
        title: '重置密码',
        description: `确定要重置用户 "${selectedUserName}" 的密码吗？重置后密码将变为：123456`,
        confirmButtonText: '确定重置',
        confirmButtonVariant: 'secondary'
      };
    } else if (dialogAction === 'delete') {
      return {
        title: '删除用户',
        description: `确定要删除用户 "${selectedUserName}" 吗？此操作不可逆。`,
        confirmButtonText: '确定删除',
        confirmButtonVariant: 'destructive'
      };
    }
    return {};
  };

  const dialogProps = getDialogContent();

  return (
    <MainLayout pageTitle="用户管理"> {/* Wrap with MainLayout */}
      <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-start justify-center min-h-[calc(100vh-100px)]">
        <Card className="w-full max-w-4xl shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <Users className="mr-2 h-7 w-7" />用户管理
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="mb-6 flex justify-between items-center">
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow-md"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />返回导航页
              </Button>
            </div>

            {message && (
              <div className={`p-3 rounded-md mb-4 text-sm flex items-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
                {message.text}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">加载用户数据中...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无用户数据。</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <Table className="min-w-full divide-y divide-gray-200">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</TableHead>
                      <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</TableHead>
                      <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">管理员</TableHead>
                      <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.isAdmin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              是
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              否
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-center space-x-2">
                            <Button
                              onClick={() => window.location.href = `/admin/users/edit/${user._id}`}
                              className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-3 py-1.5 text-sm"
                            >
                              <Edit className="w-4 h-4 mr-1" />编辑
                            </Button>
                            <Button
                              onClick={() => handleActionClick('reset', user._id, user.username)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-md px-3 py-1.5 text-sm"
                            >
                              <Lock className="w-4 h-4 mr-1" />重置密码
                            </Button>
                            <Button
                              onClick={() => handleActionClick('delete', user._id, user.username)}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-md px-3 py-1.5 text-sm"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>{dialogProps.title}</DialogTitle>
              <DialogDescription>
                {dialogProps.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-gray-700 border-gray-300 hover:bg-gray-100">取消</Button>
              <Button
                variant={dialogProps.confirmButtonVariant}
                onClick={confirmAction}
                className="px-4 py-2 rounded-md font-semibold"
              >
                {dialogProps.confirmButtonText}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default UserList;
