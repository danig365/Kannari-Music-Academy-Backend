import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import LoadingSpinner from '../LoadingSpinner';
import './AdminLessonManagement.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

/**
 * AdminLessonManagement - Reusable Course Management Component
 * 
 * @param {Object} props
 * @param {string} props.userType - 'admin' or 'teacher'
 * @param {number} props.teacherId - Required when userType is 'teacher'
 * @param {string} props.basePath - Base route path (e.g., '/admin/lesson-management' or '/teacher-course-management')
 * @param {string} props.pageTitle - Page title to display
 * @param {boolean} props.showTeacherSelect - Whether to show teacher selection dropdown
 * @param {boolean} props.showAnalytics - Whether to show analytics button
 */
const AdminLessonManagement = ({
    userType = 'admin',
    teacherId = null,
    basePath = '/admin/lesson-management',
    pageTitle = 'Course Management',
    showTeacherSelect = true,
    showAnalytics = true
}) => {
    const navigate = useNavigate();
    const { course_id } = useParams();
    
    // Get teacherId from props or localStorage for teacher context
    const effectiveTeacherId = teacherId || (userType === 'teacher' ? localStorage.getItem('teacherId') : null);
    
    // State
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseData, setCourseData] = useState(null);
    const [expandedModules, setExpandedModules] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    
    // Course Modal States
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [savingCourse, setSavingCourse] = useState(false);
    const [courseFormData, setCourseFormData] = useState({
        title: '',
        description: '',
        category: '',
        teacher: '',
        techs: '',
        featured_img: null,
        required_access_level: 'free'
    });
    const [imagePreview, setImagePreview] = useState(null);
    
    // Inline category creation
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);
    
    // Module Modal States
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [moduleFormData, setModuleFormData] = useState({
        title: '',
        description: '',
        order: 0
    });
    
    // Lesson Modal States
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [currentModuleId, setCurrentModuleId] = useState(null);
    const [duplicateContext, setDuplicateContext] = useState(null);
    const [lessonFormData, setLessonFormData] = useState({
        title: '',
        description: '',
        content_type: 'video',
        file: null,
        duration_seconds: 0,
        objectives: '',
        is_preview: false,
        is_locked: false,
        is_premium: false,
        required_access_level: 'free'
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    
    // Downloadables Modal States
    const [showDownloadablesModal, setShowDownloadablesModal] = useState(false);
    const [currentLessonForDownloads, setCurrentLessonForDownloads] = useState(null);
    const [downloadables, setDownloadables] = useState([]);
    const [loadingDownloadables, setLoadingDownloadables] = useState(false);
    const [showAddDownloadableForm, setShowAddDownloadableForm] = useState(false);
    const [downloadableFormData, setDownloadableFormData] = useState({
        title: '',
        file_type: 'pdf',
        file: null,
        description: '',
        order: 0
    });
    const [savingDownloadable, setSavingDownloadable] = useState(false);
    const downloadableFileRef = useRef(null);
    
    // Upload UI States
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [multipleFiles, setMultipleFiles] = useState([]);
    const [uploadingMultiple, setUploadingMultiple] = useState(false);
    const [multiUploadProgress, setMultiUploadProgress] = useState({});
    const multiFileInputRef = useRef(null);
    
    // Lesson Templates
    const lessonTemplates = [
        {
            id: 'video_lesson',
            name: 'Video Lesson',
            icon: 'bi-play-circle-fill',
            color: '#3b82f6',
            description: 'Standard video lesson with objectives',
            defaults: {
                content_type: 'video',
                objectives: '• Watch the full video\n• Take notes on key concepts\n• Practice the techniques shown',
                is_preview: false,
                is_locked: false
            }
        },
        {
            id: 'practice_session',
            name: 'Practice Session',
            icon: 'bi-music-note-beamed',
            color: '#8b5cf6',
            description: 'Audio practice with play-along tracks',
            defaults: {
                content_type: 'audio',
                objectives: '• Listen to the demonstration\n• Practice at slow tempo\n• Gradually increase speed\n• Record yourself for review',
                is_preview: false,
                is_locked: false
            }
        },
        {
            id: 'theory_reading',
            name: 'Theory & Reading',
            icon: 'bi-file-pdf-fill',
            color: '#ef4444',
            description: 'PDF document with theory content',
            defaults: {
                content_type: 'pdf',
                objectives: '• Read through the material\n• Highlight key concepts\n• Complete any exercises\n• Review terminology',
                is_preview: false,
                is_locked: false
            }
        },
        {
            id: 'free_preview',
            name: 'Free Preview',
            icon: 'bi-eye-fill',
            color: '#f59e0b',
            description: 'Unlocked preview lesson for non-enrolled users',
            defaults: {
                content_type: 'video',
                objectives: '• Get a taste of the course content\n• See the teaching style\n• Decide if this course is right for you',
                is_preview: true,
                is_locked: false
            }
        },
        {
            id: 'blank',
            name: 'Blank Lesson',
            icon: 'bi-file-earmark-plus',
            color: '#6b7280',
            description: 'Start from scratch',
            defaults: {
                content_type: 'video',
                objectives: '',
                is_preview: false,
                is_locked: false
            }
        }
    ];
    
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    useEffect(() => {
        document.title = `${pageTitle} | ${userType === 'admin' ? 'Admin' : 'Teacher'} Dashboard`;
        fetchCourses();
        fetchCategories();
        if (showTeacherSelect) {
            fetchTeachers();
        }
    }, [userType, pageTitle, showTeacherSelect]);

    useEffect(() => {
        if (course_id) {
            setSelectedCourse(parseInt(course_id));
            fetchCourseStructure(course_id);
        }
    }, [course_id]);

    const fetchCourses = async () => {
        try {
            let url;
            if (userType === 'teacher' && effectiveTeacherId) {
                // For teachers, fetch only their courses
                url = `${baseUrl}/teacher-course/${effectiveTeacherId}`;
            } else {
                // For admin, fetch all courses
                url = `${baseUrl}/course/`;
            }
            const response = await axios.get(url);
            setCourses(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${baseUrl}/category/`);
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await axios.get(`${baseUrl}/admin/teachers/`);
            setTeachers(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    };

    const fetchCourseStructure = async (courseId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${baseUrl}/admin/course/${courseId}/modules/`);
            setCourseData(response.data);
            const expanded = {};
            response.data.modules?.forEach(m => expanded[m.id] = true);
            setExpandedModules(expanded);
        } catch (error) {
            console.error('Error fetching course structure:', error);
            try {
                const chaptersResponse = await axios.get(`${baseUrl}/course-chapters/${courseId}`);
                const courseResponse = await axios.get(`${baseUrl}/course/${courseId}/`);
                setCourseData({
                    course_id: courseId,
                    course_title: courseResponse.data.title,
                    total_modules: chaptersResponse.data.length,
                    modules: chaptersResponse.data.map(ch => ({
                        id: ch.id,
                        title: ch.title,
                        description: ch.description,
                        order: ch.order || 0,
                        total_lessons: ch.module_lessons?.length || 0,
                        lessons: ch.module_lessons || []
                    }))
                });
            } catch (err) {
                console.error('Fallback also failed:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCourseSelect = (courseId) => {
        setSelectedCourse(courseId);
        navigate(`${basePath}/${courseId}`);
        fetchCourseStructure(courseId);
    };

    const toggleModuleExpand = (moduleId) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    // Filter courses
    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || course.category?.id === parseInt(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    // ============ COURSE CRUD ============
    const openAddCourseModal = () => {
        setEditingCourse(null);
        setCourseFormData({
            title: '',
            description: '',
            category: '',
            teacher: '',
            techs: '',
            featured_img: null,
            required_access_level: 'free'
        });
        setImagePreview(null);
        setShowCourseModal(true);
    };

    const openEditCourseModal = (course) => {
        setEditingCourse(course);
        setCourseFormData({
            title: course.title || '',
            description: course.description || '',
            category: course.category?.title || '',  // Use category name instead of ID
            teacher: course.teacher?.id || '',
            techs: course.techs || '',
            featured_img: null,
            required_access_level: course.required_access_level || 'free'
        });
        setImagePreview(course.featured_img);
        setShowCourseModal(true);
    };

    const closeCourseModal = () => {
        setShowCourseModal(false);
        setEditingCourse(null);
        setCourseFormData({
            title: '',
            description: '',
            category: '',
            teacher: '',
            techs: '',
            featured_img: null,
            required_access_level: 'free'
        });
        setImagePreview(null);
        setShowNewCategoryInput(false);
        setNewCategoryName('');
    };

    const handleCourseInputChange = (e) => {
        const { name, value } = e.target;
        setCourseFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setSavingCategory(true);
        try {
            const response = await axios.post(`${baseUrl}/category/`, {
                title: newCategoryName.trim(),
                description: ''
            });
            await fetchCategories();
            setCourseFormData(prev => ({ ...prev, category: response.data.id }));
            setNewCategoryName('');
            setShowNewCategoryInput(false);
        } catch (error) {
            console.error('Error creating category:', error);
            Swal.fire('Error', 'Error creating category. It may already exist.', 'error');
        } finally {
            setSavingCategory(false);
        }
    };

    const handleCourseFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCourseFormData(prev => ({ ...prev, featured_img: file }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleCourseSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!courseFormData.title.trim()) {
            Swal.fire('Error', 'Course title is required', 'error');
            return;
        }
        if (!courseFormData.category.trim()) {
            Swal.fire('Error', 'Category name is required', 'error');
            return;
        }
        // Only require teacher selection for admin context
        if (showTeacherSelect && !courseFormData.teacher) {
            Swal.fire('Error', 'Please select an instructor', 'error');
            return;
        }
        if (!courseFormData.description.trim()) {
            Swal.fire('Error', 'Course description is required', 'error');
            return;
        }
        if (!courseFormData.techs.trim()) {
            Swal.fire('Error', 'Technologies/Topics are required', 'error');
            return;
        }
        
        setSavingCourse(true);
        try {
            const submitData = new FormData();
            submitData.append('title', courseFormData.title);
            submitData.append('description', courseFormData.description);
            submitData.append('category_name', courseFormData.category.trim());
            // For teacher context, auto-assign the teacher ID
            const teacherIdToUse = userType === 'teacher' ? effectiveTeacherId : courseFormData.teacher;
            submitData.append('teacher', teacherIdToUse);
            submitData.append('techs', courseFormData.techs);
            submitData.append('required_access_level', courseFormData.required_access_level || 'free');
            if (courseFormData.featured_img) {
                submitData.append('featured_img', courseFormData.featured_img);
            }

            // Log the data being sent
            console.log('=== COURSE FORM SUBMISSION ===');
            console.log('User Type:', userType);
            console.log('Form Data:', courseFormData);
            console.log('FormData entries:');
            for (let [key, value] of submitData.entries()) {
                console.log(`  ${key}: ${value}`);
            }

            if (editingCourse) {
                await axios.patch(`${baseUrl}/admin/course/${editingCourse.id}/`, submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                Swal.fire('Success', 'Course updated successfully', 'success');
            } else {
                await axios.post(`${baseUrl}/admin/course/create/`, submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                Swal.fire('Success', 'Course created successfully', 'success');
            }
            closeCourseModal();
            fetchCourses();
        } catch (error) {
            console.error('=== ERROR SAVING COURSE ===');
            console.error('Error:', error);
            console.error('Response data:', error.response?.data);
            console.error('Response status:', error.response?.status);
            
            const errorMsg = error.response?.data?.detail || 
                            (error.response?.data && typeof error.response.data === 'object' 
                                ? Object.entries(error.response.data)
                                    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                                    .join('\n')
                                : error.message) || 
                            'Error saving course. Please check all fields.';
            
            Swal.fire('Error', errorMsg, 'error');
        } finally {
            setSavingCourse(false);
        }
    };

    const handleDeleteCourse = async (courseId, e) => {
        e.stopPropagation();
        const result = await Swal.fire({
            title: 'Delete Course?',
            text: 'This will delete all modules and lessons. This cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                console.log(`=== DELETING COURSE ${courseId} ===`);
                const response = await axios.post(`${baseUrl}/admin/delete-course/${courseId}/`);
                console.log('Delete response:', response.data);
                
                if (response.data.bool === true) {
                    Swal.fire('Deleted!', response.data.message || 'Course has been deleted.', 'success');
                    await fetchCourses();
                } else {
                    Swal.fire('Error', response.data.message || 'Failed to delete course', 'error');
                }
            } catch (error) {
                console.error('Error deleting course:', error);
                console.error('Error response:', error.response?.data);
                Swal.fire('Error', 
                    error.response?.data?.message || error.response?.data?.detail || 'Failed to delete course', 
                    'error');
            }
        }
    };

    // ============ MODULE CRUD ============
    const openAddModuleModal = () => {
        setEditingModule(null);
        setModuleFormData({ title: '', description: '', order: courseData?.modules?.length || 0 });
        setShowModuleModal(true);
    };

    const openEditModuleModal = (module) => {
        setEditingModule(module);
        setModuleFormData({
            title: module.title,
            description: module.description || '',
            order: module.order
        });
        setShowModuleModal(true);
    };

    const handleModuleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingModule) {
                await axios.put(`${baseUrl}/admin/module/${editingModule.id}/`, {
                    ...moduleFormData,
                    course: selectedCourse
                });
                Swal.fire('Success', 'Module updated successfully', 'success');
            } else {
                await axios.post(`${baseUrl}/admin/modules/`, {
                    ...moduleFormData,
                    course: selectedCourse
                });
                Swal.fire('Success', 'Module created successfully', 'success');
            }
            setShowModuleModal(false);
            fetchCourseStructure(selectedCourse);
        } catch (error) {
            console.error('Error saving module:', error);
            Swal.fire('Error', 'Failed to save module', 'error');
        }
    };

    const handleDeleteModule = async (moduleId) => {
        const result = await Swal.fire({
            title: 'Delete Module?',
            text: 'This will also delete all lessons within this module.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${baseUrl}/admin/module/${moduleId}/`);
                Swal.fire('Deleted!', 'Module has been deleted.', 'success');
                fetchCourseStructure(selectedCourse);
            } catch (error) {
                console.error('Error deleting module:', error);
                Swal.fire('Error', 'Failed to delete module', 'error');
            }
        }
    };

    // ============ LESSON CRUD ============
    const openAddLessonModal = (moduleId) => {
        setEditingLesson(null);
        setCurrentModuleId(moduleId);
        setDuplicateContext(null);
        setSelectedTemplate(null);
        setShowTemplateSelector(true); // Show template selector first
        setLessonFormData({
            title: '',
            description: '',
            content_type: 'video',
            file: null,
            duration_seconds: 0,
            objectives: '',
            is_preview: false,
            is_locked: false,
            is_premium: false,
            required_access_level: 'free'
        });
        setUploadProgress(0);
        setIsDragging(false);
    };
    
    const selectTemplate = (template) => {
        setSelectedTemplate(template);
        setLessonFormData(prev => ({
            ...prev,
            content_type: template.defaults.content_type,
            objectives: template.defaults.objectives,
            is_preview: template.defaults.is_preview,
            is_locked: template.defaults.is_locked
        }));
        setShowTemplateSelector(false);
        setShowLessonModal(true);
    };
    
    const skipTemplateSelection = () => {
        setShowTemplateSelector(false);
        setShowLessonModal(true);
    };

    const openEditLessonModal = (lesson, moduleId, duplicationMeta = null) => {
        setEditingLesson(lesson);
        setCurrentModuleId(moduleId);
        setDuplicateContext(duplicationMeta);
        setSelectedTemplate(null);
        setLessonFormData({
            title: lesson.title,
            description: lesson.description || '',
            content_type: lesson.content_type,
            file: null,
            duration_seconds: lesson.duration_seconds,
            objectives: lesson.objectives || '',
            is_preview: lesson.is_preview || false,
            is_locked: lesson.is_locked || false,
            is_premium: lesson.is_premium || false,
            required_access_level: lesson.required_access_level || 'free'
        });
        setUploadProgress(0);
        setShowLessonModal(true);
    };
    
    // Drag and drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            
            // Auto-detect content type
            const ext = file.name.split('.').pop().toLowerCase();
            const contentTypeMap = {
                'mp4': 'video', 'webm': 'video', 'mov': 'video', 'avi': 'video', 'mkv': 'video',
                'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio', 'm4a': 'audio', 'flac': 'audio', 'aac': 'audio',
                'pdf': 'pdf',
                'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'webp': 'image', 'svg': 'image',
            };
            const detectedType = contentTypeMap[ext] || lessonFormData.content_type;
            
            // Validate file size
            if (!validateFileSize(file, detectedType)) return;
            
            setLessonFormData(prev => ({ ...prev, file, content_type: detectedType }));
        }
    };

    // File size limits per content type (in bytes)
    const FILE_SIZE_LIMITS = {
        video: 2 * 1024 * 1024 * 1024,    // 2 GB
        audio: 200 * 1024 * 1024,           // 200 MB
        pdf:   50 * 1024 * 1024,            // 50 MB
        image: 20 * 1024 * 1024,            // 20 MB
    };

    const FILE_SIZE_LABELS = {
        video: '2 GB',
        audio: '200 MB',
        pdf:   '50 MB',
        image: '20 MB',
    };

    const formatFileSize = (bytes) => {
        if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
        if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return bytes + ' B';
    };

    const validateFileSize = (file, contentType) => {
        const maxSize = FILE_SIZE_LIMITS[contentType] || 50 * 1024 * 1024;
        const maxLabel = FILE_SIZE_LABELS[contentType] || '50 MB';
        if (file.size > maxSize) {
            Swal.fire({
                icon: 'error',
                title: 'File Too Large',
                html: `<div style="text-align:left">
                    <p>The selected file exceeds the maximum allowed size for <strong>${contentType}</strong> content.</p>
                    <table style="width:100%; margin-top:10px; font-size:14px;">
                        <tr><td style="padding:4px 8px; color:#666;">Your file:</td><td style="padding:4px 8px; font-weight:600;">${formatFileSize(file.size)}</td></tr>
                        <tr><td style="padding:4px 8px; color:#666;">Max allowed:</td><td style="padding:4px 8px; font-weight:600; color:#dc2626;">${maxLabel}</td></tr>
                    </table>
                    <p style="margin-top:12px; font-size:13px; color:#666;">Tip: Compress or reduce the quality of your file before uploading.</p>
                </div>`,
                confirmButtonColor: '#4285f4'
            });
            return false;
        }
        return true;
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!validateFileSize(file, lessonFormData.content_type)) {
                e.target.value = '';
                return;
            }
            setLessonFormData({ ...lessonFormData, file });
        }
    };

    const handleLessonSubmit = async (e) => {
        e.preventDefault();
        
        // Validate file for new lessons
        if (!editingLesson && !lessonFormData.file) {
            Swal.fire('Error', 'Please select a file to upload', 'error');
            return;
        }
        
        // Validate file size before upload
        if (lessonFormData.file && !validateFileSize(lessonFormData.file, lessonFormData.content_type)) {
            return;
        }
        
        setUploading(true);
        setUploadProgress(0);
        try {
            const formData = new FormData();
            formData.append('title', lessonFormData.title);
            formData.append('description', lessonFormData.description);
            formData.append('content_type', lessonFormData.content_type);
            formData.append('module', currentModuleId);
            formData.append('objectives', lessonFormData.objectives);
            formData.append('is_preview', lessonFormData.is_preview);
            formData.append('is_locked', lessonFormData.is_locked);
            formData.append('is_premium', lessonFormData.is_premium);
            formData.append('required_access_level', lessonFormData.required_access_level || 'free');
            if (lessonFormData.file) {
                formData.append('file', lessonFormData.file);
            }
            if (lessonFormData.duration_seconds) {
                formData.append('duration_seconds', lessonFormData.duration_seconds);
            }

            console.log('=== LESSON FORM SUBMISSION ===');
            console.log('FormData entries:');
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value);
            }

            const config = {
                headers: { 'content-type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            };

            if (editingLesson) {
                await axios.put(`${baseUrl}/admin/lesson/${editingLesson.id}/`, formData, config);
                Swal.fire('Success', 'Lesson updated successfully', 'success');
            } else {
                await axios.post(`${baseUrl}/admin/module/${currentModuleId}/lessons/`, formData, config);
                Swal.fire('Success', 'Lesson created successfully', 'success');
            }
            setShowLessonModal(false);
            setUploadProgress(0);
            fetchCourseStructure(selectedCourse);
        } catch (error) {
            console.error('=== ERROR SAVING LESSON ===');
            console.error('Error:', error);
            console.error('Response data:', error.response?.data);
            console.error('Response status:', error.response?.status);
            
            const errorMsg = error.response?.data?.error ||
                            error.response?.data?.detail || 
                            (error.response?.data && typeof error.response.data === 'object' 
                                ? Object.entries(error.response.data)
                                    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                                    .join('\n')
                                : error.message) || 
                            'Failed to save lesson';
            
            Swal.fire('Error', errorMsg, 'error');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // ============ DOWNLOADABLES CRUD ============
    const getDownloadableRequestParams = () => {
        const requesterType = userType === 'teacher' ? 'teacher' : 'admin';
        const requesterId = requesterType === 'teacher'
            ? effectiveTeacherId
            : localStorage.getItem('adminId');
        return {
            requester_type: requesterType,
            requester_id: requesterId
        };
    };

    const openDownloadablesModal = async (lesson) => {
        setCurrentLessonForDownloads(lesson);
        setShowDownloadablesModal(true);
        setLoadingDownloadables(true);
        setMultipleFiles([]);
        setMultiUploadProgress({});
        try {
            const response = await axios.get(`${baseUrl}/lesson/${lesson.id}/downloadables/`, {
                params: getDownloadableRequestParams()
            });
            setDownloadables(response.data);
        } catch (error) {
            console.error('Error fetching downloadables:', error);
            setDownloadables([]);
        } finally {
            setLoadingDownloadables(false);
        }
    };

    const closeDownloadablesModal = () => {
        console.log('Closing downloadables modal, downloadables count:', downloadables.length);
        setShowDownloadablesModal(false);
        setCurrentLessonForDownloads(null);
        // Don't clear downloadables - keep the server-fetched list
        setShowAddDownloadableForm(false);
        setMultipleFiles([]);
        setMultiUploadProgress({});
        setDownloadableFormData({
            title: '',
            file_type: 'pdf',
            file: null,
            description: '',
            order: 0
        });
    };
    
    // Multi-file selection handler
    const handleMultiFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const fileObjects = files.map((file, index) => ({
            id: Date.now() + index,
            file,
            title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for title
            file_type: detectFileType(file.name),
            description: '',
            status: 'pending' // pending, uploading, completed, error
        }));
        setMultipleFiles(prev => [...prev, ...fileObjects]);
    };
    
    const detectFileType = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const typeMap = {
            'pdf': 'pdf',
            'mp3': 'audio_playalong', 'wav': 'audio_playalong', 'm4a': 'audio_playalong',
            'doc': 'worksheet', 'docx': 'worksheet', 'txt': 'worksheet',
            'png': 'sheet_music', 'jpg': 'sheet_music', 'jpeg': 'sheet_music'
        };
        return typeMap[ext] || 'other';
    };
    
    const updateMultiFileItem = (id, updates) => {
        setMultipleFiles(prev => prev.map(item => 
            item.id === id ? { ...item, ...updates } : item
        ));
    };
    
    const removeMultiFileItem = (id) => {
        setMultipleFiles(prev => prev.filter(item => item.id !== id));
    };
    
    const uploadAllFiles = async () => {
        console.log('uploadAllFiles called with files:', multipleFiles);
        if (multipleFiles.length === 0) {
            Swal.fire('Warning', 'No files selected to upload', 'warning');
            return;
        }
        
        setUploadingMultiple(true);
        let successCount = 0;
        
        for (const fileItem of multipleFiles) {
            if (fileItem.status === 'completed') {
                successCount++;
                continue;
            }
            
            updateMultiFileItem(fileItem.id, { status: 'uploading' });
            setMultiUploadProgress(prev => ({ ...prev, [fileItem.id]: 0 }));
            
            try {
                const formData = new FormData();
                formData.append('lesson', currentLessonForDownloads.id);
                formData.append('title', fileItem.title);
                formData.append('file_type', fileItem.file_type);
                formData.append('file', fileItem.file);
                formData.append('description', fileItem.description);
                formData.append('order', downloadables.length + multipleFiles.indexOf(fileItem));

                console.log(`Uploading file: ${fileItem.title} to lesson ${currentLessonForDownloads.id}`);
                const uploadResponse = await axios.post(`${baseUrl}/lesson/${currentLessonForDownloads.id}/downloadables/`, formData, {
                    params: getDownloadableRequestParams(),
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setMultiUploadProgress(prev => ({ ...prev, [fileItem.id]: percent }));
                    }
                });
                console.log(`File uploaded successfully: ${fileItem.title}`, uploadResponse.data);
                
                updateMultiFileItem(fileItem.id, { status: 'completed' });
                successCount++;
            } catch (error) {
                console.error('Error uploading file:', error);
                updateMultiFileItem(fileItem.id, { status: 'error' });
            }
        }
        
        // Refresh downloadables list
        try {
            console.log('Refreshing downloadables list after batch upload...');
            const response = await axios.get(`${baseUrl}/lesson/${currentLessonForDownloads.id}/downloadables/`, {
                params: getDownloadableRequestParams()
            });
            console.log('Updated downloadables after batch upload:', response.data);
            setDownloadables(response.data);
        } catch (error) {
            console.error('Error refreshing downloadables:', error);
        }
        
        setUploadingMultiple(false);
        
        if (successCount === multipleFiles.length && successCount > 0) {
            Swal.fire('Success', `${successCount} file(s) uploaded successfully!`, 'success');
            setMultipleFiles([]);
            setMultiUploadProgress({});
        } else if (successCount > 0) {
            Swal.fire('Partial Success', `${successCount} of ${multipleFiles.length} files uploaded. Some files failed.`, 'warning');
        } else {
            Swal.fire('Error', 'Failed to upload files. Please try again.', 'error');
        }
    };

    const handleDownloadableSubmit = async (e) => {
        e.preventDefault();
        console.log('handleDownloadableSubmit called with formData:', downloadableFormData);
        if (!downloadableFormData.file) {
            Swal.fire('Error', 'Please select a file', 'error');
            return;
        }
        setSavingDownloadable(true);
        try {
            const formData = new FormData();
            formData.append('lesson', currentLessonForDownloads.id);
            formData.append('title', downloadableFormData.title);
            formData.append('file_type', downloadableFormData.file_type);
            formData.append('file', downloadableFormData.file);
            formData.append('description', downloadableFormData.description);
            formData.append('order', downloadables.length);

            console.log('Posting to:', `${baseUrl}/lesson/${currentLessonForDownloads.id}/downloadables/`);
            const postResponse = await axios.post(`${baseUrl}/lesson/${currentLessonForDownloads.id}/downloadables/`, formData, {
                params: getDownloadableRequestParams(),
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log('Post response:', postResponse.data);

            // Refresh downloadables list
            console.log('Fetching updated downloadables list...');
            const response = await axios.get(`${baseUrl}/lesson/${currentLessonForDownloads.id}/downloadables/`, {
                params: getDownloadableRequestParams()
            });
            console.log('Fetched downloadables:', response.data);
            setDownloadables(response.data);
            
            // Reset form
            setShowAddDownloadableForm(false);
            setDownloadableFormData({
                title: '',
                file_type: 'pdf',
                file: null,
                description: '',
                order: 0
            });
            if (downloadableFileRef.current) downloadableFileRef.current.value = '';
            
            Swal.fire('Success', 'Downloadable added successfully', 'success');
        } catch (error) {
            console.error('Error saving downloadable:', error);
            Swal.fire('Error', 'Failed to save downloadable', 'error');
        } finally {
            setSavingDownloadable(false);
        }
    };

    const handleDeleteDownloadable = async (downloadableId) => {
        const result = await Swal.fire({
            title: 'Delete Downloadable?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${baseUrl}/downloadable/${downloadableId}/`, {
                    params: getDownloadableRequestParams()
                });
                setDownloadables(prev => prev.filter(d => d.id !== downloadableId));
                Swal.fire('Deleted!', 'Downloadable has been deleted.', 'success');
            } catch (error) {
                console.error('Error deleting downloadable:', error);
                Swal.fire('Error', 'Failed to delete downloadable', 'error');
            }
        }
    };

    const getDownloadableTypeIcon = (type) => {
        switch (type) {
            case 'pdf': return 'bi-file-pdf-fill';
            case 'sheet_music': return 'bi-music-note-list';
            case 'audio_slow': return 'bi-play-circle';
            case 'audio_fast': return 'bi-fast-forward-circle';
            case 'audio_playalong': return 'bi-speaker';
            case 'worksheet': return 'bi-file-earmark-text';
            default: return 'bi-file-earmark';
        }
    };

    const getDownloadableTypeColor = (type) => {
        switch (type) {
            case 'pdf': return '#ef4444';
            case 'sheet_music': return '#8b5cf6';
            case 'audio_slow': return '#3b82f6';
            case 'audio_fast': return '#f59e0b';
            case 'audio_playalong': return '#22c55e';
            case 'worksheet': return '#06b6d4';
            default: return '#6b7280';
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        const result = await Swal.fire({
            title: 'Delete Lesson?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${baseUrl}/admin/lesson/${lessonId}/`);
                Swal.fire('Deleted!', 'Lesson has been deleted.', 'success');
                fetchCourseStructure(selectedCourse);
            } catch (error) {
                console.error('Error deleting lesson:', error);
                Swal.fire('Error', 'Failed to delete lesson', 'error');
            }
        }
    };

    const handleDuplicateLesson = async (lesson, moduleId) => {
        const requesterType = userType === 'teacher' ? 'teacher' : 'admin';
        const requesterId = requesterType === 'teacher'
            ? effectiveTeacherId
            : localStorage.getItem('adminId');

        const result = await Swal.fire({
            title: 'Duplicate Lesson',
            input: 'text',
            inputLabel: 'New lesson title',
            inputValue: `${lesson.title} (Copy)`,
            showCancelButton: true,
            confirmButtonText: 'Duplicate',
            confirmButtonColor: '#4285f4',
            inputValidator: (value) => {
                if (!value || !value.trim()) {
                    return 'Title is required';
                }
                return null;
            }
        });

        if (!result.isConfirmed) return;

        try {
            const response = await axios.post(`${baseUrl}/admin/lesson/${lesson.id}/duplicate/`, {
                requester_type: requesterType,
                requester_id: requesterId,
                title: result.value
            });

            await fetchCourseStructure(selectedCourse);

            const duplicatedLesson = response?.data?.lesson;
            const duplicationMeta = response?.data?.meta || {};
            if (duplicatedLesson?.id) {
                openEditLessonModal(duplicatedLesson, moduleId, {
                    sourceLessonId: duplicationMeta.source_lesson_id || lesson.id,
                    duplicatedLessonId: duplicationMeta.duplicated_lesson_id || duplicatedLesson.id
                });
            }

            Swal.fire('Duplicated', 'Lesson copied successfully. You can now edit the new copy.', 'success');
        } catch (error) {
            console.error('Error duplicating lesson:', error);
            const message = error?.response?.data?.message || 'Failed to duplicate lesson';
            Swal.fire('Error', message, 'error');
        }
    };

    const getContentTypeIcon = (type) => {
        switch (type) {
            case 'video': return 'bi-play-circle-fill';
            case 'audio': return 'bi-music-note-beamed';
            case 'pdf': return 'bi-file-pdf-fill';
            case 'image': return 'bi-image-fill';
            default: return 'bi-file-earmark';
        }
    };

    const getContentTypeColor = (type) => {
        switch (type) {
            case 'video': return '#3b82f6';
            case 'audio': return '#8b5cf6';
            case 'pdf': return '#ef4444';
            case 'image': return '#22c55e';
            default: return '#6b7280';
        }
    };

    if (loading && !courses.length && !courseData) {
        return (
            <div className="admin-loading-wrapper">
                <LoadingSpinner size="lg" text="Loading courses..." />
            </div>
        );
    }

    return (
        <>
            {!selectedCourse ? (
                /* ============ COURSES LIST VIEW ============ */
                <>
                            <div className="lesson-management-container">
                            {/* Header */}
                            <div className="lesson-header">
                                <div>
                                    <h2 style={{ color: '#1a2332', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.5px', marginBottom: '4px' }}>
                                        <i className="bi bi-collection-play me-2" style={{ color: '#4285f4' }}></i>
                                        {pageTitle}
                                    </h2>
                                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: 0 }}>
                                        {userType === 'teacher' 
                                            ? 'Create and manage your courses, modules, and lessons'
                                            : 'Create courses, add modules, and manage lessons - all in one place'
                                        }
                                    </p>
                                </div>
                                <button
                                    className="btn"
                                    onClick={openAddCourseModal}
                                    style={{
                                        background: 'linear-gradient(135deg, #4285f4 0%, #3b5998 100%)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        fontWeight: 500,
                                        fontSize: '13px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 2px 8px rgba(66, 133, 244, 0.3)',
                                        cursor: 'pointer',
                                        width: 'auto',
                                        maxWidth: '160px'
                                    }}
                                >
                                    <i className="bi bi-plus-lg"></i>
                                    Add New Course
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="lesson-stats-grid">
                                <div className="stat-card">
                                    <i className="bi bi-book" style={{ color: '#4285f4' }}></i>
                                    <h3>{courses.length}</h3>
                                    <p>Total Courses</p>
                                </div>
                                <div className="stat-card">
                                    <i className="bi bi-folder" style={{ color: '#34c759' }}></i>
                                    <h3>{categories.length}</h3>
                                    <p>Categories</p>
                                </div>
                                {userType !== 'teacher' && (
                                <div className="stat-card">
                                    <i className="bi bi-person-circle" style={{ color: '#ff6b6b' }}></i>
                                    <h3>{teachers.length}</h3>
                                    <p>Instructors</p>
                                </div>
                                )}
                            </div>

                            {/* Search & Filter */}
                            <div className="filter-card">
                                <div className="filter-row">
                                    <div>
                                        <div className="input-group">
                                            <span className="input-group-text" style={{ background: '#f8f9fa', border: '1px solid #e5e7eb' }}>
                                                <i className="bi bi-search text-muted"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search courses..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                style={{ border: '1px solid #e5e7eb', borderLeft: 'none' }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <select
                                            className="form-select"
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            style={{ border: '1px solid #e5e7eb' }}
                                        >
                                            <option value="">All Categories</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Courses Grid */}
                            <div className="courses-grid">
                                {filteredCourses.length > 0 ? (
                                    filteredCourses.map(course => (
                                        <div key={course.id} className="course-card-wrapper">
                                            <div
                                                className="course-card"
                                                style={{
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onClick={() => handleCourseSelect(course.id)}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                                }}
                                            >
                                                {course.featured_img ? (
                                                    <img
                                                        src={course.featured_img}
                                                        alt={course.title}
                                                        style={{ height: '140px', objectFit: 'cover', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        height: '140px',
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderTopLeftRadius: '12px',
                                                        borderTopRightRadius: '12px'
                                                    }}>
                                                        <i className="bi bi-music-note-beamed" style={{ fontSize: '48px', color: 'rgba(255,255,255,0.8)' }}></i>
                                                    </div>
                                                )}
                                                <div className="course-card-body">
                                                    <div className="course-actions" style={{ marginBottom: '8px' }}>
                                                        <span style={{
                                                            background: '#e8f4fd',
                                                            color: '#1976d2',
                                                            padding: '4px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: 500
                                                        }}>
                                                            {course.category?.title || 'Uncategorized'}
                                                        </span>
                                                        <div className="d-flex gap-1" onClick={e => e.stopPropagation()}>
                                                            {showAnalytics && (
                                                                <button
                                                                    className="btn btn-sm"
                                                                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/course-analytics/${course.id}`); }}
                                                                    title="View Analytics"
                                                                    style={{ background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '6px', padding: '4px 8px' }}
                                                                >
                                                                    <i className="bi bi-graph-up"></i>
                                                                </button>
                                                            )}
                                                            <button
                                                                className="btn btn-sm"
                                                                onClick={(e) => { e.stopPropagation(); openEditCourseModal(course); }}
                                                                style={{ background: '#e3f2fd', color: '#1976d2', border: 'none', borderRadius: '6px', padding: '4px 8px' }}
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm"
                                                                onClick={(e) => handleDeleteCourse(course.id, e)}
                                                                style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', padding: '4px 8px' }}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <h6 style={{ fontWeight: 600, color: '#1a2332', marginBottom: '8px', fontSize: '15px' }}>
                                                        {course.title}
                                                    </h6>
                                                    <p className="text-muted small mb-3" style={{ fontSize: '13px' }}>
                                                        <i className="bi bi-person me-1"></i>
                                                        {course.teacher?.full_name || 'Unknown'}
                                                    </p>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div className="d-flex gap-2">
                                                            <span style={{
                                                                background: '#f0fdf4',
                                                                color: '#166534',
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: 500
                                                            }}>
                                                                <i className="bi bi-collection me-1"></i>
                                                                {course.course_chapters?.length || course.total_modules || 0} Modules
                                                            </span>
                                                            <span style={{
                                                                background: '#fef3c7',
                                                                color: '#92400e',
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: 500
                                                            }}>
                                                                <i className="bi bi-people me-1"></i>
                                                                {course.total_enrolled_students || 0}
                                                            </span>
                                                        </div>
                                                        <i className="bi bi-arrow-right-circle" style={{ color: '#4285f4', fontSize: '20px' }}></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-12">
                                        <div className="card" style={{ border: 'none', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                            <div className="card-body text-center py-5">
                                                <i className="bi bi-inbox" style={{ fontSize: '48px', color: '#d1d5db' }}></i>
                                                <h5 className="mt-3" style={{ color: '#374151' }}>No Courses Found</h5>
                                                <p className="text-muted">Get started by creating your first course</p>
                                                <button
                                                    className="btn mt-2"
                                                    onClick={openAddCourseModal}
                                                    style={{ background: '#4285f4', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px' }}
                                                >
                                                    <i className="bi bi-plus-lg me-2"></i>
                                                    Add First Course
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            </div>
                        </>
                    ) : (
                        /* ============ MODULES & LESSONS VIEW ============ */
                        <>
                            <div className="lesson-management-container">
                            {/* Back Button & Course Info */}
                            <div className="lesson-header" style={{ marginBottom: '24px' }}>
                                <div className="d-flex align-items-center gap-3">
                                    <button
                                        className="btn"
                                        onClick={() => {
                                            setSelectedCourse(null);
                                            setCourseData(null);
                                            navigate(basePath);
                                        }}
                                        style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '10px 16px' }}
                                    >
                                        <i className="bi bi-arrow-left me-2"></i>
                                        Back to Courses
                                    </button>
                                    <div>
                                        <h4 style={{ margin: 0, fontWeight: 600, color: '#1a2332' }}>{courseData?.course_title}</h4>
                                        <small className="text-muted">{courseData?.total_modules || 0} Modules</small>
                                    </div>
                                </div>
                                <button
                                    className="btn"
                                    onClick={openAddModuleModal}
                                    style={{
                                        background: 'linear-gradient(135deg, #4285f4 0%, #3b5998 100%)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '10px 20px',
                                        fontWeight: 500
                                    }}
                                >
                                    <i className="bi bi-plus-lg me-2"></i>
                                    Add Module
                                </button>
                            </div>

                            {/* Modules List */}
                            {courseData?.modules?.length > 0 ? (
                                courseData.modules.map((module, moduleIndex) => (
                                    <div key={module.id} className="card mb-3" style={{ border: 'none', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                                        {/* Module Header */}
                                        <div
                                            className="card-header d-flex justify-content-between align-items-center"
                                            style={{ backgroundColor: '#f8fafc', borderBottom: expandedModules[module.id] ? '1px solid #e5e7eb' : 'none', padding: '16px 20px', cursor: 'pointer' }}
                                            onClick={() => toggleModuleExpand(module.id)}
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <span style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    background: 'linear-gradient(135deg, #4285f4 0%, #3b5998 100%)',
                                                    color: 'white',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 600,
                                                    fontSize: '14px'
                                                }}>
                                                    {moduleIndex + 1}
                                                </span>
                                                <div>
                                                    <h6 style={{ margin: 0, fontWeight: 600, color: '#1a2332' }}>{module.title}</h6>
                                                    <small className="text-muted">{module.total_lessons || module.lessons?.length || 0} Lessons</small>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={(e) => { e.stopPropagation(); openAddLessonModal(module.id); }}
                                                    title="Add Lesson"
                                                    style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: '6px', padding: '6px 10px' }}
                                                >
                                                    <i className="bi bi-plus-lg"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={(e) => { e.stopPropagation(); openEditModuleModal(module); }}
                                                    title="Edit Module"
                                                    style={{ background: '#e3f2fd', color: '#1976d2', border: 'none', borderRadius: '6px', padding: '6px 10px' }}
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}
                                                    title="Delete Module"
                                                    style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', padding: '6px 10px' }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                                <i className={`bi ${expandedModules[module.id] ? 'bi-chevron-up' : 'bi-chevron-down'} ms-2`} style={{ color: '#6b7280' }}></i>
                                            </div>
                                        </div>

                                        {/* Lessons */}
                                        {expandedModules[module.id] && (
                                            <div className="card-body p-0">
                                                {module.lessons && module.lessons.length > 0 ? (
                                                    <div className="list-group list-group-flush">
                                                        {module.lessons.map((lesson, lessonIndex) => (
                                                            <div
                                                                key={lesson.id}
                                                                className="list-group-item d-flex justify-content-between align-items-center"
                                                                style={{ padding: '14px 20px', borderLeft: `4px solid ${getContentTypeColor(lesson.content_type)}` }}
                                                            >
                                                                <div className="d-flex align-items-center gap-3">
                                                                    <span style={{ color: '#9ca3af', fontSize: '14px', minWidth: '24px' }}>
                                                                        {lessonIndex + 1}.
                                                                    </span>
                                                                    <i className={`bi ${getContentTypeIcon(lesson.content_type)}`} style={{ color: getContentTypeColor(lesson.content_type), fontSize: '18px' }}></i>
                                                                    <div>
                                                                        <span style={{ fontWeight: 500, color: '#1a2332' }}>{lesson.title}</span>
                                                                        <div className="d-flex gap-2 mt-1 flex-wrap">
                                                                            <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '11px', fontWeight: 500 }}>
                                                                                {lesson.content_type.toUpperCase()}
                                                                            </span>
                                                                            {lesson.duration_formatted && lesson.duration_formatted !== '0:00' && (
                                                                                <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '11px', fontWeight: 500 }}>
                                                                                    <i className="bi bi-clock me-1"></i>
                                                                                    {lesson.duration_formatted}
                                                                                </span>
                                                                            )}
                                                                            {lesson.is_preview && (
                                                                                <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 500 }}>
                                                                                    <i className="bi bi-eye me-1"></i>
                                                                                    Preview
                                                                                </span>
                                                                            )}
                                                                            {lesson.is_locked && (
                                                                                <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: 500 }}>
                                                                                    <i className="bi bi-lock me-1"></i>
                                                                                    Locked
                                                                                </span>
                                                                            )}
                                                                            {lesson.objectives && (
                                                                                <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', fontSize: '11px', fontWeight: 500 }}>
                                                                                    <i className="bi bi-list-check me-1"></i>
                                                                                    Objectives
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex gap-2">
                                                                    <button
                                                                        className="btn btn-sm"
                                                                        onClick={() => openDownloadablesModal(lesson)}
                                                                        title="Manage Downloadables"
                                                                        style={{ background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '6px', padding: '6px 10px' }}
                                                                    >
                                                                        <i className="bi bi-download"></i>
                                                                    </button>
                                                                    {lesson.file && (
                                                                        <a
                                                                            href={lesson.file}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="btn btn-sm"
                                                                            style={{ background: '#f3e5f5', color: '#7b1fa2', border: 'none', borderRadius: '6px', padding: '6px 10px' }}
                                                                        >
                                                                            <i className="bi bi-eye"></i>
                                                                        </a>
                                                                    )}
                                                                    <button
                                                                        className="btn btn-sm"
                                                                        onClick={() => openEditLessonModal(lesson, module.id)}
                                                                        style={{ background: '#e3f2fd', color: '#1976d2', border: 'none', borderRadius: '6px', padding: '6px 10px' }}
                                                                    >
                                                                        <i className="bi bi-pencil"></i>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm"
                                                                        onClick={() => handleDuplicateLesson(lesson, module.id)}
                                                                        title="Duplicate Lesson"
                                                                        style={{ background: '#ede9fe', color: '#6d28d9', border: 'none', borderRadius: '6px', padding: '6px 10px' }}
                                                                    >
                                                                        <i className="bi bi-files"></i>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm"
                                                                        onClick={() => handleDeleteLesson(lesson.id)}
                                                                        style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', padding: '6px 10px' }}
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <i className="bi bi-inbox text-muted" style={{ fontSize: '32px' }}></i>
                                                        <p className="text-muted mt-2 mb-3">No lessons in this module yet</p>
                                                        <button
                                                            className="btn btn-sm"
                                                            onClick={() => openAddLessonModal(module.id)}
                                                            style={{ background: '#4285f4', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px' }}
                                                        >
                                                            <i className="bi bi-plus-lg me-2"></i>
                                                            Add First Lesson
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="card" style={{ border: 'none', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                    <div className="card-body text-center py-5">
                                        <i className="bi bi-collection text-muted" style={{ fontSize: '48px' }}></i>
                                        <h5 className="mt-3" style={{ color: '#374151' }}>No Modules Yet</h5>
                                        <p className="text-muted">Start building your course by adding the first module</p>
                                        <button
                                            className="btn mt-2"
                                            onClick={openAddModuleModal}
                                            style={{ background: '#4285f4', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px' }}
                                        >
                                            <i className="bi bi-plus-lg me-2"></i>
                                            Add First Module
                                        </button>
                                    </div>
                                </div>
                            )}
                            </div>
                        </>
                    )}

            {/* ============ COURSE MODAL ============ */}
            {showCourseModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content" style={{ borderRadius: '12px', border: 'none' }}>
                            <div className="modal-header" style={{ borderBottom: '1px solid #e5e7eb', padding: '20px 24px' }}>
                                <h5 className="modal-title" style={{ fontWeight: 600, color: '#1a2332' }}>
                                    <i className={`bi ${editingCourse ? 'bi-pencil' : 'bi-plus-circle'} me-2`} style={{ color: '#4285f4' }}></i>
                                    {editingCourse ? 'Edit Course' : 'Add New Course'}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeCourseModal}></button>
                            </div>
                            <form onSubmit={handleCourseSubmit}>
                                <div className="modal-body" style={{ padding: '24px' }}>
                                    <div className="row g-4">
                                        <div className="col-md-8">
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                Course Title <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="title"
                                                value={courseFormData.title}
                                                onChange={handleCourseInputChange}
                                                required
                                                placeholder="Enter course title"
                                                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                Category <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="category"
                                                value={courseFormData.category}
                                                onChange={handleCourseInputChange}
                                                placeholder="Enter category name (e.g., Music, Programming, Art)"
                                                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                            />
                                        </div>
                                        {showTeacherSelect && (
                                            <div className="col-md-6">
                                                <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                    Instructor <span style={{ color: '#ef4444' }}>*</span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    name="teacher"
                                                    value={courseFormData.teacher}
                                                    onChange={handleCourseInputChange}
                                                    required
                                                    style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                                >
                                                    <option value="">Select Instructor</option>
                                                    {teachers.map(teacher => (
                                                        <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div className={showTeacherSelect ? "col-md-6" : "col-12"}>
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>Technologies/Topics</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="techs"
                                                value={courseFormData.techs}
                                                onChange={handleCourseInputChange}
                                                placeholder="e.g., Piano, Guitar, Music Theory"
                                                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                Description <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="description"
                                                value={courseFormData.description}
                                                onChange={handleCourseInputChange}
                                                rows="3"
                                                required
                                                placeholder="Enter course description"
                                                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', resize: 'none' }}
                                            ></textarea>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>Featured Image</label>
                                            <input
                                                type="file"
                                                className="form-control"
                                                accept="image/*"
                                                onChange={handleCourseFileChange}
                                                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                            />
                                            {imagePreview && (
                                                <div className="mt-3">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        style={{ maxWidth: '200px', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                <i className="bi bi-shield-lock me-1" style={{ color: '#8b5cf6' }}></i>
                                                Required Access Level
                                            </label>
                                            <select
                                                className="form-select"
                                                name="required_access_level"
                                                value={courseFormData.required_access_level}
                                                onChange={handleCourseInputChange}
                                                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                            >
                                                <option value="free">🟢 Free — Anyone can access</option>
                                                <option value="basic">🔵 Basic — Basic plan or higher</option>
                                                <option value="standard">🟣 Standard — Standard plan or higher</option>
                                                <option value="premium">🟠 Premium — Premium plan or higher</option>
                                            </select>
                                            <small className="text-muted">Students need at least this subscription level to enroll</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px' }}>
                                    <button type="button" className="btn" onClick={closeCourseModal} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '10px 20px' }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn" disabled={savingCourse} style={{ background: 'linear-gradient(135deg, #4285f4 0%, #3b5998 100%)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px' }}>
                                        {savingCourse ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                                        ) : (
                                            <><i className={`bi ${editingCourse ? 'bi-check-lg' : 'bi-plus-lg'} me-2`}></i>{editingCourse ? 'Save Changes' : 'Create Course'}</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ MODULE MODAL ============ */}
            {showModuleModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content" style={{ border: 'none', borderRadius: '12px' }}>
                            <div className="modal-header" style={{ borderBottom: '1px solid #e5e7eb', padding: '20px 24px' }}>
                                <h5 className="modal-title" style={{ fontWeight: 600, color: '#1a2332' }}>
                                    <i className={`bi ${editingModule ? 'bi-pencil' : 'bi-plus-circle'} me-2`} style={{ color: '#4285f4' }}></i>
                                    {editingModule ? 'Edit Module' : 'Add New Module'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModuleModal(false)}></button>
                            </div>
                            <form onSubmit={handleModuleSubmit}>
                                <div className="modal-body" style={{ padding: '24px' }}>
                                    <div className="mb-3">
                                        <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>Module Title <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={moduleFormData.title}
                                            onChange={(e) => setModuleFormData({ ...moduleFormData, title: e.target.value })}
                                            placeholder="e.g., Introduction to Music Theory"
                                            required
                                            style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>Description</label>
                                        <textarea
                                            className="form-control"
                                            value={moduleFormData.description}
                                            onChange={(e) => setModuleFormData({ ...moduleFormData, description: e.target.value })}
                                            placeholder="Brief description of this module..."
                                            rows="3"
                                            style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px' }}>
                                    <button type="button" className="btn" onClick={() => setShowModuleModal(false)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '10px 20px' }}>Cancel</button>
                                    <button type="submit" className="btn" style={{ background: '#4285f4', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px' }}>
                                        {editingModule ? 'Update Module' : 'Create Module'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ TEMPLATE SELECTOR MODAL ============ */}
            {showTemplateSelector && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content" style={{ border: 'none', borderRadius: '16px', overflow: 'hidden' }}>
                            <div className="modal-header" style={{ 
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                                color: '#fff', 
                                padding: '24px 28px',
                                border: 'none' 
                            }}>
                                <div>
                                    <h5 className="modal-title" style={{ fontWeight: 700, marginBottom: '4px', fontSize: '20px' }}>
                                        <i className="bi bi-magic me-2"></i>
                                        Choose a Lesson Template
                                    </h5>
                                    <small style={{ opacity: 0.9 }}>Start with a pre-configured template or create from scratch</small>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => { setShowTemplateSelector(false); setShowLessonModal(false); }}
                                ></button>
                            </div>
                            <div className="modal-body" style={{ padding: '28px' }}>
                                <div className="row g-3">
                                    {lessonTemplates.map((template) => (
                                        <div key={template.id} className="col-md-4">
                                            <div 
                                                className="card h-100"
                                                onClick={() => selectTemplate(template)}
                                                style={{ 
                                                    border: `2px solid ${template.color}20`,
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    overflow: 'hidden'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                                    e.currentTarget.style.boxShadow = `0 8px 24px ${template.color}25`;
                                                    e.currentTarget.style.borderColor = template.color;
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                    e.currentTarget.style.borderColor = `${template.color}20`;
                                                }}
                                            >
                                                <div 
                                                    className="card-header text-center"
                                                    style={{ 
                                                        background: `${template.color}15`,
                                                        border: 'none',
                                                        padding: '20px'
                                                    }}
                                                >
                                                    <i 
                                                        className={`bi ${template.icon}`} 
                                                        style={{ fontSize: '36px', color: template.color }}
                                                    ></i>
                                                </div>
                                                <div className="card-body text-center" style={{ padding: '16px' }}>
                                                    <h6 style={{ fontWeight: 600, color: '#1a2332', marginBottom: '8px' }}>
                                                        {template.name}
                                                    </h6>
                                                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: 0 }}>
                                                        {template.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-center mt-4">
                                    <button
                                        className="btn"
                                        onClick={skipTemplateSelection}
                                        style={{ 
                                            background: 'transparent', 
                                            color: '#6b7280', 
                                            border: '1px dashed #d1d5db',
                                            borderRadius: '8px',
                                            padding: '10px 24px'
                                        }}
                                    >
                                        <i className="bi bi-skip-forward me-2"></i>
                                        Skip & Start from Scratch
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ LESSON MODAL ============ */}
            {showLessonModal && !showTemplateSelector && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content" style={{ border: 'none', borderRadius: '12px' }}>
                            <div className="modal-header" style={{ borderBottom: '1px solid #e5e7eb', padding: '20px 24px' }}>
                                <div>
                                    <h5 className="modal-title" style={{ fontWeight: 600, color: '#1a2332', marginBottom: '4px' }}>
                                        <i className={`bi ${editingLesson ? 'bi-pencil' : 'bi-plus-circle'} me-2`} style={{ color: '#4285f4' }}></i>
                                        {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
                                    </h5>
                                    {editingLesson && duplicateContext?.duplicatedLessonId === editingLesson.id && (
                                        <small style={{ color: '#6d28d9', display: 'block', marginBottom: '4px' }}>
                                            <i className="bi bi-files me-1"></i>
                                            Copied from Lesson #{duplicateContext.sourceLessonId}
                                        </small>
                                    )}
                                    {selectedTemplate && !editingLesson && (
                                        <small style={{ color: '#6b7280' }}>
                                            <i className={`bi ${selectedTemplate.icon} me-1`} style={{ color: selectedTemplate.color }}></i>
                                            Using {selectedTemplate.name} template
                                        </small>
                                    )}
                                </div>
                                <button type="button" className="btn-close" onClick={() => { setShowLessonModal(false); setDuplicateContext(null); }}></button>
                            </div>
                            <form onSubmit={handleLessonSubmit}>
                                <div className="modal-body" style={{ padding: '24px' }}>
                                    {/* Upload Progress Bar */}
                                    {uploading && uploadProgress > 0 && (
                                        <div className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span style={{ fontWeight: 500, color: '#374151', fontSize: '14px' }}>
                                                    <i className="bi bi-cloud-upload me-2" style={{ color: '#4285f4' }}></i>
                                                    Uploading...
                                                </span>
                                                <span style={{ fontWeight: 600, color: '#4285f4' }}>{uploadProgress}%</span>
                                            </div>
                                            <div className="progress" style={{ height: '8px', borderRadius: '4px', backgroundColor: '#e5e7eb' }}>
                                                <div 
                                                    className="progress-bar" 
                                                    role="progressbar" 
                                                    style={{ 
                                                        width: `${uploadProgress}%`, 
                                                        background: 'linear-gradient(90deg, #4285f4 0%, #34a853 100%)',
                                                        borderRadius: '4px',
                                                        transition: 'width 0.3s ease'
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="row g-3">
                                        <div className="col-md-8">
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>Lesson Title <span style={{ color: '#ef4444' }}>*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={lessonFormData.title}
                                                onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                                                placeholder="e.g., Understanding Major Scales"
                                                required
                                                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>Content Type <span style={{ color: '#ef4444' }}>*</span></label>
                                            <select
                                                className="form-select"
                                                value={lessonFormData.content_type}
                                                onChange={(e) => setLessonFormData({ ...lessonFormData, content_type: e.target.value })}
                                                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                            >
                                                <option value="video">Video</option>
                                                <option value="audio">Audio</option>
                                                <option value="pdf">PDF Document</option>
                                                <option value="image">Image</option>
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>Description</label>
                                            <textarea
                                                className="form-control"
                                                value={lessonFormData.description}
                                                onChange={(e) => setLessonFormData({ ...lessonFormData, description: e.target.value })}
                                                placeholder="What will students learn in this lesson?"
                                                rows="2"
                                                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                            ></textarea>
                                        </div>
                                        
                                        {/* Learning Objectives */}
                                        <div className="col-12">
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                <i className="bi bi-list-check me-1" style={{ color: '#4285f4' }}></i>
                                                Learning Objectives
                                            </label>
                                            <textarea
                                                className="form-control"
                                                value={lessonFormData.objectives}
                                                onChange={(e) => setLessonFormData({ ...lessonFormData, objectives: e.target.value })}
                                                placeholder="Enter each objective on a new line:&#10;• Understand basic chord structures&#10;• Play the C major scale&#10;• Read sheet music notation"
                                                rows="4"
                                                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                            ></textarea>
                                            <small className="text-muted">Each line will be shown as a separate learning objective to students</small>
                                        </div>
                                        
                                        {/* Preview & Lock Toggles */}
                                        <div className="col-md-6">
                                            <div className="form-check form-switch" style={{ padding: '12px 16px', backgroundColor: '#fefce8', borderRadius: '8px', border: '1px solid #fef08a' }}>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="isPreviewSwitch"
                                                    checked={lessonFormData.is_preview}
                                                    onChange={(e) => setLessonFormData({ ...lessonFormData, is_preview: e.target.checked })}
                                                    style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                                                />
                                                <label className="form-check-label ms-2" htmlFor="isPreviewSwitch" style={{ fontWeight: 500, color: '#92400e', cursor: 'pointer' }}>
                                                    <i className="bi bi-eye me-1"></i>
                                                    Free Preview
                                                </label>
                                                <small className="d-block text-muted mt-1">Allow non-enrolled users to preview this lesson</small>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-check form-switch" style={{ padding: '12px 16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="isLockedSwitch"
                                                    checked={lessonFormData.is_locked}
                                                    onChange={(e) => setLessonFormData({ ...lessonFormData, is_locked: e.target.checked })}
                                                    style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                                                />
                                                <label className="form-check-label ms-2" htmlFor="isLockedSwitch" style={{ fontWeight: 500, color: '#dc2626', cursor: 'pointer' }}>
                                                    <i className="bi bi-lock me-1"></i>
                                                    Manually Locked
                                                </label>
                                                <small className="d-block text-muted mt-1">Override sequential unlock and lock this lesson</small>
                                            </div>
                                        </div>
                                        
                                        {/* Subscription Access Controls */}
                                        <div className="col-md-6">
                                            <div className="form-check form-switch" style={{ padding: '12px 16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="isPremiumSwitch"
                                                    checked={lessonFormData.is_premium}
                                                    onChange={(e) => setLessonFormData({ ...lessonFormData, is_premium: e.target.checked })}
                                                    style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                                                />
                                                <label className="form-check-label ms-2" htmlFor="isPremiumSwitch" style={{ fontWeight: 500, color: '#92400e', cursor: 'pointer' }}>
                                                    <i className="bi bi-star-fill me-1"></i>
                                                    Premium Content
                                                </label>
                                                <small className="d-block text-muted mt-1">Only premium/unlimited subscribers can access</small>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                <i className="bi bi-shield-lock me-1" style={{ color: '#8b5cf6' }}></i>
                                                Required Access Level
                                            </label>
                                            <select
                                                className="form-select"
                                                value={lessonFormData.required_access_level}
                                                onChange={(e) => setLessonFormData({ ...lessonFormData, required_access_level: e.target.value })}
                                                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                            >
                                                <option value="free">🟢 Free</option>
                                                <option value="basic">🔵 Basic</option>
                                                <option value="standard">🟣 Standard</option>
                                                <option value="premium">🟠 Premium</option>
                                            </select>
                                            <small className="text-muted">Minimum subscription tier needed for this lesson</small>
                                        </div>

                                        {/* Drag & Drop File Upload */}
                                        <div className="col-12">
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                Upload File {!editingLesson && <span style={{ color: '#ef4444' }}>*</span>}
                                            </label>
                                            <div
                                                onDragEnter={handleDragEnter}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                onClick={() => fileInputRef.current?.click()}
                                                style={{
                                                    border: isDragging ? '2px dashed #4285f4' : '2px dashed #d1d5db',
                                                    borderRadius: '12px',
                                                    padding: '32px 20px',
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    backgroundColor: isDragging ? '#eff6ff' : lessonFormData.file ? '#f0fdf4' : '#fafafa',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="d-none"
                                                    onChange={handleFileInputChange}
                                                    accept={
                                                        lessonFormData.content_type === 'video' ? 'video/*' :
                                                        lessonFormData.content_type === 'audio' ? 'audio/*' :
                                                        lessonFormData.content_type === 'pdf' ? '.pdf' :
                                                        lessonFormData.content_type === 'image' ? 'image/*' : '*'
                                                    }
                                                    required={!editingLesson}
                                                />
                                                {lessonFormData.file ? (
                                                    <div>
                                                        <i className="bi bi-check-circle-fill" style={{ fontSize: '36px', color: '#16a34a' }}></i>
                                                        <p style={{ fontWeight: 500, color: '#16a34a', marginTop: '12px', marginBottom: '4px' }}>
                                                            File Selected
                                                        </p>
                                                        <p style={{ color: '#374151', fontSize: '14px', marginBottom: '4px' }}>
                                                            {lessonFormData.file.name}
                                                        </p>
                                                        <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px' }}>
                                                            {formatFileSize(lessonFormData.file.size)} / {FILE_SIZE_LABELS[lessonFormData.content_type] || '50 MB'} max
                                                        </p>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setLessonFormData({ ...lessonFormData, file: null });
                                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                                            }}
                                                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px' }}
                                                        >
                                                            <i className="bi bi-x-circle me-1"></i>Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <i className={`bi ${isDragging ? 'bi-cloud-arrow-down-fill' : 'bi-cloud-upload'}`} 
                                                           style={{ fontSize: '36px', color: isDragging ? '#4285f4' : '#9ca3af' }}></i>
                                                        <p style={{ fontWeight: 500, color: isDragging ? '#4285f4' : '#374151', marginTop: '12px', marginBottom: '4px' }}>
                                                            {isDragging ? 'Drop your file here!' : 'Drag & drop your file here'}
                                                        </p>
                                                        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: 0 }}>
                                                            or <span style={{ color: '#4285f4', fontWeight: 500 }}>click to browse</span>
                                                        </p>
                                                        <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '8px', marginBottom: 0 }}>
                                                            Supports: {lessonFormData.content_type === 'video' ? 'MP4, MOV, AVI, MKV, WebM' :
                                                                       lessonFormData.content_type === 'audio' ? 'MP3, WAV, M4A, OGG, FLAC, AAC' :
                                                                       lessonFormData.content_type === 'pdf' ? 'PDF files' :
                                                                       lessonFormData.content_type === 'image' ? 'PNG, JPG, JPEG, GIF, WebP, SVG' : 'All files'}
                                                        </p>
                                                        <p style={{ 
                                                            color: '#4285f4', fontSize: '12px', marginTop: '4px', marginBottom: 0,
                                                            background: '#eff6ff', display: 'inline-block', 
                                                            padding: '2px 10px', borderRadius: '12px', fontWeight: 500
                                                        }}>
                                                            Max size: {FILE_SIZE_LABELS[lessonFormData.content_type] || '50 MB'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            {editingLesson && editingLesson.file && !lessonFormData.file && (
                                                <div className="mt-2 p-2" style={{ background: '#f3f4f6', borderRadius: '8px' }}>
                                                    <small className="text-muted">
                                                        <i className="bi bi-file-earmark me-1"></i>
                                                        Current file: <strong>{editingLesson.file.split('/').pop()}</strong>
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                        {(lessonFormData.content_type === 'video' || lessonFormData.content_type === 'audio') && (
                                            <div className="col-md-6">
                                                <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>Duration (seconds)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={lessonFormData.duration_seconds}
                                                    onChange={(e) => setLessonFormData({ ...lessonFormData, duration_seconds: parseInt(e.target.value) || 0 })}
                                                    placeholder="e.g., 300 for 5 minutes"
                                                    style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px' }}>
                                    <button type="button" className="btn" onClick={() => setShowLessonModal(false)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '10px 20px' }}>Cancel</button>
                                    <button type="submit" className="btn" disabled={uploading} style={{ background: '#4285f4', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px' }}>
                                        {uploading ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</>
                                        ) : (
                                            editingLesson ? 'Update Lesson' : 'Create Lesson'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ DOWNLOADABLES MODAL ============ */}
            {showDownloadablesModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content" style={{ border: 'none', borderRadius: '12px' }}>
                            <div className="modal-header" style={{ borderBottom: '1px solid #e5e7eb', padding: '20px 24px' }}>
                                <div>
                                    <h5 className="modal-title" style={{ fontWeight: 600, color: '#1a2332', marginBottom: '4px' }}>
                                        <i className="bi bi-download me-2" style={{ color: '#16a34a' }}></i>
                                        Manage Downloadables
                                    </h5>
                                    <small className="text-muted">
                                        Lesson: {currentLessonForDownloads?.title}
                                    </small>
                                </div>
                                <button type="button" className="btn-close" onClick={closeDownloadablesModal}></button>
                            </div>
                            <div className="modal-body" style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
                                
                                {/* Multi-File Upload Zone */}
                                <div className="mb-4">
                                    <div 
                                        className="text-center p-4"
                                        style={{
                                            border: '2px dashed #16a34a40',
                                            borderRadius: '12px',
                                            backgroundColor: '#f0fdf4',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => document.getElementById('multiFileInput').click()}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = '#16a34a';
                                            e.currentTarget.style.backgroundColor = '#dcfce7';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = '#16a34a40';
                                            e.currentTarget.style.backgroundColor = '#f0fdf4';
                                        }}
                                    >
                                        <input
                                            type="file"
                                            id="multiFileInput"
                                            multiple
                                            className="d-none"
                                            onChange={handleMultiFileSelect}
                                        />
                                        <i className="bi bi-cloud-upload" style={{ fontSize: '32px', color: '#16a34a' }}></i>
                                        <p style={{ fontWeight: 500, color: '#16a34a', marginTop: '12px', marginBottom: '4px' }}>
                                            Drop multiple files here or click to browse
                                        </p>
                                        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: 0 }}>
                                            Upload PDFs, audio files, sheet music, and more
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Multi-File Queue */}
                                {multipleFiles.length > 0 && (
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 style={{ fontWeight: 600, color: '#374151', margin: 0 }}>
                                                <i className="bi bi-files me-2" style={{ color: '#16a34a' }}></i>
                                                Files to Upload ({multipleFiles.length})
                                            </h6>
                                            <button
                                                className="btn btn-sm"
                                                onClick={uploadAllFiles}
                                                disabled={uploadingMultiple}
                                                style={{ 
                                                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', 
                                                    color: '#fff', 
                                                    border: 'none', 
                                                    borderRadius: '6px',
                                                    padding: '6px 12px',
                                                    fontWeight: 500,
                                                    fontSize: '13px',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {uploadingMultiple ? (
                                                    <><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</>
                                                ) : (
                                                    <><i className="bi bi-cloud-upload me-2"></i>Upload All</>
                                                )}
                                            </button>
                                        </div>
                                        <div className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {multipleFiles.map((item) => (
                                                <div 
                                                    key={item.id}
                                                    className="list-group-item"
                                                    style={{ 
                                                        padding: '12px 16px', 
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        marginBottom: '8px',
                                                        backgroundColor: item.status === 'completed' ? '#f0fdf4' : 
                                                                         item.status === 'error' ? '#fef2f2' : '#fff'
                                                    }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div className="d-flex align-items-center gap-3" style={{ flex: 1 }}>
                                                            <div 
                                                                className="rounded-2 d-flex align-items-center justify-content-center"
                                                                style={{ 
                                                                    width: '36px', 
                                                                    height: '36px', 
                                                                    backgroundColor: `${getDownloadableTypeColor(item.file_type)}15`
                                                                }}
                                                            >
                                                                {item.status === 'uploading' ? (
                                                                    <span className="spinner-border spinner-border-sm" style={{ color: '#4285f4' }}></span>
                                                                ) : item.status === 'completed' ? (
                                                                    <i className="bi bi-check-circle-fill" style={{ color: '#16a34a' }}></i>
                                                                ) : item.status === 'error' ? (
                                                                    <i className="bi bi-exclamation-circle-fill" style={{ color: '#dc2626' }}></i>
                                                                ) : (
                                                                    <i className={`bi ${getDownloadableTypeIcon(item.file_type)}`} 
                                                                       style={{ color: getDownloadableTypeColor(item.file_type) }}></i>
                                                                )}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm"
                                                                    value={item.title}
                                                                    onChange={(e) => updateMultiFileItem(item.id, { title: e.target.value })}
                                                                    placeholder="Title"
                                                                    disabled={item.status === 'uploading' || item.status === 'completed'}
                                                                    style={{ 
                                                                        border: 'none', 
                                                                        padding: '0', 
                                                                        fontWeight: 500,
                                                                        background: 'transparent'
                                                                    }}
                                                                />
                                                                <div className="d-flex gap-2 align-items-center mt-1">
                                                                    <select
                                                                        className="form-select form-select-sm"
                                                                        value={item.file_type}
                                                                        onChange={(e) => updateMultiFileItem(item.id, { file_type: e.target.value })}
                                                                        disabled={item.status === 'uploading' || item.status === 'completed'}
                                                                        style={{ 
                                                                            width: 'auto', 
                                                                            fontSize: '11px', 
                                                                            padding: '2px 8px',
                                                                            border: '1px solid #e5e7eb',
                                                                            borderRadius: '4px'
                                                                        }}
                                                                    >
                                                                        <option value="pdf">PDF</option>
                                                                        <option value="sheet_music">Sheet Music</option>
                                                                        <option value="audio_slow">Audio (Slow)</option>
                                                                        <option value="audio_fast">Audio (Fast)</option>
                                                                        <option value="audio_playalong">Play-along</option>
                                                                        <option value="worksheet">Worksheet</option>
                                                                        <option value="other">Other</option>
                                                                    </select>
                                                                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                                        {(item.file.size / 1024).toFixed(0)} KB
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {item.status !== 'completed' && item.status !== 'uploading' && (
                                                            <button
                                                                className="btn btn-sm"
                                                                onClick={() => removeMultiFileItem(item.id)}
                                                                style={{ 
                                                                    background: '#fee2e2', 
                                                                    color: '#dc2626', 
                                                                    border: 'none', 
                                                                    borderRadius: '6px',
                                                                    padding: '4px 6px',
                                                                    minWidth: '32px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                <i className="bi bi-x"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                    {item.status === 'uploading' && multiUploadProgress[item.id] !== undefined && (
                                                        <div className="progress mt-2" style={{ height: '4px', borderRadius: '2px' }}>
                                                            <div 
                                                                className="progress-bar" 
                                                                style={{ 
                                                                    width: `${multiUploadProgress[item.id]}%`,
                                                                    background: 'linear-gradient(90deg, #4285f4 0%, #16a34a 100%)'
                                                                }}
                                                            ></div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Divider */}
                                {(multipleFiles.length > 0 || downloadables.length > 0) && (
                                    <div className="d-flex align-items-center gap-3 my-4">
                                        <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                                        <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 500 }}>
                                            {downloadables.length > 0 ? 'EXISTING FILES' : 'OR ADD SINGLE FILE'}
                                        </span>
                                        <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                                    </div>
                                )}

                                {/* Single File Form (collapsed by default) */}
                                {!showAddDownloadableForm && multipleFiles.length === 0 && (
                                    <button
                                        className="btn mb-4"
                                        onClick={() => setShowAddDownloadableForm(true)}
                                        style={{ 
                                            background: '#f3f4f6', 
                                            color: '#374151', 
                                            border: '1px dashed #d1d5db', 
                                            borderRadius: '8px', 
                                            padding: '10px 16px',
                                            fontWeight: 500,
                                            fontSize: '13px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <i className="bi bi-plus-lg"></i>
                                        Add Single File Manually
                                    </button>
                                )}
                                {showAddDownloadableForm && (
                                    <div className="card mb-4" style={{ border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                                        <div className="card-header" style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '16px 20px' }}>
                                            <h6 style={{ margin: 0, fontWeight: 600, color: '#374151' }}>
                                                <i className="bi bi-plus-circle me-2" style={{ color: '#16a34a' }}></i>
                                                Add Single Downloadable
                                            </h6>
                                        </div>
                                        <div className="card-body" style={{ padding: '20px' }}>
                                            <form onSubmit={handleDownloadableSubmit}>
                                                <div className="row g-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                            Title <span style={{ color: '#ef4444' }}>*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={downloadableFormData.title}
                                                            onChange={(e) => setDownloadableFormData({ ...downloadableFormData, title: e.target.value })}
                                                            placeholder="e.g., Practice Sheet"
                                                            required
                                                            style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                            File Type <span style={{ color: '#ef4444' }}>*</span>
                                                        </label>
                                                        <select
                                                            className="form-select"
                                                            value={downloadableFormData.file_type}
                                                            onChange={(e) => setDownloadableFormData({ ...downloadableFormData, file_type: e.target.value })}
                                                            style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                                        >
                                                            <option value="pdf">PDF Document</option>
                                                            <option value="sheet_music">Sheet Music</option>
                                                            <option value="audio_slow">Audio (Slow Tempo)</option>
                                                            <option value="audio_fast">Audio (Fast Tempo)</option>
                                                            <option value="audio_playalong">Audio (Play-along)</option>
                                                            <option value="worksheet">Worksheet</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                            File <span style={{ color: '#ef4444' }}>*</span>
                                                        </label>
                                                        <input
                                                            type="file"
                                                            ref={downloadableFileRef}
                                                            className="form-control"
                                                            onChange={(e) => setDownloadableFormData({ ...downloadableFormData, file: e.target.files[0] })}
                                                            required
                                                            style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                                        />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>Description</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={downloadableFormData.description}
                                                            onChange={(e) => setDownloadableFormData({ ...downloadableFormData, description: e.target.value })}
                                                            placeholder="Brief description of this file"
                                                            style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-2 mt-4">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm"
                                                        onClick={() => {
                                                            setShowAddDownloadableForm(false);
                                                            setDownloadableFormData({ title: '', file_type: 'pdf', file: null, description: '', order: 0 });
                                                            if (downloadableFileRef.current) downloadableFileRef.current.value = '';
                                                        }}
                                                        style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="btn btn-sm"
                                                        disabled={savingDownloadable}
                                                        style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px' }}
                                                    >
                                                        {savingDownloadable ? (
                                                            <><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</>
                                                        ) : (
                                                            <><i className="bi bi-cloud-upload me-2"></i>Upload</>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                {/* Downloadables List */}
                                {loadingDownloadables ? (
                                    <div className="text-center py-5">
                                        <LoadingSpinner size="sm" text="Loading downloadables..." />
                                    </div>
                                ) : downloadables.length > 0 ? (
                                    <div className="list-group">
                                        {downloadables.map((item, index) => (
                                            <div 
                                                key={item.id} 
                                                className="list-group-item d-flex justify-content-between align-items-center"
                                                style={{ 
                                                    padding: '16px 20px', 
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: index === 0 ? '12px 12px 0 0' : index === downloadables.length - 1 ? '0 0 12px 12px' : '0',
                                                    borderTop: index === 0 ? '1px solid #e5e7eb' : 'none'
                                                }}
                                            >
                                                <div className="d-flex align-items-center gap-3">
                                                    <div 
                                                        className="rounded-2 d-flex align-items-center justify-content-center"
                                                        style={{ 
                                                            width: '44px', 
                                                            height: '44px', 
                                                            backgroundColor: `${getDownloadableTypeColor(item.file_type)}15`
                                                        }}
                                                    >
                                                        <i 
                                                            className={`bi ${getDownloadableTypeIcon(item.file_type)}`} 
                                                            style={{ fontSize: '20px', color: getDownloadableTypeColor(item.file_type) }}
                                                        ></i>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 500, color: '#1a2332' }}>{item.title}</div>
                                                        <div className="d-flex gap-2 mt-1">
                                                            <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '11px' }}>
                                                                {item.file_type_display || item.file_type.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                            {item.file_size_formatted && (
                                                                <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '11px' }}>
                                                                    {item.file_size_formatted}
                                                                </span>
                                                            )}
                                                            <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', fontSize: '11px' }}>
                                                                <i className="bi bi-download me-1"></i>
                                                                {item.download_count || 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <a
                                                        href={item.file}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-sm"
                                                        style={{ background: '#e3f2fd', color: '#1976d2', border: 'none', borderRadius: '6px', padding: '6px 10px' }}
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </a>
                                                    <button
                                                        className="btn btn-sm"
                                                        onClick={() => handleDeleteDownloadable(item.id)}
                                                        style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', padding: '6px 10px' }}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="bi bi-inbox" style={{ fontSize: '48px', color: '#d1d5db' }}></i>
                                        <h6 className="mt-3" style={{ color: '#6b7280' }}>No Downloadables Yet</h6>
                                        <p className="text-muted" style={{ fontSize: '14px' }}>
                                            Add practice files, sheet music, or audio tracks for this lesson
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px' }}>
                                <button 
                                    type="button" 
                                    className="btn btn-sm" 
                                    onClick={closeDownloadablesModal}
                                    style={{ background: '#4285f4', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px' }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminLessonManagement;
