import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import GuideWorkspace from './pages/GuideWorkspace';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  // Use sessionStorage so closing the browser/tab automatically logs out the HOD
  const [admin, setAdmin] = useState(() => {
    try {
      const saved = sessionStorage.getItem('psncet_admin');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Wipe any old persistent localStorage login from earlier sessions
  useEffect(() => {
    localStorage.removeItem('psncet_admin');
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Navbar admin={admin} setAdmin={setAdmin} />
        <main className="flex-1">
          <Routes>
            {/* Always opens the Faculty / Guide directory first */}
            <Route path="/" element={<Home />} />
            <Route path="/guide/:guideId" element={<GuideWorkspace />} />
            <Route path="/admin/login" element={<AdminLogin setAdmin={setAdmin} />} />
            <Route
              path="/admin/dashboard"
              element={
                admin ? <AdminDashboard admin={admin} /> : <Navigate to="/admin/login" replace />
              }
            />
            {/* Fallback any unknown route to the Guide Page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Subtle Institutional & Developer Watermark Footer */}
        <footer className="bg-white border-t border-slate-200/90 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <p className="text-[11px] sm:text-xs text-slate-500">
              PSN Institute of Higher Education and Research • Dept. of CSE
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Designed &amp; Developed by{' '}
              <span className="font-semibold text-emerald-900">
                Surya Perumal Jeyapandi
              </span>{' '}
              <span className="text-slate-400">• IV-CSE</span>
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}