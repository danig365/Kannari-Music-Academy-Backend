import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';

const AdminLogout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem('adminLoginStatus');
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminName');
        navigate('/admin-login');
    }, [navigate]);

    return <LoadingSpinner fullScreen size="lg" text="Logging out..." />;
};

export default AdminLogout;
