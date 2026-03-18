import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import LoadingSpinner from '../LoadingSpinner';
import './UsersManagement.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const mediaBaseUrl = API_BASE_URL.replace('/api', '');

// Responsive Table Cell Component
const TableCell = ({ label, children }) => (
    <td data-label={label}>
        {children}
    </td>
);

const UsersManagement = () => {
    const adminId = localStorage.getItem('adminId');
    const [activeTab, setActiveTab] = useState('students');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [schoolsSearchTerm, setSchoolsSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTimeout, setSearchTimeout] = useState(null);

    // Students State
    const [students, setStudents] = useState([]);
    const [studentsTotalPages, setStudentsTotalPages] = useState(1);

    // Teachers State
    const [teachers, setTeachers] = useState([]);
    const [teachersTotalPages, setTeachersTotalPages] = useState(1);
    const [teacherVerificationFilter, setTeacherVerificationFilter] = useState('');

    // Schools State
    const [schools, setSchools] = useState([]);

    // Compliance States
    const [minors, setMinors] = useState([]);
    const [minorsLoading, setMinorsLoading] = useState(false);
    const [safetyReports, setSafetyReports] = useState([]);
    const [safetyStatusFilter, setSafetyStatusFilter] = useState('');
    const [safetyLoading, setSafetyLoading] = useState(false);

    const [showSchoolModal, setShowSchoolModal] = useState(false);
    const [editingSchool, setEditingSchool] = useState(null);
    const [schoolFormData, setSchoolFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        website: '',
        status: 'trial',
        max_teachers: 10,
        max_students: 100,
        max_courses: 50
    });

    // Manage Members State
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [membersSchool, setMembersSchool] = useState(null);
    const [schoolTeachers, setSchoolTeachers] = useState([]);
    const [schoolStudents, setSchoolStudents] = useState([]);
    const [allTeachers, setAllTeachers] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersMsg, setMembersMsg] = useState('');

    // Verification Detail Modal State
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationDetail, setVerificationDetail] = useState(null);
    const [verificationTeacher, setVerificationTeacher] = useState(null);
    const [verificationLoading, setVerificationLoading] = useState(false);

    // Students Modal State
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [studentFormData, setStudentFormData] = useState({
        fullname: '',
        email: '',
        username: '',
        password: '',
        interseted_categories: ''
    });

    // Teachers Modal State
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [teacherFormData, setTeacherFormData] = useState({
        full_name: '',
        email: '',
        mobile_no: '',
        password: '',
        qualification: '',
        skills: ''
    });

    useEffect(() => {
        document.title = 'Users Management | Admin Dashboard';
    }, []);

    useEffect(() => {
        setCurrentPage(1);
        setSearchTerm('');
        setSchoolsSearchTerm('');
        if (activeTab === 'students') {
            fetchStudents();
        } else if (activeTab === 'teachers') {
            fetchTeachers();
        } else if (activeTab === 'schools') {
            fetchSchools();
        } else if (activeTab === 'minors') {
            fetchMinorsStatus();
        } else if (activeTab === 'safety') {
            fetchSafetyReports();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'students') {
            fetchStudents();
        } else if (activeTab === 'teachers') {
            fetchTeachers();
        } else if (activeTab === 'schools') {
            fetchSchools();
        } else if (activeTab === 'safety') {
            fetchSafetyReports();
        }
    }, [currentPage, searchTerm, schoolsSearchTerm, activeTab, safetyStatusFilter, teacherVerificationFilter]);

    // Fetch Students
    const fetchStudents = async () => {
        setLoading(true);
        try {
            let url = `${baseUrl}/admin/students/?page=${currentPage}`;
            if (searchTerm) {
                url += `&search=${searchTerm}`;
            }
            const response = await axios.get(url);
            if (response.data.results) {
                setStudents(response.data.results);
                setStudentsTotalPages(Math.ceil(response.data.count / 8));
            } else {
                setStudents(response.data);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Teachers
    const fetchTeachers = async () => {
        setLoading(true);
        try {
            let url = `${baseUrl}/admin/teachers/?page=${currentPage}`;
            if (searchTerm) {
                url += `&search=${searchTerm}`;
            }
            if (teacherVerificationFilter) {
                url += `&verification_status=${teacherVerificationFilter}`;
            }
            const response = await axios.get(url);
            if (response.data.results) {
                setTeachers(response.data.results);
                setTeachersTotalPages(Math.ceil(response.data.count / 8));
            } else {
                setTeachers(response.data);
            }
        } catch (error) {
            console.error('Error fetching teachers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Schools
    const fetchSchools = async () => {
        setLoading(true);
        try {
            let url = `${baseUrl}/schools/?page=${currentPage}`;
            if (schoolsSearchTerm) {
                url += `&search=${schoolsSearchTerm}`;
            }
            const response = await axios.get(url);
            // Handle both paginated response (object with results) and non-paginated (array)
            const schoolsData = response.data.results ? response.data.results : response.data;
            setSchools(Array.isArray(schoolsData) ? schoolsData : []);
        } catch (error) {
            console.error('Error fetching schools:', error);
            setSchools([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMinorsStatus = async () => {
        setMinorsLoading(true);
        try {
            const res = await axios.get(`${baseUrl}/admin/minors/consent-status/?requester_admin_id=${adminId}`);
            setMinors(Array.isArray(res.data?.minors) ? res.data.minors : []);
        } catch (error) {
            console.error('Error fetching minors consent status:', error);
            setMinors([]);
        } finally {
            setMinorsLoading(false);
        }
    };

    const fetchSafetyReports = async () => {
        setSafetyLoading(true);
        try {
            let url = `${baseUrl}/admin/safety-reports/?requester_admin_id=${adminId}`;
            if (safetyStatusFilter) {
                url += `&status=${safetyStatusFilter}`;
            }
            const res = await axios.get(url);
            setSafetyReports(Array.isArray(res.data?.reports) ? res.data.reports : []);
        } catch (error) {
            console.error('Error fetching safety reports:', error);
            setSafetyReports([]);
        } finally {
            setSafetyLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
    };

    // Students Modal Functions
    const openStudentModal = () => {
        setEditingStudent(null);
        setStudentFormData({
            fullname: '',
            email: '',
            username: '',
            password: '',
            interseted_categories: ''
        });
        setShowStudentModal(true);
    };

    const closeStudentModal = () => {
        setShowStudentModal(false);
        setEditingStudent(null);
        setStudentFormData({
            fullname: '',
            email: '',
            username: '',
            password: '',
            interseted_categories: ''
        });
    };

    const handleStudentChange = (e) => {
        setStudentFormData({
            ...studentFormData,
            [e.target.name]: e.target.value
        });
    };

    const handleStudentSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('fullname', studentFormData.fullname);
            formData.append('email', studentFormData.email);
            formData.append('username', studentFormData.username);
            formData.append('interseted_categories', studentFormData.interseted_categories);
            if (studentFormData.password) {
                formData.append('password', studentFormData.password);
            }

            if (editingStudent) {
                await axios.put(`${baseUrl}/student/${editingStudent.id}/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                await axios.post(`${baseUrl}/student/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }
            fetchStudents();
            closeStudentModal();
        } catch (error) {
            console.error('Error saving student:', error);
            alert('Error saving student: ' + (error.response?.data?.detail || error.response?.data?.fullname?.[0] || error.message));
        }
    };

    // Teachers Modal Functions
    const openTeacherModal = () => {
        setEditingTeacher(null);
        setTeacherFormData({
            full_name: '',
            email: '',
            mobile_no: '',
            password: '',
            qualification: '',
            skills: ''
        });
        setShowTeacherModal(true);
    };

    const closeTeacherModal = () => {
        setShowTeacherModal(false);
        setEditingTeacher(null);
        setTeacherFormData({
            full_name: '',
            email: '',
            mobile_no: '',
            password: '',
            qualification: '',
            skills: ''
        });
    };

    const handleTeacherChange = (e) => {
        setTeacherFormData({
            ...teacherFormData,
            [e.target.name]: e.target.value
        });
    };

    const handleTeacherSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('full_name', teacherFormData.full_name);
            formData.append('email', teacherFormData.email);
            formData.append('mobile_no', teacherFormData.mobile_no);
            formData.append('qualification', teacherFormData.qualification);
            formData.append('skills', teacherFormData.skills);
            if (teacherFormData.password) {
                formData.append('password', teacherFormData.password);
            }

            if (editingTeacher) {
                await axios.put(`${baseUrl}/teacher/${editingTeacher.id}/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                await axios.post(`${baseUrl}/teacher/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }
            fetchTeachers();
            closeTeacherModal();
        } catch (error) {
            console.error('Error saving teacher:', error);
            alert('Error saving teacher: ' + (error.response?.data?.detail || error.response?.data?.full_name?.[0] || error.message));
        }
    };

    const openSchoolModal = () => {
        setEditingSchool(null);
        setSchoolFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            country: 'India',
            website: '',
            status: 'trial',
            max_teachers: 10,
            max_students: 100,
            max_courses: 50
        });
        setShowSchoolModal(true);
    }

    // Students Edit
    const handleEditStudent = (student) => {
        setEditingStudent(student);
        setStudentFormData({
            fullname: student.fullname,
            email: student.email,
            username: student.username,
            password: '',
            interseted_categories: student.interseted_categories || ''
        });
        setShowStudentModal(true);
    };

    // Students Delete
    const handleDeleteStudent = async (studentId) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await axios.delete(`${baseUrl}/student/${studentId}/`);
                fetchStudents();
            } catch (error) {
                console.error('Error deleting student:', error);
            }
        }
    };

    // Teachers Edit
    const handleEditTeacher = (teacher) => {
        setEditingTeacher(teacher);
        setTeacherFormData({
            full_name: teacher.full_name,
            email: teacher.email,
            mobile_no: teacher.mobile_no || '',
            password: '',
            qualification: teacher.qualification || '',
            skills: teacher.skills || ''
        });
        setShowTeacherModal(true);
    };

    // Teachers Delete
    const handleDeleteTeacher = async (teacherId) => {
        if (window.confirm('Are you sure you want to delete this teacher?')) {
            try {
                await axios.delete(`${baseUrl}/teacher/${teacherId}/`);
                fetchTeachers();
            } catch (error) {
                console.error('Error deleting teacher:', error);
            }
        }
    };

    // Teacher Approval Toggle (Admin)
    const handleTeacherApproval = async (teacher, shouldApprove) => {
        try {
            const formData = new FormData();
            formData.append('is_approved', shouldApprove ? 'true' : 'false');
            const response = await axios.post(`${baseUrl}/admin/toggle-teacher/${teacher.id}/`, formData);

            if (response.data?.bool) {
                Swal.fire({
                    icon: 'success',
                    title: shouldApprove ? 'Teacher Approved' : 'Approval Revoked',
                    text: response.data?.message || 'Teacher approval status updated.',
                    confirmButtonColor: '#1976d2'
                });
                fetchTeachers();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: response.data?.message || 'Could not update teacher approval status.',
                    confirmButtonColor: '#1976d2'
                });
            }
        } catch (error) {
            console.error('Error updating teacher approval:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to update teacher approval status.',
                confirmButtonColor: '#1976d2'
            });
        }
    };

    const openTeacherVerificationDetails = async (teacher) => {
        setVerificationTeacher(teacher);
        setVerificationLoading(true);
        setShowVerificationModal(true);
        try {
            const res = await axios.get(
                `${baseUrl}/admin/teacher/${teacher.id}/verification/?requester_admin_id=${adminId}`
            );
            setVerificationDetail(res.data?.verification || null);
        } catch (error) {
            console.error('Error loading verification details:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to load verification details.' });
            setShowVerificationModal(false);
        } finally {
            setVerificationLoading(false);
        }
    };

    const closeVerificationModal = () => {
        setShowVerificationModal(false);
        setVerificationDetail(null);
        setVerificationTeacher(null);
    };

    const handleVerificationAction = async (teacherId, action, extraParams = {}) => {
        try {
            const payload = new FormData();
            payload.append('requester_admin_id', adminId);
            Object.entries(extraParams).forEach(([k, v]) => payload.append(k, v));
            let url = '';
            if (action === 'approve-id') url = `${baseUrl}/admin/teacher/${teacherId}/verification/review-id/`;
            else if (action === 'approve-bg') url = `${baseUrl}/admin/teacher/${teacherId}/verification/review-background/`;
            else if (action === 'activate') url = `${baseUrl}/admin/teacher/${teacherId}/verification/activate/`;
            const res = await axios.post(url, payload);
            Swal.fire({ icon: 'success', title: res.data?.message || 'Updated', timer: 1500, showConfirmButton: false });
            fetchTeachers();
            // Refresh modal data
            const refresh = await axios.get(`${baseUrl}/admin/teacher/${teacherId}/verification/?requester_admin_id=${adminId}`);
            setVerificationDetail(refresh.data?.verification || null);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Action failed', text: error.response?.data?.message || 'Please try again.' });
        }
    };

    const handleApproveAgreementsFromModal = async (teacherId) => {
        try {
            const detail = await axios.get(`${baseUrl}/admin/teacher/${teacherId}/verification/?requester_admin_id=${adminId}`);
            const sigs = (detail.data?.verification?.agreement_signatures || []).filter(s => s.status === 'in_review' || s.status === 'pending');
            if (!sigs.length) { Swal.fire({ icon: 'info', title: 'No pending agreements' }); return; }
            await Promise.all(sigs.map(sig => {
                const p = new FormData();
                p.append('requester_admin_id', adminId);
                p.append('decision', 'approved');
                p.append('notes', 'Approved from verification review modal');
                return axios.post(`${baseUrl}/admin/teacher/${teacherId}/verification/review-agreement/${sig.id}/`, p);
            }));
            Swal.fire({ icon: 'success', title: 'Agreements approved', timer: 1500, showConfirmButton: false });
            fetchTeachers();
            const refresh = await axios.get(`${baseUrl}/admin/teacher/${teacherId}/verification/?requester_admin_id=${adminId}`);
            setVerificationDetail(refresh.data?.verification || null);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Failed', text: error.response?.data?.message || 'Try again.' });
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'approved': return 'bg-success';
            case 'rejected': return 'bg-danger';
            case 'expired': return 'bg-danger';
            case 'in_review': return 'bg-info';
            default: return 'bg-warning text-dark';
        }
    };

    const getDocumentUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${mediaBaseUrl}${path}`;
    };

    const isImageFile = (url) => {
        if (!url) return false;
        const ext = url.split('?')[0].split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
    };

    const reviewTeacherVerificationStep = async (teacherId, step, decision) => {
        const notesResult = await Swal.fire({
            title: `${decision === 'approved' ? 'Approve' : 'Reject'} ${step}`,
            input: 'text',
            inputLabel: 'Notes (optional)',
            inputPlaceholder: 'Add review notes',
            showCancelButton: true,
        });
        if (!notesResult.isConfirmed) return;

        const endpoint = step === 'id' ? 'review-id' : 'review-background';
        try {
            const payload = new FormData();
            payload.append('requester_admin_id', adminId);
            payload.append('decision', decision);
            if (notesResult.value) payload.append('notes', notesResult.value);
            const res = await axios.post(
                `${baseUrl}/admin/teacher/${teacherId}/verification/${endpoint}/`,
                payload
            );
            Swal.fire({ icon: 'success', title: res.data?.message || 'Updated' });
            fetchTeachers();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Update failed',
                text: error.response?.data?.message || 'Could not update verification step.',
            });
        }
    };

    const approvePendingAgreements = async (teacherId) => {
        try {
            const detail = await axios.get(
                `${baseUrl}/admin/teacher/${teacherId}/verification/?requester_admin_id=${adminId}`
            );
            const signatures = (detail.data?.verification?.agreement_signatures || []).filter(
                (item) => item.status === 'in_review'
            );

            if (!signatures.length) {
                Swal.fire({ icon: 'info', title: 'No pending agreement signatures' });
                return;
            }

            await Promise.all(
                signatures.map((signature) => {
                    const payload = new FormData();
                    payload.append('requester_admin_id', adminId);
                    payload.append('decision', 'approved');
                    payload.append('notes', 'Approved from admin dashboard bulk action');
                    return axios.post(
                        `${baseUrl}/admin/teacher/${teacherId}/verification/review-agreement/${signature.id}/`,
                        payload
                    );
                })
            );

            Swal.fire({ icon: 'success', title: 'Pending agreements approved' });
            fetchTeachers();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Failed to approve agreements',
                text: error.response?.data?.message || 'Please try again.',
            });
        }
    };

    const activateTeacherAfterVerification = async (teacherId) => {
        try {
            const payload = new FormData();
            payload.append('requester_admin_id', adminId);
            const res = await axios.post(`${baseUrl}/admin/teacher/${teacherId}/verification/activate/`, payload);
            Swal.fire({ icon: 'success', title: res.data?.message || 'Teacher activated' });
            fetchTeachers();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Activation failed',
                text: error.response?.data?.message || 'Could not activate teacher.',
            });
        }
    };

    const rejectTeacherVerification = async (teacherId) => {
        const result = await Swal.fire({
            title: 'Reject Teacher Verification',
            input: 'textarea',
            inputLabel: 'Reason',
            inputPlaceholder: 'Enter rejection reason',
            showCancelButton: true,
            inputValidator: (value) => (!value ? 'Reason is required' : undefined),
        });
        if (!result.isConfirmed) return;

        try {
            const payload = new FormData();
            payload.append('requester_admin_id', adminId);
            payload.append('reason', result.value);
            const res = await axios.post(`${baseUrl}/admin/teacher/${teacherId}/verification/reject/`, payload);
            Swal.fire({ icon: 'success', title: res.data?.message || 'Verification rejected' });
            fetchTeachers();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Rejection failed',
                text: error.response?.data?.message || 'Could not reject verification.',
            });
        }
    };

    const updateSafetyReportStatus = async (reportId) => {
        const result = await Swal.fire({
            title: 'Update Safety Report',
            html: `
                <select id="safety-status" class="swal2-input">
                    <option value="open">Open</option>
                    <option value="in_review">In Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                </select>
                <textarea id="safety-notes" class="swal2-textarea" placeholder="Admin notes"></textarea>
            `,
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                const status = document.getElementById('safety-status')?.value;
                const notes = document.getElementById('safety-notes')?.value;
                if (!status) {
                    Swal.showValidationMessage('Status is required');
                    return false;
                }
                return { status, notes };
            }
        });

        if (!result.isConfirmed) return;

        try {
            const payload = new FormData();
            payload.append('requester_admin_id', adminId);
            payload.append('status', result.value.status);
            payload.append('admin_notes', result.value.notes || '');
            const res = await axios.post(`${baseUrl}/admin/safety-report/${reportId}/update/`, payload);
            Swal.fire({ icon: 'success', title: res.data?.message || 'Safety report updated' });
            fetchSafetyReports();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Failed to update report',
                text: error.response?.data?.message || 'Please try again.',
            });
        }
    };

    // Schools Functions
    const handleSchoolChange = (e) => {
        setSchoolFormData({
            ...schoolFormData,
            [e.target.name]: e.target.value
        });
    };

    const handleSchoolSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', schoolFormData.name);
            formData.append('email', schoolFormData.email);
            formData.append('phone', schoolFormData.phone);
            formData.append('address', schoolFormData.address);
            formData.append('city', schoolFormData.city);
            formData.append('state', schoolFormData.state);
            formData.append('country', schoolFormData.country);
            formData.append('website', schoolFormData.website);
            formData.append('status', schoolFormData.status);
            formData.append('max_teachers', schoolFormData.max_teachers);
            formData.append('max_students', schoolFormData.max_students);
            formData.append('max_courses', schoolFormData.max_courses);

            if (editingSchool) {
                await axios.put(`${baseUrl}/schools/${editingSchool.id}/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                const response = await axios.post(`${baseUrl}/schools/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                // Show school login credentials after creation
                if (response.data.school_login_email && response.data.school_login_password) {
                    Swal.fire({
                        title: 'School Created Successfully!',
                        html: `
                            <div style="text-align: left; padding: 10px;">
                                <p style="margin-bottom: 15px; color: #666;">The following login credentials have been generated for the school portal:</p>
                                <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; border: 1px solid #e9ecef;">
                                    <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="/school/login" style="color: #1976d2;">${window.location.origin}/school/login</a></p>
                                    <p style="margin: 5px 0;"><strong>Email:</strong> <code style="background: #e3f2fd; padding: 2px 8px; border-radius: 4px;">${response.data.school_login_email}</code></p>
                                    <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background: #e8f5e9; padding: 2px 8px; border-radius: 4px;">${response.data.school_login_password}</code></p>
                                </div>
                                <p style="margin-top: 15px; color: #e65100; font-size: 13px;">⚠ Please save these credentials. The password cannot be retrieved later.</p>
                            </div>
                        `,
                        icon: 'success',
                        confirmButtonText: 'Got it!',
                        confirmButtonColor: '#1976d2',
                        width: '500px',
                    });
                }
            }
            fetchSchools();
            closeSchoolModal();
        } catch (error) {
            console.error('Error saving school:', error);
            alert('Error saving school: ' + (error.response?.data?.detail || error.response?.data?.name?.[0] || error.message));
        }
    };

    const handleEditSchool = (school) => {
        setEditingSchool(school);
        setSchoolFormData({
            name: school.name,
            email: school.email,
            phone: school.phone || '',
            address: school.address || '',
            city: school.city || '',
            state: school.state || '',
            country: school.country || 'India',
            website: school.website || '',
            status: school.status,
            max_teachers: school.max_teachers,
            max_students: school.max_students,
            max_courses: school.max_courses
        });
        setShowSchoolModal(true);
    };

    const handleDeleteSchool = async (schoolId) => {
        if (window.confirm('Are you sure you want to delete this school?')) {
            try {
                await axios.delete(`${baseUrl}/schools/${schoolId}/`);
                fetchSchools();
            } catch (error) {
                console.error('Error deleting school:', error);
            }
        }
    };

    const handleSchoolChangePassword = async (school) => {
        const schoolUserId = school.school_user_id;
        if (!schoolUserId) {
            Swal.fire({
                icon: 'error',
                title: 'No School User',
                text: 'This school does not have a login user associated with it.',
                confirmButtonColor: '#1976d2'
            });
            return;
        }
        const { value: newPassword } = await Swal.fire({
            title: 'Change School Password',
            html: `
                <div style="text-align: left; margin-bottom: 10px;">
                    <p style="margin: 0 0 5px; color: #666; font-size: 14px;"><strong>School:</strong> ${school.name}</p>
                    <p style="margin: 0 0 15px; color: #666; font-size: 14px;"><strong>Login Email:</strong> ${school.school_user_email || school.email}</p>
                </div>
            `,
            input: 'password',
            inputLabel: 'New Password',
            inputPlaceholder: 'Enter new password',
            inputAttributes: {
                autocapitalize: 'off',
                autocorrect: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Change Password',
            confirmButtonColor: '#1976d2',
            cancelButtonColor: '#6c757d',
            inputValidator: (value) => {
                if (!value) {
                    return 'Please enter a new password';
                }
                if (value.length < 4) {
                    return 'Password must be at least 4 characters';
                }
            }
        });

        if (newPassword) {
            try {
                const formData = new FormData();
                formData.append('password', newPassword);
                const response = await axios.post(
                    `${baseUrl}/school/change-password/${schoolUserId}/`,
                    formData
                );
                if (response.data.bool) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Password Changed!',
                        text: `The password for ${school.name} has been updated successfully.`,
                        confirmButtonColor: '#1976d2'
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to change password. Please try again.',
                        confirmButtonColor: '#1976d2'
                    });
                }
            } catch (error) {
                console.error('Error changing school password:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to change password: ' + (error.response?.data?.detail || error.message),
                    confirmButtonColor: '#1976d2'
                });
            }
        }
    };

    const closeSchoolModal = () => {
        setShowSchoolModal(false);
        setEditingSchool(null);
        setSchoolFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            country: 'India',
            website: '',
            status: 'trial',
            max_teachers: 10,
            max_students: 100,
            max_courses: 50
        });
    };

    // ===== Manage Members Functions =====
    const openMembersModal = async (school) => {
        setMembersSchool(school);
        setShowMembersModal(true);
        setMembersLoading(true);
        setMembersMsg('');
        setSelectedTeacherId('');
        setSelectedStudentId('');
        try {
            const [stRes, ssRes, allTRes, allSRes] = await Promise.all([
                axios.get(`${baseUrl}/schools/${school.id}/teachers/`),
                axios.get(`${baseUrl}/schools/${school.id}/students/`),
                axios.get(`${baseUrl}/teacher/`),
                axios.get(`${baseUrl}/student/`),
            ]);
            setSchoolTeachers(stRes.data);
            setSchoolStudents(ssRes.data);
            setAllTeachers(allTRes.data);
            setAllStudents(allSRes.data);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setMembersLoading(false);
        }
    };

    const closeMembersModal = () => {
        setShowMembersModal(false);
        setMembersSchool(null);
        setSchoolTeachers([]);
        setSchoolStudents([]);
        fetchSchools();
    };

    const addTeacherToSchool = async () => {
        if (!selectedTeacherId || !membersSchool) return;
        try {
            await axios.post(`${baseUrl}/schools/${membersSchool.id}/teachers/`, {
                school: membersSchool.id,
                teacher: selectedTeacherId,
            });
            setSelectedTeacherId('');
            setMembersMsg('Teacher assigned successfully!');
            const res = await axios.get(`${baseUrl}/schools/${membersSchool.id}/teachers/`);
            setSchoolTeachers(res.data);
            setTimeout(() => setMembersMsg(''), 3000);
        } catch (error) {
            const errData = error.response?.data;
            const errMsg = errData ? (typeof errData === 'object' ? Object.values(errData).flat().join(' ') : String(errData)) : 'Failed to assign teacher';
            setMembersMsg(errMsg);
            setTimeout(() => setMembersMsg(''), 3000);
        }
    };

    const removeTeacherFromSchool = async (recordId) => {
        if (!window.confirm('Remove this teacher from the school?')) return;
        try {
            await axios.delete(`${baseUrl}/school-teachers/${recordId}/`);
            setSchoolTeachers(schoolTeachers.filter(t => t.id !== recordId));
            setMembersMsg('Teacher removed');
            setTimeout(() => setMembersMsg(''), 3000);
        } catch (error) {
            console.error('Error removing teacher:', error);
        }
    };

    const addStudentToSchool = async () => {
        if (!selectedStudentId || !membersSchool) return;
        try {
            await axios.post(`${baseUrl}/schools/${membersSchool.id}/students/`, {
                school: membersSchool.id,
                student: selectedStudentId,
            });
            setSelectedStudentId('');
            setMembersMsg('Student assigned successfully!');
            const res = await axios.get(`${baseUrl}/schools/${membersSchool.id}/students/`);
            setSchoolStudents(res.data);
            setTimeout(() => setMembersMsg(''), 3000);
        } catch (error) {
            const errData = error.response?.data;
            const errMsg = errData ? (typeof errData === 'object' ? Object.values(errData).flat().join(' ') : String(errData)) : 'Failed to assign student';
            setMembersMsg(errMsg);
            setTimeout(() => setMembersMsg(''), 3000);
        }
    };

    const removeStudentFromSchool = async (recordId) => {
        if (!window.confirm('Remove this student from the school?')) return;
        try {
            await axios.delete(`${baseUrl}/school-students/${recordId}/`);
            setSchoolStudents(schoolStudents.filter(s => s.id !== recordId));
            setMembersMsg('Student removed');
            setTimeout(() => setMembersMsg(''), 3000);
        } catch (error) {
            console.error('Error removing student:', error);
        }
    };

    const assignedTeacherIds = schoolTeachers.map(st => st.teacher?.id || st.teacher);
    const assignedStudentIds = schoolStudents.map(ss => ss.student?.id || ss.student);
    const availableTeachers = allTeachers.filter(t => !assignedTeacherIds.includes(t.id));
    const availableStudents = allStudents.filter(s => !assignedStudentIds.includes(s.id));

    const getStatusBadge = (status) => {
        const badges = {
            active: 'bg-success',
            inactive: 'bg-secondary',
            suspended: 'bg-danger',
            trial: 'bg-warning text-dark'
        };
        return badges[status] || 'bg-secondary';
    };

    if (loading && students.length === 0 && teachers.length === 0 && schools.length === 0) {
        return (
            <div className="admin-loading-wrapper">
                <LoadingSpinner size="lg" text="Loading users..." />
            </div>
        );
    }

        return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4 users-header-wrapper">
                <h2 className="users-management-header mb-0">
                    <i className="bi bi-people me-2"></i>
                    Users Management
                </h2>
                <button 
                    className="btn btn-primary users-add-btn"
                    onClick={() => {
                        if (activeTab === 'students') openStudentModal();
                        else if (activeTab === 'teachers') openTeacherModal();
                        else if (activeTab === 'schools') openSchoolModal();
                    }}
                    disabled={activeTab === 'minors' || activeTab === 'safety'}
                >
                    <i className="bi bi-plus-circle me-2"></i>Add New
                </button>
            </div>

            {/* Tabs Navigation */}
            <ul className="nav nav-tabs users-nav-tabs" role="tablist">
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === 'students' ? 'active' : ''}`}
                                id="students-tab"
                                onClick={() => setActiveTab('students')}
                                role="tab"
                                aria-controls="students"
                                aria-selected={activeTab === 'students'}
                            >
                                <i className="bi bi-mortarboard me-2"></i>Students
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === 'teachers' ? 'active' : ''}`}
                                id="teachers-tab"
                                onClick={() => setActiveTab('teachers')}
                                role="tab"
                                aria-controls="teachers"
                                aria-selected={activeTab === 'teachers'}
                            >
                                <i className="bi bi-person-workspace me-2"></i>Teachers
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === 'schools' ? 'active' : ''}`}
                                id="schools-tab"
                                onClick={() => setActiveTab('schools')}
                                role="tab"
                                aria-controls="schools"
                                aria-selected={activeTab === 'schools'}
                            >
                                <i className="bi bi-building me-2"></i>Schools
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === 'minors' ? 'active' : ''}`}
                                id="minors-tab"
                                onClick={() => setActiveTab('minors')}
                                role="tab"
                                aria-controls="minors"
                                aria-selected={activeTab === 'minors'}
                            >
                                <i className="bi bi-people-fill me-2"></i>Minor Consents
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === 'safety' ? 'active' : ''}`}
                                id="safety-tab"
                                onClick={() => setActiveTab('safety')}
                                role="tab"
                                aria-controls="safety"
                                aria-selected={activeTab === 'safety'}
                            >
                                <i className="bi bi-shield-exclamation me-2"></i>Safety Reports
                            </button>
                        </li>
                    </ul>

                    {/* Students Tab */}
                    {activeTab === 'students' && (
                        <div className="tab-pane fade show active">
                            {/* Search */}
                            <div className="card users-search-card">
                                <div className="card-body">
                                    <form onSubmit={handleSearch}>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search by name or email..."
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            />
                                            <button className="btn btn-primary" type="submit">
                                                <i className="bi bi-search me-1"></i> Search
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Students List */}
                            <div className="card users-content-card">
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Username</th>
                                                    <th>Enrolled</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students.length > 0 ? (
                                                    students.map((student, index) => (
                                                        <tr key={student.id}>
                                                            <TableCell label="#">{(currentPage - 1) * 8 + index + 1}</TableCell>
                                                            <TableCell label="Name"><strong>{student.fullname}</strong></TableCell>
                                                            <TableCell label="Email">{student.email}</TableCell>
                                                            <TableCell label="Username">{student.username || 'N/A'}</TableCell>
                                                            <TableCell label="Enrolled">
                                                                <span className="badge bg-primary">
                                                                    {student.enrolled_courses || 0}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell label="Actions">
                                                                <button
                                                                    className="btn btn-sm btn-warning me-2"
                                                                    onClick={() => handleEditStudent(student)}
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => handleDeleteStudent(student.id)}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </TableCell>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="text-center text-muted users-empty-state">
                                                            No students found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Pagination */}
                            <nav className="mt-4" aria-label="Page navigation">
                                <ul className="pagination justify-content-center">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            Previous
                                        </button>
                                    </li>
                                    {Array.from({length: studentsTotalPages}, (_, i) => i + 1).map(page => (
                                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(page)}
                                            >
                                                {page}
                                            </button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${currentPage === studentsTotalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === studentsTotalPages}
                                        >
                                            Next
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}

                    {/* Teachers Tab */}
                    {activeTab === 'teachers' && (
                        <div className="tab-pane fade show active">
                            {/* Search + Filters */}
                            <div className="card users-search-card">
                                <div className="card-body">
                                    <div className="row g-2 align-items-end">
                                        <div className="col-md-6">
                                            <form onSubmit={handleSearch}>
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Search by name or email..."
                                                        value={searchTerm}
                                                        onChange={(e) => {
                                                            setSearchTerm(e.target.value);
                                                            setCurrentPage(1);
                                                        }}
                                                    />
                                                    <button className="btn btn-primary" type="submit">
                                                        <i className="bi bi-search me-1"></i> Search
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label mb-0 small fw-semibold">Verification Status</label>
                                            <select
                                                className="form-select form-select-sm"
                                                value={teacherVerificationFilter}
                                                onChange={(e) => {
                                                    setTeacherVerificationFilter(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="verified">Verified</option>
                                                <option value="in_review">In Review</option>
                                                <option value="unverified">Unverified</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="expired">Expired</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            {teacherVerificationFilter && (
                                                <button
                                                    className="btn btn-outline-secondary btn-sm w-100"
                                                    onClick={() => {
                                                        setTeacherVerificationFilter('');
                                                        setCurrentPage(1);
                                                    }}
                                                >
                                                    <i className="bi bi-x-circle me-1"></i>Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Teachers List */}
                            <div className="card users-content-card">
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Approval</th>
                                                    <th>Verification</th>
                                                    <th>Mobile</th>
                                                    <th>Courses</th>
                                                    <th>Students</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {teachers.length > 0 ? (
                                                    teachers.map((teacher, index) => (
                                                        <tr key={teacher.id}>
                                                            <TableCell label="#">{(currentPage - 1) * 8 + index + 1}</TableCell>
                                                            <TableCell label="Name"><strong>{teacher.full_name}</strong></TableCell>
                                                            <TableCell label="Email">{teacher.email}</TableCell>
                                                            <TableCell label="Approval">
                                                                {teacher.is_approved ? (
                                                                    <span className="badge bg-success">Approved</span>
                                                                ) : (
                                                                    <span className="badge bg-warning text-dark">Pending</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell label="Verification">
                                                                <div className="d-flex flex-column gap-1">
                                                                    <span className={`badge ${teacher.verification_status === 'verified' ? 'bg-success' : teacher.verification_status === 'rejected' ? 'bg-danger' : teacher.verification_status === 'expired' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                                                        {(teacher.verification_status || 'not_started').replace('_', ' ')}
                                                                    </span>
                                                                    <span className={`badge ${teacher.can_teach_minors ? 'bg-success' : 'bg-secondary'}`}>
                                                                        {teacher.can_teach_minors ? 'Can teach minors' : 'Minors blocked'}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell label="Mobile">{teacher.mobile_no || 'N/A'}</TableCell>
                                                            <TableCell label="Courses">
                                                                <span className="badge bg-primary">
                                                                    {teacher.total_teacher_course || 0}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell label="Students">
                                                                <span className="badge bg-success">
                                                                    {teacher.total_teacher_students || 0}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell label="Actions">
                                                                <button
                                                                    className={`btn btn-sm me-2 ${teacher.is_approved ? 'btn-secondary' : 'btn-success'}`}
                                                                    onClick={() => handleTeacherApproval(teacher, !teacher.is_approved)}
                                                                    title={teacher.is_approved ? 'Revoke approval' : 'Approve teacher'}
                                                                >
                                                                    <i className={`bi ${teacher.is_approved ? 'bi-x-circle' : 'bi-check-circle'}`}></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-primary me-2"
                                                                    onClick={() => openTeacherVerificationDetails(teacher)}
                                                                    title="View verification details"
                                                                >
                                                                    <i className="bi bi-eye"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-success me-2"
                                                                    onClick={() => reviewTeacherVerificationStep(teacher.id, 'id', 'approved')}
                                                                    title="Approve ID"
                                                                >
                                                                    <i className="bi bi-person-vcard"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-success me-2"
                                                                    onClick={() => reviewTeacherVerificationStep(teacher.id, 'background', 'approved')}
                                                                    title="Approve background"
                                                                >
                                                                    <i className="bi bi-shield-check"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-info me-2"
                                                                    onClick={() => approvePendingAgreements(teacher.id)}
                                                                    title="Approve pending agreements"
                                                                >
                                                                    <i className="bi bi-file-earmark-check"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-success me-2"
                                                                    onClick={() => activateTeacherAfterVerification(teacher.id)}
                                                                    title="Activate after verification"
                                                                >
                                                                    <i className="bi bi-check2-all"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger me-2"
                                                                    onClick={() => rejectTeacherVerification(teacher.id)}
                                                                    title="Reject verification"
                                                                >
                                                                    <i className="bi bi-x-octagon"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-warning me-2"
                                                                    onClick={() => handleEditTeacher(teacher)}
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => handleDeleteTeacher(teacher.id)}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </TableCell>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="9" className="text-center text-muted users-empty-state">
                                                            No teachers found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Pagination */}
                            <nav className="users-pagination" aria-label="Page navigation">
                                <ul className="pagination">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            Previous
                                        </button>
                                    </li>
                                    {Array.from({length: teachersTotalPages}, (_, i) => i + 1).map(page => (
                                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(page)}
                                            >
                                                {page}
                                            </button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${currentPage === teachersTotalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === teachersTotalPages}
                                        >
                                            Next
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}

                    {/* Schools Tab */}
                    {activeTab === 'schools' && (
                        <div className="tab-pane fade show active">
                            {/* Search */}
                            <div className="card users-search-card">
                                <div className="card-body">
                                    <form onSubmit={handleSearch}>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search by school name or email..."
                                                value={schoolsSearchTerm}
                                                onChange={(e) => {
                                                    setSchoolsSearchTerm(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            />
                                            <button className="btn btn-primary" type="submit">
                                                <i className="bi bi-search me-1"></i> Search
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Schools List */}
                            <div className="card users-content-card">
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>#</th>
                                                    <th>School Name</th>
                                                    <th>Email</th>
                                                    <th>Phone</th>
                                                    <th>City</th>
                                                    <th>Status</th>
                                                    <th>Subscription</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {schools.length > 0 ? (
                                                    schools.map((school, index) => (
                                                        <tr key={school.id}>
                                                            <TableCell label="#">{index + 1}</TableCell>
                                                            <TableCell label="School Name"><strong>{school.name}</strong></TableCell>
                                                            <TableCell label="Email">{school.email}</TableCell>
                                                            <TableCell label="Phone">{school.phone || 'N/A'}</TableCell>
                                                            <TableCell label="City">{school.city || 'N/A'}</TableCell>
                                                            <TableCell label="Status">
                                                                <span className={`badge ${getStatusBadge(school.status)}`}>
                                                                    {school.status.toUpperCase()}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell label="Subscription">
                                                                <span className="badge bg-info">
                                                                    {school.subscription_plan || 'N/A'}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell label="Actions">
                                                                <button
                                                                    className="btn btn-sm btn-info me-2"
                                                                    onClick={() => openMembersModal(school)}
                                                                    title="Manage Members"
                                                                >
                                                                    <i className="bi bi-people"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-secondary me-2"
                                                                    onClick={() => handleSchoolChangePassword(school)}
                                                                    title="Change Password"
                                                                >
                                                                    <i className="bi bi-key"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-warning me-2"
                                                                    onClick={() => handleEditSchool(school)}
                                                                    title="Edit"
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => handleDeleteSchool(school.id)}
                                                                    title="Delete"
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </TableCell>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="8" className="text-center text-muted py-4">
                                                            No schools found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'minors' && (
                        <div className="tab-pane fade show active">
                            <div className="card users-content-card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0">Minor Consent Status</h5>
                                        <button className="btn btn-outline-primary btn-sm" onClick={fetchMinorsStatus}>
                                            <i className="bi bi-arrow-repeat me-1"></i> Refresh
                                        </button>
                                    </div>
                                    {minorsLoading ? (
                                        <div className="text-center py-4">Loading minors consent data...</div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead className="table-dark">
                                                    <tr>
                                                        <th>Student</th>
                                                        <th>Email</th>
                                                        <th>Parent</th>
                                                        <th>Link</th>
                                                        <th>Auth Mode</th>
                                                        <th>Live Consent</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {minors.length > 0 ? minors.map((minor) => (
                                                        <tr key={minor.student_id}>
                                                            <TableCell label="Student"><strong>{minor.student_name}</strong></TableCell>
                                                            <TableCell label="Email">{minor.student_email}</TableCell>
                                                            <TableCell label="Parent">{minor.parent_name || 'Not linked'}</TableCell>
                                                            <TableCell label="Link">
                                                                <span className={`badge ${minor.parent_link_status === 'approved' ? 'bg-success' : minor.parent_link_status === 'pending' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                                                    {minor.parent_link_status}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell label="Auth Mode">{minor.authorization_mode || 'N/A'}</TableCell>
                                                            <TableCell label="Live Consent">
                                                                <span className={`badge ${minor.live_sessions_status === 'approved' ? 'bg-success' : minor.live_sessions_status === 'pending' ? 'bg-warning text-dark' : minor.live_sessions_status === 'revoked' ? 'bg-danger' : 'bg-secondary'}`}>
                                                                    {minor.live_sessions_status}
                                                                </span>
                                                            </TableCell>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan="6" className="text-center text-muted py-4">No minor records found</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'safety' && (
                        <div className="tab-pane fade show active">
                            <div className="card users-search-card mb-3">
                                <div className="card-body d-flex flex-wrap align-items-center gap-2">
                                    <label className="mb-0 fw-semibold">Status Filter:</label>
                                    <select
                                        className="form-select"
                                        style={{ maxWidth: '220px' }}
                                        value={safetyStatusFilter}
                                        onChange={(e) => setSafetyStatusFilter(e.target.value)}
                                    >
                                        <option value="">All</option>
                                        <option value="open">Open</option>
                                        <option value="in_review">In Review</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="dismissed">Dismissed</option>
                                    </select>
                                    <button className="btn btn-outline-primary btn-sm" onClick={fetchSafetyReports}>
                                        <i className="bi bi-arrow-repeat me-1"></i> Refresh
                                    </button>
                                </div>
                            </div>

                            <div className="card users-content-card">
                                <div className="card-body">
                                    {safetyLoading ? (
                                        <div className="text-center py-4">Loading safety reports...</div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead className="table-dark">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Type</th>
                                                        <th>Status</th>
                                                        <th>Reporter</th>
                                                        <th>Target</th>
                                                        <th>Description</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {safetyReports.length > 0 ? safetyReports.map((report, index) => (
                                                        <tr key={report.id}>
                                                            <TableCell label="#">{index + 1}</TableCell>
                                                            <TableCell label="Type">{report.report_type}</TableCell>
                                                            <TableCell label="Status">
                                                                <span className={`badge ${report.status === 'resolved' ? 'bg-success' : report.status === 'dismissed' ? 'bg-secondary' : report.status === 'in_review' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                                                    {report.status}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell label="Reporter">{report.reported_by_teacher || report.reported_by_student || 'Unknown'}</TableCell>
                                                            <TableCell label="Target">{report.reported_teacher || report.reported_student || 'N/A'}</TableCell>
                                                            <TableCell label="Description">
                                                                <span title={report.description}>
                                                                    {(report.description || '').length > 70
                                                                        ? `${report.description.slice(0, 70)}...`
                                                                        : (report.description || 'N/A')}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell label="Actions">
                                                                <button className="btn btn-sm btn-primary" onClick={() => updateSafetyReportStatus(report.id)}>
                                                                    <i className="bi bi-pencil-square me-1"></i> Update
                                                                </button>
                                                            </TableCell>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan="7" className="text-center text-muted py-4">No safety reports found</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

            {/* Student Modal */}
            {showStudentModal && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingStudent ? 'Edit Student' : 'Add New Student'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closeStudentModal}
                                ></button>
                            </div>
                            <form onSubmit={handleStudentSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Full Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="fullname"
                                            value={studentFormData.fullname}
                                            onChange={handleStudentChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            name="email"
                                            value={studentFormData.email}
                                            onChange={handleStudentChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Username *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="username"
                                            value={studentFormData.username}
                                            onChange={handleStudentChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Interested Categories *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="interseted_categories"
                                            value={studentFormData.interseted_categories}
                                            onChange={handleStudentChange}
                                            placeholder="e.g., Python, Web Development"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Password {!editingStudent && '*'}</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            name="password"
                                            value={studentFormData.password}
                                            onChange={handleStudentChange}
                                            placeholder={editingStudent ? "Leave blank to keep current password" : "Enter password"}
                                            required={!editingStudent}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeStudentModal}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingStudent ? 'Update' : 'Add'} Student
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Teacher Modal */}
            {showTeacherModal && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closeTeacherModal}
                                ></button>
                            </div>
                            <form onSubmit={handleTeacherSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Full Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="full_name"
                                            value={teacherFormData.full_name}
                                            onChange={handleTeacherChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            name="email"
                                            value={teacherFormData.email}
                                            onChange={handleTeacherChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Mobile Number</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            name="mobile_no"
                                            value={teacherFormData.mobile_no}
                                            onChange={handleTeacherChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Qualification *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="qualification"
                                            value={teacherFormData.qualification}
                                            onChange={handleTeacherChange}
                                            placeholder="e.g., B.Tech, M.Tech"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Skills *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="skills"
                                            value={teacherFormData.skills}
                                            onChange={handleTeacherChange}
                                            placeholder="e.g., Python, Java, Web Development"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Password {!editingTeacher && '*'}</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            name="password"
                                            value={teacherFormData.password}
                                            onChange={handleTeacherChange}
                                            placeholder={editingTeacher ? "Leave blank to keep current password" : "Enter password"}
                                            required={!editingTeacher}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeTeacherModal}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingTeacher ? 'Update' : 'Add'} Teacher
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* School Modal */}
            {showSchoolModal && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingSchool ? 'Edit School' : 'Add New School'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closeSchoolModal}
                                ></button>
                            </div>
                            <form onSubmit={handleSchoolSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">School Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="name"
                                            value={schoolFormData.name}
                                            onChange={handleSchoolChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            name="email"
                                            value={schoolFormData.email}
                                            onChange={handleSchoolChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Phone</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            name="phone"
                                            value={schoolFormData.phone}
                                            onChange={handleSchoolChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Address</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="address"
                                            value={schoolFormData.address}
                                            onChange={handleSchoolChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">City</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="city"
                                            value={schoolFormData.city}
                                            onChange={handleSchoolChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">State</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="state"
                                            value={schoolFormData.state}
                                            onChange={handleSchoolChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Website</label>
                                        <input
                                            type="url"
                                            className="form-control"
                                            name="website"
                                            value={schoolFormData.website}
                                            onChange={handleSchoolChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Status *</label>
                                        <select
                                            className="form-control"
                                            name="status"
                                            value={schoolFormData.status}
                                            onChange={handleSchoolChange}
                                            required
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="trial">Trial</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Max Teachers</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="max_teachers"
                                                value={schoolFormData.max_teachers}
                                                onChange={handleSchoolChange}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Max Students</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="max_students"
                                                value={schoolFormData.max_students}
                                                onChange={handleSchoolChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Max Courses</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="max_courses"
                                            value={schoolFormData.max_courses}
                                            onChange={handleSchoolChange}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeSchoolModal}
                                    >
                                        Close
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingSchool ? 'Update' : 'Add'} School
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Members Modal */}
            {showMembersModal && membersSchool && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0, 0, 0, 0.6)'}}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content" style={{borderRadius: '12px', overflow: 'hidden', border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'}}>
                            {/* Header */}
                            <div className="modal-header py-3 px-4" style={{background: '#1e293b', borderBottom: 'none'}}>
                                <div className="d-flex align-items-center">
                                    <div style={{
                                        width: '38px', height: '38px', borderRadius: '10px',
                                        background: 'rgba(99, 102, 241, 0.2)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', marginRight: '12px'
                                    }}>
                                        <i className="bi bi-building" style={{color: '#818cf8', fontSize: '18px'}}></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-0" style={{color: '#fff', fontWeight: 600, fontSize: '16px'}}>Manage Members</h6>
                                        <small style={{color: '#94a3b8', fontSize: '12px'}}>{membersSchool.name}</small>
                                    </div>
                                </div>
                                <button type="button" className="btn-close btn-close-white" onClick={closeMembersModal} style={{opacity: 0.6}}></button>
                            </div>

                            {/* Body */}
                            <div className="modal-body p-4" style={{background: '#f8fafc', maxHeight: '65vh', overflowY: 'auto'}}>
                                {membersMsg && (
                                    <div className="alert alert-info py-2 px-3 d-flex align-items-center" style={{borderRadius: '8px', fontSize: '13px', border: 'none', background: '#e0f2fe', color: '#0369a1'}}>
                                        <i className="bi bi-info-circle me-2"></i>{membersMsg}
                                    </div>
                                )}
                                {membersLoading ? (
                                    <div className="text-center py-5">
                                        <LoadingSpinner size="sm" text="Loading members..." />
                                    </div>
                                ) : (
                                    <div className="row g-4">
                                        {/* Teachers Section */}
                                        <div className="col-md-6">
                                            <div style={{background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden'}}>
                                                <div className="px-3 py-2 d-flex align-items-center justify-content-between" style={{background: '#f1f5f9', borderBottom: '1px solid #e2e8f0'}}>
                                                    <div className="d-flex align-items-center">
                                                        <i className="bi bi-person-workspace me-2" style={{color: '#6366f1'}}></i>
                                                        <span style={{fontWeight: 600, fontSize: '14px', color: '#334155'}}>Teachers</span>
                                                    </div>
                                                    <span className="badge" style={{background: '#6366f1', fontSize: '11px', padding: '4px 10px', borderRadius: '20px'}}>{schoolTeachers.length}</span>
                                                </div>
                                                <div className="p-3">
                                                    <div className="d-flex gap-2 mb-3">
                                                        <select
                                                            className="form-select form-select-sm"
                                                            value={selectedTeacherId}
                                                            onChange={(e) => setSelectedTeacherId(e.target.value)}
                                                            style={{borderRadius: '8px', fontSize: '13px', border: '1px solid #cbd5e1'}}
                                                        >
                                                            <option value="">Select teacher...</option>
                                                            {availableTeachers.map(t => (
                                                                <option key={t.id} value={t.id}>
                                                                    {t.full_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            className="btn btn-sm px-3"
                                                            onClick={addTeacherToSchool}
                                                            disabled={!selectedTeacherId}
                                                            style={{borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', whiteSpace: 'nowrap', fontSize: '13px'}}
                                                        >
                                                            <i className="bi bi-plus-lg me-1"></i>Add
                                                        </button>
                                                    </div>
                                                    {availableTeachers.length === 0 && allTeachers.length > 0 && (
                                                        <div className="text-center py-1 mb-2">
                                                            <small style={{color: '#94a3b8', fontSize: '12px'}}>All teachers assigned</small>
                                                        </div>
                                                    )}
                                                    <div style={{maxHeight: '240px', overflowY: 'auto'}}>
                                                        {schoolTeachers.length > 0 ? (
                                                            schoolTeachers.map(st => (
                                                                <div key={st.id} className="d-flex align-items-center justify-content-between p-2 mb-2" style={{background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9'}}>
                                                                    <div className="d-flex align-items-center">
                                                                        <div style={{
                                                                            width: '32px', height: '32px', borderRadius: '50%',
                                                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            marginRight: '10px', flexShrink: 0
                                                                        }}>
                                                                            <span style={{color: '#fff', fontSize: '12px', fontWeight: 600}}>
                                                                                {(st.teacher?.full_name || 'T').charAt(0).toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <div style={{fontSize: '13px', fontWeight: 500, color: '#1e293b', lineHeight: 1.3}}>
                                                                                {st.teacher?.full_name || 'Teacher'}
                                                                            </div>
                                                                            <div style={{fontSize: '11px', color: '#94a3b8'}}>{st.teacher?.email}</div>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        className="btn btn-sm p-0 d-flex align-items-center justify-content-center"
                                                                        onClick={() => removeTeacherFromSchool(st.id)}
                                                                        title="Remove teacher"
                                                                        style={{width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', flexShrink: 0}}
                                                                    >
                                                                        <i className="bi bi-x" style={{fontSize: '16px'}}></i>
                                                                    </button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-center py-4">
                                                                <i className="bi bi-person-plus" style={{fontSize: '24px', color: '#cbd5e1'}}></i>
                                                                <p className="mb-0 mt-1" style={{fontSize: '13px', color: '#94a3b8'}}>No teachers assigned</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Students Section */}
                                        <div className="col-md-6">
                                            <div style={{background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden'}}>
                                                <div className="px-3 py-2 d-flex align-items-center justify-content-between" style={{background: '#f1f5f9', borderBottom: '1px solid #e2e8f0'}}>
                                                    <div className="d-flex align-items-center">
                                                        <i className="bi bi-mortarboard me-2" style={{color: '#10b981'}}></i>
                                                        <span style={{fontWeight: 600, fontSize: '14px', color: '#334155'}}>Students</span>
                                                    </div>
                                                    <span className="badge" style={{background: '#10b981', fontSize: '11px', padding: '4px 10px', borderRadius: '20px'}}>{schoolStudents.length}</span>
                                                </div>
                                                <div className="p-3">
                                                    <div className="d-flex gap-2 mb-3">
                                                        <select
                                                            className="form-select form-select-sm"
                                                            value={selectedStudentId}
                                                            onChange={(e) => setSelectedStudentId(e.target.value)}
                                                            style={{borderRadius: '8px', fontSize: '13px', border: '1px solid #cbd5e1'}}
                                                        >
                                                            <option value="">Select student...</option>
                                                            {availableStudents.map(s => (
                                                                <option key={s.id} value={s.id}>
                                                                    {s.fullname}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            className="btn btn-sm px-3"
                                                            onClick={addStudentToSchool}
                                                            disabled={!selectedStudentId}
                                                            style={{borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', whiteSpace: 'nowrap', fontSize: '13px'}}
                                                        >
                                                            <i className="bi bi-plus-lg me-1"></i>Add
                                                        </button>
                                                    </div>
                                                    {availableStudents.length === 0 && allStudents.length > 0 && (
                                                        <div className="text-center py-1 mb-2">
                                                            <small style={{color: '#94a3b8', fontSize: '12px'}}>All students assigned</small>
                                                        </div>
                                                    )}
                                                    <div style={{maxHeight: '240px', overflowY: 'auto'}}>
                                                        {schoolStudents.length > 0 ? (
                                                            schoolStudents.map(ss => (
                                                                <div key={ss.id} className="d-flex align-items-center justify-content-between p-2 mb-2" style={{background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9'}}>
                                                                    <div className="d-flex align-items-center">
                                                                        <div style={{
                                                                            width: '32px', height: '32px', borderRadius: '50%',
                                                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            marginRight: '10px', flexShrink: 0
                                                                        }}>
                                                                            <span style={{color: '#fff', fontSize: '12px', fontWeight: 600}}>
                                                                                {(ss.student?.fullname || 'S').charAt(0).toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <div style={{fontSize: '13px', fontWeight: 500, color: '#1e293b', lineHeight: 1.3}}>
                                                                                {ss.student?.fullname || 'Student'}
                                                                            </div>
                                                                            <div style={{fontSize: '11px', color: '#94a3b8'}}>{ss.student?.email}</div>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        className="btn btn-sm p-0 d-flex align-items-center justify-content-center"
                                                                        onClick={() => removeStudentFromSchool(ss.id)}
                                                                        title="Remove student"
                                                                        style={{width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', flexShrink: 0}}
                                                                    >
                                                                        <i className="bi bi-x" style={{fontSize: '16px'}}></i>
                                                                    </button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-center py-4">
                                                                <i className="bi bi-person-plus" style={{fontSize: '24px', color: '#cbd5e1'}}></i>
                                                                <p className="mb-0 mt-1" style={{fontSize: '13px', color: '#94a3b8'}}>No students assigned</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="modal-footer py-2 px-4" style={{background: '#fff', borderTop: '1px solid #e2e8f0'}}>
                                <button
                                    type="button"
                                    className="btn btn-sm px-4"
                                    onClick={closeMembersModal}
                                    style={{borderRadius: '8px', background: '#1e293b', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500}}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ VERIFICATION DETAIL MODAL ============ */}
            {showVerificationModal && (
                <div className="modal d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060}}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable verification-review-dialog">
                        <div className="modal-content verification-review-modal">
                            {/* Header */}
                            <div className="modal-header" style={{background: 'linear-gradient(135deg, #1e293b, #334155)', color: '#fff', borderBottom: 'none', padding: '16px 20px'}}>
                                <div className="d-flex align-items-center gap-2">
                                    <i className="bi bi-shield-lock" style={{fontSize: '20px'}}></i>
                                    <div>
                                        <h5 className="modal-title mb-0" style={{fontSize: '16px', fontWeight: 600}}>
                                            Verification Review
                                        </h5>
                                        <small style={{opacity: 0.7, fontSize: '12px'}}>
                                            {verificationTeacher?.full_name || 'Teacher'}
                                        </small>
                                    </div>
                                </div>
                                <button type="button" className="btn-close btn-close-white" onClick={closeVerificationModal}></button>
                            </div>

                            {/* Body */}
                            <div className="modal-body" style={{padding: '16px 20px', background: '#f8fafc'}}>
                                {verificationLoading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                                        <p className="mt-2 text-muted small">Loading verification data...</p>
                                    </div>
                                ) : !verificationDetail ? (
                                    <div className="text-center py-5">
                                        <i className="bi bi-exclamation-circle" style={{fontSize: '40px', color: '#cbd5e1'}}></i>
                                        <p className="mt-2 text-muted">No verification data found</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* === Overall Status Bar === */}
                                        <div className="vr-status-bar mb-3">
                                            <div className="row g-2">
                                                <div className="col-6 col-md-3">
                                                    <div className="vr-status-card text-center p-2">
                                                        <small className="text-muted d-block" style={{fontSize: '11px'}}>Overall</small>
                                                        <span className={`badge ${getStatusBadgeClass(verificationDetail.overall_status)} mt-1`}>
                                                            {verificationDetail.overall_status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="col-6 col-md-3">
                                                    <div className="vr-status-card text-center p-2">
                                                        <small className="text-muted d-block" style={{fontSize: '11px'}}>Teach Minors</small>
                                                        <span className={`badge ${verificationDetail.can_teach_minors ? 'bg-success' : 'bg-danger'} mt-1`}>
                                                            {verificationDetail.can_teach_minors ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="col-6 col-md-3">
                                                    <div className="vr-status-card text-center p-2">
                                                        <small className="text-muted d-block" style={{fontSize: '11px'}}>Approved</small>
                                                        <span className={`badge ${verificationDetail.teacher_is_approved ? 'bg-success' : 'bg-warning text-dark'} mt-1`}>
                                                            {verificationDetail.teacher_is_approved ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="col-6 col-md-3">
                                                    <div className="vr-status-card text-center p-2">
                                                        <small className="text-muted d-block" style={{fontSize: '11px'}}>Status</small>
                                                        <span className={`badge ${getStatusBadgeClass(verificationDetail.teacher_verification_status)} mt-1`}>
                                                            {(verificationDetail.teacher_verification_status || 'unverified').replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* === ID VERIFICATION === */}
                                        <div className="vr-section mb-3">
                                            <div className="vr-section-header d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="bi bi-person-vcard" style={{fontSize: '16px', color: '#3b82f6'}}></i>
                                                    <strong style={{fontSize: '14px'}}>ID Verification</strong>
                                                </div>
                                                <span className={`badge ${getStatusBadgeClass(verificationDetail.id_verification?.status)}`}>
                                                    {verificationDetail.id_verification?.status || 'pending'}
                                                </span>
                                            </div>
                                            <div className="vr-section-body">
                                                {verificationDetail.id_verification?.document_type && (
                                                    <div className="mb-2">
                                                        <small className="text-muted">Document Type:</small>
                                                        <span className="ms-2 fw-medium" style={{fontSize: '13px'}}>
                                                            {(verificationDetail.id_verification.document_type || '').replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Document Preview / Download */}
                                                {verificationDetail.id_verification?.id_document ? (
                                                    <div className="vr-document-box">
                                                        <div className="d-flex align-items-center gap-2 mb-2">
                                                            <i className="bi bi-file-earmark-text" style={{color: '#3b82f6'}}></i>
                                                            <small className="text-muted">Uploaded Document:</small>
                                                        </div>
                                                        {isImageFile(verificationDetail.id_verification.id_document) ? (
                                                            <div className="vr-img-preview mb-2">
                                                                <img
                                                                    src={getDocumentUrl(verificationDetail.id_verification.id_document)}
                                                                    alt="ID Document"
                                                                    className="vr-preview-img"
                                                                    onClick={() => window.open(getDocumentUrl(verificationDetail.id_verification.id_document), '_blank')}
                                                                />
                                                            </div>
                                                        ) : null}
                                                        <a
                                                            href={getDocumentUrl(verificationDetail.id_verification.id_document)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            <i className="bi bi-download me-1"></i> View / Download Document
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <div className="vr-empty-state">
                                                        <i className="bi bi-cloud-upload" style={{fontSize: '24px', color: '#cbd5e1'}}></i>
                                                        <p className="mb-0 small text-muted">No document uploaded yet</p>
                                                    </div>
                                                )}

                                                {verificationDetail.id_verification?.submitted_at && (
                                                    <small className="text-muted d-block mt-2">
                                                        <i className="bi bi-clock me-1"></i>
                                                        Submitted: {new Date(verificationDetail.id_verification.submitted_at).toLocaleString()}
                                                    </small>
                                                )}
                                                {verificationDetail.id_verification?.review_notes && (
                                                    <div className="alert alert-light mt-2 mb-0 py-1 px-2" style={{fontSize: '12px'}}>
                                                        <i className="bi bi-chat-left-text me-1"></i>
                                                        <strong>Review Notes:</strong> {verificationDetail.id_verification.review_notes}
                                                    </div>
                                                )}

                                                {/* Approve / Reject Actions */}
                                                {verificationDetail.id_verification?.status !== 'approved' && (
                                                    <div className="mt-2 d-flex gap-2">
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleVerificationAction(verificationDetail.teacher_id, 'approve-id', { decision: 'approved' })}
                                                        >
                                                            <i className="bi bi-check-circle me-1"></i> Approve ID
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* === BACKGROUND CHECK === */}
                                        <div className="vr-section mb-3">
                                            <div className="vr-section-header d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="bi bi-shield-check" style={{fontSize: '16px', color: '#10b981'}}></i>
                                                    <strong style={{fontSize: '14px'}}>Background Check</strong>
                                                </div>
                                                <span className={`badge ${getStatusBadgeClass(verificationDetail.background_check?.status)}`}>
                                                    {verificationDetail.background_check?.status || 'pending'}
                                                </span>
                                            </div>
                                            <div className="vr-section-body">
                                                {/* Metadata */}
                                                <div className="row g-2 mb-2">
                                                    {verificationDetail.background_check?.provider_name && (
                                                        <div className="col-12 col-sm-6">
                                                            <div className="vr-meta-item">
                                                                <small className="text-muted d-block" style={{fontSize: '11px'}}>Provider</small>
                                                                <span style={{fontSize: '13px', fontWeight: 500}}>{verificationDetail.background_check.provider_name}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {verificationDetail.background_check?.reference_number && (
                                                        <div className="col-12 col-sm-6">
                                                            <div className="vr-meta-item">
                                                                <small className="text-muted d-block" style={{fontSize: '11px'}}>Reference #</small>
                                                                <span style={{fontSize: '13px', fontWeight: 500, fontFamily: 'monospace'}}>{verificationDetail.background_check.reference_number}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {verificationDetail.background_check?.confirmation_email && (
                                                        <div className="col-12 col-sm-6">
                                                            <div className="vr-meta-item">
                                                                <small className="text-muted d-block" style={{fontSize: '11px'}}>Confirmation Email</small>
                                                                <a href={`mailto:${verificationDetail.background_check.confirmation_email}`} style={{fontSize: '13px'}}>
                                                                    {verificationDetail.background_check.confirmation_email}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="col-12 col-sm-6">
                                                        <div className="vr-meta-item">
                                                            <small className="text-muted d-block" style={{fontSize: '11px'}}>Expiry</small>
                                                            {verificationDetail.background_check?.expires_at ? (
                                                                verificationDetail.background_check.is_expired ? (
                                                                    <span style={{fontSize: '13px', fontWeight: 600, color: '#ef4444'}}>
                                                                        EXPIRED ({new Date(verificationDetail.background_check.expires_at).toLocaleDateString()})
                                                                    </span>
                                                                ) : verificationDetail.background_check.days_until_expiry !== null && verificationDetail.background_check.days_until_expiry <= 30 ? (
                                                                    <span style={{fontSize: '13px', fontWeight: 600, color: '#f59e0b'}}>
                                                                        {verificationDetail.background_check.days_until_expiry} days left ({new Date(verificationDetail.background_check.expires_at).toLocaleDateString()})
                                                                    </span>
                                                                ) : (
                                                                    <span style={{fontSize: '13px', fontWeight: 500, color: '#10b981'}}>
                                                                        {new Date(verificationDetail.background_check.expires_at).toLocaleDateString()} ({verificationDetail.background_check.days_until_expiry} days)
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span style={{fontSize: '13px', color: '#94a3b8'}}>No expiry set</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Evidence File */}
                                                {verificationDetail.background_check?.evidence_file ? (
                                                    <div className="vr-document-box">
                                                        <div className="d-flex align-items-center gap-2 mb-2">
                                                            <i className="bi bi-file-earmark-check" style={{color: '#10b981'}}></i>
                                                            <small className="text-muted">Evidence Document:</small>
                                                        </div>
                                                        {isImageFile(verificationDetail.background_check.evidence_file) ? (
                                                            <div className="vr-img-preview mb-2">
                                                                <img
                                                                    src={getDocumentUrl(verificationDetail.background_check.evidence_file)}
                                                                    alt="Background Check Evidence"
                                                                    className="vr-preview-img"
                                                                    onClick={() => window.open(getDocumentUrl(verificationDetail.background_check.evidence_file), '_blank')}
                                                                />
                                                            </div>
                                                        ) : null}
                                                        <a
                                                            href={getDocumentUrl(verificationDetail.background_check.evidence_file)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-outline-success"
                                                        >
                                                            <i className="bi bi-download me-1"></i> View / Download Evidence
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <div className="vr-empty-state">
                                                        <i className="bi bi-cloud-upload" style={{fontSize: '24px', color: '#cbd5e1'}}></i>
                                                        <p className="mb-0 small text-muted">No evidence file uploaded yet</p>
                                                    </div>
                                                )}

                                                {verificationDetail.background_check?.submitted_at && (
                                                    <small className="text-muted d-block mt-2">
                                                        <i className="bi bi-clock me-1"></i>
                                                        Submitted: {new Date(verificationDetail.background_check.submitted_at).toLocaleString()}
                                                    </small>
                                                )}
                                                {verificationDetail.background_check?.review_notes && (
                                                    <div className="alert alert-light mt-2 mb-0 py-1 px-2" style={{fontSize: '12px'}}>
                                                        <i className="bi bi-chat-left-text me-1"></i>
                                                        <strong>Review Notes:</strong> {verificationDetail.background_check.review_notes}
                                                    </div>
                                                )}

                                                {/* Approve / Reject Actions */}
                                                {verificationDetail.background_check?.status !== 'approved' && (
                                                    <div className="mt-2 d-flex gap-2">
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleVerificationAction(verificationDetail.teacher_id, 'approve-bg', { decision: 'approved' })}
                                                        >
                                                            <i className="bi bi-check-circle me-1"></i> Approve Background
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* === AGREEMENTS === */}
                                        <div className="vr-section mb-3">
                                            <div className="vr-section-header d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="bi bi-file-earmark-check" style={{fontSize: '16px', color: '#8b5cf6'}}></i>
                                                    <strong style={{fontSize: '14px'}}>Agreement Signatures</strong>
                                                </div>
                                                <span className={`badge ${getStatusBadgeClass(verificationDetail.agreement_status)}`}>
                                                    {verificationDetail.agreement_status}
                                                </span>
                                            </div>
                                            <div className="vr-section-body">
                                                {verificationDetail.agreement_signatures?.length > 0 ? (
                                                    <div className="vr-agreements-list">
                                                        {verificationDetail.agreement_signatures.map((sig) => (
                                                            <div key={sig.id} className="vr-agreement-item">
                                                                <div className="d-flex justify-content-between align-items-start">
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <i className={`bi ${sig.status === 'approved' ? 'bi-check-circle-fill text-success' : sig.status === 'rejected' ? 'bi-x-circle-fill text-danger' : 'bi-hourglass-split text-warning'}`}></i>
                                                                        <strong style={{fontSize: '13px', textTransform: 'capitalize'}}>
                                                                            {(sig.agreement_type || '').replace(/_/g, ' ')}
                                                                        </strong>
                                                                    </div>
                                                                    <span className={`badge ${getStatusBadgeClass(sig.status)}`} style={{fontSize: '10px'}}>
                                                                        {sig.status}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-1 ps-4" style={{fontSize: '12px', color: '#64748b'}}>
                                                                    {sig.signed_at && (
                                                                        <div><i className="bi bi-calendar-check me-1"></i>Signed: {new Date(sig.signed_at).toLocaleString()}</div>
                                                                    )}
                                                                    {sig.reviewed_at && (
                                                                        <div><i className="bi bi-calendar2-check me-1"></i>Reviewed: {new Date(sig.reviewed_at).toLocaleString()}</div>
                                                                    )}
                                                                    {sig.ip_address && (
                                                                        <div><i className="bi bi-globe me-1"></i>IP: {sig.ip_address}</div>
                                                                    )}
                                                                    {sig.signature_text && (
                                                                        <div><i className="bi bi-pen me-1"></i>Signature: <em>"{sig.signature_text}"</em></div>
                                                                    )}
                                                                    {sig.policy_version && (
                                                                        <div><i className="bi bi-tag me-1"></i>Policy v{sig.policy_version}</div>
                                                                    )}
                                                                    {sig.review_notes && (
                                                                        <div className="mt-1 p-1 rounded" style={{background: '#f1f5f9'}}>
                                                                            <i className="bi bi-chat-left-text me-1"></i><strong>Notes:</strong> {sig.review_notes}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="vr-empty-state">
                                                        <i className="bi bi-pen" style={{fontSize: '24px', color: '#cbd5e1'}}></i>
                                                        <p className="mb-0 small text-muted">No signatures submitted yet</p>
                                                    </div>
                                                )}

                                                {/* Bulk approve pending agreements */}
                                                {verificationDetail.agreement_signatures?.some(s => s.status === 'in_review' || s.status === 'pending') && (
                                                    <div className="mt-2">
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleApproveAgreementsFromModal(verificationDetail.teacher_id)}
                                                        >
                                                            <i className="bi bi-check2-all me-1"></i> Approve All Pending Agreements
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* === FINAL ACTIVATION === */}
                                        {verificationDetail.overall_status !== 'approved' && (
                                            <div className="vr-section mb-2">
                                                <div className="vr-section-body text-center py-3">
                                                    <p className="mb-2 small text-muted">
                                                        Once all steps above are approved, click below to finalize.
                                                    </p>
                                                    <button
                                                        className="btn btn-success"
                                                        onClick={() => handleVerificationAction(verificationDetail.teacher_id, 'activate')}
                                                        disabled={
                                                            verificationDetail.id_verification?.status !== 'approved' ||
                                                            verificationDetail.background_check?.status !== 'approved' ||
                                                            verificationDetail.agreement_status !== 'approved'
                                                        }
                                                    >
                                                        <i className="bi bi-check2-all me-1"></i> Activate Teacher for Minors
                                                    </button>
                                                    {(verificationDetail.id_verification?.status !== 'approved' ||
                                                      verificationDetail.background_check?.status !== 'approved' ||
                                                      verificationDetail.agreement_status !== 'approved') && (
                                                        <div className="mt-2">
                                                            <small className="text-danger">
                                                                <i className="bi bi-exclamation-triangle me-1"></i>
                                                                All 3 steps (ID, Background, Agreements) must be approved first
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Rejection reason if any */}
                                        {verificationDetail.rejection_reason && (
                                            <div className="alert alert-danger mt-2 py-2 px-3" style={{fontSize: '13px'}}>
                                                <i className="bi bi-exclamation-triangle me-1"></i>
                                                <strong>Rejection Reason:</strong> {verificationDetail.rejection_reason}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="modal-footer py-2 px-4" style={{background: '#fff', borderTop: '1px solid #e2e8f0'}}>
                                <button type="button" className="btn btn-sm btn-outline-danger me-auto"
                                    onClick={() => { closeVerificationModal(); rejectTeacherVerification(verificationTeacher?.id); }}
                                >
                                    <i className="bi bi-x-octagon me-1"></i> Reject
                                </button>
                                <button type="button" className="btn btn-sm px-4"
                                    onClick={closeVerificationModal}
                                    style={{borderRadius: '8px', background: '#1e293b', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500}}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UsersManagement;