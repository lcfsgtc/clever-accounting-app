import React from 'react';
import { Home, Wallet, ShoppingCart, Building, BookOpen, Book, Users, Lock } from 'lucide-react'; // Importing icons from lucide-react

const Sidebar = ({ activeMenuPath, onCloseSidebar }) => {
  // Define navigation items with their paths, labels, and icons
  const navItems = [
    { path: '/dashboard', label: '导航页', icon: Home },
    { path: '/incomes', label: '收入管理', icon: Wallet },
    { path: '/expenses', label: '支出管理', icon: ShoppingCart },
    { path: '/assets', label: '资产盘点', icon: Building },
    { path: '/diary', label: '日记管理', icon: BookOpen },
    { path: '/booknote', label: '读书笔记', icon: Book },
    { path: '/admin/users', label: '用户管理', icon: Users, isAdmin: true }, // Example for admin-only link
    { path: '/change-password', label: '修改密码', icon: Lock },
    // TODO: Add logout link here, which should trigger a logout API call and redirect
  ];

  const handleNavLinkClick = (e, path) => {
    e.preventDefault();
    window.location.href = path; // Navigate to the new path

    // If on mobile and a link is clicked, close the sidebar
    if (onCloseSidebar) {
      onCloseSidebar();
    }
  };

  return (
    <div className="p-3 flex flex-col h-full">
      <h2 className="text-white text-opacity-70 text-lg font-semibold uppercase tracking-wider mb-4 px-3">管理</h2>
      <hr className="border-gray-700 mb-6" />
      <div className="flex-grow"> {/* This div ensures the list takes available space */}
        {navItems.map((item) => (
          // In a real application with React Router, you'd use <NavLink> or <Link>
          <a
            key={item.path}
            href={item.path}
            onClick={(e) => handleNavLinkClick(e, item.path)}
            className={`
              flex items-center px-4 py-3 mb-1 rounded-lg
              text-white text-opacity-85 hover:bg-blue-700 hover:text-white
              transition-all duration-200 ease-in-out
              ${activeMenuPath === item.path || (item.path === '/' && activeMenuPath === '/') || (activeMenuPath.startsWith(item.path) && item.path !== '/')
                ? 'bg-blue-600 text-white font-semibold shadow-md' // Active state
                : 'bg-transparent' // Inactive state
              }
            `}
          >
            {item.icon && <item.icon className="mr-3 h-5 w-5 opacity-90" />} {/* Render icon */}
            {item.label}
          </a>
        ))}
      </div>
      {/* Optionally add a logout button here */}
    </div>
  );
};

export default Sidebar;
