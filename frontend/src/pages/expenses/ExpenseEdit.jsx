// src/pages/expenses/ExpenseEdit.jsx

import React, { useState, useEffect } from 'react';
// 1. 导入 apiClient
import apiClient from '../../api/apiClient'; // 调整路径以匹配您的项目结构

// 导入UI组件 (保持不变)
import MainLayout from '../MainLayout.jsx';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Label from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, XCircle, Edit, DollarSign, Tag, Calendar, LayoutGrid, CheckCircle } from 'lucide-react';

// Helper function (保持不变)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 2. 组件接收 expenseId 作为 prop
const ExpenseEdit = ({ expenseId }) => {
  // 3. 初始状态设为 null
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const categories = ['衣', '食', '住', '行', '医', '娱', '人情', '其他'];

  useEffect(() => {
    // 4. 从 prop 获取 ID，而不是从 URL 解析
    if (!expenseId) {
      setMessage({ type: 'error', text: '无效的支出记录ID。' });
      setLoading(false);
      return;
    }

    const fetchExpense = async () => {
      setLoading(true);
      setMessage(null);
      try {
        // 5. 使用 apiClient 发起 GET 请求
        const response = await apiClient.get(`/expenses/${expenseId}`);
        const data = response.data;
        
        // 注意：您的后端返回的ID字段可能是 `id` 或 `_id`
        // Supabase 通常是 `id`。这里我们统一使用 `id`
        setExpense({
          id: data.id, 
          description: data.description,
          amount: data.amount.toString(),
          category: data.category,
          subcategory: data.subcategory,
          date: formatDateForInput(data.date),
        });

      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || '加载支出记录失败。';
        setMessage({ type: 'error', text: errorMessage });
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpense();
  }, [expenseId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpense(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setExpense(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!expense) return;
    
    setSaving(true);
    setMessage(null);

    // 前端验证逻辑 (保持不变)
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
      // 6. 使用 apiClient 发起 PUT 请求
      const response = await apiClient.put(`/expenses/${expense.id}`, {
        description: expense.description,
        amount: parseFloat(expense.amount),
        category: expense.category,
        subcategory: expense.subcategory,
        date: expense.date,
      });

      setMessage({ type: 'success', text: response.data.message || '支出记录更新成功！' });
      
      // 7. 使用 replace 重定向
      setTimeout(() => {
        window.location.replace('/expenses');
      }, 1500);

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || '更新支出记录失败，请稍后再试。';
      setMessage({ type: 'error', text: errorMessage });
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

  // 8. 改进加载和错误状态的UI显示
  if (!expense) {
    return (
      <MainLayout pageTitle="编辑支出记录">
        <div className="text-center text-red-500 mt-8">
          {message?.text || '无法找到该支出记录。'}
        </div>
      </MainLayout>
    );
  }

  // UI 部分 (JSX) 保持不变，只为消息提示添加图标和调整颜色
  return (
    <MainLayout pageTitle="编辑支出记录">
      <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Card className="w-full max-w-lg shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-red-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <Edit className="mr-2 h-7 w-7" />编辑支出记录
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
              {/* Form fields... no changes here */}
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
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
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
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
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
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
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
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button type="submit" className="flex-grow bg-red-600 hover:bg-red-700 text-white rounded-md shadow-md py-2.5 text-base" disabled={saving}>
                  <Save className="mr-2 h-5 w-5" />{saving ? '保存中...' : '确认修改'}
                </Button>
                <Button type="button" onClick={() => window.location.href = '/expenses'} variant="outline" className="flex-grow text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2.5 text-base">
                  <XCircle className="mr-2 h-5 w-5" />返回列表
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