--
-- PostgreSQL database dump
--

\restrict iOXHHqY10BLpdMHNx1zgG2nTyt76CraL4fwttYhxU0ly8qKTGqWKP0ik49CIouG

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

-- Started on 2026-05-05 16:40:11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 24625)
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- TOC entry 5345 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- TOC entry 1017 (class 1247 OID 25073)
-- Name: attendancestatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendancestatus AS ENUM (
    'present',
    'absent',
    'pending'
);


--
-- TOC entry 1035 (class 1247 OID 25167)
-- Name: dayofweek; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.dayofweek AS ENUM (
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday'
);


--
-- TOC entry 1044 (class 1247 OID 25200)
-- Name: pendingattendancestatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pendingattendancestatus AS ENUM (
    'pending',
    'approved',
    'declined'
);


--
-- TOC entry 1041 (class 1247 OID 25193)
-- Name: pendingreason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pendingreason AS ENUM (
    'qr_failed',
    'camera_error',
    'other'
);


--
-- TOC entry 1011 (class 1247 OID 25044)
-- Name: sessionstatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sessionstatus AS ENUM (
    'active',
    'closed',
    'expired'
);


--
-- TOC entry 993 (class 1247 OID 24954)
-- Name: userrole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.userrole AS ENUM (
    'student',
    'instructor',
    'admin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 24620)
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- TOC entry 230 (class 1259 OID 25080)
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_records (
    id integer NOT NULL,
    session_id integer NOT NULL,
    student_id integer NOT NULL,
    status public.attendancestatus DEFAULT 'present'::public.attendancestatus,
    face_similarity_score double precision,
    qr_validated boolean DEFAULT false,
    face_validated boolean DEFAULT false,
    submitted_at timestamp with time zone DEFAULT now(),
    ip_address character varying(50)
);


--
-- TOC entry 229 (class 1259 OID 25079)
-- Name: attendance_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendance_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 229
-- Name: attendance_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendance_records_id_seq OWNED BY public.attendance_records.id;


--
-- TOC entry 228 (class 1259 OID 25052)
-- Name: attendance_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_sessions (
    id integer NOT NULL,
    course_id integer NOT NULL,
    title character varying(200),
    status public.sessionstatus DEFAULT 'active'::public.sessionstatus,
    qr_token text,
    qr_expires_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now(),
    ended_at timestamp with time zone,
    created_by_id integer NOT NULL
);


--
-- TOC entry 227 (class 1259 OID 25051)
-- Name: attendance_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendance_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 227
-- Name: attendance_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendance_sessions_id_seq OWNED BY public.attendance_sessions.id;


--
-- TOC entry 240 (class 1259 OID 25178)
-- Name: course_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_schedules (
    id integer NOT NULL,
    course_id integer NOT NULL,
    day_of_week public.dayofweek NOT NULL,
    start_time character varying(5) NOT NULL,
    end_time character varying(5) NOT NULL,
    room character varying(100),
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 239 (class 1259 OID 25177)
-- Name: course_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.course_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 239
-- Name: course_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.course_schedules_id_seq OWNED BY public.course_schedules.id;


--
-- TOC entry 224 (class 1259 OID 25007)
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    instructor_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 223 (class 1259 OID 25006)
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 223
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- TOC entry 226 (class 1259 OID 25024)
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    id integer NOT NULL,
    student_id integer NOT NULL,
    course_id integer NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 225 (class 1259 OID 25023)
-- Name: enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 225
-- Name: enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.enrollments_id_seq OWNED BY public.enrollments.id;


--
-- TOC entry 232 (class 1259 OID 25103)
-- Name: face_embeddings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.face_embeddings (
    id integer NOT NULL,
    student_id integer NOT NULL,
    version integer DEFAULT 1,
    photo_path character varying(500),
    created_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    embedding public.vector(512)
);


--
-- TOC entry 231 (class 1259 OID 25102)
-- Name: face_embeddings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.face_embeddings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 231
-- Name: face_embeddings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.face_embeddings_id_seq OWNED BY public.face_embeddings.id;


--
-- TOC entry 222 (class 1259 OID 24993)
-- Name: instructors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructors (
    id integer NOT NULL,
    user_id integer NOT NULL,
    department character varying(100),
    title character varying(50)
);


--
-- TOC entry 221 (class 1259 OID 24992)
-- Name: instructors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.instructors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5352 (class 0 OID 0)
-- Dependencies: 221
-- Name: instructors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.instructors_id_seq OWNED BY public.instructors.id;


--
-- TOC entry 234 (class 1259 OID 25121)
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    email_alerts boolean,
    attendance_confirmation boolean,
    low_attendance_warning boolean,
    session_start_reminder boolean,
    weekly_summary_report boolean,
    at_risk_student_alert boolean,
    updated_at timestamp with time zone
);


--
-- TOC entry 233 (class 1259 OID 25120)
-- Name: notification_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5353 (class 0 OID 0)
-- Dependencies: 233
-- Name: notification_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_preferences_id_seq OWNED BY public.notification_preferences.id;


--
-- TOC entry 236 (class 1259 OID 25136)
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(6) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 235 (class 1259 OID 25135)
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 235
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- TOC entry 242 (class 1259 OID 25208)
-- Name: pending_attendances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_attendances (
    id integer NOT NULL,
    session_id integer NOT NULL,
    student_id integer NOT NULL,
    reason public.pendingreason NOT NULL,
    note text,
    status public.pendingattendancestatus NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone
);


--
-- TOC entry 241 (class 1259 OID 25207)
-- Name: pending_attendances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pending_attendances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 241
-- Name: pending_attendances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pending_attendances_id_seq OWNED BY public.pending_attendances.id;


--
-- TOC entry 220 (class 1259 OID 24975)
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id integer NOT NULL,
    user_id integer NOT NULL,
    student_number character varying(20) NOT NULL,
    department character varying(100),
    face_enrolled boolean DEFAULT false,
    enrollment_consent boolean DEFAULT false
);


--
-- TOC entry 219 (class 1259 OID 24974)
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5356 (class 0 OID 0)
-- Dependencies: 219
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- TOC entry 238 (class 1259 OID 25152)
-- Name: system_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_configs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    geo_fencing_radius integer,
    absence_threshold integer,
    qr_refresh_interval integer,
    face_verification_required boolean,
    updated_at timestamp with time zone
);


--
-- TOC entry 237 (class 1259 OID 25151)
-- Name: system_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5357 (class 0 OID 0)
-- Dependencies: 237
-- Name: system_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_configs_id_seq OWNED BY public.system_configs.id;


--
-- TOC entry 218 (class 1259 OID 24962)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    role public.userrole NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- TOC entry 217 (class 1259 OID 24961)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5358 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 5073 (class 2604 OID 25083)
-- Name: attendance_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records ALTER COLUMN id SET DEFAULT nextval('public.attendance_records_id_seq'::regclass);


--
-- TOC entry 5070 (class 2604 OID 25055)
-- Name: attendance_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_sessions ALTER COLUMN id SET DEFAULT nextval('public.attendance_sessions_id_seq'::regclass);


--
-- TOC entry 5086 (class 2604 OID 25181)
-- Name: course_schedules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_schedules ALTER COLUMN id SET DEFAULT nextval('public.course_schedules_id_seq'::regclass);


--
-- TOC entry 5065 (class 2604 OID 25010)
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- TOC entry 5068 (class 2604 OID 25027)
-- Name: enrollments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq'::regclass);


--
-- TOC entry 5078 (class 2604 OID 25106)
-- Name: face_embeddings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.face_embeddings ALTER COLUMN id SET DEFAULT nextval('public.face_embeddings_id_seq'::regclass);


--
-- TOC entry 5064 (class 2604 OID 24996)
-- Name: instructors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructors ALTER COLUMN id SET DEFAULT nextval('public.instructors_id_seq'::regclass);


--
-- TOC entry 5082 (class 2604 OID 25124)
-- Name: notification_preferences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences ALTER COLUMN id SET DEFAULT nextval('public.notification_preferences_id_seq'::regclass);


--
-- TOC entry 5083 (class 2604 OID 25139)
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- TOC entry 5088 (class 2604 OID 25211)
-- Name: pending_attendances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_attendances ALTER COLUMN id SET DEFAULT nextval('public.pending_attendances_id_seq'::regclass);


--
-- TOC entry 5061 (class 2604 OID 24978)
-- Name: students id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- TOC entry 5085 (class 2604 OID 25155)
-- Name: system_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_configs ALTER COLUMN id SET DEFAULT nextval('public.system_configs_id_seq'::regclass);


--
-- TOC entry 5058 (class 2604 OID 24965)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5313 (class 0 OID 24620)
-- Dependencies: 216
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alembic_version (version_num) FROM stdin;
a39f9ad280d9
\.


--
-- TOC entry 5327 (class 0 OID 25080)
-- Dependencies: 230
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_records (id, session_id, student_id, status, face_similarity_score, qr_validated, face_validated, submitted_at, ip_address) FROM stdin;
\.


--
-- TOC entry 5325 (class 0 OID 25052)
-- Dependencies: 228
-- Data for Name: attendance_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_sessions (id, course_id, title, status, qr_token, qr_expires_at, started_at, ended_at, created_by_id) FROM stdin;
\.


--
-- TOC entry 5337 (class 0 OID 25178)
-- Dependencies: 240
-- Data for Name: course_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.course_schedules (id, course_id, day_of_week, start_time, end_time, room, created_at) FROM stdin;
\.


--
-- TOC entry 5321 (class 0 OID 25007)
-- Dependencies: 224
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.courses (id, code, name, description, instructor_id, is_active, created_at) FROM stdin;
\.


--
-- TOC entry 5323 (class 0 OID 25024)
-- Dependencies: 226
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enrollments (id, student_id, course_id, enrolled_at) FROM stdin;
\.


--
-- TOC entry 5329 (class 0 OID 25103)
-- Dependencies: 232
-- Data for Name: face_embeddings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.face_embeddings (id, student_id, version, photo_path, created_at, is_active, embedding) FROM stdin;
\.


--
-- TOC entry 5319 (class 0 OID 24993)
-- Dependencies: 222
-- Data for Name: instructors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.instructors (id, user_id, department, title) FROM stdin;
\.


--
-- TOC entry 5331 (class 0 OID 25121)
-- Dependencies: 234
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_preferences (id, user_id, email_alerts, attendance_confirmation, low_attendance_warning, session_start_reminder, weekly_summary_report, at_risk_student_alert, updated_at) FROM stdin;
\.


--
-- TOC entry 5333 (class 0 OID 25136)
-- Dependencies: 236
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, user_id, email, code, expires_at, used_at, created_at) FROM stdin;
\.


--
-- TOC entry 5339 (class 0 OID 25208)
-- Dependencies: 242
-- Data for Name: pending_attendances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pending_attendances (id, session_id, student_id, reason, note, status, created_at, resolved_at) FROM stdin;
\.


--
-- TOC entry 5317 (class 0 OID 24975)
-- Dependencies: 220
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.students (id, user_id, student_number, department, face_enrolled, enrollment_consent) FROM stdin;
\.


--
-- TOC entry 5335 (class 0 OID 25152)
-- Dependencies: 238
-- Data for Name: system_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_configs (id, user_id, geo_fencing_radius, absence_threshold, qr_refresh_interval, face_verification_required, updated_at) FROM stdin;
\.


--
-- TOC entry 5315 (class 0 OID 24962)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, hashed_password, first_name, last_name, role, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5359 (class 0 OID 0)
-- Dependencies: 229
-- Name: attendance_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attendance_records_id_seq', 1, false);


--
-- TOC entry 5360 (class 0 OID 0)
-- Dependencies: 227
-- Name: attendance_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attendance_sessions_id_seq', 1, false);


--
-- TOC entry 5361 (class 0 OID 0)
-- Dependencies: 239
-- Name: course_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.course_schedules_id_seq', 1, false);


--
-- TOC entry 5362 (class 0 OID 0)
-- Dependencies: 223
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.courses_id_seq', 1, false);


--
-- TOC entry 5363 (class 0 OID 0)
-- Dependencies: 225
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 1, false);


--
-- TOC entry 5364 (class 0 OID 0)
-- Dependencies: 231
-- Name: face_embeddings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.face_embeddings_id_seq', 1, false);


--
-- TOC entry 5365 (class 0 OID 0)
-- Dependencies: 221
-- Name: instructors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.instructors_id_seq', 1, false);


--
-- TOC entry 5366 (class 0 OID 0)
-- Dependencies: 233
-- Name: notification_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_preferences_id_seq', 1, false);


--
-- TOC entry 5367 (class 0 OID 0)
-- Dependencies: 235
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- TOC entry 5368 (class 0 OID 0)
-- Dependencies: 241
-- Name: pending_attendances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pending_attendances_id_seq', 1, false);


--
-- TOC entry 5369 (class 0 OID 0)
-- Dependencies: 219
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.students_id_seq', 1, false);


--
-- TOC entry 5370 (class 0 OID 0)
-- Dependencies: 237
-- Name: system_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_configs_id_seq', 1, false);


--
-- TOC entry 5371 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- TOC entry 5091 (class 2606 OID 24624)
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- TOC entry 5120 (class 2606 OID 25089)
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);


--
-- TOC entry 5122 (class 2606 OID 25091)
-- Name: attendance_records attendance_records_session_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_session_id_student_id_key UNIQUE (session_id, student_id);


--
-- TOC entry 5117 (class 2606 OID 25061)
-- Name: attendance_sessions attendance_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_sessions
    ADD CONSTRAINT attendance_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5144 (class 2606 OID 25184)
-- Name: course_schedules course_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_schedules
    ADD CONSTRAINT course_schedules_pkey PRIMARY KEY (id);


--
-- TOC entry 5108 (class 2606 OID 25016)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- TOC entry 5112 (class 2606 OID 25030)
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- TOC entry 5114 (class 2606 OID 25032)
-- Name: enrollments enrollments_student_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_course_id_key UNIQUE (student_id, course_id);


--
-- TOC entry 5126 (class 2606 OID 25113)
-- Name: face_embeddings face_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.face_embeddings
    ADD CONSTRAINT face_embeddings_pkey PRIMARY KEY (id);


--
-- TOC entry 5103 (class 2606 OID 24998)
-- Name: instructors instructors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructors
    ADD CONSTRAINT instructors_pkey PRIMARY KEY (id);


--
-- TOC entry 5105 (class 2606 OID 25000)
-- Name: instructors instructors_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructors
    ADD CONSTRAINT instructors_user_id_key UNIQUE (user_id);


--
-- TOC entry 5130 (class 2606 OID 25126)
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- TOC entry 5132 (class 2606 OID 25128)
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- TOC entry 5137 (class 2606 OID 25142)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 5151 (class 2606 OID 25216)
-- Name: pending_attendances pending_attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_attendances
    ADD CONSTRAINT pending_attendances_pkey PRIMARY KEY (id);


--
-- TOC entry 5153 (class 2606 OID 25218)
-- Name: pending_attendances pending_attendances_session_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_attendances
    ADD CONSTRAINT pending_attendances_session_id_student_id_key UNIQUE (session_id, student_id);


--
-- TOC entry 5099 (class 2606 OID 24982)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- TOC entry 5101 (class 2606 OID 24984)
-- Name: students students_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_key UNIQUE (user_id);


--
-- TOC entry 5140 (class 2606 OID 25157)
-- Name: system_configs system_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT system_configs_pkey PRIMARY KEY (id);


--
-- TOC entry 5142 (class 2606 OID 25159)
-- Name: system_configs system_configs_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT system_configs_user_id_key UNIQUE (user_id);


--
-- TOC entry 5095 (class 2606 OID 24971)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5124 (class 1259 OID 25119)
-- Name: face_embeddings_ivfflat_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX face_embeddings_ivfflat_idx ON public.face_embeddings USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- TOC entry 5123 (class 1259 OID 25232)
-- Name: ix_attendance_records_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_attendance_records_id ON public.attendance_records USING btree (id);


--
-- TOC entry 5118 (class 1259 OID 25233)
-- Name: ix_attendance_sessions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_attendance_sessions_id ON public.attendance_sessions USING btree (id);


--
-- TOC entry 5145 (class 1259 OID 25190)
-- Name: ix_course_schedules_course_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_course_schedules_course_id ON public.course_schedules USING btree (course_id);


--
-- TOC entry 5146 (class 1259 OID 25191)
-- Name: ix_course_schedules_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_course_schedules_id ON public.course_schedules USING btree (id);


--
-- TOC entry 5109 (class 1259 OID 25022)
-- Name: ix_courses_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_courses_code ON public.courses USING btree (code);


--
-- TOC entry 5110 (class 1259 OID 25234)
-- Name: ix_courses_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_courses_id ON public.courses USING btree (id);


--
-- TOC entry 5115 (class 1259 OID 25235)
-- Name: ix_enrollments_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_enrollments_id ON public.enrollments USING btree (id);


--
-- TOC entry 5127 (class 1259 OID 25236)
-- Name: ix_face_embeddings_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_face_embeddings_id ON public.face_embeddings USING btree (id);


--
-- TOC entry 5106 (class 1259 OID 25237)
-- Name: ix_instructors_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_instructors_id ON public.instructors USING btree (id);


--
-- TOC entry 5128 (class 1259 OID 25134)
-- Name: ix_notification_preferences_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification_preferences_id ON public.notification_preferences USING btree (id);


--
-- TOC entry 5133 (class 1259 OID 25148)
-- Name: ix_password_reset_tokens_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_password_reset_tokens_email ON public.password_reset_tokens USING btree (email);


--
-- TOC entry 5134 (class 1259 OID 25149)
-- Name: ix_password_reset_tokens_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_password_reset_tokens_id ON public.password_reset_tokens USING btree (id);


--
-- TOC entry 5135 (class 1259 OID 25150)
-- Name: ix_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- TOC entry 5147 (class 1259 OID 25229)
-- Name: ix_pending_attendances_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pending_attendances_id ON public.pending_attendances USING btree (id);


--
-- TOC entry 5148 (class 1259 OID 25230)
-- Name: ix_pending_attendances_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pending_attendances_session_id ON public.pending_attendances USING btree (session_id);


--
-- TOC entry 5149 (class 1259 OID 25231)
-- Name: ix_pending_attendances_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pending_attendances_student_id ON public.pending_attendances USING btree (student_id);


--
-- TOC entry 5096 (class 1259 OID 24991)
-- Name: ix_students_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_students_id ON public.students USING btree (id);


--
-- TOC entry 5097 (class 1259 OID 24990)
-- Name: ix_students_student_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_students_student_number ON public.students USING btree (student_number);


--
-- TOC entry 5138 (class 1259 OID 25165)
-- Name: ix_system_configs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_system_configs_id ON public.system_configs USING btree (id);


--
-- TOC entry 5092 (class 1259 OID 24972)
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- TOC entry 5093 (class 1259 OID 24973)
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- TOC entry 5161 (class 2606 OID 25092)
-- Name: attendance_records attendance_records_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.attendance_sessions(id) ON DELETE CASCADE;


--
-- TOC entry 5162 (class 2606 OID 25097)
-- Name: attendance_records attendance_records_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 5159 (class 2606 OID 25062)
-- Name: attendance_sessions attendance_sessions_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_sessions
    ADD CONSTRAINT attendance_sessions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 5160 (class 2606 OID 25067)
-- Name: attendance_sessions attendance_sessions_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_sessions
    ADD CONSTRAINT attendance_sessions_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- TOC entry 5167 (class 2606 OID 25185)
-- Name: course_schedules course_schedules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_schedules
    ADD CONSTRAINT course_schedules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 5156 (class 2606 OID 25017)
-- Name: courses courses_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE SET NULL;


--
-- TOC entry 5157 (class 2606 OID 25038)
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 5158 (class 2606 OID 25033)
-- Name: enrollments enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 5163 (class 2606 OID 25114)
-- Name: face_embeddings face_embeddings_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.face_embeddings
    ADD CONSTRAINT face_embeddings_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 5155 (class 2606 OID 25001)
-- Name: instructors instructors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructors
    ADD CONSTRAINT instructors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5164 (class 2606 OID 25129)
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5165 (class 2606 OID 25143)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5168 (class 2606 OID 25219)
-- Name: pending_attendances pending_attendances_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_attendances
    ADD CONSTRAINT pending_attendances_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.attendance_sessions(id) ON DELETE CASCADE;


--
-- TOC entry 5169 (class 2606 OID 25224)
-- Name: pending_attendances pending_attendances_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_attendances
    ADD CONSTRAINT pending_attendances_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 5154 (class 2606 OID 24985)
-- Name: students students_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5166 (class 2606 OID 25160)
-- Name: system_configs system_configs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT system_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-05-05 16:40:12

--
-- PostgreSQL database dump complete
--

\unrestrict iOXHHqY10BLpdMHNx1zgG2nTyt76CraL4fwttYhxU0ly8qKTGqWKP0ik49CIouG

