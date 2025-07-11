// src/pages/incomes/IncomeEdit.jsx

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

const IncomeEdit = ({ incomeId }) => {
  const [income, setIncome] = useState(null); // 初始值为 null，用于区分加载中和未找到
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const categories = ['工资', '奖金', '投资收益', '兼职收入', '礼金', '其他'];

  useEffect(() => {
    if (!incomeId) {
      setMessage({ type: 'error', text: '无效的收入记录ID。' });
      setLoading(false);
      return;
    }

    const fetchIncome = async () => {
      setLoading(true);
      setMessage(null);
      try {
        // 2. 使用 apiClient 发起 GET 请求获取单个记录
        //    它会自动处理 baseURL 和 Authorization
        const response = await apiClient.get(`/incomes/${incomeId}`);
        const data = response.data;

        // 设置表单状态
        setIncome({
          id: data.id,
          description: data.description,
          amount: data.amount.toString(),
          category: data.category,
          subcategory: data.subcategory,
          date: formatDateForInput(data.date),
        });

      } catch (err) {
        // 3. 简化错误处理
        const errorMessage = err.response?.data?.message || err.message || '加载收入记录失败。';
        setMessage({ type: 'error', text: errorMessage });
      } finally {
        setLoading(false);
      }
    };
    
    fetchIncome();
  }, [incomeId]); // 依赖项为 incomeId

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setIncome(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setIncome(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!income) return; // 如果 income 数据还未加载，则不执行
    
    setSaving(true);
    setMessage(null);

    // 前端验证逻辑 (保持不变)
    if (!income.description || !income.amount || !income.category || !income.subcategory || !income.date) {
      setMessage({ type: 'error', text: '所有字段都是必填项。' });
      setSaving(false);
      return;
    }
    if (isNaN(parseFloat(income.amount)) || parseFloat(income.amount) <= 0) {
      setMessage({ type: 'error', text: '金额必须是大于0的有效数字。' });
      setSaving(false);
      return;
    }

    try {
      // 4. 使用 apiClient 发起 PUT 请求更新记录
      //    它会自动处理 baseURL, Content-Type, 和 Authorization
      const response = await apiClient.put(`/incomes/${income.id}`, {
        description: income.description,
        amount: parseFloat(income.amount),
        category: income.category,
        subcategory: income.subcategory,
        date: income.date,
      });

      // 5. 从 response.data 获取成功消息
      setMessage({ type: 'success', text: response.data.message || '收入记录更新成功！' });
      
      // 6. 使用 replace 重定向
      setTimeout(() => {
        window.location.replace('/incomes');
      }, 1500);

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || '更新收入记录失败，请稍后再试。';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout pageTitle="编辑收入记录">
        <p className="text-center text-gray-600 mt-8">加载中...</p>
      </MainLayout>
    );
  }

  // 7. 改进加载和错误状态的UI显示
  if (!income) {
    return (
      <MainLayout pageTitle="编辑收入记录">
        <div className="text-center text-red-500 mt-8">
          {message?.text || '无法找到该收入记录。'}
        </div>
      </MainLayout>
    );
  }

  // UI 部分 (JSX) 保持不变
  return (
    <MainLayout pageTitle="编辑收入记录">
      <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Card className="w-full max-w-lg shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <Edit className="mr-2 h-7 w-7" />编辑收入记录
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
                  value={income.description}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  value={income.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" />大类:
                </Label>
                <Select
                  value={income.category}
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
                  value={income.subcategory}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  value={income.date}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button type="submit" className="flex-grow bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md py-2.5 text-base" disabled={saving}>
                  <Save className="mr-2 h-5 w-5" />{saving ? '保存中...' : '确认修改'}
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

export default IncomeEdit;