import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

// 1. 创建 Context 对象
// 默认值将用于在没有 Provider 包装的组件中使用 Context 时，或者在 Context 初始化时。
const AppContext = createContext({
  isAuthenticated: false,
  isAdmin: false,
  userId: null,
  setAuthStatus: () => {}, // 提供一个空函数作为默认值
  logout: () => {}, // 提供一个空函数作为默认值
});

// 2. 创建 Context Provider 组件
export const AppProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Track if auth status is being loaded

  // Function to update authentication status
  // This can be called from login/logout components
  const setAuthStatus = useCallback((authData) => {
    // authData should contain { token: string, userId: string, isAdmin: boolean }
    if (authData && authData.token) {
      localStorage.setItem('authToken', authData.token);
      localStorage.setItem('userId', authData.userId);
      localStorage.setItem('isAdmin', authData.isAdmin); // Store isAdmin as string
      setIsAuthenticated(true);
      setIsAdmin(authData.isAdmin);
      setUserId(authData.userId);
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('isAdmin');
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUserId(null);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setAuthStatus(null); // Clear all auth data
    // Redirect to login page
    window.location.href = '/login';
  }, [setAuthStatus]);

  // Initial check of authentication status from localStorage on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUserId = localStorage.getItem('userId');
    const storedIsAdmin = localStorage.getItem('isAdmin') === 'true'; // Convert string to boolean

    if (token && storedUserId) {
      setIsAuthenticated(true);
      setIsAdmin(storedIsAdmin);
      setUserId(storedUserId);
    }
    setIsLoadingAuth(false); // Auth status has been loaded
  }, []);

  // The value prop contains the state and functions to be shared
  const contextValue = {
    isAuthenticated,
    isAdmin,
    userId,
    setAuthStatus,
    logout,
    isLoadingAuth, // Provide loading status
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// 3. 自定义 Hook，方便组件使用 Context
export const useAppContext = () => {
  return useContext(AppContext);
};

export default AppContext;
