import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../MainLayout.jsx'; // 确保 MainLayout.jsx 位于正确的位置
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming shadcn/ui Card components
import  Button  from '@/components/ui/button'; // Assuming shadcn/ui Button component
import  Label  from '@/components/ui/label'; // Assuming shadcn/ui Label component
import { Package, DollarSign, Calendar, Info, TrendingUp, ClipboardPen, Percent, Eye, ArrowLeft } from 'lucide-react'; // Icons for viewing details

// Helper function to format date for display
const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN'); // Formats date like YYYY/MM/DD
};

const AssetView = ({ assetId: propAssetId }) => {
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'error', text: string }

  // Extract assetId from URL if not provided as prop
  const currentAssetId = propAssetId || window.location.pathname.split('/').pop();

  const fetchAsset = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('authToken'); // Get JWT from local storage
      const response = await fetch(`/api/assets/${currentAssetId}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch asset details');
      }

      setAsset(data.asset); // Store the fetched asset data
    } catch (err) {
      console.error('Error fetching asset:', err);
      setMessage({ type: 'error', text: `加载资产详情失败: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [currentAssetId]);

  useEffect(() => {
    if (currentAssetId) {
      fetchAsset();
    } else {
      setMessage({ type: 'error', text: '未提供资产ID。' });
      setLoading(false);
    }
  }, [currentAssetId, fetchAsset]);

  if (loading) {
    return (
      <MainLayout pageTitle="查看资产">
        <div className="container mx-auto p-4 text-center">加载中...</div>
      </MainLayout>
    );
  }

  if (message && message.type === 'error') {
    return (
      <MainLayout pageTitle="查看资产">
        <div className="container mx-auto p-4 text-center text-red-700 bg-red-100 rounded-md">
          {message.text}
        </div>
      </MainLayout>
    );
  }

  if (!asset) {
    return (
      <MainLayout pageTitle="查看资产">
        <div className="container mx-auto p-4 text-center text-gray-700">资产未找到。</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="查看资产"> {/* 使用 MainLayout 包装组件 */}
      <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Card className="w-full max-w-2xl shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center py-5">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <Eye className="mr-2 h-7 w-7" />资产详情
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full mb-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">基本信息</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                <div className="flex flex-col">
                  <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                    <Package className="inline-block w-4 h-4 mr-1 text-gray-500" />名称:
                  </Label>
                  <span className="text-gray-800 text-base">{asset.name}</span>
                </div>
                <div className="flex flex-col">
                  <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                    <Info className="inline-block w-4 h-4 mr-1 text-gray-500" />类型:
                  </Label>
                  <span className="text-gray-800 text-base">{asset.type}</span>
                </div>
                <div className="flex flex-col">
                  <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                    <TrendingUp className="inline-block w-4 h-4 mr-1 text-gray-500" />数量:
                  </Label>
                  <span className="text-gray-800 text-base">{asset.quantity}</span>
                </div>
                <div className="flex flex-col">
                  <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                    <DollarSign className="inline-block w-4 h-4 mr-1 text-gray-500" />成本:
                  </Label>
                  <span className="text-red-600 font-semibold text-base">¥{parseFloat(asset.cost).toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                    <DollarSign className="inline-block w-4 h-4 mr-1 text-gray-500" />现值:
                  </Label>
                  <span className="text-green-600 font-semibold text-base">¥{parseFloat(asset.currentValue).toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                    <Calendar className="inline-block w-4 h-4 mr-1 text-gray-500" />购买日期:
                  </Label>
                  <span className="text-gray-800 text-base">{formatDateForDisplay(asset.purchaseDate)}</span>
                </div>
                <div className="flex flex-col">
                  <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                    <Info className="inline-block w-4 h-4 mr-1 text-gray-500" />状况:
                  </Label>
                  <span className="text-gray-800 text-base">{asset.condition}</span>
                </div>
              </div>
            </div>

            <div className="col-span-full mt-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">折旧信息</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                <div className="flex flex-col">
                  <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                    <ClipboardPen className="inline-block w-4 h-4 mr-1 text-gray-500" />折旧方法:
                  </Label>
                  <span className="text-gray-800 text-base">{asset.depreciationMethod}</span>
                </div>
                <div className="flex flex-col">
                  <Label className="text-sm font-medium text-gray-600 flex items-center mb-1">
                    <Percent className="inline-block w-4 h-4 mr-1 text-gray-500" />折旧率:
                  </Label>
                  <span className="text-gray-800 text-base">
                    {typeof asset.depreciationRate === 'number' ? (asset.depreciationRate * 100).toFixed(2) + '%' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="col-span-full mt-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">备注</h2>
              <p className="text-gray-800 text-base whitespace-pre-wrap">{asset.notes || '无'}</p>
            </div>

            <div className="col-span-full flex justify-center mt-6">
              <Button onClick={() => window.location.href = '/assets'} variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-100 rounded-md shadow-sm py-2.5 text-base px-6">
                <ArrowLeft className="mr-2 h-5 w-5" />返回列表
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AssetView;
