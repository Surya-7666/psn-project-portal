import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import {
  Search,
  X,
  UserCheck,
  Users,
  ChevronRight,
  BookOpen,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';

export default function Home() {
  const [guides, setGuides] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const { data } = await API.get('/guides');
        setGuides(data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'Unable to connect to backend server. Make sure backend is running on port 5000.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  const filteredGuides = guides.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.designation || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = guides.reduce((sum, g) => sum + (g.studentCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Mobile-First Hero Banner - Forest Emerald & Charcoal */}
      <div className="bg-emerald-950 text-white rounded-2xl p-4 sm:p-8 mb-5 sm:mb-8 shadow-sm border border-emerald-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/90 border border-emerald-700/70 text-emerald-200 text-[11px] sm:text-xs font-semibold mb-2.5">
              <CalendarDays className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>AY 2026–2027 • IV Year CSE</span>
            </div>
            <h1 className="text-lg sm:text-3xl font-bold tracking-tight leading-snug">
              Final Year Project Attendance &amp; Review Portal
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-base mt-1.5 sm:mt-2 max-w-2xl leading-relaxed">
              Tap your name below to view your batch, add project titles, and submit daily attendance.
            </p>
          </div>

          {/* 2-Column Mobile Stat Tiles */}
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-4 shrink-0">
            <div className="bg-emerald-900/75 border border-emerald-800 rounded-xl px-3.5 py-2.5 sm:px-5 sm:py-3.5 text-center sm:min-w-[120px]">
              <p className="text-lg sm:text-2xl font-bold text-emerald-300 leading-tight">
                {guides.length}
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-100/80 font-medium mt-0.5">
                Project Guides
              </p>
            </div>
            <div className="bg-emerald-900/75 border border-emerald-800 rounded-xl px-3.5 py-2.5 sm:px-5 sm:py-3.5 text-center sm:min-w-[120px]">
              <p className="text-lg sm:text-2xl font-bold text-amber-400 leading-tight">
                {totalStudents}
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-100/80 font-medium mt-0.5">
                Total Students
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky/Accessible Mobile Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-baseline justify-between sm:block">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Select Project Guide</h2>
          <p className="text-[11px] sm:text-xs text-slate-500">
            {filteredGuides.length} of {guides.length} faculty
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search faculty name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700 transition-all min-h-[44px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3.5 sm:p-4 mb-5 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">Connection Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse h-24 sm:h-36"
            />
          ))}
        </div>
      ) : filteredGuides.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center">
          <BookOpen className="w-9 h-9 text-slate-300 mx-auto mb-2.5" />
          <h3 className="text-sm sm:text-base font-semibold text-slate-800">
            No Project Guides Found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {guides.length === 0
              ? 'The HOD / Admin has not assigned any Project Guides yet.'
              : 'Try searching with a different faculty name.'}
          </p>
        </div>
      ) : (
        /* Responsive Faculty Directory: Compact Touch Cards on Mobile, Rich Grid on Desktop */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
          {filteredGuides.map((guide, index) => (
            <Link
              key={guide._id}
              to={`/guide/${guide._id}`}
              className="group bg-white border border-slate-200 hover:border-emerald-700 active:bg-emerald-50/40 active:scale-[0.99] rounded-2xl p-3.5 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Top / Mobile Compact Row */}
              <div className="flex items-center sm:items-start justify-between gap-3">
                <div className="flex items-center sm:block gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="min-w-0 sm:mt-3.5">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug break-words group-hover:text-emerald-800 transition-colors">
                      {guide.name}
                    </h3>
                    {guide.designation && (
                      <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-0.5 truncate">
                        {guide.designation}
                      </p>
                    )}
                    {/* Mobile-only inline batch badge */}
                    <div className="sm:hidden flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full">
                        <Users className="w-3 h-3 text-amber-600" />
                        {guide.studentCount || 0} Students
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop Student Count Badge */}
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 shrink-0">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  {guide.studentCount || 0} Students
                </span>

                {/* Mobile Right Chevron */}
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 shrink-0 sm:hidden" />
              </div>

              {/* Desktop Card Footer */}
              <div className="hidden sm:flex mt-4 pt-3 border-t border-slate-100 items-center justify-between text-xs font-semibold text-emerald-700">
                <span className="inline-flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  Open Workspace &amp; Attendance
                </span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}