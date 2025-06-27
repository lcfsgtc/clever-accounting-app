import React, { useState, useEffect } from 'react';
import MainLayout from './pages/MainLayout.jsx'; // 导入主布局组件

// 导入所有重构后的页面组件
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ChangePassword from './pages/auth/ChangePassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import UserList from './pages/admin/UserList.jsx';
import UserEdit from './pages/admin/UserEdit.jsx';
import BookNoteList from './pages/booknotes/BookNoteList.jsx';
import BookNoteAdd from './pages/booknotes/BookNoteAdd.jsx';
import BookNoteEdit from './pages/booknotes/BookNoteEdit.jsx';
import BookNoteStatistics from './pages/booknotes/BookNoteStatistics.jsx';
import ExpenseList from './pages/expenses/ExpenseList.jsx';
import IncomeList from './pages/incomes/IncomeList.jsx';
import IncomeAdd from './pages/incomes/IncomeAdd.jsx';
import IncomeEdit from './pages/incomes/IncomeEdit.jsx';
import IncomeStatistics from './pages/incomes/IncomeStatistics.jsx';
import AssetList from './pages/assets/AssetList.jsx';
import DiaryList from './pages/diary/DiaryList.jsx';
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
    // 如果未认证且不在登录/注册页，则重定向到登录页
    if (!token && currentPath !== '/login' && currentPath !== '/register') {
      window.history.pushState({}, '', '/login');
      setCurrentPath('/login');
    }
    // 如果已认证且在登录/注册页，则重定向到仪表板
    else if (token && (currentPath === '/login' || currentPath === '/register')) {
      window.history.pushState({}, '', '/dashboard');
      setCurrentPath('/dashboard');
    }
    // --- 修改点 START ---
    // 如果用户已认证，并且当前路径是根路径 '/'，也应视为导航页
    else if (token && currentPath === '/') {
        window.history.pushState({}, '', '/dashboard'); // 统一跳转到 /dashboard
        setCurrentPath('/dashboard');
    }
    // --- 修改点 END ---

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
      // 如果我们已经在登录/注册页，则不再重定向
      return <Login />; // 未认证时的默认回退
    }

    // 处理受保护的路由
    switch (true) {
      // --- 修改点 START ---
      // 同时匹配 '/' 和 '/dashboard' 到 Dashboard 组件
      case currentPath === '/' || currentPath === '/dashboard':
        return <Dashboard isAdmin={isAdmin} />;
      // --- 修改点 END ---
      case currentPath === '/change-password':
        return <ChangePassword />;

      // Book Notes routes
      case currentPath === '/booknote':
        return <BookNoteList />;
      case currentPath === '/booknote/add':
        return <BookNoteAdd />;
      case currentPath.startsWith('/booknote/edit/'):
        const bookNoteId = currentPath.split('/').pop();
        // 检查解析出的 bookNoteId 是否有效
        console.log('App.jsx - Parsed bookNoteId for edit:', bookNoteId); // 调试日志
        if (!bookNoteId || bookNoteId === '' || bookNoteId === 'undefined') { // 增加对 'undefined' 字符串的检查
          return <NotFound />; // 如果 ID 无效，渲染 404 页面
        }
        return <BookNoteEdit bookNoteId={bookNoteId} />; // 将 ID 作为 prop 传递
      case currentPath === '/booknote/statistics':
        return <BookNoteStatistics />;

      // Admin routes (only for admins)
      case currentPath === '/admin/users':
        return isAdmin ? <UserList /> : <NotFound />; // Show 404 or unauthorized for non-admins
      case currentPath.startsWith('/admin/users/edit/'):
        const userId = currentPath.split('/').pop();
        // 检查解析出的 userId 是否有效
        console.log('App.jsx - Parsed userId for edit:', userId); // 调试日志
        if (!userId || userId === '' || userId === 'undefined') { // 增加对 'undefined' 字符串的检查
          return <NotFound />;
        }
        return isAdmin ? <UserEdit userId={userId} /> : <NotFound />;

      // Placeholder routes for other modules
      case currentPath === '/expenses':
        return <ExpenseList />;
      case currentPath === '/incomes':
        return <IncomeList />;
      case currentPath === '/incomes/add':
        return <IncomeAdd />;
      case currentPath.startsWith('/incomes/edit/'):
        const incomeId = currentPath.split('/').pop();
        // 确保从 URL 中解析出的 incomeId 不是 undefined、空字符串或 'undefined' 字符串本身
        console.log('App.jsx - Parsed incomeId for edit:', incomeId); // 调试日志
        if (!incomeId || incomeId === '' || incomeId === 'undefined') {
          // 如果解析出的 ID 无效，返回一个 NotFound 组件或者一个错误提示
          return <NotFound />;
        }
        return <IncomeEdit incomeId={incomeId} />; // 将 incomeId 作为 prop 传递给 IncomeEdit
      case currentPath === '/incomes/statistics':
        return <IncomeStatistics />;
      case currentPath === '/assets':
        return <AssetList />;
      case currentPath === '/diary':
        return <DiaryList />;
      case currentPath === '/logout':
        // 处理登出逻辑：清除 token 并重定向到登录页
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('isAdmin');
        setIsAuthenticated(false);
        setIsAdmin(false);
        navigate('/login');
        return null; // 重定向时，不渲染任何内容

      default:
        return <NotFound />; // 未匹配的路径
    }
  };

  // 登录和注册页面通常不包含完整的布局
  const needsMainLayout = isAuthenticated && currentPath !== '/login' && currentPath !== '/register';

  if (needsMainLayout) {
    // 动态确定 MainLayout 的 pageTitle
    let title = '个人管理系统';
    // --- 修改点 START ---
    // 如果当前路径是根路径或仪表板路径，则标题为 '导航页'
    if (currentPath === '/' || currentPath === '/dashboard') title = '导航页';
    // --- 修改点 END ---
    else if (currentPath === '/change-password') title = '修改密码';
    else if (currentPath.startsWith('/admin/users')) title = '用户管理';
    else if (currentPath.startsWith('/booknote')) title = '读书笔记'; // 这将在子页面中更具体
    else if (currentPath === '/booknote/add') title = '新增读书笔记';
    else if (currentPath.startsWith('/booknote/edit')) title = '编辑读书笔记';
    else if (currentPath === '/booknote/statistics') title = '读书笔记统计';
    // 为其他列表添加标题
    else if (currentPath === '/expenses') title = '支出管理';
    else if (currentPath === '/incomes') title = '收入管理';
    else if (currentPath === '/incomes/add') title = '新增收入记录';
    else if (currentPath.startsWith('/incomes/edit/')) title = '编辑收入记录'; // 为编辑页面添加标题
    else if (currentPath === '/incomes/statistics') title = '收入统计';
    else if (currentPath === '/assets') title = '资产盘点';
    else if (currentPath === '/diary') title = '日记管理';

    return (
      <MainLayout pageTitle={title}>
        {renderContent()}
      </MainLayout>
    );
  } else {
    // 对于登录/注册和 404（如果未认证）页面，渲染不带 MainLayout 的内容
    return renderContent();
  }
};

export default App;
