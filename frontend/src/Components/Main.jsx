import React from 'react'
import Home from './Home'
import Header from './Header'
import Footer from './Footer'
import CourseDetail from './User/CourseDetail'
import TeacherDetail from './User/TeacherDetail'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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

const Main = () => {
  return (
      <BrowserRouter>
        <MainContent />
      </BrowserRouter>
  )
}

const MainContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSchoolRoute = location.pathname.startsWith('/school');
  const studentLoginStatus = localStorage.getItem('studentLoginStatus');
  const teacherLoginStatus = localStorage.getItem('teacherLoginStatus');
  const schoolLoginStatus = localStorage.getItem('schoolLoginStatus');
  const isStudentDashboardRoute = location.pathname.startsWith('/user-dashboard') || 
                                   location.pathname.startsWith('/my-courses') ||
                                   location.pathname.startsWith('/my-teachers') ||
                                   location.pathname.startsWith('/profile-setting') ||
                                   location.pathname.startsWith('/change-password') ||
                                   location.pathname.startsWith('/my-progress') ||
                                   location.pathname.startsWith('/my-achievements') ||
                                   location.pathname.startsWith('/subscriptions') ||
                                   location.pathname.startsWith('/learn') ||
                                   location.pathname.startsWith('/all-courses') ||
                                   location.pathname.startsWith('/my-sessions') ||
                                   location.pathname.startsWith('/my-messages') ||
                                   location.pathname.startsWith('/my-assignments');
  const isTeacherDashboardRoute = location.pathname.startsWith('/teacher-dashboard') ||
                                  location.pathname.startsWith('/teacher-overview') ||
                                  location.pathname.startsWith('/teacher-students') ||
                                  location.pathname.startsWith('/teacher-progress') ||
                                  location.pathname.startsWith('/teacher-course-management') ||
                                  location.pathname.startsWith('/teacher-change-password') ||
                                  location.pathname.startsWith('/teacher-profile-setting') ||
                                  location.pathname.startsWith('/teacher-my-course') ||
                                  location.pathname.startsWith('/add-course') ||
                                  location.pathname.startsWith('/all-questions') ||
                                  location.pathname.startsWith('/add-chapter') ||
                                  location.pathname.startsWith('/add-question') ||
                                  location.pathname.startsWith('/my-users') ||
                                  location.pathname.startsWith('/teacher-sessions') ||
                                  location.pathname.startsWith('/teacher-audio-messages') ||
                                  location.pathname.startsWith('/teacher-assignment-reviews');
  const isCourseDetailRoute = location.pathname.startsWith('/detail/');
  const isSchoolDashboardRoute = location.pathname.startsWith('/school-dashboard') ||
                                  location.pathname.startsWith('/school/');
  
  const isAdminLoginRoute = location.pathname === '/admin-login';
  const isSchoolLoginRoute = location.pathname === '/school-login';
  const isAdminLogoutRoute = location.pathname === '/admin-logout';
  const isSchoolLogoutRoute = location.pathname === '/school-logout';

  const isParentConsentRoute = location.pathname.startsWith('/parent-consent');

  const shouldHideHeader = (isAdminRoute && !isAdminLoginRoute && !isAdminLogoutRoute) || 
                          (isSchoolRoute && !isSchoolLoginRoute && !isSchoolLogoutRoute) ||
                          isCourseDetailRoute ||
                          isParentConsentRoute ||
                          (isSchoolDashboardRoute && !isSchoolLoginRoute) ||
                          (isStudentDashboardRoute && studentLoginStatus === 'true') ||
                          (isTeacherDashboardRoute && teacherLoginStatus === 'true');

  return (
    <>
      {!shouldHideHeader && <Header />}
      <Routes>
          <Route path='/user-login' element={<Login />}/>
          <Route path='/user-forgot-password' element={<ForgotPassword />}/>
          <Route path='/' element={<Home />}/>
          <Route path='/detail/:course_id' element={<CourseDetail />}/>
          <Route path='/user-register' element={<Register />}/>
          <Route path='/user-dashboard' element={<EnhancedDashboard />}/>
          <Route path='/my-courses' element={<MyCourses />}/>
          <Route path='/profile-setting' element={<ProfileSetting/>}/>
          <Route path='/change-password' element={<ChangePassword/>}/>
          
          {/* Enhanced Student Dashboard Routes */}
          <Route path='/my-progress' element={<MyProgress />}/>
          <Route path='/my-achievements' element={<MyAchievements />}/>
          <Route path='/subscriptions' element={<StudentSubscriptions />}/>
          <Route path='/learn/:course_id' element={<StudentCoursePlayer />}/>
          <Route path='/learn/:course_id/lesson/:lesson_id' element={<StudentCoursePlayer />}/>
          <Route path='/my-sessions' element={<StudentSessions />}/>
          <Route path='/my-messages' element={<AudioMessages />}/>
          <Route path='/my-assignments' element={<StudentAssignments />}/>
          
          <Route path='/teacher-login' element={<TeacherLogin />}/>
          <Route path='/teacher-forgot-password' element={<TeacherForgotPassword />}/>
          <Route path='/teacher-logout' element={<TeacherLogout />}/>
          <Route path='/user-logout' element={<UserLogout />}/>
          <Route path='/teacher-register' element={<TeacherRegister />}/>
          
          {/* Teacher Dashboard - redirects to overview */}
          <Route path='/teacher-dashboard' element={<TeacherLayout />}>
            <Route index element={<TeacherOverview />}/>
          </Route>
          <Route path='/teacher' element={<TeacherLayout />}>
            <Route path='profile-setting' element={<TeacherProfileSetting />}/>
            <Route path='my-course' element={<TeacherMyCourses />}/>
          </Route>
          <Route path='/teacher-my-course' element={<TeacherLayout />}>
            <Route index element={<TeacherMyCourses />}/>
          </Route>
          <Route path='/teacher-profile-setting' element={<TeacherLayout />}>
            <Route index element={<TeacherProfileSetting />}/>
          </Route>
          <Route path='/my-users' element={<TeacherLayout />}>
            <Route index element={<MyUsers />}/>
          </Route>
          
          {/* Enhanced Teacher Dashboard Routes */}
          <Route path='/teacher-overview' element={<TeacherLayout />}>
            <Route index element={<TeacherOverview />}/>
          </Route>
          <Route path='/teacher-students' element={<TeacherLayout />}>
            <Route index element={<TeacherStudents />}/>
          </Route>
          <Route path='/teacher-lesson-library' element={<Navigate to='/teacher-course-management' replace />} />
          <Route path='/all-chapters/:id' element={<Navigate to='/teacher-course-management' replace />} />
          <Route path='/teacher-progress' element={<TeacherLayout />}>
            <Route index element={<TeacherProgress />}/>
          </Route>
          <Route path='/teacher-course-management' element={<TeacherLayout />}>
            <Route index element={<TeacherCourseManagement />}/>
          </Route>
          <Route path='/teacher-course-management/:course_id' element={<TeacherLayout />}>
            <Route index element={<TeacherCourseManagement />}/>
          </Route>
          <Route path='/teacher-sessions' element={<TeacherLayout />}>
            <Route index element={<TeacherSessions />}/>
          </Route>
          <Route path='/teacher-audio-messages' element={<TeacherLayout />}>
            <Route index element={<TeacherAudioMessages />}/>
          </Route>
          <Route path='/teacher-assignment-reviews' element={<TeacherLayout />}>
            <Route index element={<TeacherAssignmentReviews />}/>
          </Route>
          <Route path='/teacher-detail/:teacher_id' element={<TeacherDetail  />}/>
          <Route path='/study-material/:course_id' element={<StudyMaterial  />}/>
          <Route path='/all-courses' element={<AllCourses  />}/>
          <Route path='/popular-courses' element={<PopularCourses  />}/> 
          <Route path='/enrolled-students/:course_id' element={<EnrolledStudents  />}/>
          <Route path='/search/:searchstring' element={<Search  />}/>
          <Route path='/user/study-material/:course_id' element={<StudyStudentMaterial  />}/>
          <Route path='/faq' element={<Faq />}/>
          <Route path='/page/:page_id/:page_slug' element={<Pages />}/>
          <Route path='/aboutus' element={<About />}/>
          <Route path='/policy' element={<Policy />}/>
          <Route path='/parent-consent/:token' element={<ParentalConsent />}/>
          
          {/* Admin Routes */}
          <Route path='/admin-login' element={<AdminLogin />}/>
          <Route path='/admin-logout' element={<AdminLogout />}/>
          
          {/* Admin Dashboard with Nested Routes (persistent sidebar) */}
          <Route path='/admin-dashboard' element={<AdminLayout />}>
            <Route index element={<AdminDashboard />}/>
          </Route>
          <Route path='/admin' element={<AdminLayout />}>
            <Route path='users-management' element={<UsersManagement />}/>
            <Route path='activity-logs' element={<ActivityLogs />}/>
            <Route path='settings' element={<AdminSettings />}/>
            <Route path='lesson-management' element={<AdminLessonManagement />}/>
            <Route path='lesson-management/:course_id' element={<AdminLessonManagement />}/>
            <Route path='course-analytics/:course_id' element={<CourseAnalytics />}/>
            <Route path='subscriptions' element={<SubscriptionsManagement />}/>
            <Route path='audit-logs' element={<AuditLogsDashboard />}/>
          </Route>

          {/* School Routes */}
          <Route path='/school-login' element={<SchoolLogin />}/>
          <Route path='/school-logout' element={<SchoolLogout />}/>
          
          {/* School Dashboard with Nested Routes (persistent sidebar) */}
          <Route path='/school-dashboard' element={<SchoolLayout />}>
            <Route index element={<SchoolDashboard />}/>
          </Route>
          <Route path='/school' element={<SchoolLayout />}>
            <Route path='teachers' element={<SchoolTeachers />}/>
            <Route path='students' element={<SchoolStudents />}/>
            <Route path='group-classes' element={<SchoolGroupClasses />}/>
            <Route path='lesson-assignments' element={<SchoolLessonAssignments />}/>
            <Route path='progress' element={<SchoolProgress />}/>
            <Route path='settings' element={<SchoolSettings />}/>
          </Route>
      </Routes>
      {!isAdminRoute && !isSchoolRoute && !isSchoolDashboardRoute && !isParentConsentRoute && !(isTeacherDashboardRoute && teacherLoginStatus === 'true') && <Footer />}
    </>
  )
}

export default Main
