import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../MainLayout.jsx'; // 确保 MainLayout.jsx 文件位于正确的位置
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import  Button  from '@/components/ui/button';
import  Input  from '@/components/ui/input';
import  Label  from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import  Textarea  from '@/components/ui/textarea';
import { PencilLine, Calendar, Type, Cloud, Smile, MapPin, Users, Tag, ListTodo, Clipboard, Text, Image, Save, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'; // Icons

// Helper function to format date for input type="date"
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const DiaryEdit = ({ diaryId: propDiaryId }) => {
  const [diary, setDiary] = useState(null); // To store the original fetched data
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [weather, setWeather] = useState('');
  const [mood, setMood] = useState('');
  const [location, setLocation] = useState('');
  const [people, setPeople] = useState(''); // Comma-separated string for input
  const [tags, setTags] = useState('');     // Comma-separated string for input
  const [planList, setPlanList] = useState(''); // Newline-separated string for input
  const [eventList, setEventList] = useState(''); // Newline-separated string for input
  const [feeling, setFeeling] = useState('');
  const [summary, setSummary] = useState('');
  const [existingImageUrls, setExistingImageUrls] = useState([]); // URLs fetched from backend
  const [imagesToDelete, setImagesToDelete] = useState([]); // URLs to be deleted
  const [newImages, setNewImages] = useState([]); // Array of File objects for new uploads
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true); // For initial data fetch
  const [saving, setSaving] = useState(false); // For form submission
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

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

      setDiary(data.diary); // Store original diary data
      setDate(formatDateForInput(data.diary.date));
      setTitle(data.diary.title || '');
      setWeather(data.diary.weather || '');
      setMood(data.diary.mood || '');
      setLocation(data.diary.location || '');
      setPeople(Array.isArray(data.diary.people) ? data.diary.people.join(', ') : data.diary.people || '');
      setTags(Array.isArray(data.diary.tags) ? data.diary.tags.join(', ') : data.diary.tags || '');
      setPlanList(Array.isArray(data.diary.planList) ? data.diary.planList.join('\n') : data.diary.planList || '');
      setEventList(Array.isArray(data.diary.eventList) ? data.diary.eventList.join('\n') : data.diary.eventList || '');
      setFeeling(data.diary.feeling || '');
      setSummary(data.diary.summary || '');
      setExistingImageUrls(data.diary.imageUrls || []);
      setIsPublic(data.diary.isPublic || false);

    } catch (err) {
      console.error('Error fetching diary:', err);
      setMessage({ type: 'error', text: `加载日记数据失败: ${err.message}` });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null); // Clear previous messages

    // Basic frontend validation
    if (!date || !title) {
      setMessage({ type: 'error', text: '日期和标题是必填项。' });
      setSaving(false);
      return;
    }

    const formData = new FormData();
    formData.append('date', date);
    formData.append('title', title);
    if (weather) formData.append('weather', weather);
    if (mood) formData.append('mood', mood);
    if (location) formData.append('location', location);
    formData.append('people', people); // Send as string, backend will parse
    formData.append('tags', tags);       // Send as string, backend will parse
    formData.append('planList', planList); // Send as string, backend will parse
    formData.append('eventList', eventList); // Send as string, backend will parse
    formData.append('feeling', feeling);
    formData.append('summary', summary);
    formData.append('isPublic', isPublic);
    formData.append('imagesToDelete', JSON.stringify(imagesToDelete)); // Send array of URLs to delete

    newImages.forEach((image) => {
      formData.append(`newImages`, image); // Append each new file
    });

    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch(`/api/diaries/${currentDiaryId}`, {
        method: 'PUT', // Use PUT for update
        headers: {
          // 'Content-Type': 'multipart/form-data' is automatically set by FormData
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更新日记失败。');
      }

      setMessage({ type: 'success', text: data.message || '日记更新成功！' });
      // Clear new images and images to delete, then re-fetch data to reflect changes
      setNewImages([]);
      setImagesToDelete([]);
      // Optionally redirect after a short delay
      setTimeout(() => {
        window.location.href = '/diary'; // Redirect to diary list
      }, 1500);

    } catch (err) {
      console.error('Update diary error:', err);
      setMessage({ type: 'error', text: err.message || '更新日记失败，请稍后再试。' });
    } finally {
      setSaving(false);
    }
  };

  const handleNewImageChange = (e) => {
    setNewImages(Array.from(e.target.files)); // Convert FileList to Array
  };

  const handleImageDeleteCheckboxChange = (imageUrl, isChecked) => {
    if (isChecked) {
      setImagesToDelete(prev => [...prev, imageUrl]);
    } else {
      setImagesToDelete(prev => prev.filter(url => url !== imageUrl));
    }
  };

  if (loading) {
    return (
      <MainLayout pageTitle="编辑日记">
        <div className="container mx-auto p-4 text-center">加载中...</div>
      </MainLayout>
    );
  }

  if (!diary) {
    return (
      <MainLayout pageTitle="编辑日记">
        <div className="container mx-auto p-4 text-center text-red-500">日记未找到或无权访问。</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="编辑日记"> {/* Wrap with MainLayout */}
      <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Card className="w-full max-w-2xl shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <PencilLine className="mr-2 h-7 w-7" />编辑日记
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {message && (
              <div className={`p-3 rounded-md mb-4 text-sm flex items-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />日期:
                </Label>
                <Input
                  type="date"
                  id="date"
                  name="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Type className="inline-block w-4 h-4 mr-1 text-gray-500" />标题:
                </Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="weather" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Cloud className="inline-block w-4 h-4 mr-1 text-gray-500" />天气:
                </Label>
                <Select
                  value={weather}
                  onValueChange={setWeather}
                >
                  <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">请选择</SelectItem>
                    <SelectItem value="晴">晴</SelectItem>
                    <SelectItem value="多云">多云</SelectItem>
                    <SelectItem value="阴">阴</SelectItem>
                    <SelectItem value="雨">雨</SelectItem>
                    <SelectItem value="雪">雪</SelectItem>
                    <SelectItem value="风">风</SelectItem>
                    <SelectItem value="雾">雾</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Smile className="inline-block w-4 h-4 mr-1 text-gray-500" />心情:
                </Label>
                <Select
                  value={mood}
                  onValueChange={setMood}
                >
                  <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">请选择</SelectItem>
                    <SelectItem value="快乐">快乐</SelectItem>
                    <SelectItem value="悲伤">悲伤</SelectItem>
                    <SelectItem value="平静">平静</SelectItem>
                    <SelectItem value="激动">激动</SelectItem>
                    <SelectItem value="沮丧">沮丧</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <MapPin className="inline-block w-4 h-4 mr-1 text-gray-500" />地点:
                </Label>
                <Input
                  type="text"
                  id="location"
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="people" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Users className="inline-block w-4 h-4 mr-1 text-gray-500" />人物 (使用英文逗号 , 分割):
                </Label>
                <Input
                  type="text"
                  id="people"
                  name="people"
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" />标签 (使用英文逗号 , 分割):
                </Label>
                <Input
                  type="text"
                  id="tags"
                  name="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="planList" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <ListTodo className="inline-block w-4 h-4 mr-1 text-gray-500" />计划列表 (一行一项):
                </Label>
                <Textarea
                  id="planList"
                  name="planList"
                  value={planList}
                  onChange={(e) => setPlanList(e.target.value)}
                  rows="3"
                  className="min-h-[80px] rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                ></Textarea>
              </div>
              <div>
                <Label htmlFor="eventList" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Clipboard className="inline-block w-4 h-4 mr-1 text-gray-500" />事件列表 (一行一项):
                </Label>
                <Textarea
                  id="eventList"
                  name="eventList"
                  value={eventList}
                  onChange={(e) => setEventList(e.target.value)}
                  rows="3"
                  className="min-h-[80px] rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                ></Textarea>
              </div>
              <div>
                <Label htmlFor="feeling" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Text className="inline-block w-4 h-4 mr-1 text-gray-500" />心情随笔:
                </Label>
                <Textarea
                  id="feeling"
                  name="feeling"
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value)}
                  rows="3"
                  className="min-h-[80px] rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                ></Textarea>
              </div>
              <div>
                <Label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Text className="inline-block w-4 h-4 mr-1 text-gray-500" />每日总结:
                </Label>
                <Textarea
                  id="summary"
                  name="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows="5"
                  className="min-h-[100px] rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                ></Textarea>
              </div>

              <div className="col-span-full">
                <Label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Image className="inline-block w-4 h-4 mr-1 text-gray-500" />现有图片:
                </Label>
                {existingImageUrls && existingImageUrls.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {existingImageUrls.map((imageUrl, index) => (
                      <div key={index} className="relative group border rounded-md overflow-hidden shadow-sm">
                        <img
                          src={imageUrl}
                          alt={`图片 ${index + 1}`}
                          className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/128x128/e0e0e0/555555?text=图片加载失败"; }} // Fallback image
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-80 p-2 flex items-center justify-center">
                          <input
                            type="checkbox"
                            id={`deleteImage${index}`}
                            name="deleteImages"
                            value={imageUrl}
                            checked={imagesToDelete.includes(imageUrl)}
                            onChange={(e) => handleImageDeleteCheckboxChange(imageUrl, e.target.checked)}
                            className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                          />
                          <Label htmlFor={`deleteImage${index}`} className="ml-2 text-xs font-medium text-red-600">删除</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">没有图片</p>
                )}
              </div>

              <div>
                <Label htmlFor="newImages" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Image className="inline-block w-4 h-4 mr-1 text-gray-500" />上传新图片:
                </Label>
                <Input
                  type="file"
                  id="newImages"
                  name="newImages"
                  multiple
                  accept="image/*"
                  onChange={handleNewImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="isPublic" className="text-sm font-medium text-gray-700 flex items-center">
                  公开日记
                </Label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button type="submit" className="flex-grow bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md py-2.5 text-base" disabled={saving}>
                  <Save className="mr-2 h-5 w-5" />{saving ? '保存中...' : '保存'}
                </Button>
                <Button type="button" onClick={() => window.location.href = '/diary'} variant="outline" className="flex-grow text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2.5 text-base">
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

export default DiaryEdit;
