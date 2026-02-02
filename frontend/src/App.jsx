/**
 * Main App Component
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';
import ProtectedRoute from './components/ProtectedRoute';
import { isAdmin, canImport } from './utils/permissions';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CompaniesPage from './pages/CompaniesPage';
import ActivitiesPage from './pages/ActivitiesPage';
import AlertsPage from './pages/AlertsPage';
import ExcelPage from './pages/ExcelPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import MapPage from './pages/MapPage';
import KPIsPage from './pages/KPIsPage';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
          />

          {/* Private routes */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/companies" element={<CompaniesPage />} />
                    <Route path="/activities" element={<ActivitiesPage />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/alerts" element={<AlertsPage />} />
                    <Route path="/kpis" element={<KPIsPage />} />
                    <Route 
                      path="/excel" 
                      element={
                        <ProtectedRoute requirePermission={canImport}>
                          <ExcelPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/users" 
                      element={
                        <ProtectedRoute requirePermission={isAdmin}>
                          <UsersPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
