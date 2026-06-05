const delay = (ms = 400) => new Promise(res => setTimeout(res, ms))

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  await delay()
  if (email === 'admin@attendify.com' && password === 'admin123') {
    return { token: 'mock-admin-token', name: 'Admin' }
  }
  throw new Error('Invalid credentials')
}

// ── Students ─────────────────────────────────────────────────────────────────

const STUDENTS = [
  {
    id: 1,
    student_id: 'STU-2025-001',
    name: 'Aisha Bekova',
    email: 'aisha.bekova@student.edu',
    faculty: 'Engineering',
    department: 'Computer Science',
    program_duration_years: 4,
    enroll_date: '2023-09-01',
    graduation_date: '2027-06-30',
    face_photos_count: 3,
    is_active: true,
  },
  {
    id: 2,
    student_id: 'STU-2025-002',
    name: 'Daniyar Seitkali',
    email: 'daniyar.seitkali@student.edu',
    faculty: 'Engineering',
    department: 'Software Engineering',
    program_duration_years: 4,
    enroll_date: '2023-09-01',
    graduation_date: '2027-06-30',
    face_photos_count: 1,
    is_active: true,
  },
  {
    id: 3,
    student_id: 'STU-2025-003',
    name: 'Madina Nurova',
    email: 'madina.nurova@student.edu',
    faculty: 'Business',
    department: 'Management',
    program_duration_years: 3,
    enroll_date: '2022-09-01',
    graduation_date: '2025-06-30',
    face_photos_count: 3,
    is_active: false,
  },
  {
    id: 4,
    student_id: 'STU-2025-004',
    name: 'Timur Askarov',
    email: 'timur.askarov@student.edu',
    faculty: 'Science',
    department: 'Mathematics',
    program_duration_years: 4,
    enroll_date: '2024-09-01',
    graduation_date: '2028-06-30',
    face_photos_count: 0,
    is_active: true,
  },
]

let studentStore = [...STUDENTS]
let nextStudentId = 5

export async function getStudents() {
  await delay()
  return [...studentStore]
}

export async function toggleUserStatus(id, type, isActive) {
  await delay()
  if (type === 'student') {
    const s = studentStore.find(x => x.id === id)
    if (!s) throw new Error('Student not found')
    s.is_active = isActive
    return { ...s }
  }
  if (type === 'instructor') {
    const ins = instructorStore.find(x => x.id === id)
    if (!ins) throw new Error('Instructor not found')
    ins.is_active = isActive
    return { ...ins }
  }
  throw new Error('Unknown type')
}

export async function createStudent(data) {
  await delay()
  const now = new Date().toISOString().slice(0, 10)
  const gradYear = new Date().getFullYear() + (data.program_duration_years ?? 4)
  const newStudent = {
    id: nextStudentId,
    student_id: `STU-2025-${String(nextStudentId).padStart(3, '0')}`,
    name: data.name,
    email: data.email,
    faculty: data.faculty,
    department: data.department,
    program_duration_years: data.program_duration_years ?? 4,
    enroll_date: data.enroll_date ?? now,
    graduation_date: data.graduation_date ?? `${gradYear}-06-30`,
    face_photos_count: 0,
    is_active: true,
  }
  studentStore.push(newStudent)
  nextStudentId++
  return newStudent
}

export async function deleteStudent(id) {
  await delay()
  const idx = studentStore.findIndex(x => x.id === id)
  if (idx === -1) throw new Error('Student not found')
  studentStore.splice(idx, 1)
}

// ── Instructors ───────────────────────────────────────────────────────────────

const INSTRUCTORS = [
  {
    id: 1,
    instructor_id: 'INS-2025-001',
    name: 'Dr. Aliya Smagulova',
    email: 'a.smagulova@faculty.edu',
    faculty: 'Engineering',
    department: 'Computer Science',
    title: 'Associate Professor',
    is_active: true,
  },
  {
    id: 2,
    instructor_id: 'INS-2025-002',
    name: 'Prof. Ruslan Dzhaksybekov',
    email: 'r.dzhaksybekov@faculty.edu',
    faculty: 'Engineering',
    department: 'Software Engineering',
    title: 'Professor',
    is_active: true,
  },
  {
    id: 3,
    instructor_id: 'INS-2025-003',
    name: 'Ms. Zarina Ospanova',
    email: 'z.ospanova@faculty.edu',
    faculty: 'Business',
    department: 'Management',
    title: 'Lecturer',
    is_active: false,
  },
]

let instructorStore = [...INSTRUCTORS]
let nextInstructorId = 4

export async function getInstructors() {
  await delay()
  return [...instructorStore]
}

export async function createInstructor(data) {
  await delay()
  const now = new Date().toISOString().slice(0, 10)
  const newInstructor = {
    id: nextInstructorId,
    instructor_id: `INS-2025-${String(nextInstructorId).padStart(3, '0')}`,
    name: data.name,
    email: data.email,
    faculty: data.faculty,
    department: data.department,
    title: data.title ?? 'Lecturer',
    is_active: true,
  }
  instructorStore.push(newInstructor)
  nextInstructorId++
  return newInstructor
}

export async function deleteInstructor(id) {
  await delay()
  const idx = instructorStore.findIndex(x => x.id === id)
  if (idx === -1) throw new Error('Instructor not found')
  instructorStore.splice(idx, 1)
}
