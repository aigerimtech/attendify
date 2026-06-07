const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

function getToken() {
  return localStorage.getItem('admin_token')
}

async function request(method, path, body) {
  const token = getToken()
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    localStorage.removeItem('admin_token')
    window.location.href = '/login'
    return
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || res.statusText)
  }
  return res.status === 204 ? null : res.json()
}

export async function login(email, password) {
  const fd = new URLSearchParams({ username: email, password })
  const res = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: fd,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Invalid credentials' }))
    throw new Error(err.detail || 'Invalid credentials')
  }
  const data = await res.json()
  return { token: data.access_token, name: data.full_name }
}

export async function getStudents() {
  const data = await request('GET', '/admin/users')
  return data.filter(u => u.role === 'student')
}

export async function createStudent(form) {
  return request('POST', '/auth/register/student', {
    email: form.email,
    first_name: form.first_name,
    last_name: form.last_name,
    role: 'student',
    password: form.password,
    student_number: form.student_number,
    department: form.department,
  })
}

export async function editUser(id, payload) {
  return request('PATCH', `/admin/users/${id}/edit`, payload)
}

export async function deleteStudent(id) {
  return request('DELETE', `/admin/users/${id}`)
}

export async function getInstructors() {
  const data = await request('GET', '/admin/users')
  return data.filter(u => u.role === 'instructor')
}

export async function createInstructor(form) {
  return request('POST', '/auth/register/instructor', {
    email: form.email,
    first_name: form.first_name,
    last_name: form.last_name,
    role: 'instructor',
    password: form.password,
    department: form.department,
    title: form.title,
  })
}

export async function deleteInstructor(id) {
  return request('DELETE', `/admin/users/${id}`)
}

export async function toggleUserStatus(id, _type, isActive) {
  const path = isActive
    ? `/admin/users/${id}/activate`
    : `/admin/users/${id}/deactivate`
  return request('PATCH', path)
}