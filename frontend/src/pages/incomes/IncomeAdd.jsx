// src/pages/incomes/IncomeAdd.jsx

import React, { useState } from 'react';
// 1. 导入 apiClient
import apiClient from '../../api/apiClient'; // 调整路径以匹配您的项目结构

// 导入UI组件 (保持不变)
import MainLayout from '../MainLayout.jsx';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Label from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, XCircle, DollarSign, Tag, Calendar, LayoutGrid, CheckCircle } from 'lucide-react';

// Helper function (保持不变)
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

const IncomeAdd = () => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const categories = ['工资', '奖金', '投资收益', '兼职收入', '礼金', '其他'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 前端验证逻辑 (保持不变)
    if (!description || !amount || !category || !subcategory || !date) {
      setMessage({ type: 'error', text: '所有字段都是必填项。' });
      setLoading(false);
      return;
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setMessage({ type: 'error', text: '金额必须是大于0的有效数字。' });
      setLoading(false);
      return;
    }

    try {
      // 2. 使用 apiClient 发起 POST 请求
      //    它会自动处理 baseURL, Content-Type, 和 Authorization
      const response = await apiClient.post('/incomes/add', {
        description,
        amount: parseFloat(amount),
        category,
        subcategory,
        date,
      });

      // 3. 从 response.data 获取成功消息
      setMessage({ type: 'success', text: response.data.message || '收入记录添加成功！正在跳转...' });
      
      // 清空表单
      setDescription('');
      setAmount('');
      setCategory('');
      setSubcategory('');
      setDate(getTodayDate());

      // 4. 使用 replace 重定向，提升用户体验
      setTimeout(() => {
        window.location.replace('/incomes');
      }, 1500);

    } catch (err) {
      console.error('Add income error:', err);
      // 5. 从 Axios 错误对象中获取后端返回的错误信息
      const errorMessage = err.response?.data?.message || err.message || '添加收入记录失败，请稍后再试。';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // UI 部分 (JSX) 保持不变
  return (
    <MainLayout pageTitle="添加收入记录">
      <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Card className="w-full max-w-lg shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <Plus className="mr-2 h-7 w-7" />添加收入记录
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
                <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <LayoutGrid className="inline-block w-4 h-4 mr-1 text-gray-500" />描述:
                </Label>
                <Input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="例如：6月工资"
                />
              </div>
              <div>
                <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <DollarSign className="inline-block w-4 h-4 mr-1 text-gray-500" />金额:
                </Label>
                <Input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="请输入金额"
                />
              </div>
              <div>
                <Label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" />大类:
                </Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
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
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="例如：基本工资"
                />
              </div>
              <div>
                <Label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />日期:
                </Label>
                <Input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button type="submit" className="flex-grow bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md py-2.5 text-base" disabled={loading}>
                  <Save className="mr-2 h-5 w-5" />{loading ? '保存中...' : '确认添加'}
                </Button>
                <Button type="button" onClick={() => window.location.href = '/incomes'} variant="outline" className="flex-grow text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2.5 text-base">
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

export default IncomeAdd;