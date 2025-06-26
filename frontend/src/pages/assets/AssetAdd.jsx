import React, { useState } from 'react';
// 确保 MainLayout.jsx 位于此文件的上一级目录。例如：
// project-root/
// ├── MainLayout.jsx
// └── some-directory/
//     └── AssetAdd.jsx
import MainLayout from '../MainLayout.jsx'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import  Button  from '@/components/ui/button';
import  Input  from '@/components/ui/input';
import  Label  from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import  Textarea  from '@/components/ui/textarea'; // Assuming shadcn/ui Textarea component
import { Package, DollarSign, Calendar, Info, TrendingUp, ClipboardPen, Percent, Save, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'; // Icons for form fields and actions

const AssetAdd = () => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [condition, setCondition] = useState('全新'); // Default value
  const [depreciationMethod, setDepreciationMethod] = useState('直线折旧'); // Default value
  const [depreciationRate, setDepreciationRate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null); // Clear previous messages

    // Basic frontend validation
    if (!name || !type || quantity <= 0 || cost <= 0 || parseFloat(currentValue) < 0) { // currentValue can be 0
      setMessage({ type: 'error', text: '请填写所有必填字段并确保数值有效。' });
      setLoading(false);
      return;
    }

    const assetData = {
      name,
      type,
      quantity: parseFloat(quantity),
      cost: parseFloat(cost),
      currentValue: parseFloat(currentValue),
      purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : undefined, // Convert to ISO string for backend
      condition,
      depreciationMethod,
      depreciationRate: depreciationRate ? parseFloat(depreciationRate) : undefined,
      notes,
    };

    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        },
        body: JSON.stringify(assetData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '添加资产失败。');
      }

      setMessage({ type: 'success', text: data.message || '资产添加成功！' });
      // Clear form fields after successful submission
      setName('');
      setType('');
      setQuantity(1);
      setCost('');
      setCurrentValue('');
      setPurchaseDate('');
      setCondition('全新');
      setDepreciationMethod('直线折旧');
      setDepreciationRate('');
      setNotes('');

      // Optionally redirect after a short delay
      setTimeout(() => {
        window.location.href = '/assets'; // Redirect to assets list
      }, 1500);

    } catch (err) {
      console.error('Add asset error:', err);
      setMessage({ type: 'error', text: err.message || '添加资产失败，请稍后再试。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout pageTitle="添加资产"> {/* 使用 MainLayout 包装组件 */}
      <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Card className="w-full max-w-2xl shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <Plus className="mr-2 h-7 w-7" />添加资产
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {message && (
              <div className={`p-3 rounded-md mb-4 text-sm flex items-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="col-span-1">
                <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  <Package className="inline-block w-4 h-4 mr-1 text-gray-500" />名称:
                </Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  <Info className="inline-block w-4 h-4 mr-1 text-gray-500" />类型:
                </Label>
                <Input
                  type="text"
                  id="type"
                  name="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  <TrendingUp className="inline-block w-4 h-4 mr-1 text-gray-500" />数量:
                </Label>
                <Input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  step="1"
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="inline-block w-4 h-4 mr-1 text-gray-500" />成本:
                </Label>
                <Input
                  type="number"
                  id="cost"
                  name="cost"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  step="0.01"
                  min="0.01"
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="currentValue" className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="inline-block w-4 h-4 mr-1 text-gray-500" />现值:
                </Label>
                <Input
                  type="number"
                  id="currentValue"
                  name="currentValue"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />购买日期:
                </Label>
                <Input
                  type="date"
                  id="purchaseDate"
                  name="purchaseDate"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                  <Info className="inline-block w-4 h-4 mr-1 text-gray-500" />状况:
                </Label>
                <Select
                  value={condition}
                  onValueChange={(value) => setCondition(value)}
                >
                  <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                    <SelectValue placeholder="选择状况" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全新">全新</SelectItem>
                    <SelectItem value="良好">良好</SelectItem>
                    <SelectItem value="一般">一般</SelectItem>
                    <SelectItem value="较差">较差</SelectItem>
                    <SelectItem value="报废">报废</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Label htmlFor="depreciationMethod" className="block text-sm font-medium text-gray-700 mb-1">
                  <ClipboardPen className="inline-block w-4 h-4 mr-1 text-gray-500" />折旧方法:
                </Label>
                <Select
                  value={depreciationMethod}
                  onValueChange={(value) => setDepreciationMethod(value)}
                >
                  <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                    <SelectValue placeholder="选择折旧方法" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="直线折旧">直线折旧</SelectItem>
                    <SelectItem value="余额递减">余额递减</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Label htmlFor="depreciationRate" className="block text-sm font-medium text-gray-700 mb-1">
                  <Percent className="inline-block w-4 h-4 mr-1 text-gray-500" />折旧率 (例如 0.10 代表 10%):
                </Label>
                <Input
                  type="number"
                  id="depreciationRate"
                  name="depreciationRate"
                  value={depreciationRate}
                  onChange={(e) => setDepreciationRate(e.target.value)}
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.00-1.00"
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div className="col-span-full">
                <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  <ClipboardPen className="inline-block w-4 h-4 mr-1 text-gray-500" />备注:
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                ></Textarea>
              </div>

              <div className="col-span-full flex flex-col sm:flex-row gap-3 mt-4">
                <Button type="submit" className="flex-grow bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md py-2.5 text-base" disabled={loading}>
                  <Save className="mr-2 h-5 w-5" />{loading ? '保存中...' : '保存'}
                </Button>
                <Button type="button" onClick={() => window.location.href = '/assets'} variant="outline" className="flex-grow text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2.5 text-base">
                  <ArrowLeft className="mr-2 h-5 w-5" />取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AssetAdd;
