const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

async function request(method, path, body, isForm = false) {
  const token = localStorage.getItem('token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  if (!isForm && body) headers['Content-Type'] = 'application/json'
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    localStorage.clear()
    window.location.href = '/login'
    return
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || res.statusText)
  }
  return res.status === 204 ? null : res.json()
}

export const api = {
  get:    (path)       => request('GET',   path),
  post:   (path, body) => request('POST',  path, body),
  patch:  (path, body) => request('PATCH', path, body),
  form:   (path, fd)   => request('POST',  path, fd, true),
  loginForm: (identifier, password) => {
    const fd = new URLSearchParams({ username: identifier, password })
    return request('POST', '/auth/login', fd, true)
  },
}
