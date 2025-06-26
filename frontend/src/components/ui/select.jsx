// frontend\src\components\ui\select.jsx

import React, { useState, createContext, useContext, useRef, useEffect } from 'react';

// 创建一个上下文，用于在 Select 组件及其子组件之间共享状态和函数
const SelectContext = createContext();

// Select Root Component
const Select = ({ children, value, onValueChange }) => {
  const [open, setOpen] = useState(false); // 控制下拉菜单的打开/关闭状态
  const selectRef = useRef(null); // 用于检测点击是否在组件外部

  // 处理点击外部区域时关闭下拉菜单
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleSelect = (selectedValue) => {
    onValueChange(selectedValue); // 更新父组件的 value
    setOpen(false); // 选择后关闭下拉菜单
  };

  return (
    <SelectContext.Provider value={{ open, setOpen, value, handleSelect }}>
      <div className="relative" ref={selectRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// SelectTrigger Component
const SelectTrigger = ({ className, children, ...props }) => {
  const { open, setOpen } = useContext(SelectContext); // 从上下文中获取 open 状态和 setOpen 函数

  return (
    <button
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => setOpen(!open)} // 点击时切换 open 状态
      type="button" // 避免在表单中触发意外的提交
      {...props}
    >
      {children}
      <svg
        className={`h-4 w-4 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} // 根据 open 状态旋转箭头
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
  );
};

// SelectValue Component
const SelectValue = ({ placeholder, ...props }) => {
  const { value } = useContext(SelectContext); // 从上下文中获取当前的 value
  return <span {...props}>{value || placeholder}</span>; // 如果有值显示值，否则显示 placeholder
};

// SelectContent Component (只有当 open 为 true 时才渲染)
const SelectContent = ({ className, children, ...props }) => {
  const { open } = useContext(SelectContext); // 从上下文中获取 open 状态

  if (!open) return null; // 如果 open 为 false，则不渲染内容

  return (
    <div
      className={`absolute z-50 mt-1 w-full rounded-md border bg-white p-1 text-gray-900 shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// SelectItem Component
const SelectItem = ({ className, children, value: itemValue, ...props }) => {
  const { handleSelect, value: selectedValue } = useContext(SelectContext); // 从上下文中获取 handleSelect 函数和当前选中值
  const isSelected = selectedValue === itemValue; // 判断是否是当前选中项

  return (
    <div
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 
        ${isSelected ? 'bg-blue-50 text-blue-800 font-medium' : ''} // 添加选中样式
        ${className}`}
      data-value={itemValue}
      tabIndex="0"
      onClick={() => handleSelect(itemValue)} // 点击时调用 handleSelect
      {...props}
    >
      {children}
      {/* 可以在选中项旁边添加一个对勾图标 */}
      {isSelected && (
        <svg
          className="absolute left-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
    </div>
  );
};

// Export components
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };