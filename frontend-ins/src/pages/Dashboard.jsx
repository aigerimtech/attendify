import { useNavigate } from 'react-router-dom'
import {
  Users,
  BookOpen,
  Wifi,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  PlusCircle,
  Download,
  ChevronRight,
  Calendar,
  AlertCircle,
} from 'lucide-react'

const recentSessions = [
  {
    id: 1,
    date: 'Oct 24, 2023',
    day: 'Thursday',
    course: 'CS101: Intro to Java',
    location: 'Lecture Hall A',
    time: '10:00 AM – 11:30 AM',
    attended: 38,
    total: 42,
  },
  {
    id: 2,
    date: 'Oct 22, 2023',
    day: 'Tuesday',
    course: 'CS101: Intro to Java',
    location: 'Lab 3',
    time: '02:00 PM – 03:30 PM',
    attended: 35,
    total: 42,
  },
  {
    id: 3,
    date: 'Oct 21, 2023',
    day: 'Monday',
    course: 'DS200: Data Structures',
    location: 'Lecture Hall B',
    time: '09:00 AM – 10:50 AM',
    attended: 40,
    total: 45,
  },
  {
    id: 4,
    date: 'Oct 20, 2023',
    day: 'Sunday',
    course: 'CS101: Intro to Java',
    location: 'Lecture Hall A',
    time: '10:00 AM – 11:30 AM',
    attended: 39,
    total: 42,
  },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="fade-in space-y-6">
      {/* Page Header */}
      <div>
        <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-800" />
          Overview
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Welcome back, <span className="font-semibold text-slate-700 dark:text-slate-200">Professor Smith</span>. Review your active sessions and upcoming classes below.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Students */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-violet-600" />
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
              <TrendingUp size={11} />
              +5%
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Students</p>
            <p className="text-4xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">142</p>
          </div>
        </div>

        {/* Total Courses */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-orange-500" />
            </div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">This semester</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Courses</p>
            <p className="text-4xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">4</p>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="card p-6 text-white relative overflow-hidden cursor-pointer transition-all" style={{background: 'linear-gradient(135deg,#3730a3,#4f46e5)', boxShadow: '0 4px 20px rgba(67,56,202,.3)'}}
          onClick={() => navigate('/sessions/live')}
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-white/10 pulse-anim" />
              <div className="absolute inset-2 rounded-full bg-white/10 pulse-anim" style={{ animationDelay: '0.3s' }} />
              <div className="absolute inset-4 rounded-full bg-white/20 flex items-center justify-center">
                <Wifi size={16} className="text-white" />
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Wifi size={20} className="text-white" />
            </div>
            <span className="badge-live">LIVE</span>
          </div>
          <p className="text-xs font-semibold text-primary-100 uppercase tracking-widest">Active Sessions</p>
          <p className="text-4xl font-bold mt-0.5">1</p>
          <p className="text-sm text-primary-100 mt-1">CS101 in progress</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-50 dark:border-slate-800">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary-800 rounded-full" />
              Recent Sessions
            </h2>
            <button
              onClick={() => navigate('/sessions')}
              className="text-sm text-primary-600 font-medium hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          {/* Table Header */}
          <div className="px-6 py-3 grid grid-cols-2 gap-4 border-b border-slate-50 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</p>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Course Details</p>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {recentSessions.map((s) => (
              <div
                key={s.id}
                className="px-6 py-4 grid grid-cols-2 gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Calendar size={14} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.date}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{s.day}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.course}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                      <MapPin size={11} /> {s.location}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                      <Clock size={11} /> {s.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Upcoming Class */}
          <div className="card p-5">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-primary-800 rounded-full" />
              Upcoming Class
            </h2>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 blink" />
                  Starts in 30 mins
                </span>
                <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
                  <Clock size={13} className="text-primary-600" />
                </div>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">DS200: Data Structures</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-3">
                <MapPin size={11} /> Lecture Hall B
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Users size={13} className="text-slate-400" />
                  42 Students enrolled
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <BookOpen size={13} className="text-slate-400" />
                  Topic: Binary Trees
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/sessions/live')}
              className="btn-primary w-full justify-center text-sm"
            >
              Prepare Session
            </button>
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Quick Actions</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/courses')}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors group"
              >
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                  <PlusCircle size={15} className="text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Create New Course</span>
                <ChevronRight size={14} className="ml-auto text-slate-400" />
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors group"
              >
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                  <Download size={15} className="text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Weekly Report</span>
                <ChevronRight size={14} className="ml-auto text-slate-400" />
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors group"
              >
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                  <AlertCircle size={15} className="text-amber-500 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">At-Risk Students</span>
                <span className="ml-auto bg-rose-50 dark:bg-rose-900/30 text-rose-500 text-xs font-bold px-2 py-0.5 rounded-full">3</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
