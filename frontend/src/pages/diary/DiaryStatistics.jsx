import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../MainLayout.jsx'; // 确保 MainLayout.jsx 文件位于正确的位置
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import  Button  from '@/components/ui/button';
import  Input  from '@/components/ui/input';
import  Label  from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { BarChart, Filter, Calendar, Cloud, Smile, MapPin, Tag, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'; // Icons

// Helper function to format date for input fields (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DiaryStatistics = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    mood: '',
    weather: '',
    location: '',
    tags: '', // Comma-separated string
    period: '', // 'year', 'month', 'day', or '' for total
    publicOnly: false,
  });

  const [statisticsData, setStatisticsData] = useState(null); // Can be an object (for total) or array (for period)
  const [allMoods, setAllMoods] = useState([]);
  const [allWeathers, setAllWeathers] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.mood) params.append('mood', filters.mood);
    if (filters.weather) params.append('weather', filters.weather);
    if (filters.location) params.append('location', filters.location);
    if (filters.tags) params.append('tags', filters.tags);
    if (filters.period) params.append('period', filters.period);
    if (filters.publicOnly) params.append('publicOnly', 'true');
    return params.toString();
  }, [filters]);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    const queryString = buildQueryString();

    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch(`/api/diaries/statistics?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch diary statistics');
      }
      
      // Update filter options
      setAllMoods(data.allMoods || []);
      setAllWeathers(data.allWeathers || []);
      setAllLocations(data.allLocations || []);

      // The backend needs to return `statistics` as an array for period stats,
      // or as a single object inside an array for total stats,
      // consistent with the EJS template's `statistics[0]` access.
      setStatisticsData(data.statistics); 

      // Update URL without full page reload
      const newUrl = `${window.location.pathname}?${queryString}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

    } catch (err) {
      console.error('Error fetching diary statistics:', err);
      setMessage({ type: 'error', text: `加载统计数据失败: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  useEffect(() => {
    // Attempt to load initial filters from URL on component mount
    const params = new URLSearchParams(window.location.search);
    setFilters({
      startDate: params.get('startDate') || '',
      endDate: params.get('endDate') || '',
      mood: params.get('mood') || '',
      weather: params.get('weather') || '',
      location: params.get('location') || '',
      tags: params.get('tags') || '',
      period: params.get('period') || '',
      publicOnly: params.get('publicOnly') === 'true',
    });
    // fetchStatistics will be called by useEffect when filters state is updated
  }, []);

  useEffect(() => {
    // This useEffect ensures fetchStatistics is called whenever filters change
    fetchStatistics();
  }, [filters, fetchStatistics]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name, checked) => {
    setFilters(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // fetchStatistics is already called by the useEffect when filters change,
    // so simply updating filters will trigger the fetch.
  };

  // Helper to render distribution items
  const renderDistribution = (distributionArray, keyName) => {
    if (!distributionArray || distributionArray.length === 0) {
      return '无';
    }
    return distributionArray.map((item, index) => (
      <React.Fragment key={item[keyName] || index}>
        {item[keyName]} ({item.count}次){index < distributionArray.length - 1 ? ', ' : ''}
      </React.Fragment>
    ));
  };

  // Helper to render tag distribution
  const renderTagDistribution = (tagDistributionArray) => {
    if (!tagDistributionArray || tagDistributionArray.length === 0) {
      return '无';
    }
    // Sort tags by count in descending order
    const sortedTags = [...tagDistributionArray].sort((a, b) => b.count - a.count);
    return sortedTags.map((item, index) => (
      <React.Fragment key={item.tag || index}>
        #{item.tag} ({item.count}次){index < sortedTags.length - 1 ? ', ' : ''}
      </React.Fragment>
    ));
  };

  // Helper to format time dimension based on period
  const formatPeriodDimension = (item, period) => {
    if (!item || !item._id) return '未知时间';
    const { year, month, day } = item._id;
    if (period === 'year' && year) {
      return `${year}年`;
    } else if (period === 'month' && year && month) {
      return `${year}年${String(month).padStart(2, '0')}月`;
    } else if (period === 'day' && year && month && day) {
      return `${year}年${String(month).padStart(2, '0')}月${String(day).padStart(2, '0')}日`;
    }
    return '总计'; // Fallback for overall or if period doesn't match structure
  };


  return (
    <MainLayout pageTitle="日记统计">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-4">
        {/* Back Button */}
        <Button
          onClick={() => window.location.href = '/diary'}
          className="bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow-md w-fit mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />返回日记列表
        </Button>

        {/* Messages */}
        {message && (
          <div className={`p-3 rounded-md mb-4 text-sm flex items-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
            {message.text}
          </div>
        )}

        {/* Filter Card */}
        <Card className="shadow-lg rounded-xl overflow-hidden mb-6">
          <CardHeader className="bg-white p-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <Filter className="mr-2 text-blue-500" />筛选条件
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />开始日期:
                  </Label>
                  <Input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleInputChange}
                    className="rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />结束日期:
                  </Label>
                  <Input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleInputChange}
                    className="rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-1">
                    <Smile className="inline-block w-4 h-4 mr-1 text-gray-500" />心情:
                  </Label>
                  <Select
                    value={filters.mood}
                    onValueChange={(value) => handleSelectChange('mood', value)}
                  >
                    <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                      <SelectValue placeholder="所有心情" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">所有心情</SelectItem>
                      {allMoods.map(mood => (
                        <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="weather" className="block text-sm font-medium text-gray-700 mb-1">
                    <Cloud className="inline-block w-4 h-4 mr-1 text-gray-500" />天气:
                  </Label>
                  <Select
                    value={filters.weather}
                    onValueChange={(value) => handleSelectChange('weather', value)}
                  >
                    <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                      <SelectValue placeholder="所有天气" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">所有天气</SelectItem>
                      {allWeathers.map(weather => (
                        <SelectItem key={weather} value={weather}>{weather}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="inline-block w-4 h-4 mr-1 text-gray-500" />地点:
                  </Label>
                  <Select
                    value={filters.location}
                    onValueChange={(value) => handleSelectChange('location', value)}
                  >
                    <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                      <SelectValue placeholder="所有地点" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">所有地点</SelectItem>
                      {allLocations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" />标签 (逗号分隔):
                  </Label>
                  <Input
                    type="text"
                    id="tags"
                    name="tags"
                    value={filters.tags}
                    onChange={handleInputChange}
                    placeholder="例如：生活,工作"
                    className="rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />统计时间维度:
                  </Label>
                  <Select
                    value={filters.period}
                    onValueChange={(value) => handleSelectChange('period', value)}
                  >
                    <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                      <SelectValue placeholder="总计" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">总计</SelectItem>
                      <SelectItem value="year">按年</SelectItem>
                      <SelectItem value="month">按月</SelectItem>
                      <SelectItem value="day">按日</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pt-2 md:pt-0">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="publicOnly"
                      name="publicOnly"
                      checked={filters.publicOnly}
                      onCheckedChange={(checked) => handleCheckboxChange('publicOnly', checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="publicOnly" className="text-sm font-medium text-gray-700">仅公开日记</Label>
                  </div>
                </div>
                <div className="col-span-full md:col-span-1 flex justify-end mt-3 md:mt-0">
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md py-2.5 text-base">
                    <BarChart className="mr-2 h-5 w-5" />生成统计
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">统计结果</h2>

        {loading ? (
          <p className="text-center text-gray-600 py-8">加载统计数据中...</p>
        ) : statisticsData && statisticsData.length > 0 ? (
          filters.period === '' ? (
            // Overall statistics table
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <Table className="min-w-full responsive-stats-table">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">统计项</TableHead>
                      <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">值</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white divide-y divide-gray-200">
                    <TableRow>
                      <TableCell data-label="统计项:" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 block md:table-cell md:text-left">总日记数</TableCell>
                      <TableCell data-label="值:" className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 block md:table-cell md:text-left">
                        {statisticsData[0].totalDiaries || 0}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell data-label="统计项:" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 block md:table-cell md:text-left">心情分布</TableCell>
                      <TableCell data-label="值:" className="px-6 py-4 text-sm text-gray-700 block md:table-cell md:text-left">
                        {renderDistribution(statisticsData[0].moodDistribution, 'mood')}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell data-label="统计项:" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 block md:table-cell md:text-left">天气分布</TableCell>
                      <TableCell data-label="值:" className="px-6 py-4 text-sm text-gray-700 block md:table-cell md:text-left">
                        {renderDistribution(statisticsData[0].weatherDistribution, 'weather')}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell data-label="统计项:" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 block md:table-cell md:text-left">地点分布</TableCell>
                      <TableCell data-label="值:" className="px-6 py-4 text-sm text-gray-700 block md:table-cell md:text-left">
                        {renderDistribution(statisticsData[0].locationDistribution, 'location')}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell data-label="统计项:" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 block md:table-cell md:text-left">常用标签</TableCell>
                      <TableCell data-label="值:" className="px-6 py-4 text-sm text-gray-700 block md:table-cell md:text-left">
                        {renderTagDistribution(statisticsData[0].tagDistribution)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            // Period-based statistics table
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="overflow-x-auto">
                  <Table className="min-w-full divide-y divide-gray-200">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间维度</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总日记数</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">心情分布</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">天气分布</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地点分布</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">涉及标签</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white divide-y divide-gray-200">
                      {statisticsData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPeriodDimension(item, filters.period)}
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.totalDiaries || 0}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-sm text-gray-700">
                            {renderDistribution(item.moodDistribution, 'mood')}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-sm text-gray-700">
                            {renderDistribution(item.weatherDistribution, 'weather')}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-sm text-gray-700">
                            {renderDistribution(item.locationDistribution, 'location')}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-sm text-gray-700">
                            {renderTagDistribution(item.tagDistribution)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <p className="text-center text-gray-500 py-4">没有符合条件的统计数据。</p>
        )}
      </div>
    </MainLayout>
  );
};

export default DiaryStatistics;
