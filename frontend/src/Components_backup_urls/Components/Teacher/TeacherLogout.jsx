import React from 'react'

const TeacherLogout = () => {
    localStorage.removeItem('teacherLoginStatus')
    localStorage.removeItem('teacherId')
    localStorage.removeItem('teacherName')
    localStorage.removeItem('teacherEmail')
    localStorage.removeItem('teacherQualification')
    localStorage.removeItem('teacherMobile')
    localStorage.removeItem('teacherProfileImg')
    window.location.href='/teacher-login';
  return (
    <div>
      
    </div>
  )
}

export default TeacherLogout
