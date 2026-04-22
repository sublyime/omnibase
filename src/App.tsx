import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Explorer from './pages/Explorer';
import Security from './pages/Security';

// Dummy components for missing pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-enterprise-accent border border-gray-100">
      <h2 className="text-2xl font-bold uppercase">{title[0]}</h2>
    </div>
    <h1 className="text-2xl font-bold">{title}</h1>
    <p className="text-gray-500 max-w-sm">This enterprise module is currently under architectural review and will be available in the next deployment cycle.</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/explorer" element={<Layout><Explorer /></Layout>} />
        <Route path="/security" element={<Layout><Security /></Layout>} />
        <Route path="/admin" element={<Layout><Placeholder title="Admin & IAM" /></Layout>} />
        <Route path="/billing" element={<Layout><Placeholder title="Subscription & Billing" /></Layout>} />
        <Route path="/database" element={<Layout><Placeholder title="SQL & Data Infrastructure" /></Layout>} />
        <Route path="/settings" element={<Layout><Placeholder title="Global Settings" /></Layout>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

