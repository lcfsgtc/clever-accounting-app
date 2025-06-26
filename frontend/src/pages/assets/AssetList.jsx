import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../MainLayout.jsx'; // 确保 MainLayout.jsx 位于正确的位置
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // Assuming shadcn/ui table components
import  Button  from '@/components/ui/button'; // Assuming shadcn/ui button component
import  Input  from '@/components/ui/input'; // Assuming shadcn/ui input component
import  Label  from '@/components/ui/label'; // Assuming shadcn/ui label component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Assuming shadcn/ui select component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming shadcn/ui card component
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // Assuming shadcn/ui dialog components
import { Filter, Calendar, ListFilter, Search, Plus, Download, BarChart, Home, Edit, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'; // Icons

// Helper function to format date to YYYY-MM-DD for display
const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

const AssetList = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // Filter and Pagination states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    totalAssets: 0,
  });
  const [distinctTypes, setDistinctTypes] = useState([]);
  const [assetTypeCounts, setAssetTypeCounts] = useState({});
  const [totalCost, setTotalCost] = useState('0.00');
  const [totalCurrentValue, setTotalCurrentValue] = useState('0.00');

  // Dialog state for confirmation
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedAssetName, setSelectedAssetName] = useState('');

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.append('page', pagination.currentPage);
    params.append('limit', pagination.limit);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.type) params.append('type', filters.type);
    return params.toString();
  }, [pagination.currentPage, pagination.limit, filters]);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const queryParams = buildQueryString();

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/assets?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取资产失败');
      }

      setAssets(data.assets.map(asset => ({
        ...asset,
        purchaseDateFormatted: formatDateForDisplay(asset.purchaseDate)
      })) || []);
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        limit: data.limit,
        totalAssets: data.totalAssets,
      });
      setDistinctTypes(data.distinctTypes || []);
      setAssetTypeCounts(data.assetTypeCounts || {});
      setTotalCost(parseFloat(data.totalCost || 0).toFixed(2));
      setTotalCurrentValue(parseFloat(data.totalCurrentValue || 0).toFixed(2));

      // Update URL without full page reload
      const newUrl = `${window.location.pathname}?${queryParams}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

    } catch (err) {
      console.error('Error fetching assets:', err);
      setMessage({ type: 'error', text: `加载资产列表失败: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]); // Re-fetch when query string changes

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const handleSelectFilterChange = (name, value) => {
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on new filter
    // fetchAssets will be called by useEffect due to filters state change
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: parseInt(newLimit), currentPage: 1 })); // Reset to first page
  };

  const handleDeleteClick = (assetId, assetName) => {
    setSelectedAssetId(assetId);
    setSelectedAssetName(assetName);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDialogOpen(false); // Close dialog immediately
    setMessage(null); // Clear previous messages

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/assets/${selectedAssetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '删除资产失败。');
      }

      setMessage({ type: 'success', text: data.message || `资产 "${selectedAssetName}" 已成功删除。` });
      fetchAssets(); // Re-fetch list after deletion
    } catch (err) {
      console.error('Error deleting asset:', err);
      setMessage({ type: 'error', text: err.message || '删除资产失败，请稍后再试。' });
    }
  };

  // Build query string for export link
  const exportQueryString = buildQueryString();

  return (
    <MainLayout pageTitle="资产列表">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-4">
        {message && (
          <div className={`p-3 rounded-md mb-4 text-sm flex items-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
            {message.text}
          </div>
        )}

        {/* Filter Form */}
        <Card className="shadow-sm mb-6 rounded-xl overflow-hidden">
          <CardHeader className="bg-white border-b-0 pt-4 pb-0 rounded-t-xl">
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
              <Filter className="mr-2 text-blue-500" />筛选条件
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={applyFilters}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />开始日期
                  </Label>
                  <Input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
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
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    <ListFilter className="inline-block w-4 h-4 mr-1 text-gray-500" />类型
                  </Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => handleSelectFilterChange('type', value)}
                  >
                    <SelectTrigger className="w-full rounded-md border-gray-300 shadow-sm">
                      <SelectValue placeholder="所有类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">所有类型</SelectItem>
                      {distinctTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6 justify-center md:justify-start">
          <Button onClick={() => window.location.href = '/assets/add'} className="bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md w-full md:w-auto text-base px-6 py-2.5">
            <Plus className="mr-2 h-5 w-5" />添加资产
          </Button>
          <a href={`/api/assets/export${exportQueryString ? '?' + exportQueryString : ''}`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-md w-full md:w-auto text-base px-6 py-2.5">
              <Download className="mr-2 h-5 w-5" />导出Excel
            </Button>
          </a>
          <Button onClick={() => window.location.href = '/assets/statistics'} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow-md w-full md:w-auto text-base px-6 py-2.5">
            <BarChart className="mr-2 h-5 w-5" />资产统计
          </Button>
        </div>

        <hr className="my-8 border-t-2 border-gray-200" />

        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center md:text-left">资产记录</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          {loading ? (
            <div className="text-center py-8">加载资产数据中...</div>
          ) : assets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无资产记录。</div>
          ) : (
            <Table className="min-w-full divide-y divide-gray-200 lg:table-auto asset-table-responsive">
              <TableHeader className="bg-gray-50 hidden md:table-header-group"> {/* Hide on small, show on md+ */}
                <TableRow>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成本</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">现值</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">购买日期</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状况</TableHead>
                  <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {assets.map((asset) => (
                  <TableRow key={asset._id} className="block md:table-row mb-4 md:mb-0 border border-gray-200 rounded-lg md:border-none">
                    <TableCell data-label="名称:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left font-medium">
                      <span className="md:hidden float-left font-bold text-gray-700">名称:</span>
                      {asset.name}
                    </TableCell>
                    <TableCell data-label="类型:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-bold text-gray-700">类型:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {asset.type}
                      </span>
                    </TableCell>
                    <TableCell data-label="数量:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-bold text-gray-700">数量:</span>
                      {asset.quantity}
                    </TableCell>
                    <TableCell data-label="成本:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-bold text-gray-700">成本:</span>
                      <span className="text-red-600 font-semibold">¥{parseFloat(asset.cost).toFixed(2)}</span>
                    </TableCell>
                    <TableCell data-label="现值:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-bold text-gray-700">现值:</span>
                      <span className="text-green-600 font-semibold">¥{parseFloat(asset.currentValue).toFixed(2)}</span>
                    </TableCell>
                    <TableCell data-label="购买日期:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-bold text-gray-700">购买日期:</span>
                      {asset.purchaseDateFormatted} {/* Assuming API returns formatted date */}
                    </TableCell>
                    <TableCell data-label="状况:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-bold text-gray-700">状况:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {asset.condition}
                      </span>
                    </TableCell>
                    <TableCell data-label="操作:" className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-center actions-cell">
                      <span className="md:hidden float-left font-bold text-gray-700">操作:</span>
                      <div className="flex flex-wrap justify-center md:flex-nowrap md:justify-center gap-2">
                        <Button
                          onClick={() => window.location.href = `/assets/edit/${asset._id}`}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-md px-3 py-1.5 text-sm flex-grow md:flex-none"
                        >
                          <Edit className="w-4 h-4 mr-1" />编辑
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(asset._id, asset.name)}
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
          )}
        </div>

        {/* Pagination and Summary */}
        {pagination.totalPages > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 py-4 border-t border-gray-200">
            <div className="flex items-center mb-4 md:mb-0">
              <Label htmlFor="limitBottom" className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">每页显示:</Label>
              <Select
                value={String(pagination.limit)}
                onValueChange={handleLimitChange}
              >
                <SelectTrigger className="w-[80px] rounded-md border-gray-300 shadow-sm">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <nav aria-label="Page navigation" className="mb-4 md:mb-0">
              <ul className="flex items-center -space-x-px h-10 text-base">
                <li>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-l-md"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </li>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNumber => (
                  <li key={pageNumber}>
                    <Button
                      variant={pagination.currentPage === pageNumber ? 'default' : 'outline'}
                      size="icon"
                      className={`h-10 w-10 ${pagination.currentPage === pageNumber ? 'bg-blue-600 text-white' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
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
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </li>
              </ul>
            </nav>
            <span className="text-sm text-gray-500 mt-4 md:mt-0 whitespace-nowrap">总共 {pagination.totalAssets} 条记录</span>
          </div>
        )}

        {/* Asset Type Statistics */}
        <Card className="shadow-sm mt-8 rounded-xl overflow-hidden">
          <CardHeader className="bg-white border-b-0 pt-4 pb-0 rounded-t-xl">
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
              <BarChart className="mr-2 text-blue-500" />资产类型统计
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {Object.keys(assetTypeCounts).length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {Object.entries(assetTypeCounts).sort(([typeA], [typeB]) => typeA.localeCompare(typeB)).map(([type, value]) => (
                  <li key={type} className="flex justify-between items-center py-3">
                    <span className="text-gray-800">{type}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      ¥{parseFloat(value).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 mt-3">暂无统计数据。</p>
            )}
            <hr className="my-4 border-t border-gray-200" />
            <p className="text-lg font-semibold text-gray-800">总成本: <span className="text-red-600">¥{totalCost}</span></p>
            <p className="text-lg font-semibold text-gray-800">总现值: <span className="text-green-600">¥{totalCurrentValue}</span></p>
          </CardContent>
        </Card>

        {/* Back to Home Button */}
        <div className="flex justify-start mt-6">
          <Button onClick={() => window.location.href = '/dashboard'} className="bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow-md text-base px-6 py-2.5">
            <Home className="mr-2 h-5 w-5" />返回首页
          </Button>
        </div>

        {/* Confirmation Dialog for Delete */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>删除资产</DialogTitle>
              <DialogDescription>
                确定要删除资产 "{selectedAssetName}" 吗？此操作不可逆。
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

export default AssetList;
