// src/pages/incomes/IncomeList.jsx

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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Filter, Plus, FileSpreadsheet, BarChart2, Edit, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';

// Helper functions (保持不变)
const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

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
  const [message, setMessage] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIncomeId, setSelectedIncomeId] = useState(null);

  // 2. buildQueryString 不再需要手动创建 URLSearchParams
  //    因为 apiClient 会自动处理 params 对象
  const buildQueryParams = useCallback(() => {
    const params = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.category) params.category = filters.category;
    if (filters.subcategory) params.subcategory = filters.subcategory;
    params.page = filters.page;
    params.limit = filters.limit;
    return params;
  }, [filters]);

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const queryParams = buildQueryParams();
    
    try {
      // 3. 使用 apiClient 发起 GET 请求，并传递 params
      //    它会自动处理 baseURL 和 Authorization
      const response = await apiClient.get('/incomes', { params: queryParams });
      const data = response.data;

      const incomesData = data.incomes || [];
      setIncomes(incomesData.map(income => ({
        ...income,
        dateFormatted: formatDateForDisplay(income.date)
      })));
      setTotalIncomes(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);

      // 更新 URL
      const newUrl = `${window.location.pathname}?${new URLSearchParams(queryParams).toString()}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

    } catch (err) {
      // 4. 简化错误处理，401错误会被拦截器自动处理
      const errorMessage = err.response?.data?.message || err.message || '加载收入记录失败。';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  // 其他 handle 函数 (filter, page, limit change) 保持不变
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };
  const handleSelectFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };
  const handleFormSubmit = (e) => {
    e.preventDefault();
    fetchIncomes();
  };
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };
  const handleLimitChange = (value) => {
    setFilters(prev => ({ ...prev, limit: parseInt(value), page: 1 }));
  };

  const handleDeleteClick = (id) => {
    setSelectedIncomeId(id);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDialogOpen(false);
    setMessage(null);
    try {
      // 5. 使用 apiClient 发起 DELETE 请求
      const response = await apiClient.delete(`/incomes/${selectedIncomeId}`);
      setMessage({ type: 'success', text: response.data.message || '收入记录删除成功！' });
      fetchIncomes(); // 重新获取列表
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || '删除收入记录失败。';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleExport = async () => {
    setMessage(null);
    const queryParams = buildQueryParams();

    try {
      // 6. 使用 apiClient 发起导出请求，并设置 responseType 为 'blob'
      const response = await apiClient.get('/incomes/export', {
        params: queryParams,
        responseType: 'blob', // 关键！告诉 axios 期望接收一个二进制 Blob
      });

      const contentDisposition = response.headers['content-disposition'];
      let filename = `incomes_export_${Date.now()}.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: '收入记录已成功导出！' });

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || '导出失败，请稍后再试。';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  // UI 部分 (JSX) 保持不变，它已经写得很好
  return (
    <MainLayout pageTitle="收入列表">
      {/* ... 所有 JSX 代码保持不变 ... */}
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
          <Button
            variant="secondary"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-md px-6 py-2"
            onClick={handleExport} // 调用新的 handleExport 函数
          >
            <FileSpreadsheet className="mr-2 h-5 w-5" />导出Excel
          </Button>
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
        {/* --- 核心修改点 START --- */}
        {/* 将 Dialog 的内容包裹在 DialogContent 内部，因为 DialogContentWrapper 才是真正条件渲染的元素 */}
        <DialogContent>
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
        </DialogContent>
        {/* --- 核心修改点 END --- */}
      </Dialog>
    </MainLayout>
  );
};

export default IncomeList;