import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Clock,
  Users,
  Wifi,
  Hash,
  ChevronDown,
  Shield,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react'

const QR_INTERVAL = 30

const initialLiveUsers = [
  { id: 'JD', name: 'John Doe', time: 'Just now', method: 'QR Code', color: 'bg-primary-600' },
  { id: 'SW', name: 'Sarah Wilson', time: '1m ago', method: 'Via App', color: 'bg-pink-500' },
  { id: 'MK', name: 'Mike K.', time: '2m ago', method: 'Via App', color: 'bg-emerald-500' },
  { id: 'AL', name: 'Alice Lee', time: '3m ago', method: 'QR Code', color: 'bg-violet-500' },
  { id: 'TJ', name: 'Tom Johnson', time: '4m ago', method: 'Via App', color: 'bg-orange-500' },
]

const simulatedStudents = [
  { id: 'EC', name: 'Emily Chen', method: 'QR Code', color: 'bg-rose-500' },
  { id: 'JP', name: 'James Park', method: 'Via App', color: 'bg-teal-500' },
  { id: 'NR', name: 'Nina Rodriguez', method: 'QR Code', color: 'bg-cyan-500' },
  { id: 'BM', name: 'Ben Martinez', method: 'Via App', color: 'bg-lime-600' },
  { id: 'OW', name: 'Olivia White', method: 'QR Code', color: 'bg-fuchsia-500' },
  { id: 'LH', name: 'Liam Harris', method: 'Via App', color: 'bg-sky-500' },
  { id: 'AT', name: 'Ava Thompson', method: 'QR Code', color: 'bg-amber-500' },
  { id: 'DL', name: 'Daniel Lee', method: 'Via App', color: 'bg-indigo-500' },
]

function generatePattern(seed) {
  const cells = []
  for (let i = 0; i < 49; i++) {
    const val = ((seed * 31 + i * 17 + i * seed * 7) % 97)
    cells.push(val < 45)
  }
  const corners = [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,42,43,44,45,46,47,48]
  corners.forEach((c) => { cells[c] = true })
  return cells
}

function QRCodeDisplay({ seed, fading }) {
  const pattern = generatePattern(seed)
  return (
    <div
      className="w-56 h-56 bg-white rounded-2xl p-4 shadow-inner mx-auto transition-opacity duration-300"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <div className="w-full h-full grid grid-cols-7 gap-0.5">
        {pattern.map((filled, i) => (
          <div
            key={i}
            className={`rounded-sm transition-all duration-150 ${filled ? 'bg-slate-900' : 'bg-transparent'}`}
          />
        ))}
      </div>
    </div>
  )
}

function CountdownRing({ seconds, total }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const filled = (seconds / total) * circ
  const color = seconds <= 5 ? '#ef4444' : '#60a5fa'
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="absolute -inset-8 pointer-events-none">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
      <circle
        cx="60" cy="60" r={r} fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        strokeDashoffset={circ / 4}
        className="transition-all duration-1000"
      />
    </svg>
  )
}

export default function LiveSession() {
  const navigate = useNavigate()
  const [elapsedSec, setElapsedSec] = useState(0)
  const [qrCountdown, setQrCountdown] = useState(QR_INTERVAL)
  const [qrSeed, setQrSeed] = useState(1)
  const [fading, setFading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [geoFencing, setGeoFencing] = useState(true)
  const [attendeeCount, setAttendeeCount] = useState(42)
  const [liveUsers, setLiveUsers] = useState(initialLiveUsers)
  const simIndex = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSec((s) => s + 1)
      setQrCountdown((q) => {
        if (q <= 1) {
          setFading(true)
          setTimeout(() => {
            setQrSeed((s) => s + 1)
            setFading(false)
          }, 300)
          return QR_INTERVAL
        }
        return q - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const student = simulatedStudents[simIndex.current % simulatedStudents.length]
      simIndex.current += 1
      setLiveUsers((prev) => {
        const updated = prev.map((u) => ({
          ...u,
          time: u.time === 'Just now' ? '1m ago'
            : u.time === '1m ago' ? '2m ago'
            : u.time === '2m ago' ? '3m ago'
            : u.time === '3m ago' ? '4m ago'
            : u.time,
        }))
        return [{ ...student, time: 'Just now' }, ...updated.slice(0, 4)]
      })
      setAttendeeCount((c) => c + 1)
    }, 10000)
    return () => clearInterval(id)
  }, [])

  const hh = String(Math.floor(elapsedSec / 3600)).padStart(2, '0')
  const mm = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0')
  const ss = String(elapsedSec % 60).padStart(2, '0')

  const sessionCode = String(482910 + qrSeed * 137).slice(-6).replace(/(\d{3})(\d{3})/, '$1-$2')

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionCode.replace('-', ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="hover:text-primary-600 transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Overview
        </button>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300 font-medium">Live Session</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Live Session Control</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="space-y-4">

          {/* Session Status */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-700 dark:text-slate-200">Session Status</h2>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 blink" />
                ACTIVE
              </span>
            </div>

            <div className="text-center mb-4">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Session Duration</p>
              <p className="font-mono text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                {hh}:{mm}:{ss}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Session open until you end it</p>
            </div>

            <div className={`rounded-xl p-3 flex items-center gap-3 transition-colors ${
              qrCountdown <= 5 ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800' : 'bg-primary-50 dark:bg-primary-900/20'
            }`}>
              <RefreshCw
                size={16}
                className={`flex-shrink-0 transition-colors ${qrCountdown <= 5 ? 'text-red-500' : 'text-primary-600'}`}
                style={{ animation: fading ? 'spin 0.3s linear' : undefined }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${qrCountdown <= 5 ? 'text-red-600' : 'text-primary-600'}`}>
                  QR refreshes in{' '}
                  <span className="font-mono font-bold">{qrCountdown}s</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Generation #{qrSeed} · Every {QR_INTERVAL}s
                </p>
              </div>
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    qrCountdown <= 5 ? 'bg-red-500' : 'bg-primary-600'
                  }`}
                  style={{ width: `${(qrCountdown / QR_INTERVAL) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="card p-5">
            <h2 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Session Details</h2>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Select Course</label>
              <div className="relative">
                <select className="w-full appearance-none bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent cursor-pointer">
                  <option>CS101: Intro to Java</option>
                  <option>DS200: Data Structures</option>
                  <option>CS301: Algorithms</option>
                  <option>SE400: Software Engineering</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                geoFencing ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-slate-50 dark:bg-slate-800/50'
              }`}
              onClick={() => setGeoFencing(!geoFencing)}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                geoFencing ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                {geoFencing && <CheckCircle size={13} className="text-white" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Shield size={13} className="text-primary-600" />
                  Enable Geo-Fencing
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Students must be within 50m of Lecture Hall A.</p>
              </div>
            </div>
          </div>

          {/* Live Feed */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 blink" />
                Live Feed
              </h2>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Total: <span className="text-slate-700 dark:text-slate-200">{attendeeCount}</span>
              </span>
            </div>

            <div className="space-y-2.5">
              {liveUsers.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${u.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {u.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">{u.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{u.method}</p>
                  </div>
                  <span className={`text-xs font-medium ${i === 0 ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500'}`}>
                    {u.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* QR Panel */}
        <div className="lg:col-span-2 card p-8 flex flex-col items-center justify-center gap-6 min-h-[560px]" style={{background: 'linear-gradient(135deg,#3730a3,#4f46e5)'}}>

          <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
            <CountdownRing seconds={qrCountdown} total={QR_INTERVAL} />
            <QRCodeDisplay seed={qrSeed} fading={fading} />
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            qrCountdown <= 5
              ? 'bg-red-400/30 text-red-100'
              : 'bg-white/10 text-indigo-200'
          }`}>
            <RefreshCw size={13} className={fading ? 'animate-spin' : ''} />
            {fading
              ? 'Generating new QR…'
              : `New QR in ${qrCountdown}s`
            }
          </div>

          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                  <Wifi size={14} className="text-white" />
                </div>
                <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest">Network</p>
              </div>
              <p className="text-white font-bold text-base">Campus_Guest_5G</p>
            </div>

            <div
              className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 cursor-pointer hover:bg-white/20 transition-colors"
              onClick={handleCopy}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                  <Hash size={14} className="text-white" />
                </div>
                <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest">Session Code</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-white font-bold text-xl tracking-widest font-mono">{sessionCode}</p>
                {copied
                  ? <Check size={14} className="text-emerald-300" />
                  : <Copy size={14} className="text-blue-200" />
                }
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
            <Users size={14} className="text-indigo-200" />
            <span className="text-white text-sm font-semibold">{attendeeCount} students checked in</span>
          </div>
        </div>
      </div>
    </div>
  )
}
