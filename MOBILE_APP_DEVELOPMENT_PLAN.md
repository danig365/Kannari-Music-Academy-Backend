# 📱 Kannari Music Academy — Mobile App Development Plan

> **Purpose:** A comprehensive, implementation-ready blueprint to build an iOS + Android mobile app that mirrors every feature of the existing Kannari Music Academy web application.  
> **Strategy:** React Native (Expo) — maximize code reuse from the existing React.js frontend, keep the Django backend 100% untouched, and ship a pixel-perfect mobile experience on both platforms.  
> **Author:** Auto-generated from full codebase analysis  
> **Date:** March 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Why React Native (Expo)?](#2-why-react-native-expo)
3. [Architecture Overview](#3-architecture-overview)
4. [What We Reuse As-Is (Zero Changes)](#4-what-we-reuse-as-is-zero-changes)
5. [What Needs Adaptation](#5-what-needs-adaptation)
6. [Backend Changes (Minimal)](#6-backend-changes-minimal)
7. [Project Structure](#7-project-structure)
8. [Screen-by-Screen Implementation Map](#8-screen-by-screen-implementation-map)
9. [Shared Services Layer (Direct Port)](#9-shared-services-layer-direct-port)
10. [Navigation Architecture](#10-navigation-architecture)
11. [Styling Strategy](#11-styling-strategy)
12. [Authentication & State Management](#12-authentication--state-management)
13. [Platform-Specific Features](#13-platform-specific-features)
14. [Third-Party Mobile Libraries](#14-third-party-mobile-libraries)
15. [Implementation Phases & Timeline](#15-implementation-phases--timeline)
16. [Phase Details with File-by-File Mapping](#16-phase-details-with-file-by-file-mapping)
17. [Testing Strategy](#17-testing-strategy)
18. [Deployment & CI/CD](#18-deployment--cicd)
19. [Risk Mitigation](#19-risk-mitigation)
20. [Quick-Start Commands](#20-quick-start-commands)

---

## 1. Executive Summary

The Kannari Music Academy web app is a feature-rich LMS built with:
- **Backend:** Django REST Framework + PostgreSQL (100+ API endpoints)
- **Frontend:** React.js 18 + React Router 6 + Bootstrap + Axios
- **Integrations:** Stripe payments, Jitsi video conferencing, Firebase analytics, email verification

**The goal:** Build a mobile app for **iOS and Android** that is functionally identical to the web app, supporting all 5 user roles (Student, Teacher, Admin, School, Parent).

**The strategy:**
- **Backend stays 100% unchanged** — the existing REST API serves both web and mobile
- **~70% of frontend logic is directly portable** — all service files, validators, business logic, state management patterns
- **~30% needs rewriting** — UI components (JSX → React Native components) and styling (CSS → StyleSheet/NativeWind)
- **Estimated timeline:** 12–16 weeks with a 2-developer team

---

## 2. Why React Native (Expo)?

| Option | Code Reuse | Effort | Learning Curve | Recommendation |
|--------|-----------|--------|---------------|----------------|
| **React Native (Expo)** | **~70%** — same JS/React paradigm, axios, services port 1:1 | Medium | Low (team knows React) | ✅ **BEST FIT** |
| Flutter | ~0% — Dart rewrite | Very High | High | ❌ |
| Native (Swift + Kotlin) | ~0% — two separate codebases | Extremely High | High | ❌ |
| Capacitor/Ionic | ~85% — wraps existing web | Low | Low | ⚠️ Possible but poor native UX |
| PWA | ~95% — no code changes | Minimal | None | ⚠️ No App Store, limited native APIs |

### Why Not Just a PWA or Capacitor Wrapper?

Both are tempting for speed, but they have critical limitations for this app:
- **Jitsi video calls** need native SDKs for reliable camera/mic access
- **Push notifications** require native integration for both platforms
- **Audio recording** (for audio messages / rhythm games) needs native APIs
- **File downloads** (lesson materials, sheet music) need native file system access
- **App Store presence** is expected for a professional music academy

### Why Expo Specifically?

Expo (SDK 52+) now supports:
- **Expo Dev Client** — full native module support without ejecting
- **EAS Build** — cloud builds for iOS/Android (no Mac needed for iOS builds)
- **Expo Router** — file-based routing similar to Next.js
- **Pre-built modules** for camera, audio, file system, notifications, etc.
- **Over-the-air updates** — push JS updates without App Store review

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        MOBILE APP (React Native / Expo)          │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │  Screens/   │  │  Services/   │  │  Navigation/            │ │
│  │  Components │  │  (PORTED     │  │  (React Navigation)     │ │
│  │  (REWRITTEN │  │   FROM WEB)  │  │                         │ │
│  │   FOR RN)   │  │              │  │  Stack + Tab + Drawer   │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
│                          │                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ State Mgmt  │  │  Utils/      │  │  Config/                │ │
│  │ (Zustand +  │  │  (PORTED     │  │  (Updated base URLs)    │ │
│  │  AsyncStore)│  │   FROM WEB)  │  │                         │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS (same REST API)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              EXISTING BACKEND (NO CHANGES)                       │
│                                                                  │
│  Django REST Framework  ←→  PostgreSQL                           │
│  100+ API endpoints     ←→  Media files (S3/local)              │
│  Stripe integration     ←→  Email service (SMTP)                │
│  Jitsi Meet             ←→  Firebase Analytics                   │
└──────────────────────────────────────────────────────────────────┘
```

**Key insight:** The backend is completely decoupled via REST APIs. The mobile app is just another API client — no backend modifications are needed for core functionality.

---

## 4. What We Reuse As-Is (Zero Changes)

### ✅ Backend (100% reusable)
- All 100+ Django REST API endpoints
- All models, serializers, views
- Access control logic (`access_control.py`)
- Email verification flows
- Stripe payment processing
- Jitsi room generation
- PostgreSQL database

### ✅ Service Files (~95% reusable — just update import paths)

| Web File | Mobile File | Changes Needed |
|----------|-------------|----------------|
| `services/gameService.js` | `services/gameService.js` | Replace `API_BASE_URL` import, CSV exports → native download |
| `services/subscriptionService.js` | `services/subscriptionService.js` | Replace `API_BASE_URL`, use `AsyncStorage` instead of module cache |
| `services/messagingService.js` | `services/messagingService.js` | Replace `API_BASE_URL`, `FormData` with RN `uri` format for uploads |

### ✅ Utility Files (100% reusable)

| Web File | Mobile File | Changes Needed |
|----------|-------------|----------------|
| `utils/formValidation.js` | `utils/formValidation.js` | Validators port 1:1. Only `FieldError` component needs RN rewrite |

### ✅ Business Logic Inside Components (~60% extractable)

Most components follow this pattern:
```jsx
// WEB COMPONENT (extractable logic)
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const load = async () => {
    const res = await axios.get(`${API_BASE_URL}/some-endpoint/${id}/`);
    setData(res.data);
    setLoading(false);
  };
  load();
}, [id]);

// Computed values
const totalScore = data?.scores?.reduce((a, b) => a + b, 0) || 0;
const progressPct = (completed / total) * 100;
```

**All of this logic — state declarations, effects, API calls, computed values — ports directly to React Native.** Only the JSX return (the UI) needs rewriting.

### ✅ Constants & Configuration Data (100% reusable)

From `StudentGamesHub.jsx` and similar files:
```jsx
// These objects port directly
const GAME_META = {
  note_ninja: { icon: '🎯', color: '#3b82f6', gradient: ['#1e40af', '#3b82f6'] },
  // ...
};
const BADGE_META = { /* ... */ };
const TABS = ['games', 'leaderboard', 'badges'];
```

---

## 5. What Needs Adaptation

### 🔄 UI Components (JSX → React Native)

Every `.jsx` component's **return statement** needs to be rewritten:

| Web (React DOM) | Mobile (React Native) |
|-----------------|----------------------|
| `<div>` | `<View>` |
| `<span>`, `<p>`, `<h1>`–`<h6>` | `<Text>` |
| `<img>` | `<Image>` |
| `<input>` | `<TextInput>` |
| `<button>` | `<TouchableOpacity>` or `<Pressable>` |
| `<a href>` / `<Link to>` | `navigation.navigate()` |
| `<table>` | `<FlatList>` or custom `<View>` grid |
| `<select>` | `<Picker>` or custom dropdown |
| `<form>` | `<View>` with manual submit handler |
| `<video>` / `<audio>` | `expo-av` `<Video>` / `<Audio>` |
| `<iframe>` (Jitsi) | `react-native-jitsi-meet` |
| `className="..."` | `style={styles.xxx}` |
| CSS files | `StyleSheet.create({})` or NativeWind |
| `localStorage` | `AsyncStorage` / `expo-secure-store` |
| `document.title = '...'` | Remove (handled by navigation header) |
| `window.location` | `Linking` API |
| Bootstrap grid (`row`, `col-md-6`) | Flexbox `<View>` layouts |
| SweetAlert2 | `Alert.alert()` or custom modal |
| Chart.js | `react-native-chart-kit` or `victory-native` |
| React Router `<Link>` | React Navigation `navigation.navigate()` |

### 🔄 Styling (CSS → React Native StyleSheet)

**Strategy: NativeWind (Tailwind CSS for React Native)**

This is the best approach because:
1. Many web components already use utility-class-like inline styles
2. The team can keep a similar mental model
3. Colors, spacing, and typography can be defined once in `tailwind.config.js`

Alternatively, `StyleSheet.create()` for a more native approach. Both work.

### 🔄 Navigation (React Router → React Navigation)

React Router's `<BrowserRouter>` → React Navigation's native stack/tab/drawer navigators:

```
Web: <Route path="/student/dashboard" element={<EnhancedDashboard />} />
Mobile: Stack.Screen name="StudentDashboard" component={EnhancedDashboard}
```

---

## 6. Backend Changes (Minimal)

The backend needs only **2 small additions** — everything else works as-is:

### 6.1 Push Notification Support (New Endpoint)

```python
# backend/main/models.py — ADD
class DeviceToken(models.Model):
    student = models.ForeignKey('Student', null=True, blank=True, on_delete=models.CASCADE)
    teacher = models.ForeignKey('Teacher', null=True, blank=True, on_delete=models.CASCADE)
    parent  = models.ForeignKey('ParentAccount', null=True, blank=True, on_delete=models.CASCADE)
    token   = models.CharField(max_length=500)
    platform = models.CharField(max_length=10, choices=[('ios','iOS'),('android','Android')])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

# backend/main/views.py — ADD
class DeviceTokenView(APIView):
    def post(self, request):
        # Register/update push notification token
        ...
```

**Endpoints to add:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `api/device-token/register/` | POST | Register push notification token |
| `api/device-token/unregister/` | POST | Remove token on logout |

### 6.2 Optional: JWT Authentication

The current system uses custom SHA-256 password hashing with no token-based auth. This works fine for mobile too (the web app stores `studentId` in localStorage, mobile can use AsyncStorage), but adding JWT would be a security improvement:

```python
# Optional: pip install djangorestframework-simplejwt
# This is OPTIONAL — the app works without it
```

**Recommendation:** For Phase 1, keep the existing auth pattern (store user IDs in AsyncStorage). Add JWT in a future security hardening phase.

---

## 7. Project Structure

```
kannari-mobile/
├── app.json                          # Expo config
├── babel.config.js
├── tailwind.config.js                # NativeWind config
├── package.json
├── tsconfig.json                     # Optional: TypeScript
│
├── assets/                           # App icons, splash screen
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
│
├── src/
│   ├── config.js                     # ✅ PORTED from web (updated URLs)
│   │
│   ├── services/                     # ✅ PORTED from web (minimal changes)
│   │   ├── api.js                    # NEW: Shared axios instance with interceptors
│   │   ├── gameService.js            # ✅ Ported from web
│   │   ├── subscriptionService.js    # ✅ Ported from web
│   │   └── messagingService.js       # ✅ Ported from web
│   │
│   ├── utils/                        # ✅ PORTED from web
│   │   ├── formValidation.js         # ✅ Validators ported 1:1
│   │   ├── storage.js                # NEW: AsyncStorage wrapper
│   │   └── helpers.js                # NEW: timeAgo, formatters (extracted from components)
│   │
│   ├── hooks/                        # NEW: Custom hooks (extracted from component logic)
│   │   ├── useAuth.js                # Auth state + login/logout
│   │   ├── useSubscription.js        # Subscription status hook
│   │   ├── useGames.js               # Games overview hook
│   │   └── useDashboard.js           # Dashboard data hook
│   │
│   ├── store/                        # NEW: Zustand stores
│   │   ├── authStore.js              # Auth state (replaces localStorage checks)
│   │   └── appStore.js               # Global app state
│   │
│   ├── navigation/                   # NEW: React Navigation setup
│   │   ├── RootNavigator.jsx
│   │   ├── StudentNavigator.jsx      # Student tab + stack navigation
│   │   ├── TeacherNavigator.jsx
│   │   ├── AdminNavigator.jsx
│   │   ├── SchoolNavigator.jsx
│   │   ├── ParentNavigator.jsx
│   │   └── AuthNavigator.jsx         # Login/Register screens
│   │
│   ├── components/                   # NEW: Shared UI components
│   │   ├── common/
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── FieldError.jsx        # RN version of web's FieldError
│   │   │   ├── StarRating.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── TabBar.jsx
│   │   │   ├── Avatar.jsx
│   │   │   └── GradientButton.jsx
│   │   ├── charts/
│   │   │   ├── ActivityChart.jsx      # 🔄 Rewritten with victory-native
│   │   │   └── ProgressRing.jsx
│   │   ├── games/
│   │   │   ├── MusicStaff.jsx         # 🔄 Rewritten with react-native-svg
│   │   │   └── RhythmTimeline.jsx     # 🔄 Rewritten with react-native-svg
│   │   └── media/
│   │       ├── AudioPlayer.jsx        # NEW: expo-av based
│   │       ├── VideoPlayer.jsx        # NEW: expo-av based
│   │       └── AudioRecorder.jsx      # 🔄 expo-av based
│   │
│   ├── screens/                       # 🔄 REWRITTEN from web components
│   │   ├── public/
│   │   │   ├── HomeScreen.jsx
│   │   │   ├── CourseDetailScreen.jsx
│   │   │   ├── AllCoursesScreen.jsx
│   │   │   ├── SearchScreen.jsx
│   │   │   ├── TeacherDetailScreen.jsx
│   │   │   ├── FaqScreen.jsx
│   │   │   └── AboutScreen.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── StudentLoginScreen.jsx
│   │   │   ├── StudentRegisterScreen.jsx
│   │   │   ├── TeacherLoginScreen.jsx
│   │   │   ├── TeacherRegisterScreen.jsx
│   │   │   ├── AdminLoginScreen.jsx
│   │   │   ├── SchoolLoginScreen.jsx
│   │   │   ├── ParentLoginScreen.jsx
│   │   │   ├── ForgotPasswordScreen.jsx
│   │   │   └── ParentalConsentScreen.jsx
│   │   │
│   │   ├── student/
│   │   │   ├── DashboardScreen.jsx         # ← EnhancedDashboard.jsx
│   │   │   ├── MyCoursesScreen.jsx         # ← MyCourses.jsx
│   │   │   ├── CoursePlayerScreen.jsx      # ← StudentCoursePlayer.jsx
│   │   │   ├── ProgressScreen.jsx          # ← MyProgress.jsx
│   │   │   ├── AchievementsScreen.jsx      # ← MyAchievements.jsx
│   │   │   ├── SubscriptionsScreen.jsx     # ← StudentSubscriptions.jsx
│   │   │   ├── SessionsScreen.jsx          # ← StudentSessions.jsx
│   │   │   ├── AudioMessagesScreen.jsx     # ← AudioMessages.jsx
│   │   │   ├── TextMessagesScreen.jsx      # ← TextMessages.jsx
│   │   │   ├── AssignmentsScreen.jsx       # ← StudentAssignments.jsx
│   │   │   ├── GroupsScreen.jsx            # ← StudentGroups.jsx
│   │   │   ├── GroupDetailScreen.jsx       # ← StudentGroupDetail.jsx
│   │   │   ├── GamesHubScreen.jsx          # ← StudentGamesHub.jsx
│   │   │   ├── NoteNinjaScreen.jsx         # ← NoteNinjaGame.jsx
│   │   │   ├── RhythmRushScreen.jsx        # ← RhythmRushGame.jsx
│   │   │   ├── MusicChallengeScreen.jsx    # ← MusicChallengeGame.jsx
│   │   │   ├── ProfileScreen.jsx           # ← ProfileSetting.jsx
│   │   │   ├── ChangePasswordScreen.jsx    # ← ChangePassword.jsx
│   │   │   └── StudyMaterialScreen.jsx     # ← StudyStudentMaterial.jsx
│   │   │
│   │   ├── teacher/
│   │   │   ├── OverviewScreen.jsx          # ← TeacherOverview.jsx
│   │   │   ├── StudentsScreen.jsx          # ← TeacherStudents.jsx
│   │   │   ├── MyCoursesScreen.jsx         # ← TeacherMyCourses.jsx
│   │   │   ├── CourseManagementScreen.jsx  # ← TeacherCourseManagement.jsx
│   │   │   ├── SessionsScreen.jsx          # ← TeacherSessions.jsx
│   │   │   ├── AudioMessagesScreen.jsx     # ← TeacherAudioMessages.jsx
│   │   │   ├── TextMessagesScreen.jsx      # ← TeacherMessages.jsx
│   │   │   ├── AssignmentCreateScreen.jsx  # ← TeacherAssignmentCreate.jsx
│   │   │   ├── AssignmentReviewScreen.jsx  # ← TeacherAssignmentReviews.jsx
│   │   │   ├── OfficeHoursScreen.jsx       # ← TeacherOfficeHours.jsx
│   │   │   ├── CommunityScreen.jsx         # ← TeacherCommunity.jsx
│   │   │   ├── ProgressScreen.jsx          # ← TeacherProgress.jsx
│   │   │   ├── GamesPerformanceScreen.jsx  # ← TeacherGamesPerformance.jsx
│   │   │   ├── ProfileScreen.jsx           # ← TeacherProfileSetting.jsx
│   │   │   └── StudyMaterialScreen.jsx     # ← StudyMaterial.jsx
│   │   │
│   │   ├── admin/
│   │   │   ├── DashboardScreen.jsx         # ← AdminDashboard.jsx
│   │   │   ├── UsersManagementScreen.jsx   # ← UsersManagement.jsx
│   │   │   ├── LessonManagementScreen.jsx  # ← AdminLessonManagement.jsx
│   │   │   ├── SubscriptionsScreen.jsx     # ← SubscriptionsManagement.jsx
│   │   │   ├── CourseAnalyticsScreen.jsx   # ← CourseAnalytics.jsx
│   │   │   ├── ActivityLogsScreen.jsx      # ← ActivityLogs.jsx
│   │   │   ├── AuditLogsScreen.jsx         # ← AuditLogsDashboard.jsx
│   │   │   ├── GamesAnalyticsScreen.jsx    # ← AdminGamesAnalytics.jsx
│   │   │   └── SettingsScreen.jsx          # ← AdminSettings.jsx
│   │   │
│   │   ├── school/
│   │   │   ├── DashboardScreen.jsx         # ← SchoolDashboard.jsx
│   │   │   ├── TeachersScreen.jsx          # ← SchoolTeachers.jsx
│   │   │   ├── StudentsScreen.jsx          # ← SchoolStudents.jsx
│   │   │   ├── GroupClassesScreen.jsx      # ← SchoolGroupClasses.jsx
│   │   │   ├── AssignmentsScreen.jsx       # ← SchoolLessonAssignments.jsx
│   │   │   ├── ProgressScreen.jsx          # ← SchoolProgress.jsx
│   │   │   ├── SettingsScreen.jsx          # ← SchoolSettings.jsx
│   │   │   └── ChatLocksScreen.jsx         # ← SchoolChatLock.jsx
│   │   │
│   │   └── parent/
│   │       ├── DashboardScreen.jsx         # ← ParentDashboard.jsx
│   │       └── MessagesScreen.jsx          # ← ParentMessages.jsx
│   │
│   └── theme/                              # NEW: Centralized theming
│       ├── colors.js
│       ├── typography.js
│       ├── spacing.js
│       └── index.js
│
├── App.jsx                                 # Entry point
└── eas.json                                # EAS Build config
```

---

## 8. Screen-by-Screen Implementation Map

This maps every web component to its mobile screen, showing what logic is reusable and what needs rewriting.

### 8.1 Public Screens (7 screens)

| Web Component | Mobile Screen | Logic Reuse | UI Rewrite |
|---------------|---------------|-------------|------------|
| `Home.jsx` | `HomeScreen.jsx` | API calls, data formatting | Full — carousel, grid, layout |
| `CourseDetail.jsx` | `CourseDetailScreen.jsx` | All state, enrollment logic, rating logic | Full — tabs, media, reviews |
| `AllCourses.jsx` | `AllCoursesScreen.jsx` | Category filtering, pagination, API calls | Full — grid → FlatList |
| `Search.jsx` | `SearchScreen.jsx` | Search API call, debounce | Full — search bar, results list |
| `TeacherDetail.jsx` | `TeacherDetailScreen.jsx` | API call, course listing | Full — profile card, course grid |
| `Faq.jsx` | `FaqScreen.jsx` | FAQ data fetch | Full — accordion/expandable list |
| `About.jsx` | `AboutScreen.jsx` | Static content | Full |

### 8.2 Student Screens (22 screens)

| Web Component | Mobile Screen | Logic Reuse % | Notes |
|---------------|---------------|---------------|-------|
| `EnhancedDashboard.jsx` | `DashboardScreen.jsx` | 80% | API calls, stats calculation reuse. UI → native cards + charts |
| `MyCourses.jsx` | `MyCoursesScreen.jsx` | 85% | Enrollment fetch, progress calc reuse. Grid → FlatList |
| `StudentCoursePlayer.jsx` | `CoursePlayerScreen.jsx` | 70% | Progress tracking, navigation logic reuse. Video → expo-av |
| `MyProgress.jsx` | `ProgressScreen.jsx` | 80% | All progress API calls reuse. Charts → victory-native |
| `MyAchievements.jsx` | `AchievementsScreen.jsx` | 85% | Achievement data + badge logic reuse |
| `StudentSubscriptions.jsx` | `SubscriptionsScreen.jsx` | 75% | Subscription service reuse. Stripe → @stripe/stripe-react-native |
| `StudentSessions.jsx` | `SessionsScreen.jsx` | 80% | Session data + join logic reuse. Jitsi → native SDK |
| `AudioMessages.jsx` | `AudioMessagesScreen.jsx` | 75% | Message API reuse. Audio playback → expo-av |
| `TextMessages.jsx` | `TextMessagesScreen.jsx` | 80% | Full messaging service reuse. UI → chat bubble layout |
| `StudentAssignments.jsx` | `AssignmentsScreen.jsx` | 85% | Assignment fetch + submit logic reuse |
| `StudentGroups.jsx` | `GroupsScreen.jsx` | 85% | Group listing, data logic reuse |
| `StudentGroupDetail.jsx` | `GroupDetailScreen.jsx` | 80% | Chat, announcements, resources reuse |
| `StudentGamesHub.jsx` | `GamesHubScreen.jsx` | 85% | All game meta, tab logic, leaderboard logic reuse |
| `NoteNinjaGame.jsx` | `NoteNinjaScreen.jsx` | 60% | Game session logic reuse. Music staff → react-native-svg |
| `RhythmRushGame.jsx` | `RhythmRushScreen.jsx` | 60% | Game logic reuse. Rhythm viz → native animations |
| `MusicChallengeGame.jsx` | `MusicChallengeScreen.jsx` | 70% | Quiz logic reuse. Timer, animations → RN Animated |
| `ProfileSetting.jsx` | `ProfileScreen.jsx` | 80% | Form validation reuse. Image picker → expo-image-picker |
| `ChangePassword.jsx` | `ChangePasswordScreen.jsx` | 90% | Almost 1:1 port |
| `Login.jsx` | `StudentLoginScreen.jsx` | 85% | Validation + API call reuse |
| `Register.jsx` | `StudentRegisterScreen.jsx` | 80% | Validation + API call reuse. Date picker → native |
| `ForgotPassword.jsx` | `ForgotPasswordScreen.jsx` | 90% | Almost 1:1 port |
| `StudyStudentMaterial.jsx` | `StudyMaterialScreen.jsx` | 80% | Data fetch reuse. Downloads → expo-file-system |

### 8.3 Teacher Screens (16 screens)

| Web Component | Mobile Screen | Logic Reuse % | Notes |
|---------------|---------------|---------------|-------|
| `TeacherOverview.jsx` | `OverviewScreen.jsx` | 80% | Dashboard stats, charts → native |
| `TeacherStudents.jsx` | `StudentsScreen.jsx` | 85% | Student list + CRUD reuse |
| `TeacherMyCourses.jsx` | `MyCoursesScreen.jsx` | 85% | Course listing reuse |
| `TeacherCourseManagement.jsx` | `CourseManagementScreen.jsx` | 70% | Rich form → native form with image picker |
| `TeacherSessions.jsx` | `SessionsScreen.jsx` | 80% | CRUD + go-live logic reuse |
| `TeacherAudioMessages.jsx` | `AudioMessagesScreen.jsx` | 70% | Audio recording → expo-av recorder |
| `TeacherMessages.jsx` | `TextMessagesScreen.jsx` | 80% | Messaging service reuse |
| `TeacherAssignmentCreate.jsx` | `AssignmentCreateScreen.jsx` | 75% | Form logic reuse. File upload → native |
| `TeacherAssignmentReviews.jsx` | `AssignmentReviewScreen.jsx` | 80% | Grading logic reuse |
| `TeacherOfficeHours.jsx` | `OfficeHoursScreen.jsx` | 85% | CRUD logic reuse |
| `TeacherCommunity.jsx` | `CommunityScreen.jsx` | 80% | Message feed reuse |
| `TeacherProgress.jsx` | `ProgressScreen.jsx` | 80% | Stats + charts reuse |
| `TeacherGamesPerformance.jsx` | `GamesPerformanceScreen.jsx` | 85% | Data + table reuse (→ FlatList) |
| `TeacherProfileSetting.jsx` | `ProfileScreen.jsx` | 80% | Form validation reuse |
| `TeacherLogin.jsx` | `TeacherLoginScreen.jsx` | 85% | Validation + API reuse |
| `TeacherRegister.jsx` | `TeacherRegisterScreen.jsx` | 80% | Validation + API reuse |

### 8.4 Admin Screens (9 screens)

| Web Component | Mobile Screen | Logic Reuse % | Notes |
|---------------|---------------|---------------|-------|
| `AdminDashboard.jsx` | `DashboardScreen.jsx` | 80% | Stats cards + charts |
| `UsersManagement.jsx` | `UsersManagementScreen.jsx` | 75% | Table → FlatList, modal → screen |
| `AdminLessonManagement.jsx` | `LessonManagementScreen.jsx` | 70% | Drag-and-drop → long-press reorder |
| `SubscriptionsManagement.jsx` | `SubscriptionsScreen.jsx` | 80% | CRUD logic reuse |
| `CourseAnalytics.jsx` | `CourseAnalyticsScreen.jsx` | 75% | Charts → native charts |
| `ActivityLogs.jsx` | `ActivityLogsScreen.jsx` | 80% | Table → FlatList |
| `AuditLogsDashboard.jsx` | `AuditLogsScreen.jsx` | 75% | Multi-tab tables → tabbed FlatLists |
| `AdminGamesAnalytics.jsx` | `GamesAnalyticsScreen.jsx` | 80% | Charts + tables reuse |
| `AdminSettings.jsx` | `SettingsScreen.jsx` | 85% | Form logic reuse |

### 8.5 School Screens (8 screens)

| Web Component | Mobile Screen | Logic Reuse % | Notes |
|---------------|---------------|---------------|-------|
| `SchoolDashboard.jsx` | `DashboardScreen.jsx` | 80% | Stats + charts |
| `SchoolTeachers.jsx` | `TeachersScreen.jsx` | 85% | List + CRUD |
| `SchoolStudents.jsx` | `StudentsScreen.jsx` | 85% | List + CRUD |
| `SchoolGroupClasses.jsx` | `GroupClassesScreen.jsx` | 80% | Group management |
| `SchoolLessonAssignments.jsx` | `AssignmentsScreen.jsx` | 80% | Assignment management |
| `SchoolProgress.jsx` | `ProgressScreen.jsx` | 80% | Progress overview |
| `SchoolSettings.jsx` | `SettingsScreen.jsx` | 85% | Form logic |
| `SchoolChatLock.jsx` | `ChatLocksScreen.jsx` | 85% | Toggle logic |

### 8.6 Parent Screens (3 screens)

| Web Component | Mobile Screen | Logic Reuse % | Notes |
|---------------|---------------|---------------|-------|
| `ParentLogin.jsx` | `ParentLoginScreen.jsx` | 90% | OTP flow reuse |
| `ParentDashboard.jsx` | `DashboardScreen.jsx` | 85% | Children overview |
| `ParentMessages.jsx` | `MessagesScreen.jsx` | 80% | Message service reuse |

**Total: ~65 screens** (vs. ~85 web components — some web components merge into single screens)

---

## 9. Shared Services Layer (Direct Port)

### 9.1 `src/config.js` — Mobile Version

```javascript
// Mobile version — replace window.location.origin with explicit URL
export const API_BASE_URL = 'https://kannarimusicacademy.com/api';
export const SITE_URL = 'https://kannarimusicacademy.com';
export const JITSI_BASE_URL = 'https://meet.kannarimusicacademy.com';
```

### 9.2 `src/services/api.js` — NEW Shared Axios Instance

```javascript
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { storage } from '../utils/storage';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth headers automatically
api.interceptors.request.use(async (config) => {
  const studentId = await storage.get('studentId');
  const teacherId = await storage.get('teacherId');
  if (studentId) config.headers['X-Student-Id'] = studentId;
  if (teacherId) config.headers['X-Teacher-Id'] = teacherId;
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Navigate to login
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 9.3 `src/utils/storage.js` — AsyncStorage Wrapper

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  get: async (key) => {
    try { return await AsyncStorage.getItem(key); }
    catch { return null; }
  },
  set: async (key, value) => {
    await AsyncStorage.setItem(key, String(value));
  },
  remove: async (key) => {
    await AsyncStorage.removeItem(key);
  },
  clear: async () => {
    await AsyncStorage.clear();
  },
};
```

### 9.4 Service File Porting Pattern

For each service file, the changes are minimal. Here's the pattern:

```javascript
// WEB VERSION (gameService.js)
import axios from 'axios';
import { API_BASE_URL } from '../config';
const api = API_BASE_URL;

export const getStudentGamesOverview = (studentId) =>
  axios.get(`${api}/student/${studentId}/games/overview/`);

// MOBILE VERSION (gameService.js) — only 2 lines change
import api from './api';  // ← Use shared instance instead of raw axios

export const getStudentGamesOverview = (studentId) =>
  api.get(`/student/${studentId}/games/overview/`);  // ← Relative URL (baseURL handles prefix)
```

**For file uploads (messagingService.js):**

```javascript
// WEB: FormData with File objects
const formData = new FormData();
formData.append('audio_file', fileBlob);

// MOBILE: FormData with uri/type/name
const formData = new FormData();
formData.append('audio_file', {
  uri: localFileUri,
  type: 'audio/m4a',
  name: 'recording.m4a',
});
```

---

## 10. Navigation Architecture

### 10.1 Navigator Structure

```
RootNavigator (Stack)
├── AuthNavigator (Stack) — shown when not logged in
│   ├── RoleSelectScreen          — "I am a Student / Teacher / Admin / School / Parent"
│   ├── StudentLoginScreen
│   ├── StudentRegisterScreen
│   ├── TeacherLoginScreen
│   ├── TeacherRegisterScreen
│   ├── AdminLoginScreen
│   ├── SchoolLoginScreen
│   ├── ParentLoginScreen
│   ├── ForgotPasswordScreen
│   └── ParentalConsentScreen
│
├── StudentNavigator (Drawer + Bottom Tabs)
│   ├── Bottom Tab: Dashboard      → DashboardScreen
│   ├── Bottom Tab: Courses        → MyCoursesScreen
│   ├── Bottom Tab: Games          → GamesHubScreen
│   ├── Bottom Tab: Messages       → TextMessagesScreen
│   ├── Bottom Tab: Profile        → ProfileScreen
│   │
│   ├── Drawer: My Progress
│   ├── Drawer: Achievements
│   ├── Drawer: Subscriptions
│   ├── Drawer: Sessions
│   ├── Drawer: Assignments
│   ├── Drawer: Groups
│   │
│   └── Stack (modal/push screens):
│       ├── CoursePlayerScreen
│       ├── CourseDetailScreen
│       ├── NoteNinjaScreen
│       ├── RhythmRushScreen
│       ├── MusicChallengeScreen
│       ├── GroupDetailScreen
│       ├── AudioMessagesScreen
│       ├── StudyMaterialScreen
│       └── ChangePasswordScreen
│
├── TeacherNavigator (Drawer + Bottom Tabs)
│   ├── Bottom Tab: Overview       → OverviewScreen
│   ├── Bottom Tab: Students       → StudentsScreen
│   ├── Bottom Tab: Courses        → MyCoursesScreen
│   ├── Bottom Tab: Sessions       → SessionsScreen
│   ├── Bottom Tab: More           → (drawer toggle)
│   │
│   └── Stack screens for detail views...
│
├── AdminNavigator (Drawer + Bottom Tabs)
│   ├── Bottom Tab: Dashboard
│   ├── Bottom Tab: Users
│   ├── Bottom Tab: Courses
│   ├── Bottom Tab: Analytics
│   ├── Bottom Tab: More
│   │
│   └── Stack screens for management views...
│
├── SchoolNavigator (similar pattern)
│
├── ParentNavigator (simple stack — only 2 screens)
│
└── PublicNavigator (Stack) — browsing without login
    ├── HomeScreen
    ├── AllCoursesScreen
    ├── CourseDetailScreen
    ├── SearchScreen
    ├── TeacherDetailScreen
    ├── FaqScreen
    └── AboutScreen
```

### 10.2 Deep Linking Configuration

```javascript
// Support opening app from web links (email verification, password reset, etc.)
const linking = {
  prefixes: ['https://kannarimusicacademy.com', 'kannari://'],
  config: {
    screens: {
      ParentalConsent: 'parent/consent/:token',
      VerifyEmail: 'verify-email/:userType',
      ResetPassword: 'password-reset/confirm/:userType',
      CourseDetail: 'detail/:course_id',
    },
  },
};
```

---

## 11. Styling Strategy

### 11.1 Recommended: NativeWind (Tailwind CSS for React Native)

```bash
npm install nativewind tailwindcss
```

This lets us write styles similar to Bootstrap utility classes that the web app uses:

```jsx
// Mobile with NativeWind
<View className="flex-1 bg-white p-4">
  <Text className="text-2xl font-bold text-gray-900">🎮 Games Hub</Text>
  <Text className="text-sm text-gray-500 mt-1">Play, learn, and earn rewards</Text>
</View>
```

### 11.2 Theme Constants (Extracted from Web CSS)

```javascript
// src/theme/colors.js
export const colors = {
  primary:   '#3b82f6',  // Blue (Note Ninja)
  secondary: '#8b5cf6',  // Purple (Rhythm Rush)
  accent:    '#f59e0b',  // Amber (Music Challenge)
  success:   '#10b981',
  danger:    '#ef4444',
  warning:   '#f59e0b',
  background: '#f8fafc',
  card:       '#ffffff',
  text:       '#1e293b',
  textLight:  '#64748b',
  border:     '#e2e8f0',
  
  // Game-specific (from GAME_META in StudentGamesHub.jsx)
  noteNinja:      { gradient: ['#1e40af', '#3b82f6'] },
  rhythmRush:     { gradient: ['#6d28d9', '#8b5cf6'] },
  musicChallenge: { gradient: ['#d97706', '#f59e0b'] },
};
```

### 11.3 Converting Component Styles (Example)

**Web (StudentGamesHub.jsx + StudentGamesHub.css):**
```jsx
<div className="gh-game-card">
  <div className="gh-gc-icon" style={{ background: meta.gradient }}>
    <span>{meta.icon}</span>
  </div>
  <div className="gh-gc-body">
    <h3 className="gh-gc-title">{g.game.title}</h3>
  </div>
</div>
```

**Mobile equivalent:**
```jsx
<View style={styles.gameCard}>
  <LinearGradient colors={meta.gradient} style={styles.gameIcon}>
    <Text style={styles.gameIconEmoji}>{meta.icon}</Text>
  </LinearGradient>
  <View style={styles.gameBody}>
    <Text style={styles.gameTitle}>{g.game.title}</Text>
  </View>
</View>
```

---

## 12. Authentication & State Management

### 12.1 Auth Flow (Zustand Store)

```javascript
// src/store/authStore.js
import { create } from 'zustand';
import { storage } from '../utils/storage';

export const useAuthStore = create((set, get) => ({
  role: null,          // 'student' | 'teacher' | 'admin' | 'school' | 'parent'
  userId: null,
  userData: null,
  isLoggedIn: false,
  isLoading: true,     // true while checking stored session

  // Called on app launch — check stored credentials
  initialize: async () => {
    const role = await storage.get('userRole');
    const userId = await storage.get('userId');
    if (role && userId) {
      set({ role, userId, isLoggedIn: true, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  login: async (role, userId, userData) => {
    await storage.set('userRole', role);
    await storage.set('userId', String(userId));
    // Also store role-specific IDs for backward compat with services
    await storage.set(`${role}Id`, String(userId));
    await storage.set(`${role}LoginStatus`, 'true');
    set({ role, userId, userData, isLoggedIn: true });
  },

  logout: async () => {
    await storage.clear();
    set({ role: null, userId: null, userData: null, isLoggedIn: false });
  },
}));
```

### 12.2 How It Maps to Web's localStorage Pattern

| Web (localStorage) | Mobile (AsyncStorage via Zustand) |
|--------------------|------------------------------------|
| `localStorage.getItem('studentLoginStatus')` | `useAuthStore.getState().isLoggedIn && role === 'student'` |
| `localStorage.getItem('studentId')` | `useAuthStore.getState().userId` |
| `localStorage.setItem('studentId', data.id)` | `authStore.login('student', data.id, data)` |
| `localStorage.removeItem('studentLoginStatus')` | `authStore.logout()` |

---

## 13. Platform-Specific Features

### 13.1 Push Notifications

```javascript
// Using expo-notifications
import * as Notifications from 'expo-notifications';

// Register on login
const registerForPushNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status === 'granted') {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await api.post('/device-token/register/', {
      token,
      platform: Platform.OS,
      student_id: userId, // or teacher_id, etc.
    });
  }
};
```

**Notification triggers (backend sends via Expo Push API):**
- New message received
- Session starting in 15 minutes
- Assignment due soon
- New badge earned
- Subscription expiring
- Parental consent action needed

### 13.2 Jitsi Video Calls (Native SDK)

```javascript
// Using react-native-jitsi-meet or JitsiMeetView
import JitsiMeet from 'react-native-jitsi-meet';

const joinSession = (roomName, displayName) => {
  const url = `${JITSI_BASE_URL}/${roomName}`;
  JitsiMeet.call(url, {
    userInfo: { displayName, email: userEmail },
    featureFlags: {
      'chat.enabled': true,
      'recording.enabled': false,
      'live-streaming.enabled': false,
    },
  });
};
```

### 13.3 Audio Recording (for Messages & Games)

```javascript
// Using expo-av
import { Audio } from 'expo-av';

const startRecording = async () => {
  await Audio.requestPermissionsAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true });
  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  return recording;
};
```

### 13.4 File Downloads (Lesson Materials)

```javascript
// Using expo-file-system + expo-sharing
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const downloadFile = async (url, filename) => {
  const fileUri = FileSystem.documentDirectory + filename;
  const { uri } = await FileSystem.downloadAsync(url, fileUri);
  await Sharing.shareAsync(uri);
};
```

### 13.5 Stripe Payments (Native)

```javascript
// Using @stripe/stripe-react-native (instead of @stripe/react-stripe-js)
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

// Wrap app in StripeProvider
<StripeProvider publishableKey="pk_live_xxx">
  <App />
</StripeProvider>

// In SubscriptionsScreen
const { initPaymentSheet, presentPaymentSheet } = useStripe();
```

---

## 14. Third-Party Mobile Libraries

### Core Dependencies

| Package | Purpose | Replaces (Web) |
|---------|---------|----------------|
| `expo` ~52 | Framework | `react-scripts` |
| `react-native` ~0.76 | Core | `react-dom` |
| `@react-navigation/native` | Routing | `react-router-dom` |
| `@react-navigation/stack` | Stack navigation | Route components |
| `@react-navigation/bottom-tabs` | Tab bar | Sidebar tabs |
| `@react-navigation/drawer` | Drawer menu | Sidebar nav |
| `axios` | HTTP client | Same (reused) |
| `zustand` | State management | localStorage |
| `@react-native-async-storage/async-storage` | Persistent storage | localStorage |

### UI Libraries

| Package | Purpose | Replaces (Web) |
|---------|---------|----------------|
| `nativewind` + `tailwindcss` | Styling | Bootstrap CSS |
| `expo-linear-gradient` | Gradient backgrounds | CSS `linear-gradient` |
| `react-native-svg` | SVG rendering (music staff, rhythm) | Inline SVG / CSS shapes |
| `victory-native` or `react-native-chart-kit` | Charts | `chart.js` + `react-chartjs-2` |
| `react-native-reanimated` | Animations (games) | CSS animations |
| `@gorhom/bottom-sheet` | Bottom sheets | Bootstrap modals |
| `react-native-toast-message` | Toast notifications | `sweetalert2` |

### Media & Hardware

| Package | Purpose | Replaces (Web) |
|---------|---------|----------------|
| `expo-av` | Audio/Video playback & recording | `<video>`, `<audio>`, Web Audio API |
| `expo-image-picker` | Camera & photo library | `<input type="file">` |
| `expo-document-picker` | File selection | `<input type="file">` |
| `expo-file-system` | File download/management | `<a href>` download |
| `expo-sharing` | Share files | N/A |
| `expo-notifications` | Push notifications | N/A (new feature) |
| `expo-secure-store` | Secure credential storage | N/A |

### Integrations

| Package | Purpose | Replaces (Web) |
|---------|---------|----------------|
| `@stripe/stripe-react-native` | Payments | `@stripe/react-stripe-js` |
| `react-native-jitsi-meet` | Video conferencing | iframe to Jitsi web |
| `@react-native-firebase/analytics` | Analytics | `firebase` web SDK |
| `expo-linking` | Deep links | `react-router-dom` URL handling |

---

## 15. Implementation Phases & Timeline

### Phase 1: Foundation & Auth (Weeks 1–2) 🏗️

**Goal:** Project setup, navigation skeleton, authentication for all 5 roles

| Task | Effort | Priority |
|------|--------|----------|
| Expo project initialization | 2h | P0 |
| NativeWind + theme setup | 4h | P0 |
| Navigation architecture (all navigators) | 8h | P0 |
| Shared API service layer (api.js, config.js) | 4h | P0 |
| AsyncStorage utility (storage.js) | 2h | P0 |
| Zustand auth store | 4h | P0 |
| Port formValidation.js | 2h | P0 |
| Student Login/Register screens | 8h | P0 |
| Teacher Login/Register screens | 6h | P0 |
| Admin Login screen | 4h | P0 |
| School Login screen | 4h | P0 |
| Parent Login screen (OTP flow) | 4h | P0 |
| Forgot Password screen (all roles) | 4h | P0 |
| Email verification deep link | 4h | P1 |
| **Subtotal** | **~60h** | |

### Phase 2: Student Core Experience (Weeks 3–5) 📚

**Goal:** Complete student dashboard, course browsing, enrollment, and course player

| Task | Effort | Priority |
|------|--------|----------|
| Port gameService.js | 2h | P0 |
| Port subscriptionService.js | 3h | P0 |
| Port messagingService.js | 3h | P0 |
| Home screen (public) | 8h | P0 |
| All Courses + Search screens | 6h | P0 |
| Course Detail screen | 8h | P0 |
| Student Dashboard (EnhancedDashboard) | 12h | P0 |
| My Courses screen | 6h | P0 |
| Course Player screen (video + lesson nav) | 16h | P0 |
| Study Material screen + downloads | 6h | P1 |
| Subscriptions screen + Stripe integration | 12h | P0 |
| Enrollment flow (with subscription checks) | 6h | P0 |
| Lesson progress tracking | 4h | P0 |
| **Subtotal** | **~92h** | |

### Phase 3: Student Social & Communication (Weeks 5–7) 💬

**Goal:** Sessions, messaging, groups, assignments

| Task | Effort | Priority |
|------|--------|----------|
| Student Sessions screen | 8h | P0 |
| Jitsi native integration (join session) | 8h | P0 |
| Text Messages screen | 10h | P0 |
| Audio Messages screen + playback | 8h | P1 |
| Student Groups screen | 6h | P1 |
| Group Detail (chat, announcements, resources) | 12h | P1 |
| Group Sessions (join) | 4h | P1 |
| Student Assignments screen | 8h | P1 |
| Assignment submission (file, audio, video, MC) | 10h | P1 |
| Discussion threads | 6h | P2 |
| **Subtotal** | **~80h** | |

### Phase 4: Student Progress & Games (Weeks 7–9) 🎮

**Goal:** Progress tracking, achievements, all 3 games, leaderboards

| Task | Effort | Priority |
|------|--------|----------|
| My Progress screen + charts | 8h | P0 |
| Streak Calendar component | 4h | P1 |
| Weekly Goals component | 4h | P1 |
| Achievement Badges screen | 6h | P1 |
| Games Hub screen | 6h | P0 |
| Note Ninja game (music staff SVG + game logic) | 16h | P0 |
| Rhythm Rush game (rhythm viz + animations) | 16h | P0 |
| Music Challenge game (quiz + timer) | 12h | P0 |
| Leaderboard component | 4h | P1 |
| **Subtotal** | **~76h** | |

### Phase 5: Teacher Dashboard (Weeks 9–11) 👩‍🏫

**Goal:** Complete teacher experience

| Task | Effort | Priority |
|------|--------|----------|
| Teacher Overview screen | 10h | P0 |
| Teacher Students management | 8h | P0 |
| Teacher My Courses | 6h | P0 |
| Course Management (CRUD) | 12h | P0 |
| Teacher Sessions (CRUD + go-live) | 10h | P0 |
| Teacher Audio Messages + recorder | 10h | P1 |
| Teacher Text Messages | 6h | P1 |
| Assignment Create screen | 8h | P1 |
| Assignment Reviews + grading | 8h | P1 |
| Office Hours management | 4h | P2 |
| Teacher Community | 4h | P2 |
| Teacher Progress dashboard | 6h | P2 |
| Games Performance view | 4h | P2 |
| Teacher Profile screen | 4h | P1 |
| **Subtotal** | **~100h** | |

### Phase 6: Admin & School Dashboards (Weeks 11–13) 🛡️

**Goal:** Admin panel, school management, audit logs

| Task | Effort | Priority |
|------|--------|----------|
| Admin Dashboard | 8h | P0 |
| Users Management | 10h | P0 |
| Lesson Management (module/lesson CRUD) | 12h | P0 |
| Subscriptions Management | 8h | P1 |
| Course Analytics | 6h | P1 |
| Activity Logs | 6h | P2 |
| Audit Logs Dashboard | 8h | P2 |
| Games Analytics | 4h | P2 |
| Admin Settings | 4h | P1 |
| School Dashboard | 8h | P0 |
| School Teachers/Students management | 8h | P0 |
| School Group Classes | 8h | P1 |
| School Assignments | 6h | P1 |
| School Progress | 4h | P2 |
| School Settings + Chat Locks | 4h | P2 |
| **Subtotal** | **~104h** | |

### Phase 7: Parent Features & Child Safety (Week 13–14) 👪

**Goal:** Parental consent, parent dashboard, child safety features

| Task | Effort | Priority |
|------|--------|----------|
| Parental Consent screen (deep link from email) | 6h | P0 |
| Parent Dashboard | 6h | P0 |
| Parent Messages | 6h | P0 |
| Minor registration flow (DOB check, parent email) | 4h | P0 |
| Session authorization for minors | 4h | P0 |
| Policy acceptance flow | 4h | P1 |
| **Subtotal** | **~30h** | |

### Phase 8: Polish & Launch (Weeks 14–16) 🚀

**Goal:** Push notifications, offline support, testing, App Store submission

| Task | Effort | Priority |
|------|--------|----------|
| Push notification integration (Expo) | 8h | P0 |
| Backend: DeviceToken model + endpoints | 4h | P0 |
| Backend: Send push on key events | 8h | P1 |
| App icon, splash screen, branding | 4h | P0 |
| Deep linking configuration | 4h | P1 |
| Offline error handling & retry logic | 6h | P1 |
| Performance optimization (FlatList, memoization) | 6h | P1 |
| End-to-end testing | 12h | P0 |
| iOS App Store submission | 4h | P0 |
| Google Play Store submission | 4h | P0 |
| Bug fixes & QA | 16h | P0 |
| **Subtotal** | **~76h** | |

### Total Effort Summary

| Phase | Hours | Weeks (2 devs) |
|-------|-------|-----------------|
| Phase 1: Foundation & Auth | 60h | 2 |
| Phase 2: Student Core | 92h | 2.5 |
| Phase 3: Student Social | 80h | 2 |
| Phase 4: Progress & Games | 76h | 2 |
| Phase 5: Teacher Dashboard | 100h | 2.5 |
| Phase 6: Admin & School | 104h | 2.5 |
| Phase 7: Parent & Safety | 30h | 1 |
| Phase 8: Polish & Launch | 76h | 1.5 |
| **TOTAL** | **~618h** | **~16 weeks** |

---

## 16. Phase Details with File-by-File Mapping

### Phase 1 — File Creation List

```
kannari-mobile/
├── app.json
├── babel.config.js
├── tailwind.config.js
├── package.json
├── App.jsx                              # Entry: wraps in providers, initializes auth
├── src/
│   ├── config.js                        # PORT from: frontend/src/config.js
│   ├── services/api.js                  # NEW: shared axios instance
│   ├── utils/storage.js                 # NEW: AsyncStorage wrapper
│   ├── utils/formValidation.js          # PORT from: frontend/src/utils/formValidation.js
│   ├── store/authStore.js               # NEW: Zustand auth store
│   ├── theme/colors.js                  # NEW: extracted from CSS
│   ├── theme/typography.js              # NEW
│   ├── theme/spacing.js                 # NEW
│   ├── components/common/LoadingSpinner.jsx  # REWRITE from: Components/LoadingSpinner.jsx
│   ├── components/common/FieldError.jsx      # REWRITE from: utils/formValidation.js FieldError
│   ├── navigation/RootNavigator.jsx     # NEW
│   ├── navigation/AuthNavigator.jsx     # NEW
│   ├── navigation/StudentNavigator.jsx  # NEW
│   ├── navigation/TeacherNavigator.jsx  # NEW
│   ├── navigation/AdminNavigator.jsx    # NEW
│   ├── navigation/SchoolNavigator.jsx   # NEW
│   ├── navigation/ParentNavigator.jsx   # NEW
│   ├── screens/auth/StudentLoginScreen.jsx    # REWRITE from: Components/User/Login.jsx
│   ├── screens/auth/StudentRegisterScreen.jsx # REWRITE from: Components/User/Register.jsx
│   ├── screens/auth/TeacherLoginScreen.jsx    # REWRITE from: Components/Teacher/TeacherLogin.jsx
│   ├── screens/auth/TeacherRegisterScreen.jsx # REWRITE from: Components/Teacher/TeacherRegister.jsx
│   ├── screens/auth/AdminLoginScreen.jsx      # REWRITE from: Components/Admin/AdminLogin.jsx
│   ├── screens/auth/SchoolLoginScreen.jsx     # REWRITE from: Components/School/SchoolLogin.jsx
│   ├── screens/auth/ParentLoginScreen.jsx     # REWRITE from: Components/ParentLogin.jsx
│   └── screens/auth/ForgotPasswordScreen.jsx  # REWRITE from: Components/User/ForgotPassword.jsx
```

### Phase 2 — File Creation List

```
├── src/
│   ├── services/gameService.js          # PORT from: frontend/src/services/gameService.js
│   ├── services/subscriptionService.js  # PORT from: frontend/src/services/subscriptionService.js
│   ├── services/messagingService.js     # PORT from: frontend/src/services/messagingService.js
│   ├── utils/helpers.js                 # NEW: timeAgo, formatters extracted from components
│   ├── hooks/useSubscription.js         # NEW: wraps subscriptionService
│   ├── hooks/useDashboard.js            # NEW: wraps dashboard API calls
│   ├── components/common/StarRating.jsx      # REWRITE from: Components/Stars.jsx
│   ├── components/common/ProgressBar.jsx     # NEW
│   ├── components/common/Card.jsx            # NEW
│   ├── components/common/TabBar.jsx          # NEW
│   ├── components/common/EmptyState.jsx      # NEW
│   ├── components/media/VideoPlayer.jsx      # NEW: expo-av based
│   ├── screens/public/HomeScreen.jsx          # REWRITE from: Components/Home.jsx
│   ├── screens/public/AllCoursesScreen.jsx    # REWRITE from: Components/User/AllCourses.jsx
│   ├── screens/public/SearchScreen.jsx        # REWRITE from: Components/Search.jsx
│   ├── screens/public/CourseDetailScreen.jsx  # REWRITE from: Components/User/CourseDetail.jsx
│   ├── screens/public/TeacherDetailScreen.jsx # REWRITE from: Components/User/TeacherDetail.jsx
│   ├── screens/student/DashboardScreen.jsx    # REWRITE from: Components/User/EnhancedDashboard.jsx
│   ├── screens/student/MyCoursesScreen.jsx    # REWRITE from: Components/User/MyCourses.jsx
│   ├── screens/student/CoursePlayerScreen.jsx # REWRITE from: Components/User/StudentCoursePlayer.jsx
│   ├── screens/student/StudyMaterialScreen.jsx # REWRITE from: Components/User/StudyStudentMaterial.jsx
│   ├── screens/student/SubscriptionsScreen.jsx # REWRITE from: Components/User/StudentSubscriptions.jsx
│   └── screens/student/ProfileScreen.jsx      # REWRITE from: Components/User/ProfileSetting.jsx
```

*(Phases 3–8 follow the same mapping pattern — each web component has a corresponding mobile screen)*

---

## 17. Testing Strategy

### 17.1 Unit Tests
- **Framework:** Jest (included with Expo)
- **Scope:** All service files, utility files, Zustand stores, custom hooks
- **Reuse:** Test logic from web tests can be ported since services are the same

### 17.2 Component Tests
- **Framework:** React Native Testing Library
- **Scope:** All shared components, form validation, navigation flows

### 17.3 E2E Tests
- **Framework:** Detox (iOS/Android) or Maestro (simpler, YAML-based)
- **Key flows to test:**
  1. Student registration → email verification → login
  2. Browse courses → subscribe → enroll → play lesson
  3. Join live session (Jitsi)
  4. Play each game → check leaderboard
  5. Teacher: create session → go live
  6. Parent: consent flow → authorize child
  7. Admin: manage users → create course → publish

### 17.4 Device Testing Matrix

| Device | OS | Screen Size | Priority |
|--------|----|-------------|----------|
| iPhone 15 | iOS 17 | 6.1" | P0 |
| iPhone SE | iOS 16 | 4.7" | P1 |
| iPad | iPadOS 17 | 10.9" | P2 |
| Pixel 7 | Android 14 | 6.3" | P0 |
| Samsung Galaxy S23 | Android 13 | 6.1" | P1 |
| Samsung Galaxy Tab | Android 13 | 10.5" | P2 |

---

## 18. Deployment & CI/CD

### 18.1 EAS Build (Expo Application Services)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure builds
eas build:configure

# Build for both platforms
eas build --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### 18.2 Over-the-Air Updates

```bash
# Push JS-only updates without App Store review
eas update --branch production --message "Fix game score display"
```

### 18.3 CI/CD Pipeline (GitHub Actions)

```yaml
name: Mobile Build & Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: npx jest --ci
      - run: eas build --platform all --non-interactive
```

### 18.4 App Store Requirements

**iOS (App Store Connect):**
- Apple Developer Account ($99/year)
- App icons (1024x1024)
- Screenshots for iPhone 6.7", 6.5", 5.5" + iPad 12.9"
- Privacy policy URL
- Age rating: 4+ (education app)
- In-App Purchase configuration (for subscriptions via Stripe → may need to use Apple IAP for iOS compliance)

**Android (Google Play Console):**
- Google Play Developer Account ($25 one-time)
- Feature graphic (1024x500)
- Screenshots for phone + 7" + 10" tablet
- Content rating questionnaire
- Target API level 34+
- Data safety form

> **⚠️ Important iOS Note:** Apple requires that digital content subscriptions sold within iOS apps use Apple's In-App Purchase (IAP) system (30% commission). You may need to:
> 1. Use Apple IAP for iOS subscriptions (and adjust pricing to absorb the 30% fee)
> 2. Keep Stripe for Android and web
> 3. Or explore the "Reader App" exemption if applicable
> This is the single biggest cost/complexity item for iOS deployment.

---

## 19. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Apple IAP requirement for subscriptions | High — 30% revenue cut + integration work | Budget 1–2 extra weeks. Consider hybrid: IAP for iOS, Stripe for Android/web |
| Jitsi native SDK compatibility | Medium — video calls are critical | Test early in Phase 1. Fallback: open Jitsi in external browser via `Linking.openURL()` |
| Game performance (animations) | Medium — rhythm games need smooth 60fps | Use `react-native-reanimated` for game animations. Test on low-end devices early |
| Audio recording quality | Medium — audio messages need good quality | Use `expo-av` HIGH_QUALITY preset. Test on both platforms |
| Push notification delivery | Low — Firebase is reliable | Test with both foreground and background delivery |
| Deep linking edge cases | Low — email links need to open app | Test universal links (iOS) and app links (Android) early |
| Large file uploads (lesson media) | Medium — teachers upload audio/video | Implement chunked upload or background upload for large files |

---

## 20. Quick-Start Commands

```bash
# 1. Create the project
npx create-expo-app kannari-mobile --template blank
cd kannari-mobile

# 2. Install core dependencies
npx expo install react-native-screens react-native-safe-area-context \
  @react-navigation/native @react-navigation/stack \
  @react-navigation/bottom-tabs @react-navigation/drawer \
  react-native-gesture-handler react-native-reanimated

# 3. Install UI & styling
npm install nativewind tailwindcss
npx expo install expo-linear-gradient react-native-svg

# 4. Install data layer
npm install axios zustand
npx expo install @react-native-async-storage/async-storage

# 5. Install media
npx expo install expo-av expo-image-picker expo-document-picker \
  expo-file-system expo-sharing

# 6. Install integrations  
npm install @stripe/stripe-react-native
npx expo install expo-notifications expo-linking expo-secure-store

# 7. Install charts
npm install victory-native

# 8. Start development
npx expo start
```

---

## Summary: Why This Approach Wins

| Metric | Value |
|--------|-------|
| **Backend changes** | ~2 small additions (push tokens). 100+ endpoints untouched |
| **Service files reused** | 3/3 (gameService, subscriptionService, messagingService) |
| **Utility files reused** | 1/1 (formValidation.js validators) |
| **Business logic reused** | ~70% of component logic (state, effects, computed values) |
| **UI rewritten** | ~65 screens (JSX → React Native Views/Text) |
| **New code** | Navigation, theme, native integrations (audio, video, push) |
| **Timeline** | 12–16 weeks (2 developers) |
| **Platforms** | iOS + Android from single codebase |
| **Update strategy** | OTA updates for JS changes, store builds for native changes |

> **Bottom line:** By choosing React Native, we keep the same language (JavaScript), the same paradigm (React), the same HTTP client (Axios), and the same API. The only real work is translating web UI components to native UI components — and even there, the logic inside each component ports directly. This is the fastest, most reliable path to a fully functional mobile app that matches the web experience feature-for-feature. 🎵

---

*This plan is designed to be handed directly to a developer (or AI agent) for implementation. Every screen has a source component reference, every service has a porting strategy, and every phase has concrete deliverables.*
