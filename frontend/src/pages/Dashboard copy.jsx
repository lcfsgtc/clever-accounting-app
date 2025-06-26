import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming shadcn/ui Card components
import  Button from '@/components/ui/button'; // Assuming shadcn/ui Button component
import { LayoutDashboard, Wallet, TrendingDown, Home, BookOpen, BookText, Lock, Users, LogOut, TrendingUp } from 'lucide-react'; // Using lucide-react for icons

const Dashboard = ({ isAdmin = false }) => {
  // In a real application, isAdmin would likely come from a user context
  // or a user info API call after authentication.
  // For demonstration, it's passed as a prop, defaulting to false.

  const handleNavigation = (path) => {
    window.location.href = path; // Navigate using direct URL change
  };

  return (
    <div className="container mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center min-h-[calc(100vh-100px)]"> {/* Adjusted min-h for better centering */}
      <Card className="w-full max-w-2xl shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-blue-600 text-white text-center py-5">
          <CardTitle className="text-2xl font-bold flex items-center justify-center">
            <LayoutDashboard className="mr-2 h-7 w-7" />导航页
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8">
          {/* 数据管理 Section */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center">
              <Wallet className="mr-2 h-6 w-6 text-blue-500" /> 数据管理
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button onClick={() => handleNavigation('/incomes')} className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-3 text-lg font-semibold shadow-md transition-all duration-200 ease-in-out transform hover:scale-105">
                <TrendingUp className="mr-2 h-5 w-5" /> 收入管理
              </Button>
              <Button onClick={() => handleNavigation('/expenses')} className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-3 text-lg font-semibold shadow-md transition-all duration-200 ease-in-out transform hover:scale-105">
                <TrendingDown className="mr-2 h-5 w-5" /> 支出管理
              </Button>
              <Button onClick={() => handleNavigation('/assets')} className="w-full bg-gray-500 hover:bg-gray-600 text-white rounded-lg py-3 text-lg font-semibold shadow-md transition-all duration-200 ease-in-out transform hover:scale-105">
                <Home className="mr-2 h-5 w-5" /> 资产盘点
              </Button>
              <Button onClick={() => handleNavigation('/diary')} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg py-3 text-lg font-semibold shadow-md transition-all duration-200 ease-in-out transform hover:scale-105">
                <BookOpen className="mr-2 h-5 w-5" /> 日记管理
              </Button>
              <Button onClick={() => handleNavigation('/booknote')} className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-lg py-3 text-lg font-semibold shadow-md transition-all duration-200 ease-in-out transform hover:scale-105">
                <BookText className="mr-2 h-5 w-5" /> 读书笔记
              </Button>
            </div>
          </div>

          {/* 账户操作 Section */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center">
              <Lock className="mr-2 h-6 w-6 text-orange-500" /> 账户操作
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button onClick={() => handleNavigation('/change-password')} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg py-3 text-lg font-semibold shadow-md transition-all duration-200 ease-in-out transform hover:scale-105">
                <Lock className="mr-2 h-5 w-5" /> 修改密码
              </Button>
              {isAdmin && (
                <Button onClick={() => handleNavigation('/admin/users')} className="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg py-3 text-lg font-semibold shadow-md transition-all duration-200 ease-in-out transform hover:scale-105">
                  <Users className="mr-2 h-5 w-5" /> 用户管理
                </Button>
              )}
              <Button onClick={() => handleNavigation('/logout')} className="w-full bg-gray-700 hover:bg-gray-800 text-white rounded-lg py-3 text-lg font-semibold shadow-md transition-all duration-200 ease-in-out transform hover:scale-105">
                <LogOut className="mr-2 h-5 w-5" /> 登出
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
