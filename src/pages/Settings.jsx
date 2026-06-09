import { useState, useCallback, useEffect } from 'react'
import {
  User,
  Bell,
  Shield,
  Database,
  Mail,
  Phone,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
} from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

const SETTINGS_KEY = 'attendify_settings'

function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-primary-600" />
        </div>
        <h2 className="font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

const defaultProfile = {
  name: 'Professor Smith',
  email: 'smith@university.edu',
  phone: '+1 555-0100',
  department: 'Computer Science',
  title: 'Associate Professor',
}

const defaultNotifications = {
  emailAlerts: true,
  weeklyReport: true,
  atRiskAlert: true,
}

const defaultSecurity = {
  twoFactor: false,
  sessionTimeout: '30',
}

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-600'
const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5'

export default function Settings() {
  const { addToast } = useToast()
  const { user, login } = useAuth()
  const saved_s = loadSettings()

  const [saved,        setSaved]        = useState(false)
  const [profileSaving,setProfileSaving]= useState(false)
  const [showCurrent,  setShowCurrent]  = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [pwLoading,    setPwLoading]    = useState(false)
  const [pwError,      setPwError]      = useState('')
  const [pwSuccess,    setPwSuccess]    = useState(false)
  const [pwForm,       setPwForm]       = useState({ current_password: '', new_password: '', confirm_password: '' })

  // Seed profile from auth context first, then localStorage fallback
  const [profile, setProfile] = useState(() => ({
    name:       user?.name       ?? saved_s?.profile?.name       ?? defaultProfile.name,
    email:      user?.email      ?? saved_s?.profile?.email      ?? defaultProfile.email,
    phone:      user?.phone      ?? saved_s?.profile?.phone      ?? defaultProfile.phone,
    department: user?.department ?? saved_s?.profile?.department ?? defaultProfile.department,
    title:      user?.title      ?? saved_s?.profile?.title      ?? defaultProfile.title,
  }))

  const [notifications, setNotifications] = useState(saved_s?.notifications || defaultNotifications)
  const [security, setSecurity] = useState(saved_s?.security || defaultSecurity)
  const [absenceThreshold, setAbsenceThreshold] = useState(saved_s?.absenceThreshold ?? 20)

  // Load system config from backend on mount
  useEffect(() => {
    api.get('/settings/system-config')
      .then((cfg) => {
        if (cfg?.absence_threshold != null) setAbsenceThreshold(cfg.absence_threshold)
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChangePassword = useCallback(async (e) => {
    e.preventDefault()
    setPwError('')
    if (!pwForm.current_password) { setPwError('Current password is required.'); return }
    if (pwForm.new_password.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    if (pwForm.new_password !== pwForm.confirm_password) { setPwError('Passwords do not match.'); return }
    setPwLoading(true)
    try {
      await api.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      })
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
      setPwSuccess(true)
      addToast('Password updated successfully')
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwError(err.message || 'Password change failed.')
    } finally {
      setPwLoading(false)
    }
  }, [pwForm, addToast])

  const handleSave = async () => {
    setProfileSaving(true)
    try {
      // Backend UpdateProfilePayload: { first_name, last_name, department, title }
      const nameParts = profile.name.trim().split(' ')
      const firstName = nameParts[0] ?? ''
      const lastName  = nameParts.slice(1).join(' ') || firstName  // fallback if single word
      const updated = await api.patch('/auth/me', {
        first_name:  firstName,
        last_name:   lastName,
        department:  profile.department || undefined,
        title:       profile.title || undefined,
      })
      // update auth context so navbar etc reflects new name
      if (updated && login) {
        login({
          ...user,
          name:       updated.full_name ?? profile.name,
          email:      updated.email     ?? profile.email,
          department: updated.department ?? profile.department,
          initials:   (updated.full_name ?? profile.name).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        }, true)
      }
    } catch {
      // non-critical — still save locally
    }

    // Save absence threshold to backend
    try {
      await api.patch('/settings/system-config', { absence_threshold: absenceThreshold })
    } catch {
      // non-critical
    }

    // save local prefs to localStorage
    const settings = { profile, notifications, security, absenceThreshold }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    setSaved(true)
    addToast('Settings saved successfully')
    setTimeout(() => setSaved(false), 2500)
    setProfileSaving(false)
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Manage your account preferences and system configuration</p>
        </div>
        <button onClick={handleSave} disabled={profileSaving} className={`btn-primary transition-all ${saved ? 'bg-emerald-600 hover:bg-emerald-600' : ''}`}>
          {profileSaving ? 'Saving…' : saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Section title="Profile Information" icon={User}>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-800 to-primary-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md">
              {profile.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100">{profile.name}</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">{profile.title} · {profile.department}</p>
              <button className="text-xs text-primary-600 font-medium mt-1 hover:underline">Change avatar</button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Title</label>
                <select
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  className={inputCls}
                >
                  <option>Professor</option>
                  <option>Associate Professor</option>
                  <option>Assistant Professor</option>
                  <option>Lecturer</option>
                </select>
              </div>
            </div>
            <div>
              <label className={`${labelCls} flex items-center gap-1`}>
                <Mail size={12} /> Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`${labelCls} flex items-center gap-1`}>
                  <Phone size={12} /> Phone
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Department</label>
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notification Preferences" icon={Bell}>
          <div className="space-y-4">
            {[
              { key: 'emailAlerts', label: 'Email Alerts', desc: 'Get notified when students submit attendance or face verification fails' },
              { key: 'weeklyReport', label: 'Weekly Summary Report', desc: 'Receive a weekly digest of attendance rates per course' },
              { key: 'atRiskAlert', label: 'At-Risk Student Alert', desc: 'Get alerted when a student crosses the absence threshold set above' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{desc}</p>
                </div>
                <Toggle
                  checked={notifications[key]}
                  onChange={(v) => setNotifications({ ...notifications, [key]: v })}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Security */}
        <Section title="Security" icon={Shield}>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className={labelCls}>Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={pwForm.current_password}
                  onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={pwForm.new_password}
                  onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={pwForm.confirm_password}
                onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                className={inputCls}
              />
            </div>
            {pwError   && <p className="text-xs text-red-500">{pwError}</p>}
            {pwSuccess && <p className="text-xs text-emerald-600">Password updated successfully!</p>}
            <button
              type="submit"
              disabled={pwLoading}
              className="btn-primary w-full justify-center"
            >
              {pwLoading ? 'Updating…' : <><Shield size={14} /> Update Password</>}
            </button>
          </form>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div>
              <label className={labelCls}>Session Timeout (minutes)</label>
              <select
                value={security.sessionTimeout}
                onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                className={inputCls}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </div>
          </div>
        </Section>

        {/* System Config */}
        <Section title="System Configuration" icon={Database}>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-500" />
                  Absence Threshold (%)
                </label>
                <span className={`text-sm font-bold ${absenceThreshold >= 20 ? 'text-red-600' : 'text-amber-600'}`}>
                  {absenceThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                value={absenceThreshold}
                onChange={(e) => setAbsenceThreshold(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                <span>5%</span>
                <span>50%</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                Students exceeding this threshold will be marked as <span className="text-red-500 font-semibold">Critical</span>.
              </p>
            </div>

          </div>
        </Section>
      </div>
    </div>
  )
}