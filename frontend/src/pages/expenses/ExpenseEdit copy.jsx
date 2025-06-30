import React, { useState, useEffect } from 'react';
import MainLayout from '../MainLayout.jsx'; // 确保 MainLayout.jsx 位于正确的位置，通常与此文件在同一目录下
import  Button  from '@/components/ui/button';
import  Input  from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import  Label  from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, XCircle, Edit, DollarSign, Tag, Calendar, LayoutGrid } from 'lucide-react'; // Icons

// Helper function to format date for input fields (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ExpenseEdit = () => {
  const [expense, setExpense] = useState({
    _id: '', // To store the ID of the expense being edited
    description: '',
    amount: '',
    category: '',
    subcategory: '',
    date: formatDateForInput(new Date()), // Default to today's date, will be overwritten by fetched data
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // For success/error messages

  // Hardcoded categories as in original EJS, these could be fetched from an API if dynamic
  const categories = ['衣', '食', '住', '行', '医', '娱', '人情', '其他'];

  useEffect(() => {
    // Extract expense ID from the URL path (e.g., /expenses/edit/123)
    const pathSegments = window.location.pathname.split('/');
    const expenseId = pathSegments[pathSegments.length - 1]; // Gets the ID from the URL

    if (expenseId) {
      const fetchExpense = async () => {
        setLoading(true);
        setMessage(null);
        try {
          const token = localStorage.getItem('authToken'); // Get JWT from local storage
          const response = await fetch(`/api/expenses/${expenseId}`, {
            headers: {
              'Authorization': `Bearer ${token}` // Send JWT for authentication
            }
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch expense details.');
          }

          // Format date for the input field
          setExpense({
            ...data,
            date: formatDateForInput(data.date),
            amount: data.amount.toString() // Convert amount to string for number input value
          });
        } catch (err) {
          console.error('Error fetching expense:', err);
          setMessage({ type: 'error', text: `加载支出记录失败: ${err.message}` });
        } finally {
          setLoading(false);
        }
      };
      fetchExpense();
    } else {
      setLoading(false);
      setMessage({ type: 'error', text: '无效的支出记录ID。' });
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpense(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setExpense(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Basic frontend validation
    if (!expense.description || !expense.amount || !expense.category || !expense.subcategory || !expense.date) {
      setMessage({ type: 'error', text: '所有字段都是必填项。' });
      setSaving(false);
      return;
    }

    if (isNaN(parseFloat(expense.amount)) || parseFloat(expense.amount) <= 0) {
      setMessage({ type: 'error', text: '金额必须是大于0的有效数字。' });
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch(`/api/expenses/${expense._id}`, {
        method: 'PUT', // Use PUT for updating
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        },
        body: JSON.stringify({
          description: expense.description,
          amount: parseFloat(expense.amount), // Convert amount back to number
          category: expense.category,
          subcategory: expense.subcategory,
          date: expense.date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更新支出记录失败。');
      }

      setMessage({ type: 'success', text: data.message || '支出记录更新成功！' });
      // Optionally redirect after a short delay
      setTimeout(() => {
        window.location.href = '/expenses'; // Redirect to expense list after successful update
      }, 1500);

    } catch (err) {
      console.error('Error updating expense:', err);
      setMessage({ type: 'error', text: err.message || '更新支出记录失败，请稍后再试。' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout pageTitle="编辑支出记录">
        <p className="text-center text-gray-600 mt-8">加载中...</p>
      </MainLayout>
    );
  }

  // If there's an error and no expense data (e.g., ID not found), display error
  if (!loading && message && message.type === 'error' && !expense._id) {
    return (
      <MainLayout pageTitle="编辑支出记录">
        <p className="text-center text-red-500 mt-8">{message.text}</p>
      </MainLayout>
    );
  }

  // If data is loaded but expense object is empty (shouldn't happen if ID is valid)
  if (!expense._id) {
    return (
      <MainLayout pageTitle="编辑支出记录">
        <p className="text-center text-gray-500 mt-8">无法找到支出记录。</p>
      </MainLayout>
    );
  }


  return (
    <MainLayout pageTitle="编辑支出记录"> {/* 使用 MainLayout 包装组件 */}
      <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Card className="w-full max-w-lg shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <Edit className="mr-2 h-7 w-7" />编辑支出记录
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {message && (
              <div className={`p-3 rounded-md mb-4 text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <LayoutGrid className="inline-block w-4 h-4 mr-1 text-gray-500" />描述:
                </Label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  value={expense.description}
                  onChange={handleInputChange}
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <DollarSign className="inline-block w-4 h-4 mr-1 text-gray-500" />金额:
                </Label>
                <Input
                  type="number"
                  id="amount"
                  name="amount"
                  value={expense.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0.01"
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" />大类:
                </Label>
                <Select
                  value={expense.category}
                  onValueChange={handleSelectChange}
                  required
                >
                  <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                    <SelectValue placeholder="请选择大类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">请选择大类</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <LayoutGrid className="inline-block w-4 h-4 mr-1 text-gray-500" />小类:
                </Label>
                <Input
                  type="text"
                  id="subcategory"
                  name="subcategory"
                  value={expense.subcategory}
                  onChange={handleInputChange}
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />日期:
                </Label>
                <Input
                  type="date"
                  id="date"
                  name="date"
                  value={expense.date}
                  onChange={handleInputChange}
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button type="submit" className="flex-grow bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md py-2.5 text-base" disabled={saving}>
                  <Save className="mr-2 h-5 w-5" />{saving ? '保存中...' : '保存'}
                </Button>
                <Button type="button" onClick={() => window.location.href = '/expenses'} variant="outline" className="flex-grow text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2.5 text-base">
                  <XCircle className="mr-2 h-5 w-5" />取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ExpenseEdit;
