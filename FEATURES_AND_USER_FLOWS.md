# Kannari Music Academy LMS — Complete Features & User Flows

> **Document scope**: All features developed or updated across Phases 1–10 of the Child Safety, Messaging, Assignment, and Group Structure implementation.

---

## Table of Contents

1. [Phase Summary](#phase-summary)
2. [Feature 1: Child Safety & Minor Detection](#feature-1-child-safety--minor-detection)
3. [Feature 2: Parent Account & Consent System](#feature-2-parent-account--consent-system)
4. [Feature 3: Parent Portal (Login + Dashboard)](#feature-3-parent-portal-login--dashboard)
5. [Feature 4: Text Messaging (Parent ↔ Teacher)](#feature-4-text-messaging-parent--teacher)
6. [Feature 5: Chat Lock & Office Hours](#feature-5-chat-lock--office-hours)

7. [Feature 6: Group Classes](#feature-6-group-classes)
8. [Feature 7: Group Chat (Real-Time Messaging)](#feature-7-group-chat-real-time-messaging)
9. [Feature 8: Group Sessions (Live Video)](#feature-8-group-sessions-live-video)
10. [Feature 9: Group Announcements & Resources](#feature-9-group-announcements--resources)
11. [Feature 10: Lesson Assignments (Multi-Type)](#feature-10-lesson-assignments-multi-type)
12. [Feature 11: Multiple Choice Quizzes (Auto-Graded)](#feature-11-multiple-choice-quizzes-auto-graded)
13. [Feature 12: Discussion Threads](#feature-12-discussion-threads)
14. [Feature 13: Student Registration (Minor-Aware)](#feature-13-student-registration-minor-aware)
15. [Feature 14: Minor Restriction UI](#feature-14-minor-restriction-ui)
16. [Feature 15: Audit Logging & Admin Dashboard](#feature-15-audit-logging--admin-dashboard)
17. [Feature 16: Policy Documents & Parent Acceptance](#feature-16-policy-documents--parent-acceptance)
18. [Feature 17: Session Participant Logging](#feature-17-session-participant-logging)

---

## Phase Summary

| Phase | Title | What Was Built |
|-------|-------|----------------|
| 1 | Backend Models & Migrations | Message, ChatLockPolicy, TeacherOfficeHours, ChatUnlockRequest, ParentalConsent, SessionAuthorization, PolicyDocument, ParentPolicyAcceptance, GroupMessage, GroupAnnouncement, GroupResource, GroupSession, GroupSessionParticipantLog, LessonAssignment enhancements, MultipleChoiceQuestion/Answer, DiscussionThread |
| 2 | Serializers, Views & URL Routing | 50+ new API endpoints for messaging, groups, assignments, consent |
| 3 | Frontend Messaging & Chat Components | TeacherMessages, TextMessages, messagingService.js |
| 4 | Backend Group APIs | Group CRUD, member management, group chat, sessions, announcements, resources |
| 5 | Backend Registration & Parent Flow | Student minor detection, parent account auto-creation, consent email flow, minor access status |
| 6 | Frontend Messaging UI | ParentLogin, ParentMessages, TeacherOfficeHours, MessageLogsTable, ChatLock admin controls |
| 7 | Frontend Assignment UI Enhancement | Rewrote SchoolLessonAssignments, StudentAssignments, TeacherAssignmentCreate, TeacherAssignmentReviews |
| 8 | Frontend Group Features UI | StudentGroups, StudentGroupDetail, GroupChat, GroupSessions, GroupAnnouncements, Sidebar groups |
| 9 | Frontend Registration & Parent Flow | Register.jsx minor detection, ParentDashboard, Sidebar minor restrictions, approval banners |
| 10 | Audit & Integration Testing | ActivityLog expansion, audit logging on messages/assignments/sessions, ActivityLogsTable, audit summary stats |

---

## Feature 1: Child Safety & Minor Detection

### What It Does
Automatically detects students under 18 based on their date of birth and enforces safety restrictions on messaging, live sessions, and group participation.

### Models
- **Student** — `date_of_birth`, `parent_account_required`, `parent_linked_at`
  - `is_minor()` — Returns `True` if student is under 18
  - `can_send_messages()` — Returns `True` only if non-minor OR has approved parent with accepted policies
  - `has_approved_parent_with_policies()` — Checks for approved `StudentParentLink` + parent accepted all required `PolicyDocument` entries

### User Flow — Student Under 18

```
1. Student registers with DOB that makes them < 18
       ↓
2. System detects minor → sets parent_account_required = True
       ↓
3. Student must provide parent/guardian email during registration
       ↓
4. Parent receives consent email with verification link
       ↓
5. Until parent approves:
   - Student CAN browse courses, enroll, do assignments
   - Student CANNOT send messages (text or audio)
   - Student CANNOT join live sessions without parental consent
   - Sidebar dims "Messages" and "Text Messages" links
   - Banner "Parent approval required" shown on messaging pages
       ↓
6. Parent approves link + accepts policies
       ↓
7. Student gains full messaging and session access
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/student/{id}/minor-access-status/` | Returns `is_minor`, `can_send_messages`, `can_join_sessions`, `has_parent_approval`, `parent_info` |

---

## Feature 2: Parent Account & Consent System

### What It Does
Creates parent/guardian accounts, links them to student accounts, and manages granular consent (account activation, live sessions, messaging).

### Models
- **ParentAccount** — `fullname`, `email`, `password`, `mobile_no`, `is_verified`, `verification_token`, `token_expires_at`
- **StudentParentLink** — Links parent ↔ student with `relationship` (mother/father/guardian/other), `status` (pending/approved/revoked), `authorization_mode` (pre_authorized/per_session_login)
- **ParentalConsent** — Granular consent per link: `consent_type` (account_activation/live_sessions/messaging), `status` (pending/approved/revoked/expired)
- **SessionAuthorization** — Per-session approval for `per_session_login` mode

### User Flow — Parent Consent

```
1. Student registers as minor → provides parent email
       ↓
2. System auto-creates ParentAccount (if new) + StudentParentLink (pending)
       ↓
3. Consent email sent to parent with verification token link
       ↓
4. Parent clicks link → /parent/consent/:token page
       ↓
5. Parent sees child's info, reviews safety policies
       ↓
6. Parent choices:
   a. "Approve" → link.status = 'approved', consent created
   b. "Deny" → link.status = 'revoked'
       ↓
7. If approved, parent can also:
   - Set authorization_mode: "Pre-authorize all sessions" OR "Require login each session"
   - Grant/revoke live_sessions consent
   - Grant/revoke messaging consent
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/student/{id}/parent/request-link/` | Student requests a parent link |
| POST | `/student/{id}/parent/resend-email/` | Resend consent email |
| GET | `/student/{id}/parent/status/` | Get current parent consent status |
| GET | `/parent/consent/verify/` | Verify consent token |
| POST | `/parent/consent/respond/` | Parent approves/denies consent |
| POST | `/parent/{pid}/student/{sid}/authorize/` | Parent authorizes student |
| POST | `/parent/{pid}/student/{sid}/live-consent/` | Manage live session consent |
| POST | `/parent/{pid}/student/{sid}/preauthorize-sessions/` | Pre-authorize all sessions |
| POST | `/student/{id}/submit-parent-email/` | Minor submits parent email post-registration |
| GET | `/parent/{id}/children/` | List all linked children |
| GET | `/session/{sid}/student/{stid}/parental-status/` | Check parental consent for a specific session |

---

## Feature 3: Parent Portal (Login + Dashboard)

### What It Does
Provides parents a dedicated login and dashboard to manage their children's accounts, view activity, manage consent, and message teachers.

### Components
- **ParentLogin.jsx** — Email → login code flow (no password, code sent via email)
- **ParentDashboard.jsx** — Tabbed dashboard: Children | Messages | Settings
- **ParentMessages.jsx** — Chat interface for parent ↔ teacher conversations

### User Flow — Parent Login & Dashboard

```
1. Parent navigates to /parent-login
       ↓
2. Enters email → clicks "Send Code"
       ↓
3. Backend sends 6-digit login code to parent's email
       ↓
4. Parent enters code → clicks "Verify"
       ↓
5. On success → redirected to /parent-dashboard
       ↓
6. Dashboard shows 3 tabs:

   TAB: Children
   ├─ Lists all linked children with:
   │   ├─ Student name, email
   │   ├─ Link status badge (Approved ✓ / Pending ⏳ / Revoked ✗)
   │   ├─ Authorization mode display
   │   └─ Live sessions consent toggle (Approve/Revoke)
   └─ Activity summary cards (courses, sessions, assignments)

   TAB: Messages
   ├─ Select a child → opens teacher conversation
   ├─ Real-time polling (10s intervals)
   ├─ Send/receive messages with child safety notice
   └─ Chat lock status indicator

   TAB: Settings
   ├─ Parent account info (name, email)
   └─ Sign out button
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/parent/login/request/` | Request login code via email |
| POST | `/parent/login/verify/` | Verify login code → returns parent_id, linked students |

### localStorage Keys
- `parentId` — Parent account ID
- `parentName` — Display name
- `parentLoginStatus` — `"true"` when logged in

---

## Feature 4: Text Messaging (Parent ↔ Teacher)

### What It Does
Secure text messaging between parents and teachers, with full message history, read receipts, chat lock enforcement, and safety monitoring.

### Models
- **Message** — `sender_type` (parent/teacher/admin), `recipient_type`, sender/recipient FKs, `parent_link` FK, `content`, `is_read`, `read_at`, `is_hidden_by_sender`, `is_hidden_by_recipient`

### Components
- **TeacherMessages.jsx** — Teacher's view of all parent/teacher conversations
- **TextMessages.jsx** — Student's view (restricted for minors)
- **messagingService.js** — API service layer: `getConversation()`, `sendMessage()`, `markMessagesRead()`, `getUnreadMessageCount()`

### User Flow — Teacher ↔ Parent Messaging

```
TEACHER SIDE:
1. Teacher navigates to /teacher-text-messages
2. Sees list of parent conversations (linked to their students)
3. Clicks a conversation → chat panel opens
4. Types message → Send
5. Message stored with sender_type='teacher', parent_link FK set
6. ActivityLog entry created: action='message'

PARENT SIDE:
1. Parent logs into /parent-dashboard → Messages tab
2. Clicks child → teacher conversation loads
3. Types message → Send
4. If chat is locked → "Chat Locked" message shown with countdown
5. Messages polled every 10 seconds for updates
6. Read receipts shown (✓✓) when teacher reads

MINOR STUDENT SIDE:
1. Student navigates to /my-text-messages
2. If minor without approved parent:
   - Yellow banner: "Parent Approval Required"
   - "Your parent/guardian must verify and approve your account..."
   - Link to submit parent email if not yet provided
3. If parent approved → normal message view
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/messages/` | List all messages (admin: all; filtered by sender/recipient) |
| GET | `/messages/conversation/{parent_link_id}/` | Get full conversation thread |
| POST | `/messages/send/` | Send a message |
| POST | `/messages/mark-read/{parent_link_id}/` | Mark messages as read |
| GET | `/messages/unread-count/` | Get unread message count |
yes 
---

## Feature 5: Chat Lock & Office Hours

### What It Does
Age-tier based chat locking system. Children 4-12 have most restricted access; teens 13-17 get session-based unlocks; 18+ unrestricted. Teachers set office hours for automatic unlock windows.

### Models
- **ChatLockPolicy** — `parent_link` (1:1), `is_locked`, `lock_reason` (age_default/admin_lock/policy), `unlocked_by` (admin/session/office_hours/system), `unlock_expires_at`
  - `is_chat_currently_allowed()` → applies age-tier logic
- **TeacherOfficeHours** — `teacher` FK, `day_of_week` (0=Monday..6=Sunday), `start_time`, `end_time`, `is_active`
- **ChatUnlockRequest** — Admin/school temporary unlocks with `duration_hours` (24 or 168)

### User Flow — Chat Lock

```
AUTOMATIC LOCK (Age-Tier):
- Student age 4-12: Chat always locked unless admin unlocks
- Student age 13-17: Chat locked by default, auto-unlocks during teacher office hours
- Student age 18+: No restrictions

TEACHER OFFICE HOURS:
1. Teacher navigates to /teacher-office-hours
2. Sets weekly schedule (e.g., Mon-Fri 3 PM - 5 PM)
3. During those hours, chat auto-unlocks for 13-17 students
4. Outside hours, chat re-locks

ADMIN OVERRIDE:
1. Admin can toggle chat lock for any parent_link
2. Admin can grant temporary unlocks (24h or 7 days)
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/chat-lock-policies/` | List all chat lock policies |
| GET/PUT | `/chat-lock-policy/{pk}/` | Get/update specific policy |
| GET | `/chat-lock-status/{parent_link_id}/` | Check if chat is currently allowed |
| POST | `/admin/chat-lock/{parent_link_id}/toggle/` | Admin toggle lock |
| GET | `/chat-unlock-requests/` | List unlock requests |
| GET/POST | `/teacher/{id}/office-hours/` | CRUD teacher office hours |
| GET/PUT/DELETE | `/office-hours/{pk}/` | Manage specific office hour entry |

---

## Feature 6: Group Classes

### What It Does
Schools create group classes, assign teachers and students, and manage group-level features (chat, sessions, announcements, resources, assignments).

### Models
- **GroupClass** — `school` FK, `name`, `description`, `schedule`, `max_students`, `is_active`
- **GroupClassTeacher** — `group_class` FK, `teacher` FK (unique together)
- **GroupClassStudent** — `group_class` FK, `student` FK (unique together)

### Components
- **SchoolGroupClasses.jsx** — School admin creates/manages groups
- **SchoolGroupDetail.jsx** — Group detail with tabs: Members | Chat | Sessions | Announcements | Assignments
- **StudentGroups.jsx** — Student's list of enrolled groups
- **StudentGroupDetail.jsx** — Student's group view with Chat | Sessions | Announcements tabs

### User Flow — School Admin Creating a Group

```
1. School admin navigates to /school/group-classes
       ↓
2. Clicks "Create Group" → fills name, description, max students
       ↓
3. Group created → opens group detail page
       ↓
4. Tabs available:
   ├─ Members → Assign teachers & students
   ├─ Chat → View/moderate group chat messages
   ├─ Sessions → Schedule & manage group live sessions
   ├─ Announcements → Post announcements
   └─ Assignments → View group assignments
```

### User Flow — Student Viewing Groups

```
1. Student sidebar shows "My Groups" section (auto-fetched)
2. Groups with live sessions show green pulse indicator
3. Click "All Groups" → /my-groups → list of enrolled groups
4. Click a group → /my-groups (StudentGroupDetail) with tabs:
   ├─ Chat → Group chat (restricted for minors)
   ├─ Sessions → Upcoming/live group sessions
   └─ Announcements → Pinned + regular announcements
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/school/groups/{school_id}/` | List/create groups |
| GET/PUT/DELETE | `/school/group/{pk}/` | Group detail CRUD |
| POST | `/school/group/{id}/assign-teacher/` | Add teacher to group |
| DELETE | `/school/group/{id}/remove-teacher/{teacher_id}/` | Remove teacher |
| POST | `/school/group/{id}/assign-student/` | Add student to group |
| DELETE | `/school/group/{id}/remove-student/{student_id}/` | Remove student |
| GET | `/school/group/{id}/teachers/` | List group teachers |
| GET | `/school/group/{id}/students/` | List group students |
| GET | `/student/{id}/my-groups/` | Student's enrolled groups |
| GET | `/group-class/{id}/` | Public group detail |

---

## Feature 7: Group Chat (Real-Time Messaging)

### What It Does
Group-wide chat for enrolled students, teachers, and parents. Minors cannot post directly — parents post on their behalf. Messages are permanently stored, with pin and hide moderation.

### Models
- **GroupMessage** — `group_class` FK, `sender_type` (teacher/admin/parent/student), sender FKs, `sender_name` (cached), `content`, `is_pinned`, `is_hidden`

### Components
- **GroupChat.jsx** — Real-time chat with 5-second polling, role-based avatar colors, pinned message display, minor restriction enforcement

### User Flow — Group Chat

```
ADULT STUDENT / TEACHER:
1. Opens group → Chat tab
2. Sees message list with role-colored avatars:
   - Teacher: Purple (#8b5cf6)
   - Student: Blue (#3b82f6)
   - Parent: Green (#10b981)
   - Admin: Red (#ef4444)
3. Pinned messages shown at top with pin icon
4. Type message → Send
5. Messages auto-refresh every 5 seconds

MINOR STUDENT:
1. Opens group → Chat tab
2. Can READ all messages
3. Input area replaced with yellow banner:
   "Parent approval required to send messages in group chat"
4. Parent can post on behalf of child via their own dashboard

MODERATION (Teacher/Admin):
1. Click pin icon on message → toggles pinned status
2. Admin can hide inappropriate messages (is_hidden = True)
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/group/{id}/messages/` | List/send group messages |
| POST | `/group-message/{id}/toggle-pin/` | Toggle message pin |
| POST | `/group-message/{id}/hide/` | Hide inappropriate message |
| POST | `/group/{id}/chat/send/` | Alternative send endpoint |

---

## Feature 8: Group Sessions (Live Video)

### What It Does
Teachers schedule and run live video sessions for group classes using Jitsi Meet. Tracks participation with join/leave logging.

### Models
- **GroupSession** — `group_class` FK, `teacher` FK, `title`, `description`, `scheduled_date`, `scheduled_time`, `duration_minutes`, `session_type` (video_call/audio_call), `status` (scheduled/live/completed/cancelled), Jitsi room fields, `has_minor_participants`, `recording_enabled`
- **GroupSessionParticipantLog** — `session` FK, `teacher`/`student` FKs, `participant_role`, `joined_at`, `left_at`, `duration_seconds`, `ip_address`

### Components
- **GroupSessions.jsx** — Session list with live banner, join button, status filters, recording links

### User Flow — Group Live Session

```
TEACHER STARTS SESSION:
1. School/teacher creates session via /school/group-detail → Sessions tab
2. Fills: title, date, time, duration, type
3. System auto-generates Jitsi room name + meeting link
4. At session time, teacher clicks "Go Live"
5. session.go_live() → status='live', is_live=True
6. ActivityLog: action='session_start'

STUDENT JOINS:
1. Student sees "🔴 LIVE NOW" banner on group sessions
2. Clicks "Join Session"
3. Backend checks:
   a. Is session live? ✓
   b. Is student in this group? ✓
   c. If minor → is parental consent granted? ✓
4. GroupSessionParticipantLog created (joined_at recorded)
5. ActivityLog: action='session_join'
6. Student redirected to Jitsi meeting link

STUDENT LEAVES:
1. Student closes meeting / clicks leave
2. PUT to /group-session/{id}/leave/{log_id}/
3. left_at + duration_seconds calculated
4. ActivityLog: action='session_leave'

TEACHER ENDS SESSION:
1. Teacher clicks "End Session"
2. session.end_session() → status='completed', is_live=False
3. ActivityLog: action='session_end'
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/group/{id}/sessions/` | List/create sessions |
| GET/PUT/DELETE | `/group-session/{pk}/` | Session detail CRUD |
| POST | `/group-session/{id}/go-live/` | Start live session |
| POST | `/group-session/{id}/end/` | End live session |
| POST | `/group-session/{id}/join/{student_id}/` | Student joins |
| POST | `/group-session/{id}/leave/{log_id}/` | Student leaves |
| GET | `/group-session/{id}/participants/` | List participant logs |
| POST | `/group/{id}/schedule-session/` | Alternative session creation |

---

## Feature 9: Group Announcements & Resources

### What It Does
Teachers and admins post announcements (with priority levels) and share resources (files, links) within group classes.

### Models
- **GroupAnnouncement** — `group_class` FK, `teacher`/`admin` FKs, `title`, `content`, `file`, `is_pinned`, `priority` (low/normal/high/urgent)
- **GroupResource** — `group_class` FK, `teacher` FK, `title`, `description`, `file`, `link_url`, `file_type` (pdf/audio/video/image/sheet_music/other), `download_count`

### Components
- **GroupAnnouncements.jsx** — Priority badges (color-coded), pinned section at top, file attachments, expand/collapse for long content

### User Flow — Announcements

```
TEACHER POSTS ANNOUNCEMENT:
1. Opens group → Announcements tab
2. Clicks "New Announcement"
3. Fills title, content, optional file, priority level
4. Announcement appears for all group members
5. Priority badges:
   - 🔴 Urgent (red)
   - 🟠 High (orange)
   - 🔵 Normal (blue)
   - ⚪ Low (gray)
6. Pinned announcements always shown at top

STUDENT VIEWS:
1. Opens group → Announcements tab
2. Sees pinned announcements first
3. Regular announcements sorted by date
4. Can download attached files
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/group/{id}/announcements/` | List/create announcements |
| GET/PUT/DELETE | `/group-announcement/{pk}/` | Announcement detail CRUD |
| GET/POST | `/group/{id}/resources/` | List/upload resources |
| GET/PUT/DELETE | `/group-resource/{pk}/` | Resource detail CRUD |
| POST | `/group-resource/{id}/download/` | Increment download count |

---

## Feature 10: Lesson Assignments (Multi-Type)

### What It Does
Teachers and schools create assignments with multiple submission types. Supports individual and group assignments with due dates, grading, and teacher feedback.

### Models
- **LessonAssignment** — `school` FK, `teacher` FK, `lesson` FK, `title`, `description`, `submission_type` (audio/video/discussion/multiple_choice/file_upload), `status`, `assignment_type` (individual/group), `student`/`group_class` FKs, `due_date`, `audio_required`, `max_points`, `notes`
- **LessonAssignmentSubmission** — `assignment` FK, `student` FK, `audio_file`, `video_file`, `file`, `text_content`, `submission_notes`, `points_awarded`, `teacher_feedback`, `graded_by`, `graded_at`

### Components
- **SchoolLessonAssignments.jsx** — School creates assignments with submission type selector, title/description, due date, student/group selector, status badges, filters
- **StudentAssignments.jsx** — Student views assignments, submits work (file upload, text, audio, video), sees status badges using `computed_status`
- **TeacherAssignmentCreate.jsx** — Teacher creates assignments with MC question builder (option_a/b/c/d/correct_option), student selector
- **TeacherAssignmentReviews.jsx** — Teacher reviews submissions, multi-type display, MC auto-grade results, provides feedback and grades

### User Flow — Assignment Lifecycle

```
CREATION (Teacher/School):
1. Navigate to assignment creation page
2. Select submission type:
   ├─ Audio Upload
   ├─ Video Upload
   ├─ File Upload
   ├─ Discussion (text-based)
   └─ Multiple Choice (quiz)
3. Set title, description, max points, due date
4. Assign to individual student OR group class
5. For MC type: build questions with 4 options each + correct answer

SUBMISSION (Student):
1. Navigate to /my-assignments
2. See assignments with status badges:
   ├─ 🟡 Pending — Not yet submitted
   ├─ 🔵 Submitted — Awaiting review
   ├─ 🟠 Late — Past due date
   ├─ 🟢 Graded — Teacher reviewed
   └─ 🔴 Overdue — Past due, not submitted
3. Click assignment → submit based on type:
   ├─ File Upload → choose file → upload
   ├─ Audio → record/upload audio file
   ├─ Video → upload video file
   ├─ Discussion → write text response
   └─ Multiple Choice → answer all questions → auto-graded
4. ActivityLog: action='submission'

REVIEW (Teacher):
1. Navigate to /teacher-assignment-reviews
2. See all submissions with filters
3. Click submission → view content based on type
4. For MC: see auto-graded results (score, per-question breakdown)
5. For other types: review uploaded file/text
6. Enter points_awarded + teacher_feedback
7. Submit grade
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/school/lesson-assignments/{school_id}/` | School CRUD assignments |
| GET/PUT/DELETE | `/school/lesson-assignment/{pk}/` | Assignment detail |
| GET | `/student/{id}/lesson-assignments/` | Student's assignments |
| POST | `/student/{sid}/lesson-assignment/{aid}/submit/` | Submit assignment |
| GET | `/teacher/{id}/lesson-assignment-submissions/` | Teacher views submissions |
| POST | `/teacher/{tid}/lesson-assignment-submission/{sid}/grade/` | Grade submission |
| GET | `/teacher/{id}/assignments/` | Teacher's created assignments |
| GET | `/group/{id}/assignments/` | Group assignments |
| GET | `/student/{id}/group-assignments/` | Student's group assignments |

---

## Feature 11: Multiple Choice Quizzes (Auto-Graded)

### What It Does
Teachers create MC quizzes attached to assignments. Students answer all questions, and the system auto-grades immediately with per-question feedback.

### Models
- **MultipleChoiceQuestion** — `assignment` FK, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option` (a/b/c/d), `points`, `order`
- **MultipleChoiceAnswer** — `question` FK, `student` FK, `selected_option`, `is_correct` (auto-set on save comparing `selected_option` to `question.correct_option`)

### User Flow — MC Quiz

```
TEACHER CREATES QUIZ:
1. Create assignment with submission_type = 'multiple_choice'
2. Add questions with MC builder:
   - Question text
   - Option A, B, C, D
   - Select correct answer
   - Set points per question
3. Save → creates assignment + MultipleChoiceQuestion records

STUDENT TAKES QUIZ:
1. Open assignment → sees MC questions
2. Select answer for each question (radio buttons)
3. Click "Submit Answers"
4. POST to /assignment/{id}/mc-submit/{student_id}/
5. Backend auto-grades each answer:
   - Compares selected_option to correct_option
   - Calculates earned_points / total_points
   - Auto-creates LessonAssignmentSubmission with score
6. Student immediately sees:
   ├─ Overall score: "8/10 (80%)"
   ├─ Per-question results: ✓ Correct / ✗ Incorrect
   └─ Points awarded
7. ActivityLog: action='submission'
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/assignment/{id}/mc-questions/` | List/create MC questions |
| GET/PUT/DELETE | `/mc-question/{pk}/` | Question detail CRUD |
| POST | `/assignment/{id}/mc-submit/{student_id}/` | Submit MC answers (auto-graded) |

---

## Feature 12: Discussion Threads

### What It Does
Thread-based discussions for discussion-type assignments. Students and teachers can post replies in a threaded format.

### Models
- **DiscussionThread** — `assignment` FK, `author_type` (student/teacher/admin), author FKs, `content`, `parent_reply` FK(self for threading), `is_pinned`

### User Flow

```
1. Assignment created with submission_type = 'discussion'
2. Students open assignment → see discussion thread
3. Post initial response (text content)
4. Teacher and other students can reply (threaded)
5. Teacher can pin important threads
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/assignment/{id}/discussions/` | List/create threads |
| GET/PUT/DELETE | `/discussion/{pk}/` | Thread detail CRUD |

---

## Feature 13: Student Registration (Minor-Aware)

### What It Does
Enhanced registration form that detects minors in real-time based on DOB input and requires parent/guardian email for students under 18.

### Components
- **Register.jsx** — Enhanced with real-time age calculation, conditional parent fields

### User Flow — Minor Registration

```
1. Student fills registration form:
   - Full Name, Email, Username, Password, Date of Birth, Interests
       ↓
2. As soon as DOB is entered:
   - JavaScript calculates age in real-time
   - If age < 18 → isMinor = true
       ↓
3. When isMinor detected, form expands with:
   ├─ ⚠️ Amber warning banner:
   │   "Under 18 — Parent/Guardian Required"
   │   "Since you are under 18, a parent or guardian email
   │    is required. They will receive a verification email..."
   │
   ├─ Parent/Guardian Name field (optional)
   │   Placeholder: "e.g., Sarah Chen"
   │
   └─ Parent/Guardian Email field (REQUIRED, highlighted in amber)
       Placeholder: "parent@email.com"
       Helper text: "Your parent/guardian will receive a consent
       email to verify and approve your account."
       ↓
4. If minor tries to submit WITHOUT parent email:
   - SweetAlert warning: "Parent/Guardian email is required for students under 18"
   - Form submission blocked
       ↓
5. If minor submits WITH parent email:
   - Backend creates Student (parent_account_required = True)
   - Backend auto-creates ParentAccount + StudentParentLink (pending)
   - Consent email sent to parent
   - Success toast: "Registered! A consent email has been sent to your parent/guardian."
   - Redirect to /user-login after 4 seconds
       ↓
6. If adult (18+) submits:
   - Normal registration flow
   - No parent fields shown
   - Success toast: "Registered! Please verify your email."
   - Redirect to /user-login after 2.5 seconds
```

---

## Feature 14: Minor Restriction UI

### What It Does
Dynamically restricts UI elements for minor students without approved parents. Dims sidebar links, shows approval banners, and blocks access to messaging features.

### Components Updated
- **Sidebar.jsx** — Fetches `/student/{id}/minor-access-status/`, conditionally renders messaging links
- **AudioMessages.jsx** — Shows "Parent Approval Required" banner for restricted minors
- **TextMessages.jsx** — Shows "Parent Approval Required" banner for restricted minors
- **GroupChat.jsx** — Shows minor restriction message instead of input area

### User Flow — Minor Student Navigation

```
SIDEBAR (Sidebar.jsx):
├─ On mount: fetches /student/{id}/minor-access-status/
├─ If minorStatus.is_minor && !minorStatus.can_send_messages:
│   ├─ "Messages" link → dimmed (opacity 0.5), non-clickable
│   │   └─ Shows "🔒 Parent approval required" badge below
│   └─ "Text Messages" link → dimmed, non-clickable
│       └─ Shows "🔒 Parent approval required" badge below
└─ All other links remain fully accessible

AUDIO MESSAGES (/my-messages):
├─ Checks minor access status on mount
├─ If restricted → yellow banner:
│   "⚠️ Parent Approval Required"
│   "Your parent or guardian must verify and approve your
│    account before you can access messaging features."
│   [Submit Parent Email] button (if no parent link)
└─ If approved → normal message view

TEXT MESSAGES (/my-text-messages):
├─ Same banner behavior as Audio Messages
└─ Same submit parent email flow

GROUP CHAT (GroupChat.jsx):
├─ If minor without approval:
│   Input area replaced with amber banner:
│   "🔒 Parent approval required to send messages in group chat.
│    Ask your parent to approve your account."
├─ Can still READ messages
└─ Cannot send messages
```

---

## Feature 15: Audit Logging & Admin Dashboard

### What It Does
Comprehensive audit trail for all user actions: messages sent, assignment submissions, session joins/leaves, logins, exports. Admin dashboard with multiple log views and analytics.

### Models
- **ActivityLog** — `admin`/`teacher`/`student`/`parent` FKs, `action` (14 choices: login, logout, create, update, delete, view, export, import, message, submission, session_join, session_leave, session_start, session_end), `model_name`, `object_id`, `description`, `ip_address`, `user_agent`, `created_at`

### What Gets Logged (Phase 10 additions)
| Action | Trigger | Description Example |
|--------|---------|---------------------|
| `message` | `send_message()` | "Message sent from teacher:5 to parent:3 (link:12)" |
| `message` | `GroupMessageList.perform_create()` | "Group message sent in group 7 by teacher:5" |
| `submission` | `student_submit_lesson_assignment()` | "Student 8 submitted assignment 15 (file_upload)" |
| `submission` | `student_submit_mc_answers()` | "Student 8 submitted MC quiz for assignment 15 — Score: 8/10 (80%)" |
| `session_start` | `group_session_go_live()` | "Group session 3 started (Group: Advanced Piano)" |
| `session_join` | `group_session_join()` | "Student 8 joined group session 3" |
| `session_leave` | `group_session_leave()` | "Participant left group session 3 (45 min)" |
| `session_end` | `group_session_end()` | "Group session 3 ended (duration: 60 min)" |

### Components
- **AuditLogsDashboard.jsx** — Tabbed dashboard: Summary | Upload Logs | Payment Logs | Access Logs | Messages | Activity Logs
- **ActivityLogsTable.jsx** — Full activity log viewer with:
  - Action type filter dropdown (all 14 action types)
  - Model name filter
  - Date range filter
  - Text search
  - Color-coded action badges
  - Pagination
  - CSV export
- **MessageLogsTable.jsx** — Message-specific log viewer with sender type filters, content search, export

### User Flow — Admin Viewing Audit Logs

```
1. Admin navigates to /admin/audit-logs
       ↓
2. Dashboard loads with 6 tabs:
   ├─ Summary & Analytics — Overview stats for uploads, payments, access, messages, activity
   ├─ Upload Logs — File upload history with status, file types
   ├─ Payment Logs — Transaction history with amounts, statuses
   ├─ Access Logs — Course/lesson access with allow/deny tracking
   ├─ Messages (badge count) — All message logs with content, sender/recipient
   └─ Activity Logs (badge count) — All ActivityLog entries
       ↓
3. Activity Logs tab features:
   ├─ Filter by action type (message, submission, session_join, etc.)
   ├─ Filter by model (Message, LessonAssignment, GroupSession, etc.)
   ├─ Filter by date range
   ├─ Search descriptions
   ├─ Color-coded badges:
   │   - Blue: login/logout
   │   - Green: create/submission
   │   - Yellow: update
   │   - Red: delete
   │   - Purple: message
   │   - Teal: session_join/session_leave
   │   - Cyan: view/export
   ├─ Pagination (25 per page)
   └─ Export to CSV
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/audit/summary/` | Summary stats (uploads, payments, access, messages, activity) |
| GET | `/audit/activity-logs/` | Paginated activity logs with filters |
| GET | `/audit/uploads/` | Upload log list |
| GET | `/audit/payments/` | Payment log list |
| GET | `/audit/access/` | Access log list |
| GET | `/audit/export/{log_type}/` | Export logs as CSV |

---

## Feature 16: Policy Documents & Parent Acceptance

### What It Does
Manages legal/safety policy documents that parents must accept before their linked students gain full access.

### Models
- **PolicyDocument** — `title`, `policy_type` (terms_of_service/child_safety/code_of_conduct/background_check_consent/other), `version`, `content`, `is_active`, `effective_date`
- **ParentPolicyAcceptance** — `parent` FK, `policy` FK, `accepted_at`, `ip_address`, `user_agent`

### User Flow

```
1. Admin creates PolicyDocument (e.g., "Child Safety Policy v2.0")
       ↓
2. When parent approves student link, they are shown active policies
       ↓
3. Parent must accept all required policies (child_safety + terms_of_service)
       ↓
4. ParentPolicyAcceptance records created with IP + user agent
       ↓
5. Student's has_approved_parent_with_policies() checks both:
   a. Approved StudentParentLink exists
   b. Parent has accepted ALL required active policies
       ↓
6. Only when both conditions met → student.can_send_messages() = True
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/parent/{id}/policy-acceptances/` | List parent's accepted policies |
| GET | `/parent/{id}/policy-status/` | Check if all required policies accepted |

---

## Feature 17: Session Participant Logging

### What It Does
Tracks who joins and leaves both 1:1 teacher sessions and group sessions, with timing data for safety auditing.

### Models
- **SessionParticipantLog** (1:1 sessions) — `session` FK(TeacherSession), `teacher`/`student` FKs, `participant_role`, `joined_at`, `left_at`, `duration_seconds`, `ip_address`
- **GroupSessionParticipantLog** (group sessions) — `session` FK(GroupSession), `teacher`/`student` FKs, `participant_role`, `joined_at`, `left_at`, `duration_seconds`, `ip_address`

### Data Captured
```
For every session join:
├─ Who: teacher or student (FK)
├─ When: joined_at (auto timestamp)
├─ Where: ip_address (from request)
├─ Role: participant_role (teacher/student)

For every session leave:
├─ When: left_at (timestamp)
├─ Duration: left_at - joined_at (seconds)
└─ ActivityLog entry created
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.x + Django REST Framework |
| Frontend | React 18 (Create React App) |
| Database | PostgreSQL (Docker) |
| Video Conferencing | Jitsi Meet (auto-generated room links) |
| Deployment | Docker Compose (nginx → React build, gunicorn → Django) |
| Email | Django email backend (SMTP) |
| File Storage | Django media files (local storage) |
| Authentication | Session-based (localStorage tokens) |
| Real-time Updates | Polling (5-10 second intervals) |

---

*Document generated: February 28, 2026*
*Phases 1–10 complete and deployed*
