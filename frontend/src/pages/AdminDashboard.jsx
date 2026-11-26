import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import API from '../api/axios';
import {
  Users,
  UserPlus,
  Trash2,
  Edit3,
  CheckCircle2,
  Calendar,
  Search,
  ShieldCheck,
  AlertCircle,
  Save,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export default function AdminDashboard({ admin }) {
  const navigate = useNavigate();

  const getTodayString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    return local.toISOString().split('T')[0];
  };

  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'guides' | 'students'

  // Core Data
  const [guides, setGuides] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Filters
  const [filterDate, setFilterDate] = useState(getTodayString());
  const [filterGuideId, setFilterGuideId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('all'); // 'all' | 'shortage' | 'zeroth_absent'

  // Excel Report Range Mode: 'week' | 'month' | 'all'
  const [reportRange, setReportRange] = useState('week');
  const [exporting, setExporting] = useState(false);

  // Add Guide Form (No designation added automatically)
  const [newGuideName, setNewGuideName] = useState('');
  const [addingGuide, setAddingGuide] = useState(false);

  // Edit Student Inline Modal
  const [editingStudent, setEditingStudent] = useState(null);

  // Feedback
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
    }
  }, [admin, navigate]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filterDate) queryParams.append('date', filterDate);
      if (filterGuideId) queryParams.append('guideId', filterGuideId);

      const [guidesRes, studentsRes, attRes] = await Promise.all([
        API.get('/guides'),
        API.get('/students'),
        API.get(`/attendance?${queryParams.toString()}`),
      ]);

      setGuides(guidesRes.data);
      setStudents(studentsRes.data);
      setAttendanceRecords(attRes.data);
    } catch (err) {
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Error loading dashboard data.',
      });
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterGuideId]);

  useEffect(() => {
    if (admin) {
      fetchAllData();
    }
  }, [admin, fetchAllData]);

  // --- HELPER: Format Date to YYYY-MM-DD in local time ---
  const toYMD = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // --- HELPER: Generate working weekdays (Mon-Fri only, excluding Sat & Sun) ---
  const getWorkingWeekdays = (rangeType, anchorDateStr, allLogs) => {
    const anchor = anchorDateStr ? new Date(`${anchorDateStr}T00:00:00`) : new Date();
    const dates = [];

    if (rangeType === 'week') {
      const day = anchor.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(anchor);
      monday.setDate(anchor.getDate() + diffToMonday);

      for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(toYMD(d));
      }
      return dates;
    }

    if (rangeType === 'month') {
      const year = anchor.getFullYear();
      const month = anchor.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          dates.push(toYMD(d));
        }
      }
      return dates;
    }

    const sortedLogDates = allLogs
      .map((l) => l.date)
      .filter(Boolean)
      .sort();

    const startStr = sortedLogDates.length > 0 ? sortedLogDates[0] : toYMD(anchor);
    const endStr =
      sortedLogDates.length > 0
        ? sortedLogDates[sortedLogDates.length - 1] > toYMD(anchor)
          ? sortedLogDates[sortedLogDates.length - 1]
          : toYMD(anchor)
        : toYMD(anchor);

    const start = new Date(`${startStr}T00:00:00`);
    const end = new Date(`${endStr}T00:00:00`);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(toYMD(d));
      }
    }
    return dates;
  };

  // --- EXCEL REPORT EXPORT (1 Week Mon-Fri / 1 Month / Till Last) ---
  const handleDownloadExcel = async () => {
    try {
      setExporting(true);
      setBanner({ type: '', text: '' });

      const params = new URLSearchParams();
      if (filterGuideId) params.append('guideId', filterGuideId);
      const { data: allLogs } = await API.get(`/attendance?${params.toString()}`);

      const workingDates = getWorkingWeekdays(reportRange, filterDate, allLogs);
      const workingDateSet = new Set(workingDates);

      const targetStudents = filterGuideId
        ? students.filter((s) => (s.guideId?._id || s.guideId) === filterGuideId)
        : students;

      const logLookup = {};
      allLogs.forEach((rec) => {
        const sId = rec.studentId?._id || rec.studentId;
        if (sId && rec.date) {
          logLookup[`${sId}_${rec.date}`] = {
            status: rec.status,
            remark: rec.remark || '',
          };
        }
      });

      const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      // SHEET 1: Day-by-Day Attendance Register (Mon - Fri only)
      const registerRows = targetStudents.map((stu, idx) => {
        const row = {
          'S.No': idx + 1,
          'Student Name': stu.name,
          'Project Title': stu.projectTitle,
          'Project Guide': stu.guideId?.name || 'Unassigned',
        };

        let rangePresentOrOD = 0;
        let rangeMarkedDays = 0;

        workingDates.forEach((dateStr) => {
          const dObj = new Date(`${dateStr}T00:00:00`);
          const colHeader = `${dateStr} (${dayShortNames[dObj.getDay()]})`;
          const entry = logLookup[`${stu._id}_${dateStr}`];

          if (entry) {
            rangeMarkedDays += 1;
            if (entry.status === 'Present' || entry.status === 'OD') {
              rangePresentOrOD += 1;
            }
            row[colHeader] =
              entry.status === 'Present' ? 'P' : entry.status === 'Absent' ? 'A' : 'OD';
          } else {
            row[colHeader] = '-';
          }
        });

        row['Working Days Marked'] = rangeMarkedDays;
        row['Present / OD'] = rangePresentOrOD;
        row['Period %'] =
          rangeMarkedDays > 0
            ? `${Math.round((rangePresentOrOD / rangeMarkedDays) * 100)}%`
            : '0%';

        return row;
      });

      // SHEET 2: Detailed Remarks & Logs for the selected period (Mon - Fri)
      const detailedRows = allLogs
        .filter((rec) => workingDateSet.has(rec.date))
        .map((rec, idx) => ({
          'S.No': idx + 1,
          Date: rec.date,
          Day: dayShortNames[new Date(`${rec.date}T00:00:00`).getDay()],
          'Student Name': rec.studentId?.name || 'Unknown Student',
          'Project Title': rec.studentId?.projectTitle || '',
          'Project Guide': rec.guideId?.name || '',
          Status: rec.status,
          Remark: rec.remark || '',
          'HOD Verified': rec.editedByAdmin ? 'Yes' : 'No',
        }));

      const workbook = XLSX.utils.book_new();

      const registerSheet = XLSX.utils.json_to_sheet(
        registerRows.length > 0 ? registerRows : [{ Info: 'No student records found.' }]
      );
      registerSheet['!cols'] = [
        { wch: 6 },
        { wch: 26 },
        { wch: 46 },
        { wch: 26 },
        ...workingDates.map(() => ({ wch: 16 })),
        { wch: 18 },
        { wch: 14 },
        { wch: 12 },
      ];

      const sheet1Title =
        reportRange === 'week'
          ? 'Weekly Register (Mon-Fri)'
          : reportRange === 'month'
          ? 'Monthly Register (Mon-Fri)'
          : 'Full Register (Till Last)';

      XLSX.utils.book_append_sheet(workbook, registerSheet, sheet1Title);

      const detailedSheet = XLSX.utils.json_to_sheet(
        detailedRows.length > 0
          ? detailedRows
          : [{ Info: 'No attendance logs recorded in this period yet.' }]
      );
      detailedSheet['!cols'] = [
        { wch: 6 },
        { wch: 13 },
        { wch: 8 },
        { wch: 26 },
        { wch: 46 },
        { wch: 26 },
        { wch: 12 },
        { wch: 28 },
        { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Logs & Remarks');

      const selectedGuideObj = guides.find((g) => g._id === filterGuideId);
      const guideTag = selectedGuideObj
        ? `_${selectedGuideObj.name.replace(/[^a-zA-Z0-9]/g, '_')}`
        : '_All_Guides';

      const periodTag =
        reportRange === 'week'
          ? `Week_${workingDates[0]}_to_${workingDates[workingDates.length - 1]}`
          : reportRange === 'month'
          ? `Month_${(filterDate || getTodayString()).slice(0, 7)}`
          : `Till_Last_${workingDates[workingDates.length - 1]}`;

      XLSX.writeFile(workbook, `PSN_CSE_Attendance_${periodTag}${guideTag}.xlsx`);

      setBanner({
        type: 'success',
        text: `Downloaded Excel report (${periodTag.replace(/_/g, ' ')}, Mon–Fri working days only)!`,
      });
    } catch (err) {
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Failed to export Excel report.',
      });
    } finally {
      setExporting(false);
    }
  };

  // --- GUIDE ACTIONS ---
  const handleCreateGuide = async (e) => {
    e.preventDefault();
    if (!newGuideName.trim()) return;

    try {
      setAddingGuide(true);
      setBanner({ type: '', text: '' });
      await API.post('/guides', {
        name: newGuideName.trim().toUpperCase(),
        designation: '',
      });
      setNewGuideName('');
      setBanner({ type: 'success', text: 'New Project Guide assigned successfully!' });
      await fetchAllData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Failed to add guide.',
      });
    } finally {
      setAddingGuide(false);
    }
  };

  const handleDeleteGuide = async (id, name) => {
    if (!window.confirm(`Remove guide "${name}" and all their assigned students/records?`)) {
      return;
    }

    try {
      await API.delete(`/guides/${id}`);
      setBanner({ type: 'success', text: `Guide ${name} removed.` });
      await fetchAllData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete guide.',
      });
    }
  };

  // --- ATTENDANCE OVERRIDE ACTION (HOD ONLY) ---
  const handleOverrideAttendance = async (recordId, newStatus) => {
    try {
      await API.put(`/attendance/${recordId}`, { status: newStatus });
      setBanner({
        type: 'success',
        text: `Attendance updated to ${newStatus} (HOD Verified).`,
      });
      await fetchAllData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update attendance.',
      });
    }
  };

  // --- STUDENT EDIT & DELETE ACTIONS ---
  const handleSaveStudentEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      await API.put(`/students/${editingStudent._id}`, {
        name: editingStudent.name.toUpperCase(),
        projectTitle: editingStudent.projectTitle.toUpperCase(),
        guideId: editingStudent.guideId?._id || editingStudent.guideId,
      });
      setEditingStudent(null);
      setBanner({ type: 'success', text: 'Student details updated successfully!' });
      await fetchAllData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update student.',
      });
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Delete student "${name}" and their attendance history?`)) return;

    try {
      await API.delete(`/students/${id}`);
      setBanner({ type: 'success', text: `Student ${name} deleted.` });
      await fetchAllData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete student.',
      });
    }
  };

  if (!admin) return null;

  const presentTotal = attendanceRecords.filter((r) => r.status === 'Present').length;
  const absentTotal = attendanceRecords.filter((r) => r.status === 'Absent').length;
  const odTotal = attendanceRecords.filter((r) => r.status === 'OD').length;

  const shortageCount = students.filter((s) => (s.attendancePercentage ?? 0) < 75).length;
  const zerothAbsentCount = students.filter((s) =>
    (s.projectTitle || '').toUpperCase().includes('ABSENT FOR ZEROTH REVIEW')
  ).length;

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.projectTitle.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.guideId?.name || '').toLowerCase().includes(studentSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (studentStatusFilter === 'shortage') {
      return (s.attendancePercentage ?? 0) < 75;
    }
    if (studentStatusFilter === 'zeroth_absent') {
      return (s.projectTitle || '').toUpperCase().includes('ABSENT FOR ZEROTH REVIEW');
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Admin Header - Forest Emerald & Charcoal */}
      <div className="bg-emerald-950 text-white rounded-2xl p-4 sm:p-8 mb-5 sm:mb-6 shadow-sm border border-emerald-900 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/90 border border-emerald-700/70 text-emerald-200 text-[11px] sm:text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Department Admin Control</span>
          </div>
          <h1 className="text-lg sm:text-3xl font-bold leading-snug break-words">{admin.name}</h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm mt-1">
            Assign project guides, edit locked attendance, and export Mon–Fri Excel reports.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-emerald-900/75 border border-emerald-800 rounded-xl px-3 py-2.5 text-center">
              <p className="text-lg sm:text-2xl font-bold text-emerald-300">{guides.length}</p>
              <p className="text-[11px] text-emerald-100/75">Guides</p>
            </div>
            <div className="bg-emerald-900/75 border border-emerald-800 rounded-xl px-3 py-2.5 text-center">
              <p className="text-lg sm:text-2xl font-bold text-amber-400">{students.length}</p>
              <p className="text-[11px] text-emerald-100/75">Students</p>
            </div>
            <div className="bg-emerald-900/75 border border-emerald-800 rounded-xl px-3 py-2.5 text-center">
              <p className="text-lg sm:text-2xl font-bold text-white">{attendanceRecords.length}</p>
              <p className="text-[11px] text-emerald-100/75 truncate">
                {filterDate || 'All Logs'}
              </p>
            </div>
          </div>

          {/* Report Period Selector + Download Excel */}
          <div className="flex flex-col gap-2 bg-emerald-900/80 border border-emerald-800 p-2.5 rounded-xl">
            <select
              value={reportRange}
              onChange={(e) => setReportRange(e.target.value)}
              className="bg-emerald-950 text-emerald-50 text-xs font-semibold px-3 py-2 rounded-lg border border-emerald-700 focus:outline-none focus:border-amber-400 min-h-[38px]"
            >
              <option value="week">1 Week (Mon – Fri)</option>
              <option value="month">1 Month (Mon – Fri)</option>
              <option value="all">Till Last Date (Mon – Fri)</option>
            </select>

            <button
              onClick={handleDownloadExcel}
              disabled={exporting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-500 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer shadow-xs min-h-[40px]"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>{exporting ? 'Generating...' : 'Download Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {banner.text && (
        <div
          className={`rounded-xl p-3.5 sm:p-4 mb-5 flex items-center justify-between gap-2 text-xs sm:text-sm font-medium border ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="break-words">{banner.text}</span>
          </div>
          <button
            onClick={() => setBanner({ type: '', text: '' })}
            className="text-slate-400 hover:text-slate-700 p-1 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Responsive 3-Tab Switcher */}
      <div className="grid grid-cols-3 sm:flex gap-1.5 sm:gap-2 mb-5 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-2.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer min-h-[42px] text-center ${
            activeTab === 'attendance'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Attendance
        </button>

        <button
          onClick={() => setActiveTab('guides')}
          className={`px-2.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer min-h-[42px] text-center ${
            activeTab === 'guides'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Guides ({guides.length})
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-2.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer min-h-[42px] text-center ${
            activeTab === 'students'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Students ({students.length})
        </button>
      </div>

      {/* TAB 1: DAILY ATTENDANCE MONITOR (HOD OVERRIDE ENABLED) */}
      {activeTab === 'attendance' && (
        <div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 mb-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2.5 sm:gap-3">
              <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 min-h-[44px]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="text-sm font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
                {filterDate && (
                  <button
                    onClick={() => setFilterDate('')}
                    className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                  >
                    All Dates
                  </button>
                )}
              </div>

              <select
                value={filterGuideId}
                onChange={(e) => setFilterGuideId(e.target.value)}
                className="w-full lg:w-64 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-700 min-h-[44px]"
              >
                <option value="">All Project Guides</option>
                {guides.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-3 sm:flex items-center gap-2">
                <span className="text-center text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800">
                  Present: {presentTotal}
                </span>
                <span className="text-center text-xs font-bold px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700">
                  Absent: {absentTotal}
                </span>
                <span className="text-center text-xs font-bold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800">
                  OD: {odTotal}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:flex items-center gap-2">
                <select
                  value={reportRange}
                  onChange={(e) => setReportRange(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-emerald-700 min-h-[38px]"
                >
                  <option value="week">1 Week (Mon–Fri)</option>
                  <option value="month">1 Month (Mon–Fri)</option>
                  <option value="all">Till Last (Mon–Fri)</option>
                </select>

                <button
                  onClick={handleDownloadExcel}
                  disabled={exporting}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer min-h-[38px]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                  <span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
              Loading attendance records...
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
              <p className="text-slate-800 font-semibold text-sm sm:text-base">
                No Attendance Records Found
              </p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                No guides have submitted attendance for the selected filter yet.
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE CARDS (< 768px) */}
              <div className="md:hidden space-y-3">
                {attendanceRecords.map((rec) => (
                  <div
                    key={rec._id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        {rec.date}
                      </span>
                      <span className="font-semibold text-slate-600 truncate">
                        {rec.guideId?.name || '—'}
                      </span>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {rec.studentId?.name || 'Unknown Student'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {rec.studentId?.projectTitle}
                      </p>
                    </div>

                    {rec.remark && (
                      <p className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        Remark: {rec.remark}
                      </p>
                    )}

                    {rec.editedByAdmin && (
                      <p className="text-[11px] font-semibold text-emerald-800">
                        Verified / Edited by HOD
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {['Present', 'Absent', 'OD'].map((st) => (
                        <button
                          key={st}
                          onClick={() => handleOverrideAttendance(rec._id, st)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer min-h-[40px] ${
                            rec.status === st
                              ? st === 'Present'
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : st === 'Absent'
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-amber-600 text-white border-amber-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE (>= 768px) */}
              <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Student &amp; Project</th>
                        <th className="py-3.5 px-4">Project Guide</th>
                        <th className="py-3.5 px-4">Remark</th>
                        <th className="py-3.5 px-4 text-center">HOD Status Override</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {attendanceRecords.map((rec) => (
                        <tr key={rec._id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                            {rec.date}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-900">
                              {rec.studentId?.name || 'Unknown Student'}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {rec.studentId?.projectTitle}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                            {rec.guideId?.name || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            {rec.remark || '—'}
                            {rec.editedByAdmin && (
                              <span className="block text-[11px] font-semibold text-emerald-800 mt-0.5">
                                Edited by HOD
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {['Present', 'Absent', 'OD'].map((st) => (
                                <button
                                  key={st}
                                  onClick={() => handleOverrideAttendance(rec._id, st)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                    rec.status === st
                                      ? st === 'Present'
                                        ? 'bg-emerald-700 text-white border-emerald-700'
                                        : st === 'Absent'
                                        ? 'bg-rose-600 text-white border-rose-600'
                                        : 'bg-amber-600 text-white border-amber-600'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: ASSIGN & MANAGE GUIDES */}
      {activeTab === 'guides' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <form
            onSubmit={handleCreateGuide}
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs h-fit"
          >
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base mb-3.5">
              <UserPlus className="w-5 h-5 text-emerald-700 shrink-0" />
              <h2>Assign New Project Guide</h2>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Faculty Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., MS. V. AATHEESHWARI"
                  value={newGuideName}
                  onChange={(e) => setNewGuideName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:bg-white focus:outline-none focus:border-emerald-700 min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                disabled={addingGuide}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-emerald-800 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer min-h-[44px]"
              >
                {addingGuide ? 'Assigning...' : '+ Assign Guide'}
              </button>
            </div>
          </form>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                Assigned CSE Project Guides
              </h2>
              <span className="text-xs font-semibold text-slate-500">{guides.length} Total</span>
            </div>

            {guides.length === 0 ? (
              <div className="p-8 text-center text-xs sm:text-sm text-slate-500">
                No Project Guides assigned yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {guides.map((g, idx) => (
                  <div
                    key={g._id}
                    className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-100 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm break-words">
                          {g.name}
                        </p>
                        {g.designation && (
                          <p className="text-[11px] text-slate-500">{g.designation}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70">
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        {g.studentCount || 0}
                      </span>

                      <button
                        onClick={() => handleDeleteGuide(g._id, g.name)}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                        title="Remove Guide"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ALL STUDENTS & PROJECT TITLES (WITH SHORTAGE & ZEROTH ABSENTEE FILTERS) */}
      {activeTab === 'students' && (
        <div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 mb-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                Department Student Directory ({filteredStudents.length})
              </h2>
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search student, project, or guide..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:bg-white focus:outline-none focus:border-emerald-700 min-h-[44px]"
                />
              </div>
            </div>

            {/* Quick Shortage & Absentee Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStudentStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer min-h-[36px] ${
                  studentStatusFilter === 'all'
                    ? 'bg-emerald-900 text-white border-emerald-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Students ({students.length})
              </button>

              <button
                type="button"
                onClick={() => setStudentStatusFilter('shortage')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer min-h-[36px] ${
                  studentStatusFilter === 'shortage'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
              >
                Shortage &lt; 75% ({shortageCount})
              </button>

              <button
                type="button"
                onClick={() => setStudentStatusFilter('zeroth_absent')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer min-h-[36px] ${
                  studentStatusFilter === 'zeroth_absent'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                Absent for Zeroth Review ({zerothAbsentCount})
              </button>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
              <p className="text-sm font-semibold text-slate-800">No matching students found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try switching the filter pill or clearing the search box.
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE STUDENT CARDS (< 768px) */}
              <div className="md:hidden space-y-3">
                {filteredStudents.map((stu, idx) => (
                  <div
                    key={stu._id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-500 mr-1.5">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{stu.name}</span>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {stu.projectTitle}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          stu.attendancePercentage >= 75
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {stu.attendancePercentage}%
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-emerald-800 truncate">
                        {stu.guideId?.name || 'Unassigned'}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingStudent(stu)}
                          className="p-2 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(stu._id, stu.name)}
                          className="p-2 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 cursor-pointer"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP STUDENT TABLE (>= 768px) */}
              <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                        <th className="py-3.5 px-4 w-12">#</th>
                        <th className="py-3.5 px-4">Student Name</th>
                        <th className="py-3.5 px-4">Confirmed Project Title</th>
                        <th className="py-3.5 px-4">Assigned Guide</th>
                        <th className="py-3.5 px-4 text-center">Attendance</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredStudents.map((stu, idx) => (
                        <tr key={stu._id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4 font-semibold text-slate-500">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{stu.name}</td>
                          <td className="py-3.5 px-4 text-xs text-slate-600 max-w-md">
                            {stu.projectTitle}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-emerald-800">
                            {stu.guideId?.name || 'Unassigned'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                stu.attendancePercentage >= 75
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {stu.attendancePercentage}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setEditingStudent(stu)}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 mr-1 cursor-pointer"
                              title="Edit Student"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(stu._id, stu.name)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleSaveStudentEdit}
            className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Edit Student Record</h3>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.projectTitle}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, projectTitle: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Project Guide
                </label>
                <select
                  value={editingStudent.guideId?._id || editingStudent.guideId || ''}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, guideId: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm min-h-[44px]"
                >
                  {guides.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-800 text-white hover:bg-emerald-700 cursor-pointer min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}