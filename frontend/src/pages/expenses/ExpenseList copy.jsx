import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../MainLayout.jsx'; // 修正了导入路径：MainLayout.jsx 位于上一级目录
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // 假设 shadcn/ui table components
import  Button  from '@/components/ui/button'; // 假设 shadcn/ui button component
import  Input  from '@/components/ui/input'; // 假设 shadcn/ui input component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // 假设 shadcn/ui select component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // 假设 shadcn/ui card component
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination'; // 假设 shadcn/ui pagination components
import { Filter, Plus, FileSpreadsheet, BarChart2, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'; // 使用 lucide-react 作为图标库

// 辅助函数：格式化日期为YYYY-MM-DD 格式，用于 input[type="date"]
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 辅助函数：从 URL 查询参数解析初始筛选器状态
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
  const [message, setMessage] = useState(null); // 用于显示成功/错误消息
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true); // 筛选器卡片折叠状态

  // 使用 useCallback 优化，构建查询字符串
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.category) params.append('category', filters.category);
    if (filters.subcategory) params.append('subcategory', filters.subcategory);
    params.append('page', filters.page);
    params.append('limit', filters.limit);
    return params.toString();
  }, [filters]);

  // 使用 useCallback 优化，用于从 API 获取支出记录和筛选选项
  const fetchExpensesAndFilters = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const queryString = buildQueryString();
    try {
      // 获取支出记录
      const expensesResponse = await fetch(`/api/expenses?${queryString}`);
      const expensesData = await expensesResponse.json();

      if (!expensesResponse.ok) {
        throw new Error(expensesData.message || '获取支出数据失败');
      }

      setExpenses(expensesData.expenses.map(expense => ({
          ...expense,
          dateFormatted: formatDateForInput(expense.date) // 格式化日期以便显示
      })));
      setTotalExpenses(expensesData.totalCount);
      setTotalPages(expensesData.totalPages);

      // 获取所有不重复的大类
      const categoriesResponse = await fetch('/api/expenses/categories');
      const categoriesData = await categoriesResponse.json();
      if (!categoriesResponse.ok) {
        throw new Error(categoriesData.message || '获取大类失败');
      }
      setDistinctCategories(categoriesData);

      // 获取所有不重复的小类（可选：根据选择的大类过滤）
      const subcategoriesResponse = await fetch(`/api/expenses/subcategories?category=${filters.category || ''}`);
      const subcategoriesData = await subcategoriesResponse.json();
      if (!subcategoriesResponse.ok) {
        throw new Error(subcategoriesData.message || '获取小类失败');
      }
      setDistinctSubcategories(subcategoriesData);

      // 更新 URL 而不触发完整页面重载
      const newUrl = `${window.location.pathname}?${queryString}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

    } catch (err) {
      console.error('获取数据时出错:', err);
      setMessage({ type: 'error', text: `加载支出记录失败: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [buildQueryString, filters.category]); // filters.category 作为依赖项，用于小类的获取

  useEffect(() => {
    fetchExpensesAndFilters();
  }, [fetchExpensesAndFilters]); // 当 fetchExpensesAndFilters 变化时（即 filters 变化时）重新获取数据

  // 处理筛选器输入框变化
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 })); // 筛选条件改变时重置为第一页
  };

  // 处理 Select 组件的变化
  const handleSelectChange = (name, value) => {
    setFilters(prev => {
      const newState = { ...prev, [name]: value, page: 1 };
      // 如果大类改变，重置小类筛选器，因为小类依赖于大类
      if (name === 'category') {
        newState.subcategory = '';
      }
      return newState;
    });
  };

  // 处理每页显示数量变化
  const handleLimitChange = (value) => {
    setFilters(prev => ({ ...prev, limit: parseInt(value), page: 1 })); // 数量改变时重置为第一页
  };

  // 处理分页页码变化
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // 处理筛选表单提交
  const handleFormSubmit = (e) => {
    e.preventDefault();
    fetchExpensesAndFilters(); // 明确触发数据获取
  };

  // 处理删除操作
  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这条支出记录吗？')) {
      try {
        const response = await fetch(`/api/expenses/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || '删除支出记录失败。');
        }

        setMessage({ type: 'success', text: '支出记录删除成功！' });
        fetchExpensesAndFilters(); // 删除成功后刷新列表
      } catch (err) {
        console.error('删除支出时出错:', err);
        setMessage({ type: 'error', text: `删除支出记录失败: ${err.message}` });
      }
    }
  };

  return (
    <MainLayout pageTitle="支出列表"> {/* 使用 MainLayout 包装组件 */}
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-4">
        {/* 消息提示 */}
        {message && (
          <div className={`p-3 rounded-md mb-4 ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.text}
          </div>
        )}

        {/* 筛选器卡片 */}
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-white p-4 cursor-pointer" onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}>
            <CardTitle className="text-lg font-semibold text-gray-800 flex justify-between items-center">
              筛选条件 <Filter className="text-gray-500 transition-transform duration-200" style={{ transform: isFilterCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }} />
            </CardTitle>
          </CardHeader>
          <CardContent className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterCollapsed ? 'max-h-0 p-0' : 'max-h-[1000px] p-4 md:p-6'}`}>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
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
                  <Select value={filters.category} onValueChange={(value) => handleSelectChange('category', value)}>
                    <SelectTrigger className="w-full rounded-md">
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
                  <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">小类</label>
                  <Select value={filters.subcategory} onValueChange={(value) => handleSelectChange('subcategory', value)}>
                    <SelectTrigger className="w-full rounded-md">
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
                <div className="col-span-full md:col-span-1 flex justify-end">
                  <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-md shadow-md">
                    <Filter className="mr-2 h-4 w-4" /> 筛选
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-4 mb-6 justify-center md:justify-start">
          <Button onClick={() => window.location.href = '/expenses/add'} className="bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md px-6 py-2">
            <Plus className="mr-2 h-5 w-5" />添加支出
          </Button>
          <Button onClick={() => window.location.href = `/api/expenses/export?${buildQueryString()}`} className="bg-gray-500 hover:bg-gray-600 text-white rounded-md shadow-md px-6 py-2">
            <FileSpreadsheet className="mr-2 h-5 w-5" />导出Excel
          </Button>
          <Button onClick={() => window.location.href = '/expenses/statistics'} className="bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-md px-6 py-2">
            <BarChart2 className="mr-2 h-5 w-5" />支出统计
          </Button>
        </div>

        {/* 支出记录表格 */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">支出记录</h2>
        {loading ? (
          <p className="text-center text-gray-600">加载中...</p>
        ) : expenses.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <Table className="min-w-full">
              <TableHeader className="bg-gray-800 text-white hidden md:table-header-group"> {/* 移动端隐藏表头 */}
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
                {expenses.map(expense => (
                  <TableRow key={expense._id} className="odd:bg-gray-50 hover:bg-gray-100 transition-colors duration-150 block md:table-row mb-4 md:mb-0 rounded-lg border md:border-none shadow-sm md:shadow-none p-4 md:p-0">
                    {/* 移动端：将单元格显示为块级元素并添加 data-label */}
                    <TableCell data-label="描述:" className="py-2 px-4 whitespace-nowrap text-gray-800 flex justify-between items-center md:table-cell md:block md:text-left md:border-b md:border-gray-200">
                      <span className="font-bold md:hidden">描述:</span>
                      <span>{expense.description}</span>
                    </TableCell>
                    <TableCell data-label="金额:" className="py-2 px-4 whitespace-nowrap text-red-600 font-bold flex justify-between items-center md:table-cell md:block md:text-left md:border-b md:border-gray-200">
                      <span className="font-bold md:hidden">金额:</span>
                      <span>¥{expense.amount.toFixed(2)}</span>
                    </TableCell>
                    <TableCell data-label="大类:" className="py-2 px-4 whitespace-nowrap flex justify-between items-center md:table-cell md:block md:text-left md:border-b md:border-gray-200">
                      <span className="font-bold md:hidden">大类:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell data-label="小类:" className="py-2 px-4 whitespace-nowrap flex justify-between items-center md:table-cell md:block md:text-left md:border-b md:border-gray-200">
                      <span className="font-bold md:hidden">小类:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {expense.subcategory}
                      </span>
                    </TableCell>
                    <TableCell data-label="日期:" className="py-2 px-4 whitespace-nowrap text-gray-700 flex justify-between items-center md:table-cell md:block md:text-left md:border-b md:border-gray-200">
                      <span className="font-bold md:hidden">日期:</span>
                      <span>{expense.dateFormatted}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center flex justify-center items-center md:table-cell md:block">
                      <div className="flex justify-center items-center space-x-2">
                        <Button
                          size="sm"
                          className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-md shadow-sm"
                          onClick={() => window.location.href = `/expenses/edit/${expense._id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white rounded-md shadow-sm"
                          onClick={() => handleDelete(expense._id)}
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
          <p className="text-center text-gray-500 py-8">暂无支出记录。</p>
        )}

        {/* 分页组件 */}
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
    </MainLayout>
  );
};

export default ExpenseList;
