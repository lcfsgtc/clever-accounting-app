import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../MainLayout.jsx'; // 确保 MainLayout.jsx 位于正确的位置
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import  Button  from '@/components/ui/button';
import  Input  from '@/components/ui/input';
import  Label  from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Filter, Calendar, BarChart, RedoDot, ArrowLeft, ChartPie, CheckCircle, XCircle } from 'lucide-react'; // Icons

// Helper function to format date for input fields (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AssetStatistics = () => {
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
  });
  const [statisticsData, setStatisticsData] = useState({});
  const [distinctAssetTypes, setDistinctAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    return params.toString();
  }, [filters]);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    const queryString = buildQueryString();

    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch(`/api/assets/statistics?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch asset statistics');
      }

      setStatisticsData(data.statistics || {});
      setDistinctAssetTypes(data.distinctAssetTypes || []);

      // Update URL without full page reload
      const newUrl = `${window.location.pathname}?${queryString}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

    } catch (err) {
      console.error('Error fetching asset statistics:', err);
      setMessage({ type: 'error', text: `加载统计数据失败: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  useEffect(() => {
    // Attempt to load initial filters from URL on component mount
    const params = new URLSearchParams(window.location.search);
    setFilters({
      type: params.get('type') || '',
      startDate: params.get('startDate') || '',
      endDate: params.get('endDate') || '',
    });
    // fetchStatistics will be called by useEffect when filters state is updated
  }, []);

  useEffect(() => {
    // This useEffect ensures fetchStatistics is called whenever filters change
    fetchStatistics();
  }, [filters, fetchStatistics]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // fetchStatistics is already called by the useEffect when filters change,
    // so simply updating filters will trigger the fetch.
  };

  const handleReset = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: '',
    });
    // fetchStatistics will be called due to filters change
  };

  // Calculate total statistical value
  const totalStatisticalValue = Object.values(statisticsData).reduce((sum, value) => sum + value, 0);

  return (
    <MainLayout pageTitle="资产统计">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-4">
        {/* Messages */}
        {message && (
          <div className={`p-3 rounded-md mb-4 text-sm flex items-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
            {message.text}
          </div>
        )}

        {/* Filter Card */}
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-white p-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <Filter className="mr-2 text-blue-500" />筛选条件
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    <ChartPie className="inline-block w-4 h-4 mr-1 text-gray-500" />资产类型:
                  </Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                      <SelectValue placeholder="所有类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">所有类型</SelectItem>
                      {distinctAssetTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />开始日期:
                  </Label>
                  <Input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleInputChange}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />结束日期:
                  </Label>
                  <Input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleInputChange}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-3 mt-6">
                <Button type="submit" className="flex-grow md:flex-grow-0 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-md">
                  <BarChart className="w-4 h-4 mr-2" />统计
                </Button>
                <Button type="button" onClick={handleReset} className="flex-grow md:flex-grow-0 bg-gray-500 hover:bg-gray-600 text-white rounded-md shadow-md">
                  <RedoDot className="w-4 h-4 mr-2" />重置
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Statistics Results Card */}
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-white p-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <ChartPie className="mr-2 text-blue-500" />统计结果 (按类型现值汇总)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {loading ? (
              <p className="text-center text-gray-600">加载中...</p>
            ) : Object.keys(statisticsData).length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="min-w-full responsive-stats-table">
                  <TableHeader className="bg-blue-600 text-white">
                    <TableRow>
                      <TableHead className="py-3 px-4 text-left font-semibold">资产类型</TableHead>
                      <TableHead className="py-3 px-4 text-left font-semibold">总现值</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(statisticsData)
                      .sort(([typeA], [typeB]) => typeA.localeCompare(typeB)) // Sort alphabetically by type
                      .map(([type, value]) => (
                        <TableRow key={type} className="odd:bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
                          <TableCell data-label="资产类型:" className="py-2 px-4 whitespace-nowrap text-gray-800 block md:table-cell md:text-left">
                            <span className="font-bold md:hidden">资产类型:</span>
                            {type}
                          </TableCell>
                          <TableCell data-label="总现值:" className="py-2 px-4 whitespace-nowrap text-green-600 font-bold block md:table-cell md:text-left">
                            <span className="font-bold md:hidden">总现值:</span>
                            ¥{value.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    <TableRow className="bg-blue-100 font-bold text-blue-800">
                      <TableCell colSpan={2} className="py-3 px-4 text-center">
                        总计: ¥{totalStatisticalValue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="alert alert-info mb-0 text-center text-gray-500">没有找到符合条件的资产数据。</p>
            )}
          </CardContent>
        </Card>

        {/* Back to Asset List Button */}
        <Button
          onClick={() => window.location.href = '/assets'}
          className="bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow-md w-fit mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />返回资产列表
        </Button>
      </div>
    </MainLayout>
  );
};

export default AssetStatistics;
