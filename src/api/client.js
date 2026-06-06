const BASE = 'http://localhost:8000/api/v1'

async function request(method, path, body, isForm = false) {
  const token = localStorage.getItem('attendify_token')
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
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path)        => request('DELETE', path),
  loginForm: (username, password) => {
    const fd = new URLSearchParams({ username, password })
    return request('POST', '/auth/login', fd, true)
  },
}
