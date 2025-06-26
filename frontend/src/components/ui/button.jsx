// frontend\src\components\ui\button.jsx (或 .tsx，取决于您的项目)

import React from 'react';

// 这是一个简单的按钮组件示例，您可以根据需要进行修改
const Button = ({ children, onClick, className, ...props }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;