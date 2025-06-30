import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../MainLayout.jsx'; // 确保 MainLayout.jsx 位于正确的位置
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // Assuming shadcn/ui table components
import Button  from '@/components/ui/button'; // Assuming shadcn/ui button component
import  Input  from '@/components/ui/input'; // Assuming shadcn/ui input component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Assuming shadcn/ui select component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming shadcn/ui card component
import { Filter, BarChart, Calendar, Tag, DollarSign, RedoDot, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'; // Using lucide-react for icons

// Helper function to format date for input fields (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to parse URL search parameters for initial state
const getInitialFilters = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    startDate: params.get('startDate') || '',
    endDate: params.get('endDate') || '',
    category: params.get('category') || '', // Individual category filter
    subcategory: params.get('subcategory') || '', // Individual subcategory filter
    minAmount: params.get('minAmount') || '',
    maxAmount: params.get('maxAmount') || '',
    period: params.get('period') || '', // Grouping type for time: total, year, month
    categoryType: params.get('categoryType') || '', // Grouping type for categories: category, subcategory, categoryAndSubcategory
    selectedYear: params.get('year') || new Date().getFullYear().toString(), // Default to current year for month grouping
  };
};

const ExpenseStatistics = () => {
  const [filters, setFilters] = useState(getInitialFilters());
  const [statisticsData, setStatisticsData] = useState([]);
  const [distinctCategories, setDistinctCategories] = useState([]);
  const [distinctSubcategories, setDistinctSubcategories] = useState([]);
  const [distinctYears, setDistinctYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // For success/error messages
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false); // Start expanded for better UX
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false); // Start expanded for better UX

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.category) params.append('category', filters.category);
    if (filters.subcategory) params.append('subcategory', filters.subcategory);
    if (filters.minAmount) params.append('minAmount', filters.minAmount);
    if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
    if (filters.period) params.append('period', filters.period);
    if (filters.categoryType) params.append('categoryType', filters.categoryType);
    if (filters.period === 'month' && filters.selectedYear) params.append('year', filters.selectedYear);
    return params.toString();
  }, [filters]);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    const queryString = buildQueryString();

    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch(`/api/expenses/statistics?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch statistics');
      }

      setStatisticsData(data.statistics);
      setDistinctCategories(data.distinctCategories || []);
      setDistinctSubcategories(data.distinctSubcategories || []);
      setDistinctYears(data.distinctYears || []);

      // Update URL without full page reload
      const newUrl = `${window.location.pathname}?${queryString}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

    } catch (err) {
      console.error('Error fetching expense statistics:', err);
      setMessage({ type: 'error', text: `加载统计数据失败: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

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
      // If category type changes, reset individual category/subcategory filter
      if (name === 'categoryType') {
        newState.category = '';
        newState.subcategory = '';
      }
      // If period changes, reset selectedYear unless it's 'month'
      if (name === 'period' && value !== 'month') {
        newState.selectedYear = new Date().getFullYear().toString();
      }
      // If category changes, reset subcategory
      if (name === 'category') {
        newState.subcategory = '';
      }
      return newState;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchStatistics(); // Trigger a fetch with current filters
  };

  const handleReset = () => {
    const currentYear = new Date().getFullYear().toString();
    setFilters({
      startDate: '',
      endDate: '',
      category: '',
      subcategory: '',
      minAmount: '',
      maxAmount: '',
      period: '', // Resets to total grouping
      categoryType: '', // Resets to no category grouping
      selectedYear: currentYear,
    });
    // fetchStatistics will be called due to filters change
  };

  const renderCategoryOrTimeDisplay = (item, period, categoryType) => {
    if (period === 'year') {
      return `${item._id} 年`;
    } else if (period === 'month') {
      return `${item._id.year} 年 ${String(item._id.month).padStart(2, '0')} 月`;
    } else if (categoryType === 'category') {
      return item._id;
    } else if (categoryType === 'subcategory') {
      return item._id;
    } else if (categoryType === 'categoryAndSubcategory') {
      return `${item._id.category} - ${item._id.subcategory}`;
    }
    return '总计'; // Default for total or fallback
  };

  // Calculate overall total amount for display
  const totalOverallAmount = statisticsData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

  return (
    <MainLayout pageTitle="支出统计">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-4">
        {/* Return to Expense List Button */}
        <Button
          onClick={() => window.location.href = '/expenses'}
          className="bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow-md w-fit mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />返回支出列表
        </Button>

        {/* Messages */}
        {message && (
          <div className={`p-3 rounded-md mb-4 ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.text}
          </div>
        )}
        {loading && <p className="text-center text-gray-600">加载中...</p>}

        {/* Filter Card */}
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
                  <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" /> 开始日期:
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
                    <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" /> 结束日期:
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
                <div>
                  <Label htmlFor="categoryType" className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" /> 类别分组:
                  </Label>
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
                {/* Individual category/subcategory filters, only show if categoryType is not set */}
                {filters.categoryType === '' && (
                  <>
                    <div>
                      <Label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" /> 大类 (筛选):
                      </Label>
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
                      <Label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                        <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" /> 小类 (筛选):
                      </Label>
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
                  </>
                )}
                <div>
                  <Label htmlFor="minAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="inline-block w-4 h-4 mr-1 text-gray-500" /> 最小金额:
                  </Label>
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
                  <Label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="inline-block w-4 h-4 mr-1 text-gray-500" /> 最大金额:
                  </Label>
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
                  <Label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
                    <BarChart className="inline-block w-4 h-4 mr-1 text-gray-500" /> 时间分组:
                  </Label>
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
                {filters.period === 'month' && (
                  <div>
                    <Label htmlFor="selectedYear" className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" /> 选择年度:
                    </Label>
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

        {/* Statistics Details Card */}
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
                          <TableCell data-label="总金额:" className="py-2 px-4 whitespace-nowrap text-red-600 font-bold flex justify-between items-center md:table-cell md:block md:text-left">
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

export default ExpenseStatistics;
