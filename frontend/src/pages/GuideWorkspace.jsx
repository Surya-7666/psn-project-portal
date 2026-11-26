import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import {
  ArrowLeft,
  UserPlus,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  Sparkles,
  AlertCircle,
  CheckCheck,
  Share2,
  Copy,
  Check,
  Lock,
} from 'lucide-react';

export default function GuideWorkspace() {
  const { guideId } = useParams();

  const getTodayString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    return local.toISOString().split('T')[0];
  };

  const [guide, setGuide] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  // Attendance form state mapped by studentId: { [studentId]: { status, remark, editedByAdmin } }
  const [attendanceMap, setAttendanceMap] = useState({});
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Add Student Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);

  // UI feedback states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [bannerMsg, setBannerMsg] = useState({ type: '', text: '' });

  const loadWorkspaceData = useCallback(async () => {
    try {
      setLoading(true);
      const [guidesRes, studentsRes, attendanceRes] = await Promise.all([
        API.get('/guides'),
        API.get(`/students?guideId=${guideId}`),
        API.get(`/attendance?guideId=${guideId}&date=${selectedDate}`),
      ]);

      const currentGuide = guidesRes.data.find((g) => g._id === guideId);
      setGuide(currentGuide || null);
      setStudents(studentsRes.data);

      const existingByStudent = {};
      attendanceRes.data.forEach((rec) => {
        const sId = rec.studentId?._id || rec.studentId;
        existingByStudent[sId] = {
          status: rec.status,
          remark: rec.remark || '',
          editedByAdmin: rec.editedByAdmin || false,
        };
      });

      setAlreadySubmitted(attendanceRes.data.length > 0);

      const initialMap = {};
      studentsRes.data.forEach((stu) => {
        initialMap[stu._id] = existingByStudent[stu._id] || {
          status: 'Present',
          remark: '',
          editedByAdmin: false,
        };
      });
      setAttendanceMap(initialMap);
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load guide workspace.',
      });
    } finally {
      setLoading(false);
    }
  }, [guideId, selectedDate]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  const handleStatusChange = (studentId, status) => {
    if (alreadySubmitted) return;
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarkChange = (studentId, remark) => {
    if (alreadySubmitted) return;
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remark,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    if (alreadySubmitted) return;
    setAttendanceMap((prev) => {
      const updated = { ...prev };
      students.forEach((stu) => {
        updated[stu._id] = {
          ...updated[stu._id],
          status: 'Present',
        };
      });
      return updated;
    });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !projectTitle.trim()) return;

    try {
      setAddingStudent(true);
      setBannerMsg({ type: '', text: '' });

      await API.post('/students', {
        name: studentName.trim().toUpperCase(),
        projectTitle: projectTitle.trim().toUpperCase(),
        guideId,
      });

      setStudentName('');
      setProjectTitle('');
      setShowAddForm(false);
      setBannerMsg({ type: 'success', text: 'Student and project title added successfully!' });
      await loadWorkspaceData();
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err.response?.data?.message || 'Could not add student.',
      });
    } finally {
      setAddingStudent(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0 || alreadySubmitted) return;

    try {
      setSaving(true);
      setBannerMsg({ type: '', text: '' });

      const entries = students.map((stu) => ({
        studentId: stu._id,
        status: attendanceMap[stu._id]?.status || 'Present',
        remark: attendanceMap[stu._id]?.remark || '',
      }));

      await API.post('/attendance/bulk', {
        guideId,
        date: selectedDate,
        entries,
      });

      setBannerMsg({
        type: 'success',
        text: `Attendance saved and locked for ${selectedDate}! Contact HOD if any correction is needed.`,
      });
      await loadWorkspaceData();
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save attendance.',
      });
    } finally {
      setSaving(false);
    }
  };

  // --- BUILD WHATSAPP ABSENTEE REPORT ---
  const buildWhatsAppReport = () => {
    const presentList = students.filter((s) => attendanceMap[s._id]?.status === 'Present');
    const absentList = students.filter((s) => attendanceMap[s._id]?.status === 'Absent');
    const odList = students.filter((s) => attendanceMap[s._id]?.status === 'OD');

    const lines = [
      `*PSN IHER – DEPT. OF CSE*`,
      `*IV-CSE Project Attendance Report*`,
      `Date: *${selectedDate}*`,
      `Guide: *${guide?.name || ''}*`,
      `Summary: Present: *${presentList.length}* | Absent: *${absentList.length}* | OD: *${odList.length}*`,
      ``,
    ];

    if (absentList.length > 0) {
      lines.push(`*ABSENT STUDENTS (${absentList.length}):*`);
      absentList.forEach((stu, i) => {
        const rem = attendanceMap[stu._id]?.remark?.trim();
        lines.push(`${i + 1}. *${stu.name}*${rem ? ` (${rem})` : ''}`);
        lines.push(`   _${stu.projectTitle}_`);
      });
    } else {
      lines.push(`*All ${students.length} students are PRESENT today.*`);
    }

    if (odList.length > 0) {
      lines.push(``);
      lines.push(`*ON-DUTY / OD (${odList.length}):*`);
      odList.forEach((stu, i) => {
        const rem = attendanceMap[stu._id]?.remark?.trim();
        lines.push(`${i + 1}. ${stu.name}${rem ? ` (${rem})` : ''}`);
      });
    }

    return lines.join('\n');
  };

  const handleShareWhatsApp = () => {
    const message = buildWhatsAppReport();
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(buildWhatsAppReport());
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2500);
    } catch {
      setBannerMsg({ type: 'error', text: 'Unable to copy automatically. Use Share on WhatsApp.' });
    }
  };

  if (loading && !guide) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        Loading Project Guide Workspace...
      </div>
    );
  }

  if (!guide && !loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-800 font-semibold">Project Guide not found.</p>
        <Link to="/" className="text-emerald-700 font-semibold text-sm underline mt-2 inline-block">
          Return to Guide Directory
        </Link>
      </div>
    );
  }

  const presentCount = students.filter((s) => attendanceMap[s._id]?.status === 'Present').length;
  const absentCount = students.filter((s) => attendanceMap[s._id]?.status === 'Absent').length;
  const odCount = students.filter((s) => attendanceMap[s._id]?.status === 'OD').length;

  return (
    <div
      className={`max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 ${
        alreadySubmitted ? 'pb-10' : 'pb-24 md:pb-10'
      }`}
    >
      {/* Back Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-800 mb-4 transition-colors py-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>All Project Guides</span>
      </Link>

      {/* Guide Header Card - Forest Emerald & Charcoal */}
      <div className="bg-emerald-950 text-white rounded-2xl p-4 sm:p-6 shadow-sm mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-900">
        <div className="min-w-0">
          {guide.designation && (
            <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-900 text-emerald-200 border border-emerald-700 mb-2">
              {guide.designation}
            </span>
          )}
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight break-words">
            {guide.name}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 mt-1">
            Assigned Batch: <strong className="text-amber-400">{students.length} Students</strong>
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-amber-600 text-white hover:bg-amber-500 active:scale-[0.99] transition-all cursor-pointer shadow-xs min-h-[44px]"
        >
          <UserPlus className="w-4 h-4 shrink-0" />
          <span>{showAddForm ? 'Close Form' : '+ Add Student'}</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {bannerMsg.text && (
        <div
          className={`rounded-xl p-3.5 sm:p-4 mb-5 flex items-center gap-3 text-xs sm:text-sm font-medium border ${
            bannerMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {bannerMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{bannerMsg.text}</span>
        </div>
      )}

      {/* Lock Notice + One-Tap WhatsApp Absentee Share Bar (Appears once attendance is submitted) */}
      {alreadySubmitted && students.length > 0 && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3.5 sm:p-4 mb-5 space-y-3">
          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-emerald-950">
            <Lock className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Attendance Locked for {selectedDate} (
                {absentCount > 0
                  ? `${absentCount} Absentee${absentCount > 1 ? 's' : ''}`
                  : '100% Present'}
                )
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-800/85 mt-0.5">
                Submitted records cannot be edited by guides. Only the HOD / Admin can modify attendance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center justify-end gap-2 pt-2 border-t border-emerald-200/70">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100/70 transition-colors cursor-pointer min-h-[42px]"
            >
              {copiedWhatsApp ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 shrink-0" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#15803D] text-white hover:bg-[#166534] active:scale-[0.99] transition-all cursor-pointer shadow-xs min-h-[42px]"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>Share Absent List on WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Add Student Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddStudent}
          className="bg-white border-2 border-emerald-700/30 rounded-2xl p-4 sm:p-6 mb-5 shadow-xs"
        >
          <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3.5">
            Register New Student Under {guide.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., SURYA PERUMAL JEYAPANDI P"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-700 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirmed Project Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., AI AUTOMATION PLATFORMS WITH AI AGENTS"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-700 min-h-[44px]"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer min-h-[42px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingStudent}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-800 text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer min-h-[42px]"
            >
              {addingStudent ? 'Adding...' : 'Save Student'}
            </button>
          </div>
        </form>
      )}

      {/* Mobile-Responsive Date & Live Summary Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 min-h-[44px]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
              <label htmlFor="att-date" className="text-xs font-semibold text-slate-600">
                Date:
              </label>
            </div>
            <input
              id="att-date"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setBannerMsg({ type: '', text: '' });
                setSelectedDate(e.target.value);
              }}
              className="text-sm font-bold text-slate-900 bg-transparent focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {alreadySubmitted ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                Locked (HOD Edit Only)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Not Submitted
              </span>
            )}

            {students.length > 0 && !alreadySubmitted && (
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 cursor-pointer min-h-[36px]"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>All Present</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Pill Counters */}
        {students.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <div className="text-center py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">
              Present: {presentCount}
            </div>
            <div className="text-center py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">
              Absent: {absentCount}
            </div>
            <div className="text-center py-1.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold">
              OD: {odCount}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {students.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Students Assigned Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tap <strong>+ Add Student</strong> above to register your project batch and project titles.
          </p>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (< 768px): Stacked Touch-Friendly Student Cards */}
          <div className="md:hidden space-y-3.5">
            {students.map((stu, idx) => {
              const current = attendanceMap[stu._id] || {
                status: 'Present',
                remark: '',
                editedByAdmin: false,
              };

              return (
                <div
                  key={stu._id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          #{idx + 1}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm break-words">
                          {stu.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        {stu.projectTitle}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                          stu.attendancePercentage >= 75
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {stu.attendancePercentage}%
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {stu.attendedCount}/{stu.totalClasses}d
                      </p>
                    </div>
                  </div>

                  {/* 3-Column Big Thumb Buttons for Present / Absent / OD */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      disabled={alreadySubmitted}
                      onClick={() => handleStatusChange(stu._id, 'Present')}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all min-h-[44px] ${
                        current.status === 'Present'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                      } ${alreadySubmitted ? 'opacity-85 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Present</span>
                    </button>

                    <button
                      type="button"
                      disabled={alreadySubmitted}
                      onClick={() => handleStatusChange(stu._id, 'Absent')}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all min-h-[44px] ${
                        current.status === 'Absent'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50'
                      } ${alreadySubmitted ? 'opacity-85 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Absent</span>
                    </button>

                    <button
                      type="button"
                      disabled={alreadySubmitted}
                      onClick={() => handleStatusChange(stu._id, 'OD')}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all min-h-[44px] ${
                        current.status === 'OD'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50'
                      } ${alreadySubmitted ? 'opacity-85 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>OD</span>
                    </button>
                  </div>

                  {current.editedByAdmin && (
                    <p className="text-[11px] text-emerald-800 font-semibold">
                      Verified / Edited by HOD
                    </p>
                  )}

                  <input
                    type="text"
                    disabled={alreadySubmitted}
                    placeholder={alreadySubmitted ? 'No remark recorded' : 'Optional daily review remark...'}
                    value={current.remark}
                    onChange={(e) => handleRemarkChange(stu._id, e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-700 disabled:opacity-75 disabled:cursor-not-allowed min-h-[40px]"
                  />
                </div>
              );
            })}
          </div>

          {/* DESKTOP / TABLET VIEW (>= 768px): Structured Register Table */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-14">#</th>
                    <th className="py-3.5 px-4">Student &amp; Project Title</th>
                    <th className="py-3.5 px-4 text-center">Overall %</th>
                    <th className="py-3.5 px-4 text-center">Status ({selectedDate})</th>
                    <th className="py-3.5 px-4">Review / Daily Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {students.map((stu, idx) => {
                    const current = attendanceMap[stu._id] || {
                      status: 'Present',
                      remark: '',
                      editedByAdmin: false,
                    };

                    return (
                      <tr key={stu._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-4 font-semibold text-slate-500 align-top">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-4 align-top max-w-sm">
                          <p className="font-bold text-slate-900">{stu.name}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {stu.projectTitle}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-center align-top">
                          <span
                            className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                              stu.attendancePercentage >= 75
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {stu.attendancePercentage}%
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {stu.attendedCount}/{stu.totalClasses} days
                          </p>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={alreadySubmitted}
                              onClick={() => handleStatusChange(stu._id, 'Present')}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                current.status === 'Present'
                                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
                              } ${alreadySubmitted ? 'opacity-85 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Present
                            </button>

                            <button
                              type="button"
                              disabled={alreadySubmitted}
                              onClick={() => handleStatusChange(stu._id, 'Absent')}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                current.status === 'Absent'
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
                              } ${alreadySubmitted ? 'opacity-85 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Absent
                            </button>

                            <button
                              type="button"
                              disabled={alreadySubmitted}
                              onClick={() => handleStatusChange(stu._id, 'OD')}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                current.status === 'OD'
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                              } ${alreadySubmitted ? 'opacity-85 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              OD
                            </button>
                          </div>

                          {current.editedByAdmin && (
                            <p className="text-[11px] text-emerald-800 font-semibold text-center mt-1.5">
                              Verified / Edited by HOD
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4 align-top">
                          <input
                            type="text"
                            disabled={alreadySubmitted}
                            placeholder={alreadySubmitted ? '—' : 'Optional progress note...'}
                            value={current.remark}
                            onChange={(e) => handleRemarkChange(stu._id, e.target.value)}
                            className="w-full min-w-[180px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-700 disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Desktop Submit Footer (Hidden once locked) */}
            {!alreadySubmitted && (
              <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Submitting records and locks attendance for <strong>{selectedDate}</strong>. Only HOD can edit after submission.
                </p>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-800 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving Attendance...' : 'Save Daily Attendance'}</span>
                </button>
              </div>
            )}
          </div>

          {/* STICKY MOBILE SAVE BAR (< 768px — Hidden once locked) */}
          {!alreadySubmitted && (
            <div className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-slate-200 p-3 shadow-lg">
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-emerald-800 text-white hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer shadow-sm min-h-[48px]"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : `Save Attendance (${selectedDate})`}</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}