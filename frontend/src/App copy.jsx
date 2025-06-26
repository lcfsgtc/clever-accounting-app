import React, { useState, useEffect } from 'react';
import MainLayout from './pages/MainLayout.jsx'; // 导入主布局组件

// 导入所有重构后的页面组件
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ChangePassword from './pages/auth/ChangePassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import UserList from './pages/admin/UserList.jsx';
import UserEdit from './pages/admin/UserEdit.jsx';
import BookNoteList from './pages/booknotes/BookNoteList.jsx'; // Placeholder for actual component
import BookNoteAdd from './pages/booknotes/BookNoteAdd.jsx';
import BookNoteEdit from './pages/booknotes/BookNoteEdit.jsx';
import BookNoteStatistics from './pages/booknotes/BookNoteStatistics.jsx';
import ExpenseList from './pages/expenses/ExpenseList.jsx'; // Placeholder
import IncomeList from './pages/incomes/IncomeList.jsx';   // Placeholder
import IncomeAdd from './pages/incomes/IncomeAdd.jsx';   // Placeholder
import IncomeEdit from './pages/incomes/IncomeEdit.jsx';   // Placeholder
import IncomeStatistics from './pages/incomes/IncomeStatistics.jsx';   // Placeholder
import AssetList from './pages/assets/AssetList.jsx';     // Placeholder
import DiaryList from './pages/diary/DiaryList.jsx';      // Placeholder
import NotFound from './pages/NotFound.jsx'; // 404 页面

const App = () => {
  // 使用 useState 来管理当前路径
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 监听 URL 变化
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    // 检查认证状态
    const token = localStorage.getItem('authToken');
    const userIsAdmin = localStorage.getItem('isAdmin') === 'true'; // localStorage stores strings

    setIsAuthenticated(!!token); // Convert token presence to boolean
    setIsAdmin(userIsAdmin);

    // Initial redirection based on authentication
    if (!token && currentPath !== '/login' && currentPath !== '/register') {
      window.history.pushState({}, '', '/login');
      setCurrentPath('/login');
    } else if (token && (currentPath === '/login' || currentPath === '/register')) {
      window.history.pushState({}, '', '/dashboard');
      setCurrentPath('/dashboard');
    }


    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentPath]); // Re-run effect if currentPath changes (e.g., from manual URL change or initial load)

  // 模拟导航函数，更新 URL 并触发组件重新渲染
  // 在实际应用中，你可能需要一个更健壮的路由库 (如 React Router)
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // 根据当前路径渲染不同的组件
  const renderContent = () => {
    // 认证相关的页面（通常不包含 MainLayout）
    if (currentPath === '/login') {
      return <Login />;
    }
    if (currentPath === '/register') {
      return <Register />;
    }

    // 检查是否认证，未认证则重定向到登录页
    if (!isAuthenticated) {
      // If we are already on login/register, don't redirect again, just render it.
      // The useEffect above handles the initial pushState if not on these paths.
      return <Login />; // Fallback if direct access to protected route
    }

    // 处理受保护的路由
    switch (true) {
      case currentPath === '/dashboard':
        return <Dashboard isAdmin={isAdmin} />;
      case currentPath === '/change-password':
        return <ChangePassword />;

      // Book Notes routes
      case currentPath === '/booknote':
        return <BookNoteList />;
      case currentPath === '/booknote/add':
        return <BookNoteAdd />;
      case currentPath.startsWith('/booknote/edit/'):
        const bookNoteId = currentPath.split('/').pop();
        return <BookNoteEdit bookNoteId={bookNoteId} />;
      case currentPath === '/booknote/statistics':
        return <BookNoteStatistics />;

      // Admin routes (only for admins)
      case currentPath === '/admin/users':
        return isAdmin ? <UserList /> : <NotFound />; // Show 404 or unauthorized for non-admins
      case currentPath.startsWith('/admin/users/edit/'):
        const userId = currentPath.split('/').pop();
        return isAdmin ? <UserEdit userId={userId} /> : <NotFound />;

      // Placeholder routes for other modules
      case currentPath === '/expenses':
        return <ExpenseList />;
      case currentPath === '/incomes':
        return <IncomeList />;
      case currentPath === '/incomes/add': 
        return <IncomeAdd />; //  确保渲染 IncomeAdd 组件     
      case currentPath.startsWith('/incomes/edit/'):
        const incomeId = currentPath.split('/').pop();
        return <IncomeEdit incomeId={incomeId} />;  
      case currentPath === '/incomes/statistics': 
        return <IncomeStatistics />;                        
      case currentPath === '/assets':
        return <AssetList />;
      case currentPath === '/diary':
        return <DiaryList />;
      case currentPath === '/logout':
        // Handle logout logic: clear token and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('isAdmin');
        setIsAuthenticated(false);
        setIsAdmin(false);
        navigate('/login');
        return null; // Don't render anything while redirecting

      default:
        return <NotFound />;
    }
  };

  // Login and Register pages usually don't have the full layout
  const needsMainLayout = isAuthenticated && currentPath !== '/login' && currentPath !== '/register';

  if (needsMainLayout) {
    // Determine pageTitle for MainLayout dynamically
    let title = '个人管理系统';
    if (currentPath === '/dashboard') title = '导航页';
    else if (currentPath === '/change-password') title = '修改密码';
    else if (currentPath.startsWith('/admin/users')) title = '用户管理';
    else if (currentPath.startsWith('/booknote')) title = '读书笔记'; // This will be more specific in sub-pages
    else if (currentPath === '/booknote/add') title = '新增读书笔记';
    else if (currentPath.startsWith('/booknote/edit')) title = '编辑读书笔记';
    else if (currentPath === '/booknote/statistics') title = '读书笔记统计';
    // Add titles for other lists as they are implemented
    else if (currentPath === '/expenses') title = '支出管理';
    else if (currentPath === '/incomes') title = '收入管理';
    else if (currentPath === '/assets') title = '资产盘点';
    else if (currentPath === '/diary') title = '日记管理';

    return (
      <MainLayout pageTitle={title}>
        {renderContent()}
      </MainLayout>
    );
  } else {
    // Render content without MainLayout for login/register and 404 (if not authenticated)
    return renderContent();
  }
};

export default App;
