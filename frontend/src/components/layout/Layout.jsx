/**
 * Main Layout Component
 */
import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Chatbot } from '../chatbot/Chatbot';

export const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>

      {/* Chatbot Widget */}
      <Chatbot />
    </div>
  );
};

export default Layout;
