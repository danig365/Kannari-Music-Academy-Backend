import React from 'react'
import Home from './Home'
import Header from './Header'
import Footer from './Footer'
import CourseDetail from './User/CourseDetail'
import TeacherDetail from './User/TeacherDetail'
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
import About from './About';
import Login from './User/Login'
import ForgotPassword from './User/ForgotPassword'
import Register from './User/Register'
import EnhancedDashboard from './User/EnhancedDashboard'
import MyCourses from './User/MyCourses'
import ProfileSetting from './User/ProfileSetting'
import ChangePassword from './User/ChangePassword'
import TeacherLogin from './Teacher/TeacherLogin'
import TeacherForgotPassword from './Teacher/TeacherForgotPassword'
import TeacherRegister from './Teacher/TeacherRegister'
import TeacherDashboard from './Teacher/TeacherDashboard'
import TeacherProfileSetting from './Teacher/TeacherProfileSetting'
import TeacherMyCourses from './Teacher/TeacherMyCourses'
import MyUsers from './Teacher/MyUsers'
import AllCourses from './User/AllCourses'
import PopularCourses from '../PopularCourses'
import TeacherLogout from './Teacher/TeacherLogout'
import UserLogout from './User/UserLogout'
import EnrolledStudents from './Teacher/EnrolledStudents'
import Search from './Search'
import StudyMaterial from './Teacher/StudyMaterial'
import StudyStudentMaterial from './User/StudyStudentMaterial'
import Faq from './Faq'
import Pages from './Pages'

import Policy from './Policy'
import ParentalConsent from './ParentalConsent'

// Enhanced Student Dashboard Components
import MyProgress from './User/MyProgress'
import MyAchievements from './User/MyAchievements'
import StudentCoursePlayer from './User/StudentCoursePlayer'
import StudentSubscriptions from './User/StudentSubscriptions'

// Enhanced Teacher Dashboard Components
import TeacherOverview from './Teacher/TeacherOverview'
import TeacherStudents from './Teacher/TeacherStudents'
import TeacherProgress from './Teacher/TeacherProgress'
import TeacherCourseManagement from './Teacher/TeacherCourseManagement'
import TeacherSessions from './Teacher/TeacherSessions'
import TeacherAudioMessages from './Teacher/TeacherAudioMessages'
import TeacherAssignmentReviews from './Teacher/TeacherAssignmentReviews'

// Student Sessions & Audio Messages
import StudentSessions from './User/StudentSessions'
import AudioMessages from './User/AudioMessages'
import StudentAssignments from './User/StudentAssignments'
import TextMessages from './User/TextMessages'  // 18+ student ↔ teacher direct chat
import StudentGroups from './User/StudentGroups'
import StudentGamesHub from './User/StudentGamesHub'
import NoteNinjaGame from './User/NoteNinjaGame'
import RhythmRushGame from './User/RhythmRushGame'
import MusicChallengeGame from './User/MusicChallengeGame'

// Teacher new components
import TeacherMessages from './Teacher/TeacherMessages'
import TeacherAssignmentCreate from './Teacher/TeacherAssignmentCreate'
import TeacherOfficeHours from './Teacher/TeacherOfficeHours'
import TeacherCommunity from './Teacher/TeacherCommunity'
import TeacherGamesPerformance from './Teacher/TeacherGamesPerformance'

// Parent Components
import ParentLogin from './ParentLogin'
import ParentMessages from './Parent/ParentMessages'
import ParentDashboard from './Parent/ParentDashboard'

// Admin Components
import AdminLogin from './Admin/AdminLogin'
import AdminLogout from './Admin/AdminLogout'
import AdminLayout from './Admin/AdminLayout'
import AdminDashboard from './Admin/AdminDashboard'
import TeacherLayout from './Teacher/TeacherLayout'
import UsersManagement from './Admin/UsersManagement'
import ActivityLogs from './Admin/ActivityLogs'
import AdminSettings from './Admin/AdminSettings'
import AdminLessonManagement from './Admin/AdminLessonManagement'
import CourseAnalytics from './Admin/CourseAnalytics'
import SubscriptionsManagement from './Admin/SubscriptionsManagement'
import AuditLogsDashboard from './Admin/AuditLogsDashboard'
import AdminGamesAnalytics from './Admin/AdminGamesAnalytics'

// School Components
import SchoolLogin from './School/SchoolLogin'
import SchoolLogout from './School/SchoolLogout'
import SchoolLayout from './School/SchoolLayout'
import SchoolDashboard from './School/SchoolDashboard'
import SchoolTeachers from './School/SchoolTeachers'
import SchoolStudents from './School/SchoolStudents'
import SchoolGroupClasses from './School/SchoolGroupClasses'
import SchoolLessonAssignments from './School/SchoolLessonAssignments'
import SchoolProgress from './School/SchoolProgress'
import SchoolSettings from './School/SchoolSettings'
import SchoolChatLock from './School/SchoolChatLock'

// Helper for legacy redirects with path params
function RedirectWithParams({ to }) {
  const params = useParams();
  const location = useLocation();
  let target = to;
  Object.entries(params).forEach(([key, value]) => {
    if (key !== '*') target = target.replace(`:${key}`, value);
  });
  return <Navigate to={`${target}${location.search || ''}${location.hash || ''}`} replace />;
}

const Main = () => {
  return (
      <BrowserRouter>
        <MainContent />
      </BrowserRouter>
  )
}

const MainContent = () => {
  const location = useLocation();
  const isAdminPanelRoute = location.pathname.startsWith('/admin-panel');
  const isSchoolRoute = location.pathname.startsWith('/school');
  const isTeacherRoute = location.pathname.startsWith('/teacher');
  const isStudentRoute = location.pathname.startsWith('/student');
  const isParentRoute = location.pathname.startsWith('/parent');
  const studentLoginStatus = localStorage.getItem('studentLoginStatus');
  const teacherLoginStatus = localStorage.getItem('teacherLoginStatus');

  const isCourseDetailRoute = location.pathname.startsWith('/detail/');
  
  const isStudentDashboardRoute = isStudentRoute && 
    location.pathname !== '/student/login' && 
    location.pathname !== '/student/register' &&
    location.pathname !== '/student/forgot-password';

  const isTeacherDashboardRoute = isTeacherRoute && 
    location.pathname !== '/teacher/login' && 
    location.pathname !== '/teacher/register' &&
    location.pathname !== '/teacher/forgot-password' &&
    !location.pathname.startsWith('/teacher-detail/');

  const isAdminLoginRoute = location.pathname === '/admin-panel/login';
  const isAdminLogoutRoute = location.pathname === '/admin-panel/logout';
  const isSchoolLoginRoute = location.pathname === '/school/login';
  const isSchoolLogoutRoute = location.pathname === '/school/logout';
  const isParentConsentRoute = location.pathname.startsWith('/parent/consent');
  const isParentLoginRoute = location.pathname === '/parent/login';

  const shouldHideHeader = (isAdminPanelRoute && !isAdminLoginRoute && !isAdminLogoutRoute) || 
                          (isSchoolRoute && !isSchoolLoginRoute && !isSchoolLogoutRoute) ||
                          isCourseDetailRoute ||
                          isParentConsentRoute ||
                          isParentRoute ||
                          (isStudentDashboardRoute && studentLoginStatus === 'true') ||
                          (isTeacherDashboardRoute && teacherLoginStatus === 'true') ||
                          (location.pathname === '/all-courses' && studentLoginStatus === 'true');

  return (
    <>
      {!shouldHideHeader && <Header />}
      <Routes>
          {/* ==================== PUBLIC ROUTES ==================== */}
          <Route path='/' element={<Home />}/>
          <Route path='/detail/:course_id' element={<CourseDetail />}/>
          <Route path='/all-courses' element={<AllCourses />}/>
          <Route path='/popular-courses' element={<PopularCourses />}/> 
          <Route path='/search/:searchstring' element={<Search />}/>
          <Route path='/teacher-detail/:teacher_id' element={<TeacherDetail />}/>
          <Route path='/faq' element={<Faq />}/>
          <Route path='/page/:page_id/:page_slug' element={<Pages />}/>
          <Route path='/aboutus' element={<About />}/>
          <Route path='/policy' element={<Policy />}/>

          {/* ==================== STUDENT ROUTES (/student/...) ==================== */}
          <Route path='/student/login' element={<Login />}/>
          <Route path='/student/forgot-password' element={<ForgotPassword />}/>
          <Route path='/student/register' element={<Register />}/>
          <Route path='/student/logout' element={<UserLogout />}/>
          <Route path='/student/dashboard' element={<EnhancedDashboard />}/>
          <Route path='/student/my-courses' element={<MyCourses />}/>
          <Route path='/student/profile-setting' element={<ProfileSetting/>}/>
          <Route path='/student/change-password' element={<ChangePassword/>}/>
          <Route path='/student/my-progress' element={<MyProgress />}/>
          <Route path='/student/my-achievements' element={<MyAchievements />}/>
          <Route path='/student/subscriptions' element={<StudentSubscriptions />}/>
          <Route path='/student/learn/:course_id' element={<StudentCoursePlayer />}/>
          <Route path='/student/learn/:course_id/lesson/:lesson_id' element={<StudentCoursePlayer />}/>
          <Route path='/student/my-sessions' element={<StudentSessions />}/>
          <Route path='/student/my-messages' element={<AudioMessages />}/>
          <Route path='/student/text-messages' element={<TextMessages />}/>
          <Route path='/student/my-assignments' element={<StudentAssignments />}/>
          <Route path='/student/my-groups' element={<StudentGroups />}/>
          <Route path='/student/games' element={<StudentGamesHub />}/>
          <Route path='/student/games/note-ninja' element={<NoteNinjaGame />}/>
          <Route path='/student/games/rhythm-rush' element={<RhythmRushGame />}/>
          <Route path='/student/games/music-challenge' element={<MusicChallengeGame />}/>
          <Route path='/student/study-material/:course_id' element={<StudyStudentMaterial />}/>

          {/* ==================== TEACHER ROUTES (/teacher/...) ==================== */}
          <Route path='/teacher/login' element={<TeacherLogin />}/>
          <Route path='/teacher/forgot-password' element={<TeacherForgotPassword />}/>
          <Route path='/teacher/register' element={<TeacherRegister />}/>
          <Route path='/teacher/logout' element={<TeacherLogout />}/>
          
          {/* Teacher Dashboard with nested layout */}
          <Route path='/teacher' element={<TeacherLayout />}>
            <Route path='dashboard' element={<TeacherOverview />}/>
            <Route path='overview' element={<TeacherOverview />}/>
            <Route path='students' element={<TeacherStudents />}/>
            <Route path='my-courses' element={<TeacherMyCourses />}/>
            <Route path='my-users' element={<MyUsers />}/>
            <Route path='profile-setting' element={<TeacherProfileSetting />}/>
            <Route path='progress' element={<TeacherProgress />}/>
            <Route path='course-management' element={<TeacherCourseManagement />}/>
            <Route path='course-management/:course_id' element={<TeacherCourseManagement />}/>
            <Route path='sessions' element={<TeacherSessions />}/>
            <Route path='audio-messages' element={<TeacherAudioMessages />}/>
            <Route path='assignment-reviews' element={<TeacherAssignmentReviews />}/>
            <Route path='text-messages' element={<TeacherMessages />}/>
            <Route path='create-assignments' element={<TeacherAssignmentCreate />}/>
            <Route path='office-hours' element={<TeacherOfficeHours />}/>
            <Route path='community' element={<TeacherCommunity />}/>
            <Route path='games-performance' element={<TeacherGamesPerformance />}/>
            <Route path='study-material/:course_id' element={<StudyMaterial />}/>
            <Route path='enrolled-students/:course_id' element={<EnrolledStudents />}/>
          </Route>

          {/* ==================== PARENT ROUTES (/parent/...) ==================== */}
          <Route path='/parent/consent/:token' element={<ParentalConsent />}/>
          <Route path='/parent/login' element={<ParentLogin />}/>
          <Route path='/parent/dashboard' element={<ParentDashboard />}/>
          <Route path='/parent/messages' element={<ParentMessages />}/>
          
          {/* ==================== ADMIN PANEL ROUTES (/admin-panel/...) ==================== */}
          <Route path='/admin-panel/login' element={<AdminLogin />}/>
          <Route path='/admin-panel/logout' element={<AdminLogout />}/>
          <Route path='/admin-panel' element={<AdminLayout />}>
            <Route path='dashboard' element={<AdminDashboard />}/>
            <Route path='users-management' element={<UsersManagement />}/>
            <Route path='activity-logs' element={<ActivityLogs />}/>
            <Route path='settings' element={<AdminSettings />}/>
            <Route path='lesson-management' element={<AdminLessonManagement />}/>
            <Route path='lesson-management/:course_id' element={<AdminLessonManagement />}/>
            <Route path='course-analytics/:course_id' element={<CourseAnalytics />}/>
            <Route path='subscriptions' element={<SubscriptionsManagement />}/>
            <Route path='audit-logs' element={<AuditLogsDashboard />}/>
            <Route path='games-analytics' element={<AdminGamesAnalytics />}/>
          </Route>

          {/* ==================== SCHOOL ROUTES (/school/...) ==================== */}
          <Route path='/school/login' element={<SchoolLogin />}/>
          <Route path='/school/logout' element={<SchoolLogout />}/>
          <Route path='/school' element={<SchoolLayout />}>
            <Route path='dashboard' element={<SchoolDashboard />}/>
            <Route path='teachers' element={<SchoolTeachers />}/>
            <Route path='students' element={<SchoolStudents />}/>
            <Route path='group-classes' element={<SchoolGroupClasses />}/>
            <Route path='lesson-assignments' element={<SchoolLessonAssignments />}/>
            <Route path='progress' element={<SchoolProgress />}/>
            <Route path='settings' element={<SchoolSettings />}/>
            <Route path='chat-locks' element={<SchoolChatLock />}/>
          </Route>

          {/* ==================== LEGACY REDIRECTS ==================== */}
          {/* Old student routes → new */}
          <Route path='/user-login' element={<Navigate to='/student/login' replace />}/>
          <Route path='/user-register' element={<Navigate to='/student/register' replace />}/>
          <Route path='/user-forgot-password' element={<RedirectWithParams to='/student/forgot-password' />}/>
          <Route path='/user-dashboard' element={<Navigate to='/student/dashboard' replace />}/>
          <Route path='/user-logout' element={<Navigate to='/student/logout' replace />}/>
          <Route path='/my-courses' element={<Navigate to='/student/my-courses' replace />}/>
          <Route path='/my-progress' element={<Navigate to='/student/my-progress' replace />}/>
          <Route path='/my-achievements' element={<Navigate to='/student/my-achievements' replace />}/>
          <Route path='/my-sessions' element={<Navigate to='/student/my-sessions' replace />}/>
          <Route path='/my-messages' element={<Navigate to='/student/my-messages' replace />}/>
          <Route path='/my-assignments' element={<Navigate to='/student/my-assignments' replace />}/>
          <Route path='/my-groups' element={<Navigate to='/student/my-groups' replace />}/>
          <Route path='/games' element={<Navigate to='/student/games' replace />}/>
          <Route path='/profile-setting' element={<Navigate to='/student/profile-setting' replace />}/>
          <Route path='/change-password' element={<Navigate to='/student/change-password' replace />}/>
          <Route path='/subscriptions' element={<Navigate to='/student/subscriptions' replace />}/>
          <Route path='/learn/:course_id' element={<RedirectWithParams to='/student/learn/:course_id' />}/>
          <Route path='/learn/:course_id/lesson/:lesson_id' element={<RedirectWithParams to='/student/learn/:course_id/lesson/:lesson_id' />}/>
          <Route path='/user/study-material/:course_id' element={<RedirectWithParams to='/student/study-material/:course_id' />}/>
          
          {/* Old teacher routes → new */}
          <Route path='/teacher-login' element={<Navigate to='/teacher/login' replace />}/>
          <Route path='/teacher-register' element={<Navigate to='/teacher/register' replace />}/>
          <Route path='/teacher-forgot-password' element={<RedirectWithParams to='/teacher/forgot-password' />}/>
          <Route path='/parent-consent/:token' element={<RedirectWithParams to='/parent/consent/:token' />}/>
          <Route path='/teacher-logout' element={<Navigate to='/teacher/logout' replace />}/>
          <Route path='/teacher-dashboard' element={<Navigate to='/teacher/dashboard' replace />}/>
          <Route path='/teacher-overview' element={<Navigate to='/teacher/overview' replace />}/>
          <Route path='/teacher-students' element={<Navigate to='/teacher/students' replace />}/>
          <Route path='/teacher-my-courses' element={<Navigate to='/teacher/my-courses' replace />}/>
          <Route path='/teacher-profile-setting' element={<Navigate to='/teacher/profile-setting' replace />}/>
          <Route path='/teacher-progress' element={<Navigate to='/teacher/progress' replace />}/>
          <Route path='/teacher-course-management' element={<Navigate to='/teacher/course-management' replace />}/>
          <Route path='/teacher-sessions' element={<Navigate to='/teacher/sessions' replace />}/>
          <Route path='/teacher-audio-messages' element={<Navigate to='/teacher/audio-messages' replace />}/>
          <Route path='/teacher-text-messages' element={<Navigate to='/teacher/text-messages' replace />}/>
          <Route path='/teacher-create-assignments' element={<Navigate to='/teacher/create-assignments' replace />}/>
          <Route path='/teacher-assignment-reviews' element={<Navigate to='/teacher/assignment-reviews' replace />}/>
          <Route path='/teacher-office-hours' element={<Navigate to='/teacher/office-hours' replace />}/>
          <Route path='/teacher-community' element={<Navigate to='/teacher/community' replace />}/>
          <Route path='/teacher-games-performance' element={<Navigate to='/teacher/games-performance' replace />}/>
          <Route path='/my-users' element={<Navigate to='/teacher/my-users' replace />}/>
          <Route path='/study-material/:course_id' element={<RedirectWithParams to='/teacher/study-material/:course_id' />}/>
          <Route path='/enrolled-students/:course_id' element={<RedirectWithParams to='/teacher/enrolled-students/:course_id' />}/>
          <Route path='/teacher-lesson-library' element={<Navigate to='/teacher/course-management' replace />}/>
          <Route path='/all-chapters/:id' element={<Navigate to='/teacher/course-management' replace />}/>
          
          {/* Old admin routes → new */}
          <Route path='/admin-login' element={<Navigate to='/admin-panel/login' replace />}/>
          <Route path='/admin-logout' element={<Navigate to='/admin-panel/logout' replace />}/>
          <Route path='/admin-dashboard' element={<Navigate to='/admin-panel/dashboard' replace />}/>
          
          {/* Old school routes → new */}
          <Route path='/school-login' element={<Navigate to='/school/login' replace />}/>
          <Route path='/school-logout' element={<Navigate to='/school/logout' replace />}/>
          <Route path='/school-dashboard' element={<Navigate to='/school/dashboard' replace />}/>
          
          {/* Old parent routes → new */}
          <Route path='/parent-login' element={<Navigate to='/parent/login' replace />}/>
          <Route path='/parent-dashboard' element={<Navigate to='/parent/dashboard' replace />}/>
          <Route path='/parent-messages' element={<Navigate to='/parent/messages' replace />}/>
      </Routes>
      {!isAdminPanelRoute && !isSchoolRoute && !isParentConsentRoute && !isParentRoute && !(isTeacherDashboardRoute && teacherLoginStatus === 'true') && !(isStudentDashboardRoute && studentLoginStatus === 'true') && <Footer />}
    </>
  )
}

export default Main
