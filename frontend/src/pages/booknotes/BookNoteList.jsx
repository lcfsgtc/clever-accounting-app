import React, { useState, useEffect, useCallback } from 'react';
// IMPORTANT: Please ensure the path to MainLayout.jsx is correct relative to this file.
// For example: If BookNoteList.jsx is in 'src/pages/', and MainLayout.jsx is in 'src/',
// then '../MainLayout.jsx' is correct. If your project uses path aliases (e.g., @/),
// you might need to adjust this path based on your project's configuration.
import MainLayout from '../MainLayout.jsx'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import  Button  from '@/components/ui/button';
import  Input  from '@/components/ui/input';
import  Label  from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Download, BarChart, Search, BookText, User, Tag, Star, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Filter } from 'lucide-react'; // Icons

// Helper function to format date for display
const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN'); // Formats date like 2023/01/01
};

// Helper function to format datetime for display
const formatDateTimeForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN'); // Formats date and time like 2023/01/01 14:30:00
};

const BookNoteList = () => {
  const [bookNotes, setBookNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // Filter states
  const [searchTitle, setSearchTitle] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [minRating, setMinRating] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10); // Default limit

  // Dialog state for confirmation
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBookNoteId, setSelectedBookNoteId] = useState(null);
  const [selectedBookNoteTitle, setSelectedBookNoteTitle] = useState('');

  const fetchBookNotes = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    const queryParams = new URLSearchParams({
      page: currentPage,
      limit: limit,
      searchTitle,
      searchAuthor,
      searchCategory,
      minRating,
    }).toString();

    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch(`/api/booknotes?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch book notes');
      }

      setBookNotes(data.bookNotes || []);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      // setLimit(data.limit); // Uncomment if API returns limit and you want to sync it

    } catch (err) {
      console.error('Error fetching book notes:', err);
      setMessage({ type: 'error', text: `加载读书笔记失败: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, searchTitle, searchAuthor, searchCategory, minRating]); // Dependencies for re-fetching

  useEffect(() => {
    fetchBookNotes();
  }, [fetchBookNotes]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new filter
    // fetchBookNotes will be called by useEffect due to state changes
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDeleteClick = (bookNoteId, bookNoteTitle) => {
    setSelectedBookNoteId(bookNoteId);
    setSelectedBookNoteTitle(bookNoteTitle);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDialogOpen(false); // Close dialog immediately
    setMessage(null); // Clear previous messages

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/booknotes/${selectedBookNoteId}`, {
        method: 'DELETE', // Use DELETE method
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '删除读书笔记失败。');
      }

      setMessage({ type: 'success', text: data.message || `读书笔记 "${selectedBookNoteTitle}" 已成功删除。` });
      fetchBookNotes(); // Re-fetch list after deletion
    } catch (err) {
      console.error('Error deleting book note:', err);
      setMessage({ type: 'error', text: err.message || '删除读书笔记失败，请稍后再试。' });
    }
  };

  // Generate stars based on rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < rating; i++) {
      stars.push(<Star key={`filled-${i}`} className="w-4 h-4 text-yellow-500 inline-block" fill="currentColor" />);
    }
    for (let i = rating; i < 5; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-400 inline-block" />);
    }
    return stars;
  };

  const exportQueryString = new URLSearchParams({
    searchTitle,
    searchAuthor,
    searchCategory,
    minRating,
  }).toString();

  return (
    <MainLayout pageTitle="读书笔记"> {/* Wrap with MainLayout */}
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6 justify-center md:justify-start">
          <Button onClick={() => window.location.href = '/booknotes/add'} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md w-full md:w-auto text-base px-6 py-2.5">
            <Plus className="mr-2 h-5 w-5" />新增读书笔记
          </Button>
          <a href={`/api/booknotes/export${exportQueryString ? '?' + exportQueryString : ''}`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" className="bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md w-full md:w-auto text-base px-6 py-2.5">
              <Download className="mr-2 h-5 w-5" />导出Excel
            </Button>
          </a>
          <Button onClick={() => window.location.href = '/booknotes/statistics'} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow-md w-full md:w-auto text-base px-6 py-2.5">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="col-span-1">
                  <Label htmlFor="searchTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    <BookText className="inline-block w-4 h-4 mr-1 text-gray-500" />书名/笔记
                  </Label>
                  <Input
                    type="text"
                    id="searchTitle"
                    name="searchTitle"
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    placeholder="输入书名或笔记关键词"
                    className="w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="searchAuthor" className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="inline-block w-4 h-4 mr-1 text-gray-500" />作者
                  </Label>
                  <Input
                    type="text"
                    id="searchAuthor"
                    name="searchAuthor"
                    value={searchAuthor}
                    onChange={(e) => setSearchAuthor(e.target.value)}
                    placeholder="输入作者"
                    className="w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="searchCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" />分类
                  </Label>
                  <Input
                    type="text"
                    id="searchCategory"
                    name="searchCategory"
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    placeholder="输入分类"
                    className="w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="minRating" className="block text-sm font-medium text-gray-700 mb-1">
                    <Star className="inline-block w-4 h-4 mr-1 text-gray-500" />最低评分
                  </Label>
                  <Input
                    type="number"
                    id="minRating"
                    name="minRating"
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    min="1"
                    max="5"
                    placeholder="1-5"
                    className="w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="col-span-1 mt-3 md:mt-0">
                  <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-md shadow-md py-2.5 text-base">
                    <Search className="mr-2 h-5 w-5" />搜索
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">加载读书笔记中...</div>
        ) : bookNotes.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <Table className="min-w-full divide-y divide-gray-200 responsive-table-cards">
              <TableHeader className="bg-gray-50 hidden md:table-header-group"> {/* Hide on small, show on md+ */}
                <TableRow>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">书名</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作者</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">阅读日期</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">评分</TableHead>
                  <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {bookNotes.map((note) => (
                  <React.Fragment key={note._id}>
                    <TableRow className="block md:table-row mb-4 md:mb-0 border border-gray-200 rounded-lg md:border-none">
                      <TableCell data-label="书名:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left font-medium border-b md:border-b-0">
                        <span className="md:hidden float-left font-bold text-gray-700">书名:</span>
                        {note.title}
                      </TableCell>
                      <TableCell data-label="作者:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left border-b md:border-b-0">
                        <span className="md:hidden float-left font-bold text-gray-700">作者:</span>
                        {note.author}
                      </TableCell>
                      <TableCell data-label="分类:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left border-b md:border-b-0">
                        <span className="md:hidden float-left font-bold text-gray-700">分类:</span>
                        {note.category}
                      </TableCell>
                      <TableCell data-label="阅读日期:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left border-b md:border-b-0">
                        <span className="md:hidden float-left font-bold text-gray-700">阅读日期:</span>
                        {formatDateForDisplay(note.readDate)}
                      </TableCell>
                      <TableCell data-label="评分:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left border-b md:border-b-0">
                        <span className="md:hidden float-left font-bold text-gray-700">评分:</span>
                        <div className="flex justify-end md:justify-start">
                          {renderStars(note.rating)}
                        </div>
                      </TableCell>
                      <TableCell data-label="操作:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-center actions-cell">
                        <span className="md:hidden float-left font-bold text-gray-700">操作:</span>
                        <div className="flex flex-wrap justify-center md:flex-nowrap md:justify-center gap-2">
                          <Button
                            onClick={() => window.location.href = `/booknotes/edit/${note._id}`}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-md px-3 py-1.5 text-sm flex-grow md:flex-none"
                          >
                            <Edit className="w-4 h-4 mr-1" />编辑
                          </Button>
                          <Button
                            onClick={() => handleDeleteClick(note._id, note.title)}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-md px-3 py-1.5 text-sm flex-grow md:flex-none"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Notes and Tags Row for mobile and desktop */}
                    <TableRow className="bg-gray-50 block md:table-row mb-4 md:mb-0 border border-gray-200 rounded-lg md:border-none">
                      <TableCell colSpan="6" className="px-4 py-3 md:px-6 md:py-4 text-sm text-gray-700 block md:table-cell">
                        <div className="flex flex-col">
                          <strong className="text-gray-800">笔记:</strong>
                          <span dangerouslySetInnerHTML={{ __html: note.notes.replace(/\n/g, '<br>') }}></span>
                          {note.tags && note.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {note.tags.map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                                  <Tag className="w-3 h-3 mr-1" />{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <small className="text-gray-500 mt-2">创建于: {formatDateTimeForDisplay(note.createdAt)}</small>
                          {note.updatedAt && note.updatedAt > note.createdAt && (
                            <small className="text-gray-500">更新于: {formatDateTimeForDisplay(note.updatedAt)}</small>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-5">没有找到读书笔记。</p>
        )}

        {/* Pagination */}
        {totalPages > 0 && (
          <nav aria-label="Page navigation" className="mt-4">
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
        )}

        {/* Confirmation Dialog for Delete */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>删除读书笔记</DialogTitle>
              <DialogDescription>
                确定要删除读书笔记 "{selectedBookNoteTitle}" 吗？此操作不可逆。
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

export default BookNoteList;
