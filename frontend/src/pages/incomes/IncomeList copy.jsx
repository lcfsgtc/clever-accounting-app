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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination'; // Assuming shadcn/ui pagination components
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // Assuming shadcn/ui dialog components
import { Filter, Plus, FileSpreadsheet, BarChart2, Edit, Trash2, Search, CheckCircle, XCircle } from 'lucide-react'; // Using lucide-react for icons

// Helper function to format date for input fields (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to format date for display (YYYY/MM/DD)
const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

// Helper function to parse URL search parameters for initial state
const getInitialFilters = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    startDate: params.get('startDate') || '',
    endDate: params.get('endDate') || '',
    category: params.get('category') || '',
    subcategory: params.get('subcategory') || '',
    page: parseInt(params.get('page')) || 1,
    limit: parseInt(params.get('limit')) || 10,
  };
};

const IncomeList = () => {
  const [incomes, setIncomes] = useState([]);
  const [filters, setFilters] = useState(getInitialFilters());
  const [totalIncomes, setTotalIncomes] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // Dialog state for confirmation
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  console.log('IncomeList isDialogOpen initial state:', isDialogOpen);
  const [selectedIncomeId, setSelectedIncomeId] = useState(null);

  // Using useCallback to memoize the buildQueryString function
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.category) params.append('category', filters.category);
    if (filters.subcategory) params.append('subcategory', filters.subcategory);
    params.append('page', filters.page);
    params.append('limit', filters.limit);
    return params.toString();
  }, [filters]); // Re-run if filters change

// Using useCallback to memoize the fetchIncomes function
const fetchIncomes = useCallback(async () => {
    setLoading(true);
    setMessage(null); // Clear previous messages
    const queryString = buildQueryString();
    try {
        console.log('Fetching incomes...');
        const token = localStorage.getItem('authToken'); // Get JWT from local storage
        const response = await fetch(`/api/incomes?${queryString}`, {
            headers: {
                'Authorization': `Bearer ${token}` // Send JWT for authentication
            }
        });
        const data = await response.json();
        console.log('API response data:', data);
        // --- 核心改进开始 ---
        // 1. 优先检查 response.ok
        if (!response.ok) {
          console.log('API response not ok:', response.status, data.message);
            // 如果后端返回非2xx状态码，并且有错误信息，则抛出错误
            throw new Error(data.message || `HTTP 错误: ${response.status} ${response.statusText}`);
        }

        // 2. 确保 data.incomes 是一个数组。如果不是，则将其视为空数组。
        const incomesData = data.incomes || []; // 确保 incomesData 永远是数组
        console.log('incomesData after fallback:', incomesData);
        if (!Array.isArray(incomesData)) {
            console.error('Incomes data is not an array!');
            console.warn('API返回的incomes数据不是一个数组，将其视为空数组。实际返回:', data.incomes);
            setIncomes([]);
            setTotalIncomes(0);
            setTotalPages(1);
            return; // 提前返回，避免后续map操作
        }
        // --- 核心改进结束 ---
        console.log('Attempting to set incomes with:', incomesData);
        setIncomes(incomesData.map(income => ({ // 使用 incomesData 替代 data.incomes
            ...income,
            dateFormatted: formatDateForDisplay(income.date) // Format date for display
        })));
        setTotalIncomes(data.totalCount || 0); // 也对 totalCount 进行兜底
        setTotalPages(data.totalPages || 1); // 对 totalPages 进行兜底

        // Update URL without full page reload
        const newUrl = `${window.location.pathname}?${queryString}`;
        window.history.pushState({ path: newUrl }, '', newUrl);

    } catch (err) {
        //console.error('获取数据时出错:', err);
        console.error('Fetch incomes error:', err);
        setMessage({ type: 'error', text: `加载收入记录失败: ${err.message}` });
    } finally {
        setLoading(false);
    }
}, [buildQueryString]); // Re-run if buildQueryString changes (i.e., filters change)

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]); // Effect runs when fetchIncomes changes (due to filters, pagination)

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 })); // Reset to first page on filter change
  };

  // Handle select filter changes (e.g., for category, subcategory if they become select inputs)
  const handleSelectFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value, page: 1 })); // Reset to first page
  };

  // Handle form submission for filters
  const handleFormSubmit = (e) => {
    e.preventDefault();
    fetchIncomes(); // Explicitly trigger fetch on submit
  };

  // Handle pagination page change
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle limit (items per page) change
  const handleLimitChange = (value) => {
    setFilters(prev => ({ ...prev, limit: parseInt(value), page: 1 })); // Reset to first page
  };

  // Handle delete action (opens confirmation dialog)
  const handleDeleteClick = (id) => {
    console.log('handleDeleteClick called');
    setSelectedIncomeId(id);
    setIsDialogOpen(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    setIsDialogOpen(false); // Close dialog immediately
    setMessage(null); // Clear previous messages

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/incomes/${selectedIncomeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '删除收入记录失败。');
      }

      setMessage({ type: 'success', text: data.message || '收入记录删除成功！' });
      fetchIncomes(); // Re-fetch list after successful deletion
    } catch (err) {
      console.error('删除收入时出错:', err);
      setMessage({ type: 'error', text: err.message || '删除收入记录失败，请稍后再试。' });
    }
  };

  return (
    <MainLayout pageTitle="收入列表"> {/* Use MainLayout as the base layout */}
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
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                  <Input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="rounded-md" />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                  <Input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="rounded-md" />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">大类</label>
                  <Input type="text" id="category" name="category" value={filters.category} onChange={handleFilterChange} className="rounded-md" />
                </div>
                <div>
                  <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">小类</label>
                  <Input type="text" id="subcategory" name="subcategory" value={filters.subcategory} onChange={handleFilterChange} className="rounded-md" />
                </div>
                <div className="col-span-full md:col-span-auto flex justify-end">
                  <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-md shadow-md py-2.5">
                    <Search className="mr-2 h-5 w-5" />筛选
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6 justify-center md:justify-start">
          <Button onClick={() => window.location.href = '/incomes/add'} className="bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md px-6 py-2">
            <Plus className="mr-2 h-5 w-5" />添加收入
          </Button>
          <a href={`/api/incomes/export?${buildQueryString()}`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-md px-6 py-2">
              <FileSpreadsheet className="mr-2 h-5 w-5" />导出Excel
            </Button>
          </a>
          <Button onClick={() => window.location.href = '/incomes/statistics'} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow-md px-6 py-2">
            <BarChart2 className="mr-2 h-5 w-5" />收入统计
          </Button>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">收入记录</h2>
        {loading ? (
          <p className="text-center text-gray-600">加载中...</p>
        ) : Array.isArray(incomes) && incomes.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <Table className="min-w-full">
              <TableHeader className="bg-gray-800 text-white hidden md:table-header-group">
                <TableRow>
                  <TableHead className="py-3 px-4 text-left font-semibold">描述</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold">金额</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold">大类</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold">小类</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold">日期</TableHead>
                  <TableHead className="py-3 px-4 text-center font-semibold">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map(income => (
                  <TableRow key={income.id} className="odd:bg-gray-50 hover:bg-gray-100 transition-colors duration-150 block md:table-row mb-4 md:mb-0 rounded-lg border md:border-none shadow-sm md:shadow-none p-4 md:p-0">
                    {/* Mobile view: display as blocks with data-label */}
                    <TableCell data-label="描述:" className="py-2 px-4 whitespace-nowrap text-gray-800 flex justify-between items-center md:table-cell md:block md:text-left md:border-b md:border-gray-200">
                      <span className="font-bold md:hidden">描述:</span>
                      <span>{income.description}</span>
                    </TableCell>
                    <TableCell data-label="金额:" className="py-2 px-4 whitespace-nowrap text-green-600 font-bold flex justify-between items-center md:table-cell md:block md:text-left md:border-b md:border-gray-200">
                      <span className="font-bold md:hidden">金额:</span>
                      <span>¥{income.amount.toFixed(2)}</span>
                    </TableCell>
                    <TableCell data-label="大类:" className="py-2 px-4 whitespace-nowrap flex justify-between items-center md:table-cell md:block md:text-left md:border-b md:border-gray-200">
                      <span className="font-bold md:hidden">大类:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {income.category}
                      </span>
                    </TableCell>
                    <TableCell data-label="小类:" className="py-2 px-4 whitespace-nowrap flex justify-between items-center md:table-cell md:block md:text-left md:border-b md:border-gray-200">
                      <span className="font-bold md:hidden">小类:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {income.subcategory}
                      </span>
                    </TableCell>
                    <TableCell data-label="日期:" className="py-2 px-4 whitespace-nowrap text-gray-700 flex justify-between items-center md:table-cell md:block md:text-left md:border-b md:border-gray-200">
                      <span className="font-bold md:hidden">日期:</span>
                      <span>{income.dateFormatted}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center flex justify-center items-center md:table-cell md:block">
                      <div className="flex justify-center items-center space-x-2">
                        <Button
                          size="sm"
                          className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-md shadow-sm"
                          onClick={() => window.location.href = `/incomes/edit/${income.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white rounded-md shadow-sm"
                          onClick={() => handleDeleteClick(income.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">暂无收入记录。</p>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row justify-between items-center mt-6">
            <div className="flex items-center mb-4 md:mb-0">
              <label htmlFor="limitBottom" className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">每页显示:</label>
              <Select value={filters.limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-[80px] rounded-md">
                  <SelectValue placeholder={filters.limit.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (filters.page > 1) handlePageChange(filters.page - 1);
                    }}
                    className={filters.page === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(i + 1);
                      }}
                      isActive={filters.page === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (filters.page < totalPages) handlePageChange(filters.page + 1);
                    }}
                    className={filters.page === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Delete */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogHeader>
            <DialogTitle>删除收入记录</DialogTitle>
            <DialogDescription>
              确定要删除这条收入记录吗？此操作不可逆。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-gray-700 border-gray-300 hover:bg-gray-100">取消</Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="px-4 py-2 rounded-md font-semibold"
            >
              确定删除
            </Button>
          </DialogFooter>
      </Dialog>
    </MainLayout>
  );
};

export default IncomeList;
