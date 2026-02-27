import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';

const SchoolLogout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem('schoolLoginStatus');
        localStorage.removeItem('schoolUserId');
        localStorage.removeItem('schoolId');
        localStorage.removeItem('schoolName');
        localStorage.removeItem('schoolEmail');
        navigate('/school-login');
    }, [navigate]);

    return <LoadingSpinner fullScreen size="lg" text="Logging out..." />;
};

export default SchoolLogout;
