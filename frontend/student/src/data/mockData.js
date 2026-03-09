export const mockAccounts = [
  {
    email: "student@test.com",
    password: "1234",
    name: "Alex Johnson",
    studentId: "STU-2024-001",
    department: "Computer Science",
    joined: "Sep 2024",
    avatar: null,
    courses: ["CS101", "MATH201", "PHYS101"]
  },
  {
    email: "sara@test.com",
    password: "1234",
    name: "Sara Mitchell",
    studentId: "STU-2024-002",
    department: "Information Systems",
    joined: "Sep 2024",
    avatar: null,
    courses: ["IS101", "MATH201", "CS202"]
  },
  {
    email: "james@test.com",
    password: "1234",
    name: "James Carter",
    studentId: "STU-2024-003",
    department: "Software Engineering",
    joined: "Sep 2024",
    avatar: null,
    courses: ["CS101", "CS202", "SE301"]
  }
]

export const mockCourses = {
  "CS101":   { code: "CS101",   name: "Intro to Computer Science", instructor: "Prof. Williams", room: "Hall A", time: "09:00 AM" },
  "CS202":   { code: "CS202",   name: "Data Structures",           instructor: "Prof. Brown",    room: "Lab 2",  time: "02:00 PM" },
  "MATH201": { code: "MATH201", name: "Calculus II",               instructor: "Prof. Davis",    room: "Hall B", time: "11:00 AM" },
  "PHYS101": { code: "PHYS101", name: "Physics I",                 instructor: "Prof. Martinez", room: "Hall C", time: "01:00 PM" },
  "IS101":   { code: "IS101",   name: "Information Systems",       instructor: "Prof. Wilson",   room: "Lab 1",  time: "10:00 AM" },
  "SE301":   { code: "SE301",   name: "Software Engineering",      instructor: "Prof. Taylor",   room: "Hall D", time: "03:00 PM" }
}

export const mockRecentActivity = {
  "STU-2024-001": [
    { code: "CS101",   name: "Intro to Computer Science", date: "Today, 09:05 AM",        status: "Present" },
    { code: "MATH201", name: "Calculus II",               date: "Yesterday, 11:00 AM",    status: "Present" },
    { code: "PHYS101", name: "Physics I",                 date: "2 days ago, 01:00 PM",   status: "Absent"  }
  ],
  "STU-2024-002": [
    { code: "IS101",   name: "Information Systems",       date: "Today, 10:05 AM",        status: "Present" },
    { code: "MATH201", name: "Calculus II",               date: "Yesterday, 11:00 AM",    status: "Absent"  },
    { code: "CS202",   name: "Data Structures",           date: "2 days ago, 02:00 PM",   status: "Present" }
  ],
  "STU-2024-003": [
    { code: "CS101",   name: "Intro to Computer Science", date: "Today, 09:05 AM",        status: "Absent"  },
    { code: "SE301",   name: "Software Engineering",      date: "Yesterday, 03:00 PM",    status: "Present" },
    { code: "CS202",   name: "Data Structures",           date: "2 days ago, 02:00 PM",   status: "Present" }
  ]
}

// Per-course attendance stats, used by Stats page
export const mockCourseAttendance = {
  "STU-2024-001": {
    CS101:   { present: 14, absent: 2, total: 16 },
    MATH201: { present: 10, absent: 4, total: 14 },
    PHYS101: { present: 8,  absent: 8, total: 16 },
  },
  "STU-2024-002": {
    IS101:   { present: 12, absent: 2, total: 14 },
    MATH201: { present: 9,  absent: 5, total: 14 },
    CS202:   { present: 13, absent: 2, total: 15 },
  },
  "STU-2024-003": {
    CS101:   { present: 15, absent: 1, total: 16 },
    CS202:   { present: 12, absent: 3, total: 15 },
    SE301:   { present: 10, absent: 4, total: 14 },
  },
}

// Used by Confirmation page
export const mockSession = {
  courseCode: "CS101",
  courseName: "Intro to CS",
  instructor: "Prof. A. Dumbledore",
  date: "Oct 24, 2023",
  time: "10:03 AM",
  location: "Science Building, Hall A",
  status: "VERIFIED"
}
