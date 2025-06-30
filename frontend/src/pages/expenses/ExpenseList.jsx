import React, { useState, useEffect, useCallback } from 'react';
// 1. 导入 apiClient，请根据您的项目结构调整路径
import apiClient from '../../api/apiClient';

// 导入UI组件
import MainLayout from '../MainLayout.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
// 2. 引入 Dialog 相关组件和更多图标
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Filter, Plus, FileSpreadsheet, BarChart2, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import  Label  from '@/components/ui/label';

// Helper function: 格式化日期 (保持不变)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function: 获取初始筛选条件 (保持不变)
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
  // 3. 新增 Dialog 状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);

  // --- 4. 数据获取逻辑重构 ---

  // 获取固定的筛选选项（所有大类），只在组件加载时执行一次
  const fetchFilterOptions = useCallback(async () => {
    try {
      const categoriesResponse = await apiClient.get('/expenses/categories');
      setDistinctCategories(categoriesResponse.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setMessage({ type: 'error', text: '加载分类选项失败。' });
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);


  // 根据当前筛选条件获取动态数据（支出列表和相关小类）
  const fetchDynamicData = useCallback(async () => {
    setLoading(true);
    // 保持旧消息直到新请求完成
    // setMessage(null); 

    // 准备支出列表的查询参数 (axios会自动处理)
    const expenseParams = { ...filters };

    // 准备小类列表的查询参数
    // 只有在选择了大类时才传递 category 参数，否则传递空对象
    const subcategoryParams = filters.category ? { category: filters.category } : {};

    try {
      // 并行请求支出列表和可能的小类列表
      const [expensesResponse, subcategoriesResponse] = await Promise.all([
        apiClient.get('/expenses', { params: expenseParams }),
        apiClient.get('/expenses/subcategories', { params: subcategoryParams }) // 这样调用是安全的
      ]);

      // 处理支出数据
      const expensesData = expensesResponse.data;
      setExpenses(expensesData.expenses.map(expense => ({
        ...expense,
        id: expense.id, // 确保使用 id
        dateFormatted: formatDateForInput(expense.date)
      })));
      setTotalExpenses(expensesData.totalCount);
      setTotalPages(expensesData.totalPages);

      // 处理小类数据
      setDistinctSubcategories(subcategoriesResponse.data);

      // 更新URL
      const newUrl = `${window.location.pathname}?${new URLSearchParams(expenseParams).toString()}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || '加载数据失败。';
      setMessage({ type: 'error', text: errorMessage });
      console.error("Fetch dynamic data error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDynamicData();
  }, [fetchDynamicData]);


  // --- 5. 事件处理函数重构 ---

  const handleDeleteClick = (id) => {
    setSelectedExpenseId(id);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedExpenseId) return;
    setIsDialogOpen(false);
    setMessage(null);
    try {
      const response = await apiClient.delete(`/expenses/${selectedExpenseId}`);
      setMessage({ type: 'success', text: response.data.message || '支出记录删除成功！' });
      fetchDynamicData(); // 删除成功后刷新列表
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || '删除支出记录失败。';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleExport = async () => {
    setMessage(null);
    const queryParams = { ...filters };
    delete queryParams.page; // 导出时通常不关心分页
    delete queryParams.limit;

    try {
      const response = await apiClient.get('/expenses/export', {
        params: queryParams,
        responseType: 'blob', // 告诉axios期望一个二进制文件
      });

      const contentDisposition = response.headers['content-disposition'];
      let filename = `expenses_export_${new Date().toISOString().split('T')[0]}.csv`;
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

  // 其他 handle 函数保持不变，但更新了依赖
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };
  const handleSelectChange = (name, value) => {
    setFilters(prev => {
      const newState = { ...prev, [name]: value, page: 1 };
      if (name === 'category') {
        newState.subcategory = '';
      }
      return newState;
    });
  };
  const handleLimitChange = (value) => {
    setFilters(prev => ({ ...prev, limit: parseInt(value), page: 1 }));
  };
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };
  const handleFormSubmit = (e) => {
    e.preventDefault();
    fetchDynamicData();
  };


  // --- 6. JSX 渲染部分 ---
  return (
    <MainLayout pageTitle="支出管理">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-4">
        {message && (
          <div className={`p-3 rounded-md mb-4 text-sm flex items-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
            {message.text}
          </div>
        )}

        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-white p-4 cursor-pointer" onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}>
            <CardTitle className="text-lg font-semibold text-gray-800 flex justify-between items-center">
              筛选条件 <Filter className="text-gray-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterCollapsed ? 'max-h-0 p-0' : 'max-h-[1000px] p-4 md:p-6'}`}>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                <div>
                  <Label htmlFor="startDate">开始日期</Label>
                  <Input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="rounded-md" />
                </div>
                <div>
                  <Label htmlFor="endDate">结束日期</Label>
                  <Input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="rounded-md" />
                </div>
                <div>
                  <Label htmlFor="category">大类</Label>
                  <Select value={filters.category} onValueChange={(value) => handleSelectChange('category', value)}>
                    <SelectTrigger><SelectValue placeholder="所有大类" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">所有大类</SelectItem>
                      {distinctCategories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subcategory">小类</Label>
                  <Select value={filters.subcategory} onValueChange={(value) => handleSelectChange('subcategory', value)}>
                    <SelectTrigger><SelectValue placeholder="所有小类" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">所有小类</SelectItem>
                      {distinctSubcategories.map(subcat => (<SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-full md:col-span-1 flex justify-end">
                  <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-md">
                    <Filter className="mr-2 h-4 w-4" /> 筛选
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-4 my-4 justify-center md:justify-start">
          <Button onClick={() => window.location.href = '/expenses/add'} className="bg-green-600 hover:bg-green-700 text-white"><Plus className="mr-2 h-5 w-5" />添加支出</Button>
          <Button onClick={handleExport} className="bg-gray-500 hover:bg-gray-600 text-white"><FileSpreadsheet className="mr-2 h-5 w-5" />导出Excel</Button>
          <Button onClick={() => window.location.href = '/expenses/statistics'} className="bg-blue-500 hover:bg-blue-600 text-white"><BarChart2 className="mr-2 h-5 w-5" />支出统计</Button>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">支出列表</h2>
        {loading ? (
          <p className="text-center text-gray-600 py-8">加载中...</p>
        ) : expenses.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow-md">
            <Table>
              <TableHeader className="bg-gray-800 text-white">
                <TableRow>
                  <TableHead>描述</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>大类</TableHead>
                  <TableHead>小类</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map(expense => (
                  <TableRow key={expense.id} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="text-red-600 font-semibold">¥{expense.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{expense.category}</span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">{expense.subcategory}</span>
                    </TableCell>
                    <TableCell>{expense.dateFormatted}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <Button size="sm" variant="outline" onClick={() => window.location.href = `/expenses/edit/${expense.id}`}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">暂无支出记录，请尝试调整筛选条件或添加新的记录。</p>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row justify-between items-center mt-6">
            <div className="flex items-center mb-4 md:mb-0">
              <Label htmlFor="limitBottom" className="mr-2">每页显示:</Label>
              <Select value={filters.limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
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
                <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(filters.page - 1); }} /></PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }} isActive={filters.page === i + 1}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(filters.page + 1); }} /></PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除这条支出记录吗？此操作将无法撤销。
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

export default ExpenseList;