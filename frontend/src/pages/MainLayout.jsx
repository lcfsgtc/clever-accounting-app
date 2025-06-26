import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar.jsx'; // 确保 Sidebar.jsx 文件在同一个目录下
import Button  from '@/components/ui/button'; // Assuming shadcn/ui Button
import { Menu, Home } from 'lucide-react'; // Icons

const MainLayout = ({ children, pageTitle = '管理系统' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Function to toggle sidebar visibility
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Effect to handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isCurrentlyMobile = window.innerWidth < 992; // md breakpoint for Tailwind is 768px, lg is 1024px. Using 992px to match original EJS logic's desktop breakpoint.
      setIsMobileView(isCurrentlyMobile);

      // On desktop, sidebar should always be open
      if (!isCurrentlyMobile) {
        setIsSidebarOpen(true);
      } else {
        // On mobile, if sidebar was open from desktop view, close it initially
        // or ensure it's hidden unless explicitly opened
        if (isSidebarOpen && window.innerWidth >= 992) { // If resized from mobile open to desktop
            setIsSidebarOpen(true); // Keep it open
        } else if (isSidebarOpen && window.innerWidth < 992) { // If resized from desktop to mobile
             // Do nothing, let the toggle control it, or explicitly close if needed
             // setIsSidebarOpen(false); // Uncomment this line if you want it to close automatically on mobile resize from desktop
        }
    }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isSidebarOpen]); // Add isSidebarOpen to dependencies to ensure correct logic after toggle

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden text-gray-800 font-inter">
      {/* Sidebar Toggle Button (Mobile Only) */}
      {isMobileView && (
        <Button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-[1040] bg-blue-600 hover:bg-blue-700 text-white p-3 text-lg rounded-lg shadow-md transition-all duration-200 ease-in-out md:hidden"
          aria-controls="sidebarCollapse"
          aria-expanded={isSidebarOpen}
          aria-label="Toggle navigation"
        >
          <Menu className="w-6 h-6" />
        </Button>
      )}

      {/* Sidebar Overlay (Mobile Only) */}
      {isMobileView && isSidebarOpen && (
        <div
          id="sidebarOverlay"
          className="fixed inset-0 bg-black bg-opacity-50 z-[1025] opacity-100 visible transition-opacity duration-300 ease-in-out"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* App Container */}
      <div className="flex flex-grow min-h-0">
        {/* Sidebar Wrapper */}
        <nav
          id="sidebarCollapse"
          className={`fixed top-0 left-0 h-screen bg-gray-900 text-white pt-8 z-[1030] shadow-lg transition-transform duration-300 ease-in-out
            ${isMobileView ? 'w-72 -translate-x-full' : 'w-64 translate-x-0'}
            ${isSidebarOpen ? 'translate-x-0' : ''}`}
        >
          <Sidebar activeMenuPath={window.location.pathname} onCloseSidebar={isMobileView ? toggleSidebar : null} />
        </nav>

        {/* Main Content Area */}
        <div
          className={`flex flex-col flex-grow p-4 md:p-6 lg:p-8 transition-all duration-300 ease-in-out
            ${isMobileView ? 'ml-0 pt-[70px]' : 'ml-64 pt-8'}
            ${isSidebarOpen && !isMobileView ? 'ml-64' : (isMobileView && isSidebarOpen ? 'ml-0' : '')}
            min-h-0 overflow-y-auto`}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 lg:p-10 flex flex-col flex-grow min-h-0">
            <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-gray-200 pb-4 mb-8">
              {pageTitle}
            </h1>
            {children} {/* Render the child components (actual page content) */}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full p-4 text-center text-gray-600 mt-auto bg-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
        © 2025 lcf 个人软件. All rights reserved.
      </footer>
    </div>
  );
};

export default MainLayout;