import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../MainLayout.jsx'; // 确保 MainLayout.jsx 文件位于正确的位置
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming shadcn/ui Card components
import  Button  from '@/components/ui/button'; // Assuming shadcn/ui Button component
import  Label  from '@/components/ui/label'; // Assuming shadcn/ui Label component
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // Shadcn Dialog components
import { Eye, Calendar, Type, Cloud, Smile, MapPin, Users, Tag, ListTodo, Clipboard, Text, Image, Edit, Trash2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'; // Icons

// Helper function to format date for display
const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }); // Formats date like 2023/01/01
};

const DiaryView = ({ diaryId: propDiaryId }) => {
  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'error', text: string }

  // Dialog state for confirmation
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDiaryTitle, setSelectedDiaryTitle] = useState('');

  // Extract diaryId from URL if not provided as prop
  const currentDiaryId = propDiaryId || window.location.pathname.split('/').pop();

  const fetchDiary = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch(`/api/diaries/${currentDiaryId}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch diary details');
      }

      setDiary(data.diary); // Store the fetched diary data
    } catch (err) {
      console.error('Error fetching diary:', err);
      setMessage({ type: 'error', text: `加载日记详情失败: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [currentDiaryId]);

  useEffect(() => {
    if (currentDiaryId) {
      fetchDiary();
    } else {
      setMessage({ type: 'error', text: '未提供日记ID。' });
      setLoading(false);
    }
  }, [currentDiaryId, fetchDiary]);

  const handleDeleteClick = () => {
    if (diary) {
      setSelectedDiaryTitle(diary.title);
      setIsDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    setIsDialogOpen(false); // Close dialog immediately
    setMessage(null); // Clear previous messages

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/diaries/${currentDiaryId}`, {
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
      // Redirect to diary list after successful deletion
      setTimeout(() => {
        window.location.href = '/diary';
      }, 1500);
    } catch (err) {
      console.error('Error deleting diary:', err);
      setMessage({ type: 'error', text: err.message || '删除日记失败，请稍后再试。' });
    }
  };

  if (loading) {
    return (
      <MainLayout pageTitle="查看日记">
        <div className="container mx-auto p-4 text-center">加载中...</div>
      </MainLayout>
    );
  }

  if (message && message.type === 'error') {
    return (
      <MainLayout pageTitle="查看日记">
        <div className="container mx-auto p-4 text-center text-red-700 bg-red-100 rounded-md">
          {message.text}
        </div>
      </MainLayout>
    );
  }

  if (!diary) {
    return (
      <MainLayout pageTitle="查看日记">
        <div className="container mx-auto p-4 text-center text-gray-700">日记未找到。</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="查看日记">
      <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Card className="w-full max-w-3xl shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <Eye className="mr-2 h-7 w-7" />查看日记
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {message && message.type === 'success' && (
              <div className="p-3 rounded-md mb-4 text-sm flex items-center bg-green-100 text-green-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">{diary.title}</h2>
                {diary.isPublic && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    公开
                  </span>
                )}
              </div>

              <hr className="my-4 border-t-2 border-gray-200" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                <div className="flex flex-col">
                  <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                    <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />日期:
                  </Label>
                  <span className="text-gray-800 text-base">{formatDateForDisplay(diary.date)}</span>
                </div>
                {diary.weather && (
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                      <Cloud className="inline-block w-4 h-4 mr-1 text-gray-500" />天气:
                    </Label>
                    <span className="text-gray-800 text-base">{diary.weather}</span>
                  </div>
                )}
                {diary.mood && (
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                      <Smile className="inline-block w-4 h-4 mr-1 text-gray-500" />心情:
                    </Label>
                    <span className="text-gray-800 text-base">{diary.mood}</span>
                  </div>
                )}
                {diary.location && (
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                      <MapPin className="inline-block w-4 h-4 mr-1 text-gray-500" />地点:
                    </Label>
                    <span className="text-gray-800 text-base">{diary.location}</span>
                  </div>
                )}
                {diary.people && diary.people.length > 0 && (
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                      <Users className="inline-block w-4 h-4 mr-1 text-gray-500" />人物:
                    </Label>
                    <span className="text-gray-800 text-base">{Array.isArray(diary.people) ? diary.people.join(', ') : diary.people}</span>
                  </div>
                )}
                {diary.tags && diary.tags.length > 0 && (
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                      <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" />标签:
                    </Label>
                    <span className="text-gray-800 text-base">{Array.isArray(diary.tags) ? diary.tags.join(', ') : diary.tags}</span>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3 flex items-center">
                <ListTodo className="mr-2 h-5 w-5" />计划列表:
              </h3>
              {diary.planList && diary.planList.length > 0 ? (
                <ul className="list-disc list-inside text-gray-800 space-y-1">
                  {Array.isArray(diary.planList) ? diary.planList.map((plan, index) => (
                    <li key={index}>{plan}</li>
                  )) : diary.planList.split('\n').map((plan, index) => (
                    <li key={index}>{plan}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">无计划</p>
              )}

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3 flex items-center">
                <Clipboard className="mr-2 h-5 w-5" />事件列表:
              </h3>
              {diary.eventList && diary.eventList.length > 0 ? (
                <ul className="list-disc list-inside text-gray-800 space-y-1">
                  {Array.isArray(diary.eventList) ? diary.eventList.map((event, index) => (
                    <li key={index}>{event}</li>
                  )) : diary.eventList.split('\n').map((event, index) => (
                    <li key={index}>{event}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">无事件</p>
              )}

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3 flex items-center">
                <Text className="mr-2 h-5 w-5" />心情随笔:
              </h3>
              {diary.feeling ? (
                <p className="text-gray-800 whitespace-pre-wrap">{diary.feeling}</p>
              ) : (
                <p className="text-gray-500 text-sm">无心情随笔</p>
              )}

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3 flex items-center">
                <Text className="mr-2 h-5 w-5" />每日总结:
              </h3>
              {diary.summary ? (
                <p className="text-gray-800 whitespace-pre-wrap">{diary.summary}</p>
              ) : (
                <p className="text-gray-500 text-sm">无每日总结</p>
              )}

              {diary.imageUrls && diary.imageUrls.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3 flex items-center">
                    <Image className="mr-2 h-5 w-5" />相关图片:
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {diary.imageUrls.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`日记图片 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md shadow-sm"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/128x128/e0e0e0/555555?text=图片加载失败"; }} // Fallback image
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button onClick={() => window.location.href = `/diary/edit/${diary._id}`} className="flex-grow sm:flex-none bg-yellow-500 hover:bg-yellow-600 text-white rounded-md shadow-md py-2.5 text-base px-6">
                <Edit className="mr-2 h-5 w-5" />编辑日记
              </Button>
              <Button onClick={handleDeleteClick} className="flex-grow sm:flex-none bg-red-600 hover:bg-red-700 text-white rounded-md shadow-md py-2.5 text-base px-6">
                <Trash2 className="mr-2 h-5 w-5" />删除日记
              </Button>
              <Button onClick={() => window.location.href = '/diary'} variant="outline" className="flex-grow sm:flex-none text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2.5 text-base px-6">
                <ArrowLeft className="mr-2 h-5 w-5" />返回日记列表
              </Button>
            </div>
          </CardContent>
        </Card>

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

export default DiaryView;
