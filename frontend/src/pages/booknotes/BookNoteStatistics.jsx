import React, { useState, useEffect, useCallback } from 'react';
// IMPORTANT: Please ensure the path to MainLayout.jsx is correct relative to this file.
// For example: If BookNoteStatistics.jsx is in 'src/pages/', and MainLayout.jsx is in 'src/',
// then '../MainLayout.jsx' is correct. If your project uses path aliases (e.g., @/),
// you might need to adjust this path based on your project's configuration.
import MainLayout from '../MainLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import  Button  from '@/components/ui/button';
import  Input  from '@/components/ui/input';
import  Label  from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, CalendarDays, Star, ArrowLeft, ChartPie } from 'lucide-react'; // Icons

// Helper function to format date for input type="date"
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const BookNoteStatistics = () => {
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error', text: string }

  // Filter states (initialized from URL or defaults)
  const [startDate, setStartDate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('startDate') || '';
  });
  const [endDate, setEndDate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('endDate') || '';
  });
  const [groupByField, setGroupByField] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('groupByField') || 'category';
  });

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    const queryParams = new URLSearchParams({
      startDate,
      endDate,
      groupByField,
    }).toString();

    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch(`/api/booknotes/statistics?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch statistics');
      }

      setStatistics(data.statistics || []);
      // Update filter states from API response query, in case API has defaults
      setStartDate(data.startDate || '');
      setEndDate(data.endDate || '');
      setGroupByField(data.groupByField || 'category');

    } catch (err) {
      console.error('Error fetching book note statistics:', err);
      setMessage({ type: 'error', text: `加载统计数据失败: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, groupByField]); // Dependencies for re-fetching

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    // Re-fetch data based on current state values
    fetchStatistics();

    // Update URL to reflect current filter state
    const newUrl = new URL(window.location.pathname);
    newUrl.searchParams.set('startDate', startDate);
    newUrl.searchParams.set('endDate', endDate);
    newUrl.searchParams.set('groupByField', groupByField);
    window.history.pushState({}, '', newUrl);
  };

  const renderStars = (ratingValue) => {
    const stars = [];
    for (let i = 0; i < ratingValue; i++) {
      stars.push(<Star key={`filled-${i}`} className="w-4 h-4 text-yellow-500 inline-block" fill="currentColor" />);
    }
    for (let i = ratingValue; i < 5; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-400 inline-block" />);
    }
    return stars;
  };

  const getGroupLabel = (stat) => {
    if (groupByField === 'readMonth' && stat._id) {
      return `${stat._id.year}年${stat._id.month}月`;
    } else if (groupByField === 'rating' && stat._id) {
      return (
        <div className="flex items-center">
          {renderStars(stat._id)}
        </div>
      );
    } else {
      return stat._id || 'N/A';
    }
  };

  return (
    <MainLayout pageTitle="读书笔记统计">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        <Card className="shadow-lg mb-5 rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <BarChart className="mr-2 h-7 w-7" />统计选项
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleFilterSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 items-end">
                <div className="col-span-1">
                  <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <CalendarDays className="inline-block w-4 h-4 mr-1 text-gray-500" />开始日期:
                  </Label>
                  <Input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <CalendarDays className="inline-block w-4 h-4 mr-1 text-gray-500" />结束日期:
                  </Label>
                  <Input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="groupByField" className="block text-sm font-medium text-gray-700 mb-1">
                    <ChartPie className="inline-block w-4 h-4 mr-1 text-gray-500" />按...分组:
                  </Label>
                  <Select
                    value={groupByField}
                    onValueChange={(value) => setGroupByField(value)}
                  >
                    <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                      <SelectValue placeholder="选择分组方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category">类别</SelectItem>
                      <SelectItem value="author">作者</SelectItem>
                      <SelectItem value="publishYear">出版年份</SelectItem>
                      <SelectItem value="rating">评分</SelectItem>
                      <SelectItem value="readYear">阅读年份</SelectItem>
                      <SelectItem value="readMonth">阅读月份</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-full mt-3 md:mt-0">
                  <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-md shadow-md py-2.5 text-base" disabled={loading}>
                    <BarChart className="mr-2 h-5 w-5" />{loading ? '生成中...' : '生成统计'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {message && (
          <div className="p-3 rounded-md mb-4 text-sm bg-red-100 text-red-700">
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">加载统计数据中...</div>
        ) : statistics.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mt-5">
            <Table className="min-w-full divide-y divide-gray-200">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分组 ({
                    groupByField === 'category' ? '类别' :
                    groupByField === 'author' ? '作者' :
                    groupByField === 'publishYear' ? '出版年份' :
                    groupByField === 'rating' ? '评分' :
                    groupByField === 'readYear' ? '阅读年份' :
                    groupByField === 'readMonth' ? '阅读月份' : 'N/A'
                    })
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">笔记数量</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平均评分</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {statistics.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getGroupLabel(stat)}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {stat.count}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {stat.avgRating ? (
                        <div className="flex items-center">
                          {stat.avgRating.toFixed(2)}
                          {renderStars(Math.round(stat.avgRating))}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="p-3 rounded-md mb-4 text-sm bg-blue-100 text-blue-700 text-center mt-5">
            没有可用的统计数据。请尝试调整筛选条件。
          </p>
        )}

        <div className="text-center mt-6 mb-4">
          <Button onClick={() => window.location.href = '/booknotes'} variant="secondary" className="bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow-md py-2.5 text-base px-6">
            <ArrowLeft className="mr-2 h-5 w-5" />返回读书笔记列表
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default BookNoteStatistics;
