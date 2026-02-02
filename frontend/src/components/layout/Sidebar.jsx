/**
 * Sidebar Component
 */
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Bell,
  FileSpreadsheet,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Map,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { isAdmin, canModify, canImport } from '../../utils/permissions';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, requiresAuth: true },
  { name: 'Entreprises', href: '/companies', icon: Building2, requiresAuth: true },
  { name: 'Activités', href: '/activities', icon: Calendar, requiresAuth: true },
  // { name: 'Carte', href: '/map', icon: Map, requiresAuth: true },
  { name: 'Alertes', href: '/alerts', icon: Bell, requiresAuth: true ,requiresPermission: canModify},
  { name: 'KPIs', href: '/kpis', icon: BarChart3, requiresAuth: true },
  { name: 'Import Excel', href: '/excel', icon: FileSpreadsheet, requiresPermission: canImport },
  { name: 'Utilisateurs', href: '/users', icon: Users, requiresPermission: isAdmin },
  { name: 'Paramètres', href: '/settings', icon: Settings, requiresAuth: true, requiresPermission: isAdmin },
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuthStore();

  // Filter navigation based on user permissions
  const visibleNavigation = navigation.filter((item) => {
    if (item.requiresPermission) {
      return item.requiresPermission(user);
    }
    return item.requiresAuth;
  });

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 min-h-screen transition-all duration-300 ease-in-out relative shadow-2xl`}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="px-4 py-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            {!isCollapsed ? (
              <div className="flex items-center space-x-3">
                <img 
                  src="/logobg.png" 
                  alt="CCIS Logo" 
                  className="h-12 w-12 object-contain"
                />
                <div>
                  <h2 className="text-white font-bold text-lg">CCIS Vision</h2>
                  <p className="text-xs text-gray-400">Rabat-Salé-Kénitra</p>
                </div>
              </div>
            ) : (
              <div className="mx-auto">
                <img 
                  src="/logobg.png" 
                  alt="CCIS Logo" 
                  className="h-10 w-10 object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* User Info Section */}
        {user && (
          <div className="px-4 py-4 border-b border-gray-700/50">
            {!isCollapsed ? (
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {user.fullName?.charAt(0) || user.username?.charAt(0) || 'U'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.fullName || user.username}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user.roleName || 'Utilisateur'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {user.fullName?.charAt(0) || user.username?.charAt(0) || 'U'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {visibleNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed ? 'justify-center px-3' : 'gap-3 px-4'
                } py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/50'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
              title={isCollapsed ? item.name : ''}
            >
              <item.icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-700/50">
          {!isCollapsed ? (
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              CCIS Rabat-Salé-Kénitra
              <br />
              <span className="text-gray-500">Version 1.0.0</span>
            </p>
          ) : (
            <p className="text-xs text-gray-500 text-center">v1.0</p>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-gray-900 hover:bg-gray-800 text-white rounded-full p-1.5 shadow-lg border-2 border-gray-700 transition-all duration-200 hover:scale-110"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
};

export default Sidebar;
