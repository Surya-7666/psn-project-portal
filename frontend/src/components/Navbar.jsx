import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, LogOut, LayoutDashboard, Users } from 'lucide-react';

export default function Navbar({ admin, setAdmin }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('psncet_admin');
    setAdmin(null);
    navigate('/');
  };
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Official PSN Logo & Department Title */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <img
            src="/psn-logo.png"
            alt="PSN Institute of Higher Education and Research"
            className="h-9 sm:h-14 w-auto object-contain rounded shrink-0"
          />
          <div className="border-l border-slate-200 pl-2 sm:pl-3 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-xs sm:text-base whitespace-nowrap">
                Dept. of CSE
              </span>
              <span className="hidden lg:inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                IV-CSE Project Portal
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 truncate">
            PSNCET
            </p>
            <p className="sm:hidden text-[10px] font-medium text-slate-500 truncate">
              Project Portal
            </p>
          </div>
        </Link>

        {/* Thumb-Friendly Mobile & Desktop Navigation */}
        <nav className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <Link
            to="/"
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[40px] ${
              location.pathname === '/'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Guides</span>
          </Link>

          {admin ? (
            <>
              <Link
                to="/admin/dashboard"
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[40px] ${
                  location.pathname === '/admin/dashboard'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>HOD</span>
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors min-h-[40px] min-w-[40px] cursor-pointer"
                title="Logout Admin"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link
              to="/admin/login"
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors min-h-[40px] shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>HOD</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
