import React, { useState, useEffect, useCallback } from 'react';
// IMPORTANT: Please ensure the path to MainLayout.jsx is correct relative to this file.
// For example: If BookNoteEdit.jsx is in 'src/pages/', and MainLayout.jsx is in 'src/',
// then '../MainLayout.jsx' is correct. If your project uses path aliases (e.g., @/),
// you might need to adjust this path based on your project's configuration.
import MainLayout from '../MainLayout.jsx'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import  Button  from '@/components/ui/button';
import  Input  from '@/components/ui/input';
import  Label  from '@/components/ui/label';
import  Textarea  from '@/components/ui/textarea'; // Assuming shadcn/ui Textarea component
import { BookText, User, Calendar, Tag, Star, Save, ArrowLeft, CheckCircle, XCircle, PencilLine } from 'lucide-react'; // Icons

// Helper function to format date for input type="date"
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const BookNoteEdit = ({ bookNoteId: propBookNoteId }) => {
  const [bookNote, setBookNote] = useState(null); // To store the original fetched data
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publishYear, setPublishYear] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [readDate, setReadDate] = useState('');
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true); // For initial data fetch
  const [saving, setSaving] = useState(false); // For form submission
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // Extract bookNoteId from URL if not provided as prop (e.g., direct access)
  const currentBookNoteId = propBookNoteId || window.location.pathname.split('/').pop();

  const fetchBookNote = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch(`/api/booknotes/${currentBookNoteId}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch book note details');
      }

      setBookNote(data.bookNote); // Store original data
      setTitle(data.bookNote.title);
      setAuthor(data.bookNote.author || '');
      setPublishYear(data.bookNote.publishYear || '');
      setCategory(data.bookNote.category || '');
      setTags(data.bookNote.tags ? data.bookNote.tags.join(', ') : ''); // Join array to string for input
      setReadDate(formatDateForInput(data.bookNote.readDate));
      setRating(data.bookNote.rating || '');
      setNotes(data.bookNote.notes || '');

    } catch (err) {
      console.error('Error fetching book note:', err);
      setMessage({ type: 'error', text: `加载读书笔记数据失败: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [currentBookNoteId]);

  useEffect(() => {
    if (currentBookNoteId) {
      fetchBookNote();
    } else {
      setMessage({ type: 'error', text: '未提供读书笔记ID。' });
      setLoading(false);
    }
  }, [currentBookNoteId, fetchBookNote]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null); // Clear previous messages

    // Basic frontend validation
    if (!title) {
      setMessage({ type: 'error', text: '书名是必填项。' });
      setSaving(false);
      return;
    }
    if (rating && (rating < 1 || rating > 5)) {
      setMessage({ type: 'error', text: '评分必须是1到5之间的整数。' });
      setSaving(false);
      return;
    }
    if (publishYear && (publishYear < 1000 || publishYear > new Date().getFullYear())) {
        setMessage({ type: 'error', text: `出版年份必须在1000到${new Date().getFullYear()}之间。` });
        setSaving(false);
        return;
    }

    const updatedBookNoteData = {
      title,
      author,
      publishYear: publishYear ? parseInt(publishYear) : undefined,
      category,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''), // Split by comma, trim, filter empty
      readDate: readDate ? new Date(readDate).toISOString() : undefined,
      rating: rating ? parseInt(rating) : undefined,
      notes,
    };

    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch(`/api/booknotes/${currentBookNoteId}`, {
        method: 'PUT', // Use PUT for update
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        },
        body: JSON.stringify(updatedBookNoteData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更新读书笔记失败。');
      }

      setMessage({ type: 'success', text: data.message || '读书笔记更新成功！' });
      // Optionally redirect after a short delay
      setTimeout(() => {
        window.location.href = '/booknotes'; // Redirect to booknotes list
      }, 1500);

    } catch (err) {
      console.error('Update book note error:', err);
      setMessage({ type: 'error', text: err.message || '更新读书笔记失败，请稍后再试。' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout pageTitle="编辑读书笔记">
        <div className="container mx-auto p-4 text-center">加载中...</div>
      </MainLayout>
    );
  }

  if (!bookNote) {
    return (
      <MainLayout pageTitle="编辑读书笔记">
        <div className="container mx-auto p-4 text-center text-red-500">读书笔记未找到或无权访问。</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="编辑读书笔记"> {/* Wrap with MainLayout */}
      <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Card className="w-full max-w-3xl shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <PencilLine className="mr-2 h-7 w-7" />编辑读书笔记
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {message && (
              <div className={`p-3 rounded-md mb-4 text-sm flex items-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="col-span-1">
                <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  <BookText className="inline-block w-4 h-4 mr-1 text-gray-500" />书名 <span className="text-red-500">*</span>:
                </Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="请输入书名"
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline-block w-4 h-4 mr-1 text-gray-500" />作者:
                </Label>
                <Input
                  type="text"
                  id="author"
                  name="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="请输入作者"
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="publishYear" className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />出版年份:
                </Label>
                <Input
                  type="number"
                  id="publishYear"
                  name="publishYear"
                  value={publishYear}
                  onChange={(e) => setPublishYear(e.target.value)}
                  min="1000"
                  max={new Date().getFullYear()}
                  placeholder={`例如: ${new Date().getFullYear()}`}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  <BookText className="inline-block w-4 h-4 mr-1 text-gray-500" />类别:
                </Label>
                <Input
                  type="text"
                  id="category"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="例如: 科幻, 历史, 技术"
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" />标签 (用逗号分隔):
                </Label>
                <Input
                  type="text"
                  id="tags"
                  name="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="例如: 小说, 编程, 人工智能"
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="readDate" className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />阅读日期:
                </Label>
                <Input
                  type="date"
                  id="readDate"
                  name="readDate"
                  value={readDate}
                  onChange={(e) => setReadDate(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div className="col-span-full">
                <Label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                  <Star className="inline-block w-4 h-4 mr-1 text-gray-500" />评分 (1-5星):
                </Label>
                <Input
                  type="number"
                  id="rating"
                  name="rating"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  min="1"
                  max="5"
                  placeholder="请输入1-5的整数"
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div className="col-span-full">
                <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  <BookText className="inline-block w-4 h-4 mr-1 text-gray-500" />笔记内容:
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="10"
                  placeholder="在此处填写您的读书笔记..."
                  className="min-h-[150px] rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                ></Textarea>
              </div>

              <hr className="col-span-full my-6 border-t-2 border-gray-200" />

              <div className="col-span-full flex flex-col sm:flex-row justify-end gap-3">
                <Button type="submit" className="flex-grow sm:flex-none bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md py-2.5 text-base" disabled={saving}>
                  <Save className="mr-2 h-5 w-5" />{saving ? '保存中...' : '更新笔记'}
                </Button>
                <Button type="button" onClick={() => window.location.href = '/booknotes'} variant="outline" className="flex-grow sm:flex-none text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2.5 text-base">
                  <ArrowLeft className="mr-2 h-5 w-5" />取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default BookNoteEdit;
