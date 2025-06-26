// frontend\src\components\ui\label.jsx (或 .tsx，取决于您的项目)

import React from 'react';

// 这是一个简单的 Label 组件示例
const Label = ({ className, children, htmlFor, ...props }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};

export default Label;