import React from 'react'
import LoadingSpinner from '../LoadingSpinner'

const UserLogout = () => {
    localStorage.removeItem('studentLoginStatus')
    localStorage.removeItem('studentId')
    window.location.href='/student/login';
    
    return <LoadingSpinner fullScreen size="lg" text="Logging out..." />
}

export default UserLogout
