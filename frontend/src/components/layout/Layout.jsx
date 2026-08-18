import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AnimatedAdminBackground from '../common/AnimatedAdminBackground';
import AnimatedCustomerBackground from '../common/AnimatedCustomerBackground';

/**
 * Layout — Main application shell that wraps all authenticated pages.
 * Seamlessly integrates the "Business Boom" and "SUPER!" animated backgrounds
 * across all admin and customer pages with clear frosted glass contrast.
 */
export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const location = useLocation();

  const isCustomerRoute = location.pathname.startsWith('/customer');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <div className="app-layout" data-theme={theme} style={{ background: 'transparent' }}>
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Top Navbar */}
      <Navbar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      {/* Main Content with Route-Adaptive Animated Background */}
      <main
        className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        id="main-content"
        role="main"
        style={{ background: 'transparent', position: 'relative' }}
      >
        {isCustomerRoute ? (
          <AnimatedCustomerBackground>
            <div className="fade-in">
              <Outlet />
            </div>
          </AnimatedCustomerBackground>
        ) : (
          <AnimatedAdminBackground>
            <div className="fade-in">
              <Outlet />
            </div>
          </AnimatedAdminBackground>
        )}
      </main>
    </div>
  );
}
