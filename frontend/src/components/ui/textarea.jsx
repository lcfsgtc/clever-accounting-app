// frontend\src\components\ui\textarea.jsx (或 .tsx，取决于您的项目)

import React from 'react';

// 这是一个简单的 Textarea 组件示例
const Textarea = ({ className, ...props }) => {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};

export default Textarea;