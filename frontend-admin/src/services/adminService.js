export { login, getStudents, getInstructors, createStudent, createInstructor, deleteStudent, deleteInstructor, toggleUserStatus } from './mock/adminMock.js'

// ── Real API implementation (commented out for demo — uses mock data above) ──

// const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

// function getToken() {
//   return localStorage.getItem('admin_token')
// }

// async function request(method, path, body) {
//   const token = getToken()
//   const headers = {}
//   if (token) headers['Authorization'] = `Bearer ${token}`
//   if (body) headers['Content-Type'] = 'application/json'
//   const res = await fetch(BASE + path, {
//     method,
//     headers,
//     body: body ? JSON.stringify(body) : undefined,
//   })
//   if (res.status === 401) {
//     localStorage.removeItem('admin_token')
//     window.location.href = '/login'
//     return
//   }
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
//     throw new Error(err.detail || res.statusText)
//   }
//   return res.status === 204 ? null : res.json()
// }

// export async function login(email, password) {
//   const fd = new URLSearchParams({ username: email, password })
//   const res = await fetch(BASE + '/auth/login', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//     body: fd,
//   })
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({ detail: 'Invalid credentials' }))
//     throw new Error(err.detail || 'Invalid credentials')
//   }
//   const data = await res.json()
//   return { token: data.access_token, name: data.full_name }
// }

// export async function getStudents() {
//   const data = await request('GET', '/admin/users')
//   return data.filter(u => u.role === 'student')
// }

// export async function createStudent(form) {
//   return request('POST', '/auth/register/student', {
//     full_name: form.name,
//     email: form.email,
//     faculty: form.faculty,
//     department: form.department,
//     program_duration_years: form.program_duration_years,
//     enroll_date: form.enroll_date,
//   })
// }

// export async function deleteStudent(_id) {
//   throw new Error('Delete is not supported yet — endpoint not available.')
// }

// export async function getInstructors() {
//   const data = await request('GET', '/admin/users')
//   return data.filter(u => u.role === 'instructor')
// }

// export async function createInstructor(form) {
//   return request('POST', '/auth/register/instructor', {
//     full_name: form.name,
//     email: form.email,
//     faculty: form.faculty,
//     department: form.department,
//     title: form.title,
//   })
// }

// export async function deleteInstructor(_id) {
//   throw new Error('Delete is not supported yet — endpoint not available.')
// }

// export async function toggleUserStatus(id, _type, isActive) {
//   const path = isActive
//     ? `/admin/users/${id}/activate`
//     : `/admin/users/${id}/deactivate`
//   return request('PATCH', path)
// }
