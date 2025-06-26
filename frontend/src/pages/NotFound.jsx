import React from 'react';
import  Button  from '@/components/ui/button'; // Assuming shadcn/ui Button
import { Frown, ArrowLeft } from 'lucide-react'; // Icons

const NotFound = () => {
  return (
    <div className="container mx-auto p-4 md:p-8 lg:p-12 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-gray-800 text-center">
      <Frown className="w-24 h-24 text-blue-500 mb-6 animate-bounce" />
      <h1 className="text-4xl md:text-5xl font-bold mb-4">404 - 页面未找到</h1>
      <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-md">
        抱歉，您正在寻找的页面不存在。它可能已被移动或删除。
      </p>
      <Button
        onClick={() => window.location.href = '/'}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 px-6 text-lg font-semibold shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />返回主页
      </Button>
    </div>
  );
};

export default NotFound;
