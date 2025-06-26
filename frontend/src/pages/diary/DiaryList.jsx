import React, { useState, useEffect, useCallback } from 'react';
// 请确保 MainLayout.jsx 文件位于当前文件的上一级目录中。
// 例如: 如果 DiaryList.jsx 在 'src/pages/' 目录下, 那么 MainLayout.jsx 应该在 'src/' 目录下。
import MainLayout from '../MainLayout.jsx'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import  Button  from '@/components/ui/button';
import  Input  from '@/components/ui/input';
import  Label  from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Download, BarChart, Search, BookText, User, Tag, Calendar, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Cloud, Smile, MapPin, Eye } from 'lucide-react'; // Icons

// Helper function to format date for display
const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }); // Formats date like 2023/01/01
};

// Helper function to format datetime for display
const formatDateTimeForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN'); // Formats date and time like 2023/01/01 14:30:00
};

const DiaryList = () => {
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // Filter states (updated to match backend API params based on EJS)
  const [searchQuery, setSearchQuery] = useState(''); // EJS uses searchQuery for general keyword search
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10); // Default limit, EJS also implies a limit via pagination links

  // Dialog state for confirmation
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDiaryId, setSelectedDiaryId] = useState(null);
  const [selectedDiaryTitle, setSelectedDiaryTitle] = useState('');

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('limit', limit);
    if (searchQuery) params.append('searchQuery', searchQuery);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return params.toString();
  }, [currentPage, limit, searchQuery, startDate, endDate]);

  const fetchDiaries = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    const queryString = buildQueryString();

    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch(`/api/diaries?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch diaries');
      }

      // Backend returns `diaries` array, `currentPage`, `totalPages`, etc.
      setDiaries(data.diaries || []);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      // setLimit(data.limit); // Uncomment if API also returns limit and you want to sync it

      // Update URL without full page reload
      const newUrl = `${window.location.pathname}?${queryString}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

    } catch (err) {
      console.error('Error fetching diaries:', err);
      setMessage({ type: 'error', text: `加载日记失败: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]); // Dependencies for re-fetching based on generated query string

  useEffect(() => {
    // Attempt to load initial filters from URL on component mount
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get('searchQuery') || '');
    setStartDate(params.get('startDate') || '');
    setEndDate(params.get('endDate') || '');
    setCurrentPage(parseInt(params.get('page')) || 1);
    setLimit(parseInt(params.get('limit')) || 10);
  }, []); // Run only once on mount to set initial state from URL

  useEffect(() => {
    // This useEffect ensures fetchDiaries is called whenever filter or pagination states change
    fetchDiaries();
  }, [searchQuery, startDate, endDate, currentPage, limit, fetchDiaries]);


  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new filter
    // fetchDiaries will be called by useEffect due to state changes
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    setLimit(parseInt(newLimit));
    setCurrentPage(1); // Reset to first page when limit changes
  };

  const handleDeleteClick = (diaryId, diaryTitle) => {
    setSelectedDiaryId(diaryId);
    setSelectedDiaryTitle(diaryTitle);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDialogOpen(false); // Close dialog immediately
    setMessage(null); // Clear previous messages

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/diaries/${selectedDiaryId}`, {
        method: 'DELETE', // Use DELETE method
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '删除日记失败。');
      }

      setMessage({ type: 'success', text: data.message || `日记 "${selectedDiaryTitle}" 已成功删除。` });
      fetchDiaries(); // Re-fetch list after deletion
    } catch (err) {
      console.error('Error deleting diary:', err);
      setMessage({ type: 'error', text: err.message || '删除日记失败，请稍后再试。' });
    }
  };

  const exportQueryString = new URLSearchParams({
    searchQuery,
    startDate,
    endDate,
  }).toString();

  // Define tag colors as Tailwind classes for more variety
  const tagColors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-red-100 text-red-800',
    'bg-indigo-100 text-indigo-800',
    'bg-yellow-100 text-yellow-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-gray-100 text-gray-800',
  ];

  return (
    <MainLayout pageTitle="日记记录"> {/* Wrap with MainLayout */}
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6 justify-center md:justify-start">
          <Button onClick={() => window.location.href = '/diary/add'} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md w-full md:w-auto text-base px-6 py-2.5">
            <Plus className="mr-2 h-5 w-5" />新增日记
          </Button>
          <a href={`/api/diaries/export${exportQueryString ? '?' + exportQueryString : ''}`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" className="bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md w-full md:w-auto text-base px-6 py-2.5">
              <Download className="mr-2 h-5 w-5" />导出Excel
            </Button>
          </a>
          <Button onClick={() => window.location.href = '/diary/statistics'} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow-md w-full md:w-auto text-base px-6 py-2.5">
            <BarChart className="mr-2 h-5 w-5" />查看统计
          </Button>
        </div>

        {/* Messages */}
        {message && (
          <div className={`p-3 rounded-md mb-4 text-sm flex items-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
            {message.text}
          </div>
        )}

        {/* Filter Card */}
        <Card className="shadow-sm mb-6 rounded-xl overflow-hidden">
          <CardHeader className="bg-white border-b-0 pt-4 pb-0 rounded-t-xl">
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
              <Filter className="mr-2 text-blue-500" />筛选条件
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleFilterSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />开始日期
                  </Label>
                  <Input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />结束日期
                  </Label>
                  <Input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
                    <Search className="inline-block w-4 h-4 mr-1 text-gray-500" />关键词
                  </Label>
                  <Input
                    type="search"
                    id="searchQuery"
                    name="searchQuery"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索..."
                    className="w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="col-span-1 mt-3 md:mt-0">
                  <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-md shadow-md py-2.5 text-base">
                    <Search className="mr-2 h-5 w-5" />筛选
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <hr className="my-8 border-t-2 border-gray-200" />

        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center md:text-left">日记记录</h2>

        {loading ? (
          <div className="text-center py-8">加载日记中...</div>
        ) : diaries.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <Table className="min-w-full divide-y divide-gray-200 responsive-table-cards"> {/* Added responsive class */}
              <TableHeader className="bg-gray-50 hidden md:table-header-group"> {/* Hide on small, show on md+ */}
                <TableRow>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地点</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标签</TableHead>
                  <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {diaries.map((diaryItem) => (
                  <TableRow key={diaryItem._id} className="block md:table-row mb-4 md:mb-0 border border-gray-200 rounded-lg md:border-none">
                    <TableCell data-label="日期:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left font-medium border-b md:border-b-0">
                      <span className="md:hidden float-left font-bold text-gray-700">日期:</span>
                      {formatDateForDisplay(diaryItem.date)}
                    </TableCell>
                    <TableCell data-label="标题:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left border-b md:border-b-0">
                      <span className="md:hidden float-left font-bold text-gray-700">标题:</span>
                      <a href={`/diary/view/${diaryItem._id}`} className="text-blue-600 hover:underline">
                        {diaryItem.title}
                      </a>
                    </TableCell>
                    <TableCell data-label="地点:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left border-b md:border-b-0">
                      <span className="md:hidden float-left font-bold text-gray-700">地点:</span>
                      {diaryItem.location || 'N/A'}
                    </TableCell>
                    <TableCell data-label="标签:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left border-b md:border-b-0">
                      <span className="md:hidden float-left font-bold text-gray-700">标签:</span>
                      <div className="flex flex-wrap justify-end md:justify-start gap-1">
                        {diaryItem.tags && diaryItem.tags.length > 0 ? (
                          diaryItem.tags.map((tag, index) => (
                            <span key={index} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tagColors[index % tagColors.length]}`}>
                              <Tag className="w-3 h-3 mr-1" />{tag}
                            </span>
                          ))
                        ) : (
                          <span>无</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell data-label="操作:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-center actions-cell">
                      <span className="md:hidden float-left font-bold text-gray-700">操作:</span>
                      <div className="flex flex-wrap justify-center md:flex-nowrap md:justify-center gap-2">
                        <Button
                          onClick={() => window.location.href = `/diary/view/${diaryItem._id}`}
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-3 py-1.5 text-sm flex-grow md:flex-none"
                        >
                          <Eye className="w-4 h-4 mr-1" />查看
                        </Button>
                        <Button
                          onClick={() => window.location.href = `/diary/edit/${diaryItem._id}`}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-md px-3 py-1.5 text-sm flex-grow md:flex-none"
                        >
                          <Edit className="w-4 h-4 mr-1" />编辑
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(diaryItem._id, diaryItem.title)}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-md px-3 py-1.5 text-sm flex-grow md:flex-none"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-5">没有找到日记。</p>
        )}

        {/* Pagination and Limit */}
        {totalPages > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center mt-4 mb-4">
            <div className="form-group flex items-center mb-3 md:mb-0">
              <Label htmlFor="limitBottom" className="form-label mb-0 mr-2 text-nowrap">每页显示:</Label>
              <select
                id="limitBottom"
                name="limit"
                value={limit}
                onChange={(e) => handleLimitChange(e.target.value)}
                className="form-control form-control-sm w-auto rounded-md border-gray-300 shadow-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <nav aria-label="Page navigation" className="mb-0">
              <ul className="flex justify-center items-center -space-x-px h-10 text-base">
                <li>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-l-md"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <span className="sr-only">上一页</span>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                  <li key={pageNumber}>
                    <Button
                      variant={currentPage === pageNumber ? 'default' : 'outline'}
                      size="icon"
                      className={`h-10 w-10 ${currentPage === pageNumber ? 'bg-blue-600 text-white' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  </li>
                ))}
                <li>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-r-md"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <span className="sr-only">下一页</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </li>
              </ul>
            </nav>
            <span className="ms-md-3 mt-3 mt-md-0 text-nowrap text-muted text-sm text-gray-500">总共 {diaries.length} 条记录 (当前页显示)</span> {/* Adjust if API returns total records */}
          </div>
        )}

        {/* Confirmation Dialog for Delete */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>删除日记</DialogTitle>
              <DialogDescription>
                确定要删除日记 "{selectedDiaryTitle}" 吗？此操作不可逆。
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
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default DiaryList;
