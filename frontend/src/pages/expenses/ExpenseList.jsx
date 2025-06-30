// src/pages/expenses/ExpenseList.jsx

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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // 引入 Dialog
import { Filter, Plus, FileSpreadsheet, BarChart2, Edit, Trash2, Search, CheckCircle, XCircle } from 'lucide-react'; // 引入图标

// Helper functions (保持不变)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [filters, setFilters] = useState(getInitialFilters());
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [distinctCategories, setDistinctCategories] = useState([]);
  const [distinctSubcategories, setDistinctSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  // 新增 Dialog 状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);

  // 2. buildQueryParams 返回一个JS对象
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

  // 3. 重构 fetchExpensesAndFilters
  const fetchExpensesAndFilters = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const queryParams = buildQueryParams();
    
    try {
      // 使用 Promise.all 并行发起所有请求，提高效率
      const [
        expensesResponse,
        categoriesResponse,
        subcategoriesResponse
      ] = await Promise.all([
        apiClient.get('/expenses', { params: queryParams }),
        apiClient.get('/expenses/categories'),
        apiClient.get('/expenses/subcategories', { params: { category: filters.category || '' } })
      ]);

      const expensesData = expensesResponse.data;
      setExpenses(expensesData.expenses.map(expense => ({
        ...expense,
        id: expense.id, // 确保使用 id
        dateFormatted: formatDateForInput(expense.date)
      })));
      setTotalExpenses(expensesData.totalCount);
      setTotalPages(expensesData.totalPages);

      setDistinctCategories(categoriesResponse.data);
      setDistinctSubcategories(subcategoriesResponse.data);

      const newUrl = `${window.location.pathname}?${new URLSearchParams(queryParams).toString()}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

    } catch (err) {
      // 4. 统一的错误处理
      const errorMessage = err.response?.data?.message || err.message || '加载数据失败。';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, filters.category]); // 依赖项现在更清晰

  useEffect(() => {
    fetchExpensesAndFilters();
  }, [fetchExpensesAndFilters]);

  // 5. 重构 handleDelete
  const handleDeleteClick = (id) => {
    setSelectedExpenseId(id);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDialogOpen(false);
    setMessage(null);
    try {
      const response = await apiClient.delete(`/expenses/${selectedExpenseId}`);
      setMessage({ type: 'success', text: response.data.message || '支出记录删除成功！' });
      fetchExpensesAndFilters(); // 刷新列表
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || '删除支出记录失败。';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  // 6. 重构 handleExport
  const handleExport = async () => {
    setMessage(null);
    const queryParams = buildQueryParams();
    try {
      const response = await apiClient.get('/expenses/export', {
        params: queryParams,
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'];
      let filename = `expenses_export_${Date.now()}.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length > 1) filename = filenameMatch[1];
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: '支出记录已成功导出！' });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || '导出失败，请稍后再试。';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  // 其他 handle 函数保持不变
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };
  const handleSelectChange = (name, value) => {
    setFilters(prev => {
      const newState = { ...prev, [name]: value, page: 1 };
      if (name === 'category') newState.subcategory = '';
      return newState;
    });
  };
  const handleLimitChange = (value) => {
    setFilters(prev => ({ ...prev, limit: parseInt(value), page: 1 }));
  };
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };
  const handleFormSubmit = (e) => {
    e.preventDefault();
    fetchExpensesAndFilters();
  };

  // UI 部分 (JSX) 保持不变，但修正了导出和删除按钮的逻辑
  return (
    <MainLayout pageTitle="支出列表">
      {/* ... */}
      {/* ... 这里的所有 JSX 代码保持不变 ... */}
      {/* ... 只修改下面两个按钮的 onClick 事件 ... */}

      {/* 操作按钮 - 修正 */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center md:justify-start">
        <Button onClick={() => window.location.href = '/expenses/add'} className="bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md px-6 py-2">
          <Plus className="mr-2 h-5 w-5" />添加支出
        </Button>
        <Button onClick={handleExport} className="bg-gray-500 hover:bg-gray-600 text-white rounded-md shadow-md px-6 py-2">
          <FileSpreadsheet className="mr-2 h-5 w-5" />导出Excel
        </Button>
        <Button onClick={() => window.location.href = '/expenses/statistics'} className="bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-md px-6 py-2">
          <BarChart2 className="mr-2 h-5 w-5" />支出统计
        </Button>
      </div>
      
      {/* 表格 - 修正 */}
      {/* ... 表格代码 ... */}
      {/* 将 handleDelete 的 onClick 修改 */}
      <Button
          size="sm"
          className="bg-red-500 hover:bg-red-600 text-white rounded-md shadow-sm"
          onClick={() => handleDeleteClick(expense.id)} // 注意：使用 id 而不是 _id
      >
          <Trash2 className="h-4 w-4" />
      </Button>
      {/* ... */}

      {/* 删除确认对话框 - 新增 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除支出记录</DialogTitle>
            <DialogDescription>
              确定要删除这条支出记录吗？此操作不可逆。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={confirmDelete}>确定删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};
// 确保将完整的 JSX 粘贴回 return 语句中
export default ExpenseList;