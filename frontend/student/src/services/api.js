const BASE = "http://localhost:8000/api/v1";

export const getToken = () => localStorage.getItem("attendify_token");

const authHeaders = () => ({
  "Authorization": `Bearer ${getToken()}`
});

const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem("attendify_token");
    localStorage.removeItem("attendify_user");
    window.location.href = "/login";
    return;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

// ── AUTH ────────────────────────────────────────────────────
export const login = (email, password) =>
  fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password })
  }).then(handleResponse);

export const registerStudent = (data) =>
  fetch(`${BASE}/auth/register/student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(handleResponse);

export const getMe = () =>
  fetch(`${BASE}/auth/me`, {
    headers: authHeaders()
  }).then(handleResponse);

export const updateMe = (data) =>
  fetch(`${BASE}/auth/me`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(handleResponse);

export const changePassword = (data) =>
  fetch(`${BASE}/auth/change-password`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(handleResponse);

export const forgotPassword = (email) =>
  fetch(`${BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  }).then(handleResponse);

export const resetPassword = (email, code, new_password) =>
  fetch(`${BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, new_password })
  }).then(handleResponse);

// ── FACE ────────────────────────────────────────────────────
export const enrollFace = (photos, consent = true) => {
  const form = new FormData();
  form.append("consent", consent);
  photos.forEach(p => form.append("photos", p));
  return fetch(`${BASE}/face/enroll`, {
    method: "POST",
    headers: authHeaders(),
    body: form
  }).then(handleResponse);
};

export const getFaceStatus = () =>
  fetch(`${BASE}/face/enroll/status`, {
    headers: authHeaders()
  }).then(handleResponse);

export const deleteFaceEnrollment = () =>
  fetch(`${BASE}/face/enroll`, {
    method: "DELETE",
    headers: authHeaders()
  }).then(handleResponse);

// ── DASHBOARD & SCHEDULE ────────────────────────────────────
export const getDashboard = () =>
  fetch(`${BASE}/students/me/dashboard`, {
    headers: authHeaders()
  }).then(handleResponse);

export const getSchedule = (week_offset = 0) =>
  fetch(`${BASE}/students/me/schedule?week_offset=${week_offset}`, {
    headers: authHeaders()
  }).then(handleResponse);

// ── ATTENDANCE ──────────────────────────────────────────────
export const getAttendanceHistory = () =>
  fetch(`${BASE}/attendance/my`, {
    headers: authHeaders()
  }).then(handleResponse);

export const getAttendanceSummary = () =>
  fetch(`${BASE}/attendance/my/summary`, {
    headers: authHeaders()
  }).then(handleResponse);

export const submitAttendance = (qr_token, imageBlob) => {
  const form = new FormData();
  form.append("qr_token", qr_token);
  form.append("image", imageBlob, "face.jpg");
  return fetch(`${BASE}/attendance/submit`, {
    method: "POST",
    headers: authHeaders(),
    body: form
  }).then(handleResponse);
};

export const notifyInstructor = (session_id, reason = "qr_failed", note = "") =>
  fetch(`${BASE}/attendance/notify-instructor`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, reason, note })
  }).then(handleResponse);

// ── NOTIFICATIONS ────────────────────────────────────────────
export const getNotificationSettings = () =>
  fetch(`${BASE}/settings/notifications`, {
    headers: authHeaders()
  }).then(handleResponse);

export const updateNotificationSettings = (data) =>
  fetch(`${BASE}/settings/notifications`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(handleResponse);
