// src/pages/incomes/IncomeStatistics.jsx

import React, { useState, useEffect, useCallback } from 'react';
// 1. 导入 apiClient
import apiClient from '../../api/apiClient'; // 调整路径以匹配您的项目结构

// 导入UI组件 (保持不变)
import MainLayout from '../MainLayout.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, BarChart, Calendar, Tag, DollarSign, RedoDot, ArrowLeft, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';

// Helper functions (保持不变)
const getInitialFilters = () => {
  const params = new URLSearchParams(window.location.search);
  const currentYear = new Date().getFullYear().toString();
  return {
    startDate: params.get('startDate') || '',
    endDate: params.get('endDate') || '',
    category: params.get('category') || '',
    subcategory: params.get('subcategory') || '',
    minAmount: params.get('minAmount') || '',
    maxAmount: params.get('maxAmount') || '',
    period: params.get('period') || '',
    categoryType: params.get('categoryType') || '',
    selectedYear: params.get('year') || currentYear,
  };
};

const IncomeStatistics = () => {
  // State hooks (保持不变)
  const [filters, setFilters] = useState(getInitialFilters());
  const [statisticsData, setStatisticsData] = useState([]);
  const [distinctCategories, setDistinctCategories] = useState([]);
  const [distinctSubcategories, setDistinctSubcategories] = useState([]);
  const [distinctYears, setDistinctYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);

  // 2. buildQueryParams 现在返回一个普通的JS对象
  const buildQueryParams = useCallback((currentFilters) => {
    const params = {};
    if (currentFilters.startDate) params.startDate = currentFilters.startDate;
    if (currentFilters.endDate) params.endDate = currentFilters.endDate;
    if (currentFilters.category) params.category = currentFilters.category;
    if (currentFilters.subcategory) params.subcategory = currentFilters.subcategory;
    if (currentFilters.minAmount) params.minAmount = currentFilters.minAmount;
    if (currentFilters.maxAmount) params.maxAmount = currentFilters.maxAmount;
    if (currentFilters.period) params.period = currentFilters.period;
    if (currentFilters.categoryType) params.categoryType = currentFilters.categoryType;
    if (currentFilters.period === 'month' && currentFilters.selectedYear) {
      params.year = currentFilters.selectedYear;
    }
    return params;
  }, []);

  // 3. 重构 fetchStatistics 函数
  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const queryParams = buildQueryParams(filters);

    try {
      // 使用 apiClient 发起请求，自动处理 baseURL 和 Authorization
      const response = await apiClient.get('/incomes/statistics', { params: queryParams });
      const data = response.data;

      setStatisticsData(data.statistics || []);
      setDistinctCategories(data.distinctCategories || []);
      setDistinctSubcategories(data.distinctSubcategories || []);
      setDistinctYears(data.distinctYears || []);

      // 更新 URL
      const queryString = new URLSearchParams(queryParams).toString();
      const newUrl = `${window.location.pathname}?${queryString}`;
      if (window.location.search !== `?${queryString}`) {
        window.history.pushState({ path: newUrl }, '', newUrl);
      }

    } catch (err) {
      // 4. 简化错误处理
      const errorMessage = err.response?.data?.message || err.message || '加载统计数据失败。';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [filters, buildQueryParams]);

  // useEffect 和其他 handle 函数 (保持不变)
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFilters(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'period' && value !== 'month') {
        newState.selectedYear = '';
      }
      if (name === 'category') {
        newState.subcategory = '';
      }
      return newState;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchStatistics();
  };

  const handleReset = () => {
    const currentYear = new Date().getFullYear().toString();
    setFilters({
      startDate: '', endDate: '', category: '', subcategory: '',
      minAmount: '', maxAmount: '', period: '', categoryType: '',
      selectedYear: currentYear,
    });
  };
  
  // renderCategoryOrTimeDisplay 和 totalOverallAmount (保持不变)
   const renderCategoryOrTimeDisplay = (item, period, categoryType) => {
    if (!item || item.id === undefined || item.id === null) {
      return '[未知统计项]';
    }

    const id = String(item.id);

    if (id === '总计') {
      return '总计';
    }

    if (period === 'year' && !categoryType) {
        if (/^\d{4}$/.test(id)) {
            return `${id} 年`;
        }
    } else if (period === 'month' && !categoryType) {
        const match = id.match(/^(\d{4})-(\d{2})$/);
        if (match) {
            return `${match[1]} 年 ${parseInt(match[2], 10)} 月`;
        }
    }

    if (categoryType) {
        let display = id;
        if (period === 'year') {
            const parts = id.split('-');
            if (parts.length > 1 && /^\d{4}$/.test(parts[parts.length - 1])) {
                const yearPart = parts.pop();
                display = `${parts.join('-')} (${yearPart} 年)`;
            }
        } else if (period === 'month') {
            const parts = id.split('-');
            if (parts.length > 1 && /^\d{4}-\d{2}$/.test(parts[parts.length - 1])) {
                const monthYearPart = parts.pop();
                const [year, month] = monthYearPart.split('-');
                display = `${parts.join('-')} (${year} 年 ${parseInt(month, 10)} 月)`;
            }
        }
        if (categoryType === 'categoryAndSubcategory' && display.includes(' - ')) {
            // Already formatted correctly by backend for "Category - Subcategory"
        }
        return display;
    }

    return id;
  };

  const totalOverallAmount = statisticsData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

  // UI 部分 (JSX) 保持不变
  return (
    <MainLayout pageTitle="收入统计">
      {/* ... 所有 JSX 代码保持不变 ... */}
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-4">
        <Button
          onClick={() => window.location.href = '/incomes'}
          className="bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow-md w-fit mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />返回收入列表
        </Button>

        {message && (
          <div className={`p-3 rounded-md mb-4 text-sm flex items-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
            {message.text}
          </div>
        )}
        {loading && <p className="text-center text-gray-600">加载中...</p>}

        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-white p-4 cursor-pointer" onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}>
            <CardTitle className="text-lg font-semibold text-gray-800 flex justify-between items-center">
              筛选条件 <Filter className="text-gray-500 transition-transform duration-200" style={{ transform: isFilterCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }} />
            </CardTitle>
          </CardHeader>
          <CardContent className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterCollapsed ? 'max-h-0 p-0' : 'max-h-[1000px] p-4 md:p-6'}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" /> 开始日期:
                  </label>
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
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" /> 结束日期:
                  </label>
                  <Input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleInputChange}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" /> 大类 (筛选):
                  </label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                      <SelectValue placeholder="所有大类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">所有大类</SelectItem>
                      {distinctCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" /> 小类 (筛选):
                  </label>
                  <Select
                    value={filters.subcategory}
                    onValueChange={(value) => handleSelectChange('subcategory', value)}
                  >
                    <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                      <SelectValue placeholder="所有小类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">所有小类</SelectItem>
                      {distinctSubcategories.map(subcat => (
                        <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="minAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="inline-block w-4 h-4 mr-1 text-gray-500" /> 最小金额:
                  </label>
                  <Input
                    type="number"
                    id="minAmount"
                    name="minAmount"
                    value={filters.minAmount}
                    onChange={handleInputChange}
                    step="0.01"
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="inline-block w-4 h-4 mr-1 text-gray-500" /> 最大金额:
                  </label>
                  <Input
                    type="number"
                    id="maxAmount"
                    name="maxAmount"
                    value={filters.maxAmount}
                    onChange={handleInputChange}
                    step="0.01"
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
                    <BarChart className="inline-block w-4 h-4 mr-1 text-gray-500" /> 时间分组:
                  </label>
                  <Select
                    value={filters.period}
                    onValueChange={(value) => handleSelectChange('period', value)}
                  >
                    <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                      <SelectValue placeholder="总计" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">总计</SelectItem>
                      <SelectItem value="year">按年</SelectItem>
                      <SelectItem value="month">按月</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="categoryType" className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" /> 类别分组:
                  </label>
                  <Select
                    value={filters.categoryType}
                    onValueChange={(value) => handleSelectChange('categoryType', value)}
                  >
                    <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                      <SelectValue placeholder="不按类别分组" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">不按类别分组</SelectItem>
                      <SelectItem value="category">按大类</SelectItem>
                      <SelectItem value="subcategory">按小类</SelectItem>
                      <SelectItem value="categoryAndSubcategory">按大类和小类</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {filters.period === 'month' && (
                  <div>
                    <label htmlFor="selectedYear" className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" /> 选择年度:
                    </label>
                    <Select
                      value={filters.selectedYear.toString()}
                      onValueChange={(value) => handleSelectChange('selectedYear', value)}
                    >
                      <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                        <SelectValue placeholder="选择年度" />
                      </SelectTrigger>
                      <SelectContent>
                        {distinctYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year} 年
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-3 mt-6">
                <Button type="submit" className="flex-grow md:flex-grow-0 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-md">
                  <Filter className="w-4 h-4 mr-2" /> 生成统计
                </Button>
                <Button type="button" onClick={handleReset} className="flex-grow md:flex-grow-0 bg-gray-500 hover:bg-gray-600 text-white rounded-md shadow-md">
                  <RedoDot className="w-4 h-4 mr-2" /> 重置
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-white p-4 cursor-pointer" onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}>
            <CardTitle className="text-lg font-semibold text-gray-800 flex justify-between items-center">
              统计详情 <BarChart className="inline-block w-5 h-5 ml-2 text-gray-500" />
              {isStatsCollapsed ? <ChevronDown className="transition-transform duration-200" /> : <ChevronUp className="transition-transform duration-200" />}
            </CardTitle>
          </CardHeader>
          <CardContent className={`transition-all duration-300 ease-in-out overflow-hidden ${isStatsCollapsed ? 'max-h-0 p-0' : 'max-h-[1000px] p-0'}`}>
            <div className="overflow-x-auto">
              <Table className="min-w-full responsive-stats-table">
                <TableHeader className="bg-blue-600 text-white hidden md:table-header-group">
                  <TableRow>
                    <TableHead className="py-3 px-4 text-left font-semibold">统计类别</TableHead>
                    <TableHead className="py-3 px-4 text-left font-semibold">总金额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statisticsData.length > 0 ? (
                    <>
                      {statisticsData.map((item, index) => (
                        <TableRow key={index} className="odd:bg-gray-50 hover:bg-gray-100 transition-colors duration-150 block md:table-row mb-4 md:mb-0 rounded-lg border md:border-none shadow-sm md:shadow-none p-4 md:p-0">
                          <TableCell data-label="统计类别:" className="py-2 px-4 whitespace-nowrap text-gray-800 flex justify-between items-center md:table-cell md:block md:text-left md:border-b md:border-gray-200">
                            <span className="font-bold md:hidden">统计类别:</span>
                            <span>{renderCategoryOrTimeDisplay(item, filters.period, filters.categoryType)}</span>
                          </TableCell>
                          <TableCell data-label="总金额:" className="py-2 px-4 whitespace-nowrap text-green-600 font-bold flex justify-between items-center md:table-cell md:block md:text-left">
                            <span className="font-bold md:hidden">总金额:</span>
                            <span>¥ {item.totalAmount ? item.totalAmount.toFixed(2) : '0.00'}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-blue-100 font-bold text-blue-800 block md:table-row">
                        <TableCell colSpan={2} className="py-3 px-4 text-center block md:table-cell">
                          总计: ¥ {totalOverallAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow className="block md:table-row">
                      <TableCell colSpan={2} className="py-10 text-center text-gray-500 no-data-cell block md:table-cell">
                        <p className="text-lg mb-3">没有找到符合条件的统计数据。</p>
                        <p className="text-sm">请调整筛选条件或生成统计。</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default IncomeStatistics;