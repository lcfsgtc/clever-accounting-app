import React, { useState, useEffect } from 'react';
import MainLayout from '../MainLayout.jsx'; // 确保 MainLayout.jsx 位于正确的位置，通常与此文件在同一目录下
import  Button  from '@/components/ui/button';
import Input  from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import  Label  from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, XCircle, DollarSign, Tag, Calendar, LayoutGrid, CheckCircle } from 'lucide-react'; // Icons

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

const IncomeAdd = () => {
  console.log('IncomeAdd component is being rendered.'); 
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState(getTodayDate()); // Default to today's date
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // Hardcoded categories, these could be fetched from an API if dynamic
  const categories = ['工资', '奖金', '投资收益', '兼职收入', '礼金', '其他'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null); // Clear previous messages

    // Basic frontend validation
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
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch('/api/incomes/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount), // Convert amount to number
          category,
          subcategory,
          date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '添加收入记录失败。');
      }

      setMessage({ type: 'success', text: data.message || '收入记录添加成功！正在跳转至收入列表...' });
      // Clear form fields after successful submission
      setDescription('');
      setAmount('');
      setCategory('');
      setSubcategory('');
      setDate(getTodayDate()); // Reset to today's date

      // Optionally redirect after a short delay
      setTimeout(() => {
        window.location.href = '/incomes'; // Redirect to income list
      }, 1500);

    } catch (err) {
      console.error('Add income error:', err);
      setMessage({ type: 'error', text: err.message || '添加收入记录失败，请稍后再试。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout pageTitle="添加收入记录"> {/* 使用 MainLayout 包装组件 */}
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
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                  value={category}
                  onValueChange={setCategory}
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
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
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
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button type="submit" className="flex-grow bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md py-2.5 text-base" disabled={loading}>
                  <Save className="mr-2 h-5 w-5" />{loading ? '保存中...' : '保存'}
                </Button>
                <Button type="button" onClick={() => window.location.href = '/incomes'} variant="outline" className="flex-grow text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2.5 text-base">
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

export default IncomeAdd;
