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
 * @param {string} props.basePath - Base route path (e.g., '/admin-panel/lesson-management' or '/teacher/course-management')
 * @param {string} props.pageTitle - Page title to display
 * @param {boolean} props.showTeacherSelect - Whether to show teacher selection dropdown
 * @param {boolean} props.showAnalytics - Whether to show analytics button
 */
const AdminLessonManagement = ({
    userType = 'admin',
    teacherId = null,
    basePath = '/admin-panel/lesson-management',
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
        interaction_type: 'content',
        play_along_track_type: 'backing_track',
        practical_type: 'record_rhythm',
        assignment_prompt: '',
        practical_submission_type: 'audio',
        file: null,
        youtube_url: '',
        duration_seconds: 0,
        objectives: '',
        repeat_after_me_enabled: false,
        repeat_after_me_prompt: '',
        repeat_after_me_audio: null,
        teacher_voice_audio: null,
        is_preview: false,
        is_locked: false,
        is_premium: false,
        required_access_level: 'free'
    });
    const [clearExistingFile, setClearExistingFile] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const repeatAudioInputRef = useRef(null);
    const teacherVoiceAudioInputRef = useRef(null);
    
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
    // Block Builder States
    const [lessonBuilderTab, setLessonBuilderTab] = useState('info'); // 'info' | 'blocks'
    const [lessonBlocks, setLessonBlocks] = useState([]);
    const [lessonBlocksLoading, setLessonBlocksLoading] = useState(false);
    const [expandedBlockId, setExpandedBlockId] = useState(null);
    const [blockEditData, setBlockEditData] = useState({});
    const [savingBlockId, setSavingBlockId] = useState(null);
    const [blockAchievements, setBlockAchievements] = useState([]);
    const [loadingBlockAchievements, setLoadingBlockAchievements] = useState(false);
    const [blockAssignmentTemplates, setBlockAssignmentTemplates] = useState([]);
    const [loadingBlockAssignmentTemplates, setLoadingBlockAssignmentTemplates] = useState(false);
    const [paletteTab, setPaletteTab] = useState('blocks');
    const [libraryBlocks, setLibraryBlocks] = useState([]);
    const [loadingLibrary, setLoadingLibrary] = useState(false);
    const [libraryTypeFilter, setLibraryTypeFilter] = useState('all');
    const [savingToLibraryId, setSavingToLibraryId] = useState(null);
    
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
                interaction_type: 'content',
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
                interaction_type: 'content',
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
                interaction_type: 'content',
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
                interaction_type: 'content',
                objectives: '• Get a taste of the course content\n• See the teaching style\n• Decide if this course is right for you',
                is_preview: true,
                is_locked: false
            }
        },
        {
            id: 'play_along',
            name: 'Play Along',
            icon: 'bi-headphones',
            color: '#22c55e',
            description: 'Immersive practice with backing track',
            defaults: {
                content_type: 'audio',
                interaction_type: 'play_along',
                play_along_track_type: 'backing_track',
                objectives: '• Put on headphones\n• Press play\n• Practice along with the track',
                is_preview: false,
                is_locked: false
            }
        },
        {
            id: 'practice_with_teacher',
            name: 'Practice with Teacher',
            icon: 'bi-person-video3',
            color: '#f97316',
            description: 'Teacher-guided session — student plays along with teacher voice',
            defaults: {
                content_type: 'audio',
                interaction_type: 'practice_with_teacher',
                objectives: '• Put on headphones\n• Listen to your teacher explain the exercise\n• Play along with the track\n• Practice until it feels natural',
                is_preview: false,
                is_locked: false
            }
        },
        {
            id: 'practical_assignment',
            name: 'Practical Assignment',
            icon: 'bi-music-note-list',
            color: '#16a34a',
            description: 'Student records & submits — play rhythm, record embouchure, practice backing track',
            defaults: {
                content_type: 'audio',
                interaction_type: 'practical_assignment',
                practical_type: 'record_rhythm',
                practical_submission_type: 'audio',
                objectives: '• Read the assignment prompt carefully\n• Practice before recording\n• Record your best attempt\n• Submit to your teacher',
                is_preview: false,
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
                interaction_type: 'content',
                objectives: '',
                is_preview: false,
                is_locked: false
            }
        }
    ];
    
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const blockPaletteItems = [
        { type: 'video',           label: 'Teacher Video',   icon: 'bi-camera-video-fill',    color: '#3b82f6' },
        { type: 'audio',           label: 'Practice Audio',  icon: 'bi-music-note-beamed',    color: '#8b5cf6' },
        { type: 'image',           label: 'Image/Diagram',   icon: 'bi-image',                color: '#06b6d4' },
        { type: 'repeat_after_me', label: 'Repeat After Me', icon: 'bi-arrow-repeat',         color: '#f97316' },
        { type: 'checklist',       label: 'Checklist',       icon: 'bi-check2-square',        color: '#16a34a' },
        { type: 'timer',           label: 'Practice Timer',  icon: 'bi-stopwatch',            color: '#ef4444' },
        { type: 'quiz',            label: 'Quiz',            icon: 'bi-question-circle-fill', color: '#f59e0b' },
        { type: 'submission',      label: 'Submission',      icon: 'bi-mic-fill',             color: '#ec4899' },
        { type: 'badge',           label: 'Reward Badge',    icon: 'bi-award-fill',           color: '#7c3aed' },
        { type: 'assignment',      label: 'Assignment',      icon: 'bi-journal-text',         color: '#0891b2' },
        { type: 'practice_counter', label: 'Practice Counter', icon: 'bi-hand-index-thumb-fill', color: '#0e7490' },
    ];

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
                url = `${baseUrl}/teacher-course/${effectiveTeacherId}/`;
            } else {
                // For admin, fetch all courses
                url = `${baseUrl}/course/`;
            }
            // The course endpoint is paginated — follow "next" so ALL courses
            // load (otherwise courses beyond page 1 silently disappear).
            let all = [];
            let nextUrl = url;
            while (nextUrl) {
                const response = await axios.get(nextUrl);
                const data = response.data;
                if (Array.isArray(data)) { all = all.concat(data); nextUrl = null; }
                else { all = all.concat(data.results || []); nextUrl = data.next; }
            }
            setCourses(all);
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
        setLessonBuilderTab('info');
        setLessonBlocks([]);
        setShowTemplateSelector(true); // Show template selector first
        setClearExistingFile(false);
        setLessonFormData({
            title: '',
            description: '',
            content_type: 'video',
            interaction_type: 'content',
            play_along_track_type: 'backing_track',
            practical_type: 'record_rhythm',
            assignment_prompt: '',
            practical_submission_type: 'audio',
            file: null,
            youtube_url: '',
            duration_seconds: 0,
            objectives: '',
            repeat_after_me_enabled: false,
            repeat_after_me_prompt: '',
            repeat_after_me_audio: null,
            teacher_voice_audio: null,
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
            interaction_type: template.defaults.interaction_type || 'content',
            play_along_track_type: template.defaults.play_along_track_type || 'backing_track',
            practical_type: template.defaults.practical_type || 'record_rhythm',
            practical_submission_type: template.defaults.practical_submission_type || 'audio',
            assignment_prompt: '',
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
        setClearExistingFile(false);
        let parsedConfig = {};
        if (lesson.interaction_config) {
            if (typeof lesson.interaction_config === 'string') {
                try {
                    parsedConfig = JSON.parse(lesson.interaction_config);
                } catch (err) {
                    parsedConfig = {};
                }
            } else {
                parsedConfig = lesson.interaction_config;
            }
        }
        setLessonFormData({
            title: lesson.title,
            description: lesson.description || '',
            content_type: lesson.content_type,
            interaction_type: lesson.interaction_type || 'content',
            play_along_track_type: parsedConfig.track_type || 'backing_track',
            practical_type: parsedConfig.practical_type || 'record_rhythm',
            assignment_prompt: parsedConfig.assignment_prompt || '',
            practical_submission_type: parsedConfig.submission_type || 'audio',
            file: null,
            youtube_url: lesson.youtube_url || '',
            duration_seconds: lesson.duration_seconds,
            objectives: lesson.objectives || '',
            repeat_after_me_enabled: !!lesson.repeat_after_me_enabled,
            repeat_after_me_prompt: lesson.repeat_after_me_prompt || '',
            repeat_after_me_audio: null,
            teacher_voice_audio: null,
            is_preview: lesson.is_preview || false,
            is_locked: lesson.is_locked || false,
            is_premium: lesson.is_premium || false,
            required_access_level: lesson.required_access_level || 'free'
        });
        setUploadProgress(0);
        setLessonBuilderTab('info');
        setLessonBlocks([]);
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
            setClearExistingFile(false);
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
            setClearExistingFile(false);
        }
    };

    const handleLessonSubmit = async (e) => {
        e.preventDefault();
        
        // Validate file for new lessons (file not required if youtube_url provided)
        if (!editingLesson && !lessonFormData.file && !lessonFormData.youtube_url) {
            Swal.fire('Error', 'Please select a file to upload or provide a YouTube URL', 'error');
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
            formData.append('interaction_type', lessonFormData.interaction_type || 'content');
            const interactionConfig = lessonFormData.interaction_type === 'play_along'
                ? { track_type: lessonFormData.play_along_track_type || 'backing_track' }
                : lessonFormData.interaction_type === 'practical_assignment'
                ? {
                    practical_type: lessonFormData.practical_type || 'record_rhythm',
                    assignment_prompt: lessonFormData.assignment_prompt || '',
                    submission_type: lessonFormData.practical_submission_type || 'audio',
                  }
                : {};
            formData.append('interaction_config', JSON.stringify(interactionConfig));
            formData.append('repeat_after_me_enabled', lessonFormData.repeat_after_me_enabled);
            formData.append('repeat_after_me_prompt', lessonFormData.repeat_after_me_prompt || '');
            formData.append('is_preview', lessonFormData.is_preview);
            formData.append('is_locked', lessonFormData.is_locked);
            formData.append('is_premium', lessonFormData.is_premium);
            formData.append('required_access_level', lessonFormData.required_access_level || 'free');
            if (lessonFormData.repeat_after_me_audio) {
                formData.append('repeat_after_me_audio', lessonFormData.repeat_after_me_audio);
            }
            if (lessonFormData.teacher_voice_audio) {
                formData.append('teacher_voice_audio', lessonFormData.teacher_voice_audio);
            }
            if (lessonFormData.youtube_url) {
                formData.append('youtube_url', lessonFormData.youtube_url);
            }
            if (lessonFormData.file) {
                formData.append('file', lessonFormData.file);
            }
            if (editingLesson && clearExistingFile) {
                formData.append('clear_file', 'true');
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

    // ─── Lesson Block Builder helpers ───────────────────────────────────────────
    const getBlockRequestParams = () => ({
        requester_type: userType === 'teacher' ? 'teacher' : 'admin',
        requester_id:   userType === 'teacher' ? effectiveTeacherId : localStorage.getItem('adminId'),
    });

    const fetchLessonBlocks = async (lessonId) => {
        if (!lessonId) return;
        setLessonBlocksLoading(true);
        try {
            const res = await axios.get(`${baseUrl}/lesson/${lessonId}/blocks/`);
            setLessonBlocks(res.data.blocks || []);
        } catch (err) {
            console.error('Error fetching lesson blocks:', err);
        } finally {
            setLessonBlocksLoading(false);
        }
    };

    const addLessonBlock = async (blockType) => {
        if (!editingLesson?.id) return;
        try {
            const res = await axios.post(`${baseUrl}/lesson/${editingLesson.id}/blocks/`, {
                ...getBlockRequestParams(),
                block_type: blockType,
            });
            setLessonBlocks(prev => [...prev, res.data]);
        } catch (err) {
            console.error('Error adding block:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not add block', confirmButtonColor: '#4285f4' });
        }
    };

    const deleteLessonBlock = async (blockId) => {
        const result = await Swal.fire({
            title: 'Remove block?', text: 'This will permanently delete this block.',
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete',
        });
        if (!result.isConfirmed) return;
        try {
            await axios.delete(`${baseUrl}/lesson-block/${blockId}/`, { params: getBlockRequestParams() });
            setLessonBlocks(prev => prev.filter(b => b.id !== blockId));
        } catch (err) {
            console.error('Error deleting block:', err);
        }
    };

    const reorderLessonBlocks = async (updatedBlocks) => {
        if (!editingLesson?.id) return;
        setLessonBlocks(updatedBlocks);
        try {
            await axios.post(`${baseUrl}/lesson/${editingLesson.id}/blocks/reorder/`, {
                ...getBlockRequestParams(),
                order: updatedBlocks.map((b, i) => ({ id: b.id, order: i })),
            });
        } catch (err) {
            console.error('Reorder failed:', err);
        }
    };

    const moveLessonBlockUp = (block, idx) => {
        if (idx === 0) return;
        const updated = [...lessonBlocks];
        [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
        reorderLessonBlocks(updated);
    };

    const moveLessonBlockDown = (block, idx) => {
        if (idx === lessonBlocks.length - 1) return;
        const updated = [...lessonBlocks];
        [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
        reorderLessonBlocks(updated);
    };

    const fetchBlockAchievements = async () => {
        if (blockAchievements.length > 0) return;
        setLoadingBlockAchievements(true);
        try {
            const res = await axios.get(`${baseUrl}/achievements/`);
            setBlockAchievements(res.data || []);
        } catch (err) {
            console.error('Could not load achievements for badge block', err);
        } finally {
            setLoadingBlockAchievements(false);
        }
    };

    const fetchBlockAssignmentTemplates = async () => {
        if (blockAssignmentTemplates.length > 0) return;
        const teacherId = effectiveTeacherId || courses.find(c => c.id === selectedCourse)?.teacher?.id;
        if (!teacherId) return;
        setLoadingBlockAssignmentTemplates(true);
        try {
            const res = await axios.get(`${baseUrl}/teacher/${teacherId}/assignment-templates/`);
            setBlockAssignmentTemplates(res.data || []);
        } catch (err) {
            console.error('Could not load assignment templates for assignment block', err);
        } finally {
            setLoadingBlockAssignmentTemplates(false);
        }
    };

    const fetchLibraryBlocks = async () => {
        const teacherId = effectiveTeacherId || courses.find(c => c.id === selectedCourse)?.teacher?.id;
        if (!teacherId) return;
        setLoadingLibrary(true);
        try {
            const params = getBlockRequestParams();
            const res = await axios.get(`${baseUrl}/teacher/${teacherId}/library-blocks/`, { params });
            setLibraryBlocks(res.data?.blocks || []);
        } catch (err) {
            console.error('Could not load library blocks', err);
        } finally {
            setLoadingLibrary(false);
        }
    };

    const saveBlockToLibrary = async (block) => {
        const { value: libName } = await Swal.fire({
            title: 'Save to Library',
            input: 'text',
            inputLabel: 'Name for this library block',
            inputValue: block.library_name || block.title || '',
            inputPlaceholder: 'e.g. "Intro Quiz" or "Breathing Exercise"',
            showCancelButton: true,
            confirmButtonText: 'Save',
            confirmButtonColor: '#4285f4',
            inputValidator: v => !v.trim() ? 'Please enter a name' : null,
        });
        if (!libName) return;
        setSavingToLibraryId(block.id);
        try {
            const params = getBlockRequestParams();
            const fd = new FormData();
            fd.append('requester_type', params.requester_type);
            fd.append('requester_id',   params.requester_id);
            fd.append('is_library_item', 'true');
            fd.append('library_name', libName.trim());
            const res = await axios.put(`${baseUrl}/lesson-block/${block.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setLessonBlocks(prev => prev.map(b => b.id === block.id ? res.data : b));
            setLibraryBlocks(prev => {
                const without = prev.filter(lb => lb.id !== block.id);
                return [...without, { id: res.data.id, block_type: res.data.block_type, title: res.data.title, library_name: res.data.library_name, file: res.data.file, config: res.data.config, lesson_title: '' }]
                    .sort((a, b) => (a.library_name || '').localeCompare(b.library_name || ''));
            });
            Swal.fire({ icon: 'success', title: 'Saved!', text: `"${libName.trim()}" added to your library.`, timer: 2000, showConfirmButton: false });
        } catch (err) {
            console.error('Error saving to library:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not save to library.', confirmButtonColor: '#4285f4' });
        } finally {
            setSavingToLibraryId(null);
        }
    };

    const cloneLibraryBlock = async (libBlock) => {
        if (!editingLesson?.id) return;
        try {
            const params = getBlockRequestParams();
            const fd = new FormData();
            fd.append('requester_type', params.requester_type);
            fd.append('requester_id',   params.requester_id);
            fd.append('block_type', libBlock.block_type);
            fd.append('title', libBlock.library_name || libBlock.title || '');
            fd.append('config', JSON.stringify(libBlock.config || {}));
            const res = await axios.post(`${baseUrl}/lesson/${editingLesson.id}/blocks/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setLessonBlocks(prev => [...prev, res.data]);
            setPaletteTab('blocks');
        } catch (err) {
            console.error('Error cloning library block:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not add block to lesson.', confirmButtonColor: '#4285f4' });
        }
    };

    const toggleBlockExpand = (block) => {
        if (expandedBlockId === block.id) { setExpandedBlockId(null); return; }
        setBlockEditData(prev => ({
            ...prev,
            [block.id]: {
                title:           block.title || '',
                caption:         block.config?.caption || '',
                alt_text:        block.config?.alt_text || '',
                youtube_url:     block.config?.youtube_url || '',
                prompt:          block.config?.prompt || '',
                file:            null,
                checklist_items:       Array.isArray(block.config?.items) ? [...block.config.items] : [''],
                timer_minutes:         block.config?.minutes  ?? 1,
                timer_seconds:         block.config?.seconds  ?? 0,
                timer_label:           block.config?.label    || '',
                quiz_questions:        Array.isArray(block.config?.questions)
                    ? block.config.questions.map(q => ({ text: q.text || '', options: q.options || ['', '', '', ''], correct: q.correct ?? 0, points: q.points || 1 }))
                    : [],
                submission_type:       block.config?.submission_type || 'audio',
                submission_prompt:     block.config?.prompt || '',
                badge_achievement_id:  block.config?.achievement_id  || '',
                assignment_template_id: block.config?.template_id    || '',
                assignment_prompt:     block.config?.assignment_prompt || '',
                practice_prompt:       block.config?.prompt  || '',
                practice_target:       block.config?.target  ?? 3,
            }
        }));
        if (block.block_type === 'badge')      fetchBlockAchievements();
        if (block.block_type === 'assignment') fetchBlockAssignmentTemplates();
        setExpandedBlockId(block.id);
    };

    const updateBlockEditData = (blockId, changes) => {
        setBlockEditData(prev => ({ ...prev, [blockId]: { ...prev[blockId], ...changes } }));
    };

    const saveBlockConfig = async (block) => {
        setSavingBlockId(block.id);
        const ed = blockEditData[block.id] || {};
        const params = getBlockRequestParams();
        try {
            const fd = new FormData();
            fd.append('requester_type', params.requester_type);
            fd.append('requester_id',   params.requester_id);
            fd.append('title', ed.title || '');
            const cfg = {};
            if (block.block_type === 'video')           { cfg.youtube_url = ed.youtube_url || ''; cfg.caption = ed.caption || ''; }
            else if (block.block_type === 'audio')      { cfg.caption = ed.caption || ''; }
            else if (block.block_type === 'image')      { cfg.caption = ed.caption || ''; cfg.alt_text = ed.alt_text || ''; }
            else if (block.block_type === 'repeat_after_me') { cfg.prompt = ed.prompt || ''; }
            else if (block.block_type === 'checklist')  { cfg.items = (ed.checklist_items || ['']).filter(s => s.trim() !== ''); }
            else if (block.block_type === 'timer')      { cfg.minutes = parseInt(ed.timer_minutes) || 0; cfg.seconds = Math.min(59, parseInt(ed.timer_seconds) || 0); cfg.label = ed.timer_label || ''; }
            else if (block.block_type === 'quiz')       { cfg.questions = (ed.quiz_questions || []).filter(q => q.text.trim() !== ''); }
            else if (block.block_type === 'submission') { cfg.submission_type = ed.submission_type || 'audio'; cfg.prompt = ed.submission_prompt || ''; }
            else if (block.block_type === 'badge')      { cfg.achievement_id = ed.badge_achievement_id ? Number(ed.badge_achievement_id) : null; }
            else if (block.block_type === 'assignment') { cfg.template_id = ed.assignment_template_id ? Number(ed.assignment_template_id) : null; cfg.assignment_prompt = ed.assignment_prompt || ''; }
            else if (block.block_type === 'practice_counter') { cfg.prompt = ed.practice_prompt || ''; cfg.target = Math.max(1, parseInt(ed.practice_target) || 3); }
            fd.append('config', JSON.stringify(cfg));
            if (ed.file) fd.append('file', ed.file);
            const res = await axios.put(`${baseUrl}/lesson-block/${block.id}/`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setLessonBlocks(prev => prev.map(b => b.id === block.id ? res.data : b));
            setSavingBlockId(`done_${block.id}`);
            setTimeout(() => setSavingBlockId(null), 1800);
        } catch (err) {
            console.error('Error saving block:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not save block', confirmButtonColor: '#4285f4' });
            setSavingBlockId(null);
        }
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
                                            <div className="d-flex align-items-center gap-2" style={{ flexShrink: 0 }}>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={(e) => { e.stopPropagation(); openAddLessonModal(module.id); }}
                                                    title="Add Lesson"
                                                    style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: '6px', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '34px' }}
                                                >
                                                    <i className="bi bi-plus-circle" style={{ fontSize: '16px' }}></i>
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
                                                                            {lesson.youtube_url && (
                                                                                <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: 500 }}>
                                                                                    <i className="bi bi-youtube me-1"></i>
                                                                                    YouTube
                                                                                </span>
                                                                            )}
                                                                            {lesson.interaction_type === 'play_along' && (
                                                                                <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 500 }}>
                                                                                    <i className="bi bi-headphones me-1"></i>
                                                                                    Play Along
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex gap-2" style={{ flexShrink: 0 }}>
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
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
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
                                    {editingLesson && (
                                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                                            <button type="button"
                                                onClick={() => setLessonBuilderTab('info')}
                                                style={{ padding: '5px 14px', fontSize: 13, fontWeight: 600, borderRadius: 20, border: '1.5px solid', borderColor: lessonBuilderTab === 'info' ? '#4285f4' : '#e2e8f0', background: lessonBuilderTab === 'info' ? '#eff6ff' : '#f9fafb', color: lessonBuilderTab === 'info' ? '#4285f4' : '#64748b', cursor: 'pointer' }}>
                                                <i className="bi bi-sliders me-1"></i>Lesson Info
                                            </button>
                                            <button type="button"
                                                onClick={() => { setLessonBuilderTab('blocks'); if (editingLesson?.id) fetchLessonBlocks(editingLesson.id); }}
                                                style={{ padding: '5px 14px', fontSize: 13, fontWeight: 600, borderRadius: 20, border: '1.5px solid', borderColor: lessonBuilderTab === 'blocks' ? '#8b5cf6' : '#e2e8f0', background: lessonBuilderTab === 'blocks' ? '#f5f3ff' : '#f9fafb', color: lessonBuilderTab === 'blocks' ? '#8b5cf6' : '#64748b', cursor: 'pointer' }}>
                                                <i className="bi bi-layout-text-sidebar-reverse me-1"></i>Block Builder
                                                {lessonBlocks.length > 0 && <span style={{ marginLeft: 6, background: '#8b5cf6', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{lessonBlocks.length}</span>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button type="button" className="btn-close" onClick={() => { setShowLessonModal(false); setDuplicateContext(null); }}></button>
                            </div>
                            <form onSubmit={handleLessonSubmit}>
                                <div className="modal-body" style={{ padding: '24px' }}>
                                    {lessonBuilderTab === 'info' && (<>
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
                                        <div className="col-md-6">
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
                                        <div className="col-md-3">
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
                                        <div className="col-md-3">
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>Lesson Mode</label>
                                            <select
                                                className="form-select"
                                                value={lessonFormData.interaction_type}
                                                onChange={(e) => {
                                                    const nextType = e.target.value;
                                                    setLessonFormData(prev => ({
                                                        ...prev,
                                                        interaction_type: nextType,
                                                        content_type: (nextType === 'play_along' || nextType === 'practice_with_teacher' || nextType === 'practical_assignment') ? 'audio' : prev.content_type
                                                    }));
                                                }}
                                                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                            >
                                                <option value="content">Standard</option>
                                                <option value="play_along">Play Along</option>
                                                <option value="practice_with_teacher">Practice with Teacher</option>
                                                <option value="practical_assignment">Practical Assignment</option>
                                            </select>
                                        </div>
                                        {lessonFormData.interaction_type === 'practical_assignment' && (
                                            <div className="col-12">
                                                <div style={{ padding: '16px 18px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                        <i className="bi bi-music-note-list" style={{ color: '#16a34a', fontSize: '18px' }}></i>
                                                        <span style={{ fontWeight: 600, color: '#14532d' }}>Practical Assignment Setup</span>
                                                    </div>
                                                    <div className="row g-3">
                                                        <div className="col-md-6">
                                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151', fontSize: '13px' }}>Task Type</label>
                                                            <select
                                                                className="form-select"
                                                                value={lessonFormData.practical_type}
                                                                onChange={(e) => setLessonFormData({ ...lessonFormData, practical_type: e.target.value })}
                                                                style={{ border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}
                                                            >
                                                                <option value="record_rhythm">🥁 Play this rhythm</option>
                                                                <option value="record_melody">🎵 Repeat this melody</option>
                                                                <option value="record_embouchure">🎺 Record your embouchure</option>
                                                                <option value="practice_backing_track">🎸 Practice with backing track</option>
                                                                <option value="submit_warmup">🔥 Submit your warmup</option>
                                                                <option value="clap_rhythm">👏 Clap this rhythm</option>
                                                                <option value="custom">✏️ Custom task</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151', fontSize: '13px' }}>Student Submits</label>
                                                            <select
                                                                className="form-select"
                                                                value={lessonFormData.practical_submission_type}
                                                                onChange={(e) => setLessonFormData({ ...lessonFormData, practical_submission_type: e.target.value })}
                                                                style={{ border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}
                                                            >
                                                                <option value="audio">🎙️ Audio recording</option>
                                                                <option value="video">🎥 Video recording</option>
                                                                <option value="text">✏️ Text response</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-12">
                                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151', fontSize: '13px' }}>Assignment Prompt <span style={{ color: '#16a34a' }}>*</span></label>
                                                            <textarea
                                                                className="form-control"
                                                                value={lessonFormData.assignment_prompt}
                                                                onChange={(e) => setLessonFormData({ ...lessonFormData, assignment_prompt: e.target.value })}
                                                                placeholder="e.g. Play this C major scale at 60 BPM. Focus on even timing between notes."
                                                                rows="3"
                                                                style={{ border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}
                                                            />
                                                            <small style={{ color: '#6b7280' }}>This is shown prominently to the student. Be specific about what you want them to do.</small>
                                                        </div>
                                                        <div className="col-12">
                                                            <div style={{ padding: '10px 12px', background: '#dcfce7', borderRadius: '6px', fontSize: '12px', color: '#166534' }}>
                                                                <i className="bi bi-info-circle me-1"></i>
                                                                Upload the backing track / reference audio as the lesson file below (optional). Students will play along with it before recording.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {lessonFormData.interaction_type === 'practice_with_teacher' && (
                                            <div className="col-12">
                                                <div style={{ padding: '14px 16px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa', marginBottom: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                        <i className="bi bi-person-video3" style={{ color: '#f97316', fontSize: '18px' }}></i>
                                                        <span style={{ fontWeight: 600, color: '#9a3412' }}>Teacher Voice Audio</span>
                                                        <span style={{ fontSize: '12px', color: '#f97316', background: '#ffedd5', padding: '2px 8px', borderRadius: '999px', fontWeight: 500 }}>Required</span>
                                                    </div>
                                                    <p style={{ fontSize: '13px', color: '#78350f', margin: '0 0 10px' }}>
                                                        Upload your narration / explanation audio. Students will hear your voice guiding them through the exercise before playing along.
                                                    </p>
                                                    <input
                                                        type="file"
                                                        ref={teacherVoiceAudioInputRef}
                                                        className="form-control"
                                                        accept="audio/*"
                                                        onChange={(e) => setLessonFormData({ ...lessonFormData, teacher_voice_audio: e.target.files?.[0] || null })}
                                                        style={{ border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px 14px' }}
                                                    />
                                                    {lessonFormData.teacher_voice_audio && (
                                                        <div className="mt-2">
                                                            <small className="text-muted">
                                                                Selected: <strong>{lessonFormData.teacher_voice_audio.name}</strong>
                                                            </small>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm ms-2"
                                                                onClick={() => {
                                                                    setLessonFormData({ ...lessonFormData, teacher_voice_audio: null });
                                                                    if (teacherVoiceAudioInputRef.current) teacherVoiceAudioInputRef.current.value = '';
                                                                }}
                                                                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px' }}
                                                            >
                                                                <i className="bi bi-x-circle me-1"></i>Remove
                                                            </button>
                                                        </div>
                                                    )}
                                                    {editingLesson && editingLesson.teacher_voice_audio && !lessonFormData.teacher_voice_audio && (
                                                        <div className="mt-2 p-2" style={{ background: '#f3f4f6', borderRadius: '8px' }}>
                                                            <small className="text-muted">
                                                                <i className="bi bi-file-earmark-music me-1"></i>
                                                                Current file: <strong>{editingLesson.teacher_voice_audio.split('/').pop()}</strong> — upload a new file to replace it
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {lessonFormData.interaction_type === 'play_along' && (
                                            <div className="col-md-6">
                                                <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                    Play Along Track Type
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={lessonFormData.play_along_track_type}
                                                    onChange={(e) => setLessonFormData({ ...lessonFormData, play_along_track_type: e.target.value })}
                                                    style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                                >
                                                    <option value="backing_track">Backing track</option>
                                                    <option value="instrumental">Instrumental</option>
                                                    <option value="rhythm_loop">Rhythm loop</option>
                                                    <option value="warmup_sound">Warm-up sound</option>
                                                    <option value="scale_practice">Scale practice</option>
                                                    <option value="metronome_track">Metronome track</option>
                                                    <option value="slow_practice">Slow practice</option>
                                                    <option value="call_response">Call-and-response</option>
                                                </select>
                                                <small className="text-muted">Used to label the play-along track for students</small>
                                            </div>
                                        )}
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

                                        {/* Repeat After Me */}
                                        <div className="col-12">
                                            <div className="form-check form-switch" style={{ padding: '12px 16px', backgroundColor: '#eef2ff', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="repeatAfterMeSwitch"
                                                    checked={lessonFormData.repeat_after_me_enabled}
                                                    onChange={(e) => setLessonFormData({ ...lessonFormData, repeat_after_me_enabled: e.target.checked })}
                                                    style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                                                />
                                                <label className="form-check-label ms-2" htmlFor="repeatAfterMeSwitch" style={{ fontWeight: 500, color: '#4338ca', cursor: 'pointer' }}>
                                                    <i className="bi bi-mic-fill me-1"></i>
                                                    Repeat After Me
                                                </label>
                                                <small className="d-block text-muted mt-1">Enable a practice prompt with a short audio example</small>
                                            </div>
                                        </div>
                                        {lessonFormData.repeat_after_me_enabled && (
                                            <>
                                                <div className="col-12">
                                                    <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                        Practice Prompt
                                                    </label>
                                                    <textarea
                                                        className="form-control"
                                                        value={lessonFormData.repeat_after_me_prompt}
                                                        onChange={(e) => setLessonFormData({ ...lessonFormData, repeat_after_me_prompt: e.target.value })}
                                                        placeholder="e.g., Listen to the pattern and repeat it three times."
                                                        rows="2"
                                                        style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                                    ></textarea>
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                        Example Audio
                                                    </label>
                                                    <input
                                                        type="file"
                                                        ref={repeatAudioInputRef}
                                                        className="form-control"
                                                        accept="audio/*"
                                                        onChange={(e) => setLessonFormData({ ...lessonFormData, repeat_after_me_audio: e.target.files?.[0] || null })}
                                                        style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px' }}
                                                    />
                                                    {lessonFormData.repeat_after_me_audio && (
                                                        <div className="mt-2">
                                                            <small className="text-muted">
                                                                Selected: <strong>{lessonFormData.repeat_after_me_audio.name}</strong>
                                                            </small>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm ms-2"
                                                                onClick={() => {
                                                                    setLessonFormData({ ...lessonFormData, repeat_after_me_audio: null });
                                                                    if (repeatAudioInputRef.current) repeatAudioInputRef.current.value = '';
                                                                }}
                                                                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px' }}
                                                            >
                                                                <i className="bi bi-x-circle me-1"></i>Remove
                                                            </button>
                                                        </div>
                                                    )}
                                                    {editingLesson && editingLesson.repeat_after_me_audio && !lessonFormData.repeat_after_me_audio && (
                                                        <div className="mt-2 p-2" style={{ background: '#f3f4f6', borderRadius: '8px' }}>
                                                            <small className="text-muted">
                                                                <i className="bi bi-file-earmark-music me-1"></i>
                                                                Current example: <strong>{editingLesson.repeat_after_me_audio.split('/').pop()}</strong>
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        
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

                                        {/* YouTube URL */}
                                        <div className="col-12">
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                <i className="bi bi-youtube me-1" style={{ color: '#ff0000' }}></i>
                                                YouTube Video Link
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text" style={{ 
                                                    background: lessonFormData.youtube_url ? '#fef2f2' : '#f9fafb', 
                                                    border: '1px solid #e5e7eb', 
                                                    borderRight: 'none',
                                                    borderRadius: '8px 0 0 8px',
                                                    color: lessonFormData.youtube_url ? '#dc2626' : '#9ca3af'
                                                }}>
                                                    <i className="bi bi-youtube"></i>
                                                </span>
                                                <input
                                                    type="url"
                                                    className="form-control"
                                                    value={lessonFormData.youtube_url}
                                                    onChange={(e) => setLessonFormData({ ...lessonFormData, youtube_url: e.target.value })}
                                                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                                                    style={{ border: '1px solid #e5e7eb', borderRadius: '0 8px 8px 0', padding: '10px 14px' }}
                                                />
                                            </div>
                                            <small className="text-muted">
                                                Optional — Add a YouTube link for students to watch. Works with all content types. 
                                                {!lessonFormData.file && !editingLesson && lessonFormData.youtube_url && (
                                                    <span style={{ color: '#16a34a', fontWeight: 500 }}> File upload is optional when a YouTube link is provided.</span>
                                                )}
                                            </small>
                                        </div>

                                        {/* Drag & Drop File Upload */}
                                        <div className="col-12">
                                            <label className="form-label" style={{ fontWeight: 500, color: '#374151' }}>
                                                Upload File {!editingLesson && !lessonFormData.youtube_url && <span style={{ color: '#ef4444' }}>*</span>}
                                                {lessonFormData.youtube_url && <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '13px' }}> (optional)</span>}
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
                                                    <div className="d-flex align-items-center justify-content-between" style={{ gap: '12px' }}>
                                                        <small className="text-muted">
                                                            <i className="bi bi-file-earmark me-1"></i>
                                                            Current file: <strong>{editingLesson.file.split('/').pop()}</strong>
                                                        </small>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm"
                                                            onClick={() => setClearExistingFile(prev => !prev)}
                                                            style={{ background: clearExistingFile ? '#e0f2fe' : '#fee2e2', color: clearExistingFile ? '#0369a1' : '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px' }}
                                                        >
                                                            <i className={`bi ${clearExistingFile ? 'bi-arrow-counterclockwise' : 'bi-trash3'} me-1`}></i>
                                                            {clearExistingFile ? 'Undo' : 'Remove'}
                                                        </button>
                                                    </div>
                                                    {clearExistingFile && (
                                                        <div className="mt-2" style={{ fontSize: '12px', color: '#b91c1c' }}>
                                                            This file will be removed when you save.
                                                        </div>
                                                    )}
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
                                    </>)}
                                    {lessonBuilderTab === 'blocks' && (
                                        <div style={{ padding: '4px 0' }}>
                                            <div style={{ marginBottom: 20 }}>
                                                {/* Palette tab toggle */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button type="button" onClick={() => setPaletteTab('blocks')}
                                                            style={{ padding: '4px 14px', fontSize: 12, fontWeight: 600, borderRadius: 20, border: `1.5px solid ${paletteTab === 'blocks' ? '#4285f4' : '#e2e8f0'}`, background: paletteTab === 'blocks' ? '#eff6ff' : '#f9fafb', color: paletteTab === 'blocks' ? '#4285f4' : '#64748b', cursor: 'pointer' }}>
                                                            <i className="bi bi-grid-3x3-gap-fill me-1"></i>All Blocks
                                                        </button>
                                                        <button type="button"
                                                            onClick={() => { setPaletteTab('library'); if (libraryBlocks.length === 0 && !loadingLibrary) fetchLibraryBlocks(); }}
                                                            style={{ padding: '4px 14px', fontSize: 12, fontWeight: 600, borderRadius: 20, border: `1.5px solid ${paletteTab === 'library' ? '#f59e0b' : '#e2e8f0'}`, background: paletteTab === 'library' ? '#fffbeb' : '#f9fafb', color: paletteTab === 'library' ? '#d97706' : '#64748b', cursor: 'pointer' }}>
                                                            <i className="bi bi-bookmark-fill me-1"></i>Library
                                                            {libraryBlocks.length > 0 && <span style={{ marginLeft: 5, background: '#d97706', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 6px' }}>{libraryBlocks.length}</span>}
                                                        </button>
                                                    </div>
                                                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{lessonBlocks.length} block{lessonBlocks.length !== 1 ? 's' : ''}</span>
                                                </div>
                                                {/* All Blocks tab */}
                                                {paletteTab === 'blocks' && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                                                        {blockPaletteItems.map(item => (
                                                            <button key={item.type} type="button" onClick={() => addLessonBlock(item.type)}
                                                                style={{ border: `1.5px solid ${item.color}33`, borderRadius: 10, padding: '10px 8px', background: `${item.color}0d`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = `${item.color}22`; e.currentTarget.style.borderColor = item.color; }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = `${item.color}0d`; e.currentTarget.style.borderColor = `${item.color}33`; }}
                                                            >
                                                                <i className={`bi ${item.icon}`} style={{ fontSize: 20, color: item.color }}></i>
                                                                <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Library tab */}
                                                {paletteTab === 'library' && (
                                                    <div>
                                                        {/* Type filter chips */}
                                                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                                                            <button type="button" onClick={() => setLibraryTypeFilter('all')}
                                                                style={{ padding: '3px 10px', fontSize: 11, borderRadius: 12, border: `1px solid ${libraryTypeFilter === 'all' ? '#d97706' : '#e2e8f0'}`, background: libraryTypeFilter === 'all' ? '#fef3c7' : '#f9fafb', color: libraryTypeFilter === 'all' ? '#92400e' : '#64748b', cursor: 'pointer', fontWeight: 600 }}>All</button>
                                                            {[...new Set(libraryBlocks.map(b => b.block_type))].map(type => {
                                                                const pi = blockPaletteItems.find(p => p.type === type) || { label: type, color: '#94a3b8' };
                                                                return (
                                                                    <button key={type} type="button" onClick={() => setLibraryTypeFilter(type)}
                                                                        style={{ padding: '3px 10px', fontSize: 11, borderRadius: 12, border: `1px solid ${libraryTypeFilter === type ? pi.color : '#e2e8f0'}`, background: libraryTypeFilter === type ? `${pi.color}15` : '#f9fafb', color: libraryTypeFilter === type ? pi.color : '#64748b', cursor: 'pointer', fontWeight: 600 }}>
                                                                        {pi.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        {loadingLibrary ? (
                                                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                                                <span className="spinner-border spinner-border-sm text-warning"></span>
                                                                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>Loading library...</span>
                                                            </div>
                                                        ) : libraryBlocks.filter(b => libraryTypeFilter === 'all' || b.block_type === libraryTypeFilter).length === 0 ? (
                                                            <div style={{ textAlign: 'center', padding: '24px 16px', border: '2px dashed #fde68a', borderRadius: 12, color: '#94a3b8' }}>
                                                                <i className="bi bi-bookmark" style={{ fontSize: 28, display: 'block', marginBottom: 6, color: '#fbbf24' }}></i>
                                                                <p style={{ margin: 0, fontSize: 13 }}>No saved blocks yet — click <i className="bi bi-bookmark"></i> on any block to save it</p>
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                {libraryBlocks.filter(b => libraryTypeFilter === 'all' || b.block_type === libraryTypeFilter).map(lb => {
                                                                    const pi = blockPaletteItems.find(p => p.type === lb.block_type) || { icon: 'bi-square', color: '#94a3b8', label: lb.block_type };
                                                                    return (
                                                                        <div key={lb.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #fde68a', borderRadius: 10, padding: '8px 12px', background: '#fffdf7' }}>
                                                                            <div style={{ width: 30, height: 30, borderRadius: 7, background: `${pi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                                <i className={`bi ${pi.icon}`} style={{ fontSize: 14, color: pi.color }}></i>
                                                                            </div>
                                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                                <div style={{ fontWeight: 600, fontSize: 12, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lb.library_name || lb.title}</div>
                                                                                <div style={{ fontSize: 10, color: '#94a3b8' }}>{pi.label}{lb.lesson_title ? ` · from "${lb.lesson_title}"` : ''}</div>
                                                                            </div>
                                                                            <button type="button" onClick={() => cloneLibraryBlock(lb)} title="Add to this lesson"
                                                                                style={{ background: '#eff6ff', color: '#4285f4', border: '1.5px solid #bfdbfe', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                                                                                <i className="bi bi-plus-lg me-1"></i>Use
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                    <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                                                        <i className="bi bi-layout-text-sidebar-reverse me-2" style={{ color: '#4285f4' }}></i>Lesson Canvas
                                                    </span>
                                                    {lessonBlocksLoading && <span className="spinner-border spinner-border-sm text-primary"></span>}
                                                </div>
                                                {!lessonBlocksLoading && lessonBlocks.length === 0 ? (
                                                    <div style={{ textAlign: 'center', padding: '32px 16px', border: '2px dashed #e2e8f0', borderRadius: 12, color: '#94a3b8' }}>
                                                        <i className="bi bi-layers" style={{ fontSize: 32, display: 'block', marginBottom: 8 }}></i>
                                                        <p style={{ margin: 0, fontSize: 14 }}>No blocks yet — click a type above to add one</p>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        {lessonBlocks.map((block, idx) => {
                                                            const pi = blockPaletteItems.find(p => p.type === block.block_type) || { icon: 'bi-square', color: '#94a3b8', label: block.block_type };
                                                            const isExpanded  = expandedBlockId === block.id;
                                                            const isSaving    = savingBlockId === block.id;
                                                            const isSaved     = savingBlockId === `done_${block.id}`;
                                                            const ed          = blockEditData[block.id] || {};
                                                            const isMediaBlock = ['video','audio','image','repeat_after_me','checklist','timer','quiz','submission','badge','assignment','practice_counter'].includes(block.block_type);
                                                            return (
                                                                <div key={block.id} style={{ border: `1.5px solid ${isExpanded ? pi.color + '55' : '#e2e8f0'}`, borderRadius: 10, background: '#f8fafc', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                                                                    {/* Header row */}
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                                                                        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${pi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                            <i className={`bi ${pi.icon}`} style={{ fontSize: 16, color: pi.color }}></i>
                                                                        </div>
                                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                                            <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                {block.title || pi.label}
                                                                            </div>
                                                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{pi.label}</div>
                                                                        </div>
                                                                        <span style={{ fontSize: 11, color: '#cbd5e1', minWidth: 20, textAlign: 'center' }}>#{idx + 1}</span>
                                                                        <button type="button" disabled={idx === 0} onClick={() => moveLessonBlockUp(block, idx)} title="Move up"
                                                                            style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 8px', color: idx === 0 ? '#cbd5e1' : '#64748b', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}>
                                                                            <i className="bi bi-chevron-up" style={{ fontSize: 11 }}></i>
                                                                        </button>
                                                                        <button type="button" disabled={idx === lessonBlocks.length - 1} onClick={() => moveLessonBlockDown(block, idx)} title="Move down"
                                                                            style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 8px', color: idx === lessonBlocks.length - 1 ? '#cbd5e1' : '#64748b', cursor: idx === lessonBlocks.length - 1 ? 'not-allowed' : 'pointer' }}>
                                                                            <i className="bi bi-chevron-down" style={{ fontSize: 11 }}></i>
                                                                        </button>
                                                                        {isMediaBlock && (
                                                                            <button type="button" onClick={() => toggleBlockExpand(block)} title={isExpanded ? 'Collapse' : 'Edit config'}
                                                                                style={{ background: isExpanded ? `${pi.color}15` : 'none', border: `1px solid ${isExpanded ? pi.color + '55' : '#e2e8f0'}`, borderRadius: 6, padding: '3px 8px', color: isExpanded ? pi.color : '#64748b', cursor: 'pointer' }}>
                                                                                <i className={`bi bi-${isExpanded ? 'chevron-up' : 'pencil'}`} style={{ fontSize: 11 }}></i>
                                                                            </button>
                                                                        )}
                                                                        <button type="button"
                                                                            onClick={() => saveBlockToLibrary(block)}
                                                                            title={block.is_library_item ? `In library: "${block.library_name}"` : 'Save to library'}
                                                                            disabled={savingToLibraryId === block.id}
                                                                            style={{ background: block.is_library_item ? '#fffbeb' : '#f8fafc', color: block.is_library_item ? '#d97706' : '#94a3b8', border: `1px solid ${block.is_library_item ? '#fde68a' : '#e2e8f0'}`, borderRadius: 6, padding: '3px 8px', cursor: savingToLibraryId === block.id ? 'wait' : 'pointer' }}>
                                                                            <i className={`bi ${savingToLibraryId === block.id ? 'bi-hourglass' : block.is_library_item ? 'bi-bookmark-fill' : 'bi-bookmark'}`} style={{ fontSize: 11 }}></i>
                                                                        </button>
                                                                        <button type="button" onClick={() => deleteLessonBlock(block.id)} title="Remove block"
                                                                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '3px 9px', cursor: 'pointer' }}>
                                                                            <i className="bi bi-trash" style={{ fontSize: 11 }}></i>
                                                                        </button>
                                                                    </div>
                                                                    {/* Inline config form */}
                                                                    {isExpanded && isMediaBlock && (
                                                                        <div style={{ borderTop: `1px solid ${pi.color}22`, background: '#fff', padding: '14px 16px' }}>
                                                                            {/* Title */}
                                                                            <div style={{ marginBottom: 12 }}>
                                                                                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Block Title</label>
                                                                                <input type="text" value={ed.title || ''} onChange={e => updateBlockEditData(block.id, { title: e.target.value })}
                                                                                    placeholder={pi.label}
                                                                                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                                                            </div>
                                                                            {/* VIDEO */}
                                                                            {block.block_type === 'video' && (<>
                                                                                <div style={{ marginBottom: 10 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>YouTube URL</label>
                                                                                    <input type="url" value={ed.youtube_url || ''} onChange={e => updateBlockEditData(block.id, { youtube_url: e.target.value })}
                                                                                        placeholder="https://youtube.com/watch?v=..."
                                                                                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                                                                </div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                                                    <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}></div>
                                                                                    <span style={{ fontSize: 11, color: '#94a3b8' }}>or upload a video file</span>
                                                                                    <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}></div>
                                                                                </div>
                                                                                <div style={{ marginBottom: 10 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Video File</label>
                                                                                    {block.file && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}><i className="bi bi-file-earmark-play me-1"></i>Current: {block.file.split('/').pop()}</div>}
                                                                                    <input type="file" accept="video/*" onChange={e => updateBlockEditData(block.id, { file: e.target.files[0] || null })} style={{ fontSize: 12, width: '100%' }} />
                                                                                </div>
                                                                                <div style={{ marginBottom: 14 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Caption</label>
                                                                                    <input type="text" value={ed.caption || ''} onChange={e => updateBlockEditData(block.id, { caption: e.target.value })}
                                                                                        placeholder="Optional caption"
                                                                                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                                                                </div>
                                                                            </>)}
                                                                            {/* AUDIO */}
                                                                            {block.block_type === 'audio' && (<>
                                                                                <div style={{ marginBottom: 10 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Audio File</label>
                                                                                    {block.file && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}><i className="bi bi-file-earmark-music me-1"></i>Current: {block.file.split('/').pop()}</div>}
                                                                                    <input type="file" accept="audio/*" onChange={e => updateBlockEditData(block.id, { file: e.target.files[0] || null })} style={{ fontSize: 12, width: '100%' }} />
                                                                                </div>
                                                                                <div style={{ marginBottom: 14 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Caption</label>
                                                                                    <input type="text" value={ed.caption || ''} onChange={e => updateBlockEditData(block.id, { caption: e.target.value })}
                                                                                        placeholder="Optional caption"
                                                                                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                                                                </div>
                                                                            </>)}
                                                                            {/* IMAGE */}
                                                                            {block.block_type === 'image' && (<>
                                                                                <div style={{ marginBottom: 10 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Image File</label>
                                                                                    {block.file && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}><i className="bi bi-file-earmark-image me-1"></i>Current: {block.file.split('/').pop()}</div>}
                                                                                    <input type="file" accept="image/*" onChange={e => updateBlockEditData(block.id, { file: e.target.files[0] || null })} style={{ fontSize: 12, width: '100%' }} />
                                                                                </div>
                                                                                <div style={{ marginBottom: 10 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Caption</label>
                                                                                    <input type="text" value={ed.caption || ''} onChange={e => updateBlockEditData(block.id, { caption: e.target.value })}
                                                                                        placeholder="Optional caption"
                                                                                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                                                                </div>
                                                                                <div style={{ marginBottom: 14 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Alt Text</label>
                                                                                    <input type="text" value={ed.alt_text || ''} onChange={e => updateBlockEditData(block.id, { alt_text: e.target.value })}
                                                                                        placeholder="Describe the image for screen readers"
                                                                                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                                                                </div>
                                                                            </>)}
                                                                            {/* REPEAT AFTER ME */}
                                                                            {block.block_type === 'repeat_after_me' && (<>
                                                                                <div style={{ marginBottom: 10 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Prompt</label>
                                                                                    <textarea rows={3} value={ed.prompt || ''} onChange={e => updateBlockEditData(block.id, { prompt: e.target.value })}
                                                                                        placeholder="What should the student repeat? e.g. 'Say after me: Do Re Mi'"
                                                                                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                                                                                </div>
                                                                                <div style={{ marginBottom: 14 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Teacher Audio</label>
                                                                                    {block.file && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}><i className="bi bi-file-earmark-music me-1"></i>Current: {block.file.split('/').pop()}</div>}
                                                                                    <input type="file" accept="audio/*" onChange={e => updateBlockEditData(block.id, { file: e.target.files[0] || null })} style={{ fontSize: 12, width: '100%' }} />
                                                                                </div>
                                                                            </>)}
                                                                            {/* CHECKLIST */}
                                                                            {block.block_type === 'checklist' && (<>
                                                                                <div style={{ marginBottom: 14 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Checklist Items</label>
                                                                                    {(ed.checklist_items || ['']).map((item, i) => (
                                                                                        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                                                                                            <span style={{ width: 20, flexShrink: 0, fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>{i + 1}.</span>
                                                                                            <input type="text" value={item}
                                                                                                onChange={e => {
                                                                                                    const next = [...(ed.checklist_items || [''])];
                                                                                                    next[i] = e.target.value;
                                                                                                    updateBlockEditData(block.id, { checklist_items: next });
                                                                                                }}
                                                                                                placeholder={`Item ${i + 1}`}
                                                                                                style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                                                                            <button type="button"
                                                                                                disabled={(ed.checklist_items || ['']).length <= 1}
                                                                                                onClick={() => {
                                                                                                    const next = (ed.checklist_items || ['']).filter((_, j) => j !== i);
                                                                                                    updateBlockEditData(block.id, { checklist_items: next.length ? next : [''] });
                                                                                                }}
                                                                                                style={{ background: (ed.checklist_items || ['']).length <= 1 ? '#f3f4f6' : '#fee2e2', color: (ed.checklist_items || ['']).length <= 1 ? '#cbd5e1' : '#dc2626', border: 'none', borderRadius: 6, padding: '4px 9px', cursor: (ed.checklist_items || ['']).length <= 1 ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                                                                                                <i className="bi bi-x" style={{ fontSize: 14 }}></i>
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}
                                                                                    <button type="button"
                                                                                        onClick={() => updateBlockEditData(block.id, { checklist_items: [...(ed.checklist_items || ['']), ''] })}
                                                                                        style={{ background: 'none', border: '1.5px dashed #cbd5e1', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#64748b', cursor: 'pointer', width: '100%', marginTop: 2 }}>
                                                                                        <i className="bi bi-plus me-1"></i>Add Item
                                                                                    </button>
                                                                                </div>
                                                                            </>)}
                                                                            {/* TIMER */}
                                                                            {block.block_type === 'timer' && (<>
                                                                                <div style={{ marginBottom: 10 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Duration</label>
                                                                                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                                                                                        <div style={{ flex: 1 }}>
                                                                                            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Minutes</label>
                                                                                            <input type="number" min="0" max="99" value={ed.timer_minutes ?? 1}
                                                                                                onChange={e => updateBlockEditData(block.id, { timer_minutes: Math.max(0, parseInt(e.target.value) || 0) })}
                                                                                                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
                                                                                        </div>
                                                                                        <span style={{ fontSize: 22, color: '#94a3b8', paddingBottom: 8 }}>:</span>
                                                                                        <div style={{ flex: 1 }}>
                                                                                            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Seconds</label>
                                                                                            <input type="number" min="0" max="59" value={ed.timer_seconds ?? 0}
                                                                                                onChange={e => updateBlockEditData(block.id, { timer_seconds: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) })}
                                                                                                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div style={{ marginBottom: 14 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Timer Label</label>
                                                                                    <input type="text" value={ed.timer_label || ''} onChange={e => updateBlockEditData(block.id, { timer_label: e.target.value })}
                                                                                        placeholder="e.g. Practice this section for:"
                                                                                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                                                                </div>
                                                                            </>)}
                                                                            {/* QUIZ */}
                                                                            {block.block_type === 'quiz' && (<>
                                                                                <div style={{ marginBottom: 14 }}>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                                                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Questions</label>
                                                                                        <button type="button"
                                                                                            onClick={() => updateBlockEditData(block.id, { quiz_questions: [...(ed.quiz_questions || []), { text: '', options: ['', '', '', ''], correct: 0, points: 1 }] })}
                                                                                            style={{ background: '#eff6ff', color: '#4285f4', border: '1.5px solid #bfdbfe', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                                                                            <i className="bi bi-plus me-1"></i>Add Question
                                                                                        </button>
                                                                                    </div>
                                                                                    {(ed.quiz_questions || []).length === 0 && (
                                                                                        <div style={{ textAlign: 'center', padding: '20px', border: '2px dashed #e2e8f0', borderRadius: 10, color: '#94a3b8', fontSize: 13 }}>
                                                                                            <i className="bi bi-question-circle" style={{ fontSize: 24, display: 'block', marginBottom: 6 }}></i>
                                                                                            No questions yet — click Add Question to begin
                                                                                        </div>
                                                                                    )}
                                                                                    {(ed.quiz_questions || []).map((q, qi) => (
                                                                                        <div key={qi} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', marginBottom: 10, background: '#fff' }}>
                                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#4285f4', background: '#eff6ff', borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>Q{qi + 1}</span>
                                                                                                <input type="text" value={q.text}
                                                                                                    onChange={e => { const qs = [...(ed.quiz_questions || [])]; qs[qi] = { ...qs[qi], text: e.target.value }; updateBlockEditData(block.id, { quiz_questions: qs }); }}
                                                                                                    placeholder="Question text"
                                                                                                    style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                                                                                <input type="number" min="1" max="100" value={q.points}
                                                                                                    onChange={e => { const qs = [...(ed.quiz_questions || [])]; qs[qi] = { ...qs[qi], points: parseInt(e.target.value) || 1 }; updateBlockEditData(block.id, { quiz_questions: qs }); }}
                                                                                                    title="Points value"
                                                                                                    style={{ width: 52, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 6px', fontSize: 12, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
                                                                                                <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>pts</span>
                                                                                                <button type="button"
                                                                                                    onClick={() => { const qs = (ed.quiz_questions || []).filter((_, j) => j !== qi); updateBlockEditData(block.id, { quiz_questions: qs }); }}
                                                                                                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', flexShrink: 0 }}>
                                                                                                    <i className="bi bi-trash" style={{ fontSize: 11 }}></i>
                                                                                                </button>
                                                                                            </div>
                                                                                            {['A', 'B', 'C', 'D'].map((letter, oi) => (
                                                                                                <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                                                                                                    <input type="radio" name={`quiz_correct_${block.id}_${qi}`}
                                                                                                        checked={q.correct === oi}
                                                                                                        onChange={() => { const qs = [...(ed.quiz_questions || [])]; qs[qi] = { ...qs[qi], correct: oi }; updateBlockEditData(block.id, { quiz_questions: qs }); }}
                                                                                                        style={{ accentColor: '#16a34a', cursor: 'pointer', flexShrink: 0 }} />
                                                                                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', width: 14, flexShrink: 0 }}>{letter}</span>
                                                                                                    <input type="text" value={(q.options || [])[oi] || ''}
                                                                                                        onChange={e => { const qs = [...(ed.quiz_questions || [])]; const opts = [...(qs[qi].options || ['', '', '', ''])]; opts[oi] = e.target.value; qs[qi] = { ...qs[qi], options: opts }; updateBlockEditData(block.id, { quiz_questions: qs }); }}
                                                                                                        placeholder={`Option ${letter}`}
                                                                                                        style={{ flex: 1, border: `1px solid ${q.correct === oi ? '#86efac' : '#e2e8f0'}`, borderRadius: 6, padding: '5px 8px', fontSize: 12, outline: 'none', background: q.correct === oi ? '#f0fdf4' : '#fff', boxSizing: 'border-box' }} />
                                                                                                </div>
                                                                                            ))}
                                                                                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                                                                                                <i className="bi bi-info-circle me-1"></i>Select the radio button next to the correct answer
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </>)}
                                                                            {/* SUBMISSION */}
                                                                            {block.block_type === 'submission' && (<>
                                                                                <div style={{ marginBottom: 10 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Submission Type</label>
                                                                                    <div style={{ display: 'flex', gap: 10 }}>
                                                                                        {[{ value: 'audio', label: 'Audio', icon: 'bi-mic-fill', color: '#8b5cf6' }, { value: 'video', label: 'Video', icon: 'bi-camera-video-fill', color: '#3b82f6' }].map(opt => (
                                                                                            <label key={opt.value} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: `1.5px solid ${ed.submission_type === opt.value ? opt.color : '#e2e8f0'}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', background: ed.submission_type === opt.value ? `${opt.color}1a` : '#fff' }}>
                                                                                                <input type="radio" name={`sub_type_${block.id}`} value={opt.value}
                                                                                                    checked={ed.submission_type === opt.value}
                                                                                                    onChange={() => updateBlockEditData(block.id, { submission_type: opt.value })}
                                                                                                    style={{ accentColor: opt.color }} />
                                                                                                <i className={`bi ${opt.icon}`} style={{ color: opt.color, fontSize: 15 }}></i>
                                                                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{opt.label}</span>
                                                                                            </label>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                                <div style={{ marginBottom: 14 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Prompt</label>
                                                                                    <textarea rows={3} value={ed.submission_prompt || ''}
                                                                                        onChange={e => updateBlockEditData(block.id, { submission_prompt: e.target.value })}
                                                                                        placeholder="What should the student record? e.g. 'Record yourself singing the first verse'"
                                                                                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                                                                                </div>
                                                                            </>)}
                                                                            {/* BADGE */}
                                                                            {block.block_type === 'badge' && (<>
                                                                                <div style={{ marginBottom: 14 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Achievement Badge</label>
                                                                                    {loadingBlockAchievements ? (
                                                                                        <div style={{ padding: '12px', textAlign: 'center' }}>
                                                                                            <span className="spinner-border spinner-border-sm text-primary"></span>
                                                                                            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>Loading achievements...</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <select value={ed.badge_achievement_id || ''}
                                                                                            onChange={e => updateBlockEditData(block.id, { badge_achievement_id: e.target.value })}
                                                                                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff' }}>
                                                                                            <option value="">— Select an achievement —</option>
                                                                                            {blockAchievements.map(a => (
                                                                                                <option key={a.id} value={a.id}>{a.name} ({a.points} pts)</option>
                                                                                            ))}
                                                                                        </select>
                                                                                    )}
                                                                                    {ed.badge_achievement_id && (() => {
                                                                                        const ach = blockAchievements.find(a => String(a.id) === String(ed.badge_achievement_id));
                                                                                        return ach ? (
                                                                                            <div style={{ marginTop: 8, padding: '8px 12px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                                                <i className="bi bi-award-fill" style={{ fontSize: 22, color: '#7c3aed' }}></i>
                                                                                                <div>
                                                                                                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{ach.name}</div>
                                                                                                    <div style={{ fontSize: 11, color: '#64748b' }}>{ach.description} — {ach.points} XP</div>
                                                                                                </div>
                                                                                            </div>
                                                                                        ) : null;
                                                                                    })()}
                                                                                </div>
                                                                            </>)}
                                                                            {/* ASSIGNMENT */}
                                                                            {block.block_type === 'assignment' && (<>
                                                                                <div style={{ marginBottom: 10 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Assignment Template <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
                                                                                    {loadingBlockAssignmentTemplates ? (
                                                                                        <div style={{ padding: '12px', textAlign: 'center' }}>
                                                                                            <span className="spinner-border spinner-border-sm text-primary"></span>
                                                                                            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>Loading templates...</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <select value={ed.assignment_template_id || ''}
                                                                                            onChange={e => updateBlockEditData(block.id, { assignment_template_id: e.target.value })}
                                                                                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff' }}>
                                                                                            <option value="">— No template (use text prompt below) —</option>
                                                                                            {blockAssignmentTemplates.map(t => (
                                                                                                <option key={t.id} value={t.id}>{t.title} ({t.question_count} question{t.question_count !== 1 ? 's' : ''})</option>
                                                                                            ))}
                                                                                        </select>
                                                                                    )}
                                                                                </div>
                                                                                <div style={{ marginBottom: 14 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                                                                                        {ed.assignment_template_id ? 'Additional Instructions' : 'Assignment Prompt'}
                                                                                        {ed.assignment_template_id && <span style={{ fontWeight: 400, color: '#94a3b8' }}> (optional)</span>}
                                                                                    </label>
                                                                                    <textarea rows={3} value={ed.assignment_prompt || ''}
                                                                                        onChange={e => updateBlockEditData(block.id, { assignment_prompt: e.target.value })}
                                                                                        placeholder={ed.assignment_template_id ? 'Any additional instructions for this assignment...' : 'Describe what the student needs to do...'}
                                                                                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                                                                                </div>
                                                                            </>)}
                                                                            {/* PRACTICE COUNTER */}
                                                                            {block.block_type === 'practice_counter' && (<>
                                                                                <div style={{ marginBottom: 10 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Practice Prompt</label>
                                                                                    <input type="text" value={ed.practice_prompt || ''} onChange={e => updateBlockEditData(block.id, { practice_prompt: e.target.value })}
                                                                                        placeholder="e.g. Play this scale, Sing this phrase, Do this exercise"
                                                                                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                                                                </div>
                                                                                <div style={{ marginBottom: 14 }}>
                                                                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Target Repetitions</label>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                                        <input type="number" min="1" max="50" value={ed.practice_target ?? 3} onChange={e => updateBlockEditData(block.id, { practice_target: Math.max(1, parseInt(e.target.value) || 1) })}
                                                                                            style={{ width: 80, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
                                                                                        <span style={{ fontSize: 13, color: '#64748b' }}>times</span>
                                                                                    </div>
                                                                                </div>
                                                                            </>)}
                                                                            {/* Save / Cancel row */}
                                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                                                                                <button type="button" onClick={() => setExpandedBlockId(null)}
                                                                                    style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 16px', fontSize: 13, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                                                                                <button type="button" onClick={() => saveBlockConfig(block)} disabled={isSaving || isSaved}
                                                                                    style={{ background: isSaved ? '#16a34a' : pi.color, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 13, fontWeight: 600, cursor: (isSaving || isSaved) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                                    {isSaving ? (<><span className="spinner-border spinner-border-sm"></span>Saving...</>) : isSaved ? (<><i className="bi bi-check-lg"></i>Saved!</>) : (<><i className="bi bi-floppy"></i>Save Block</>)}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px' }}>
                                    {lessonBuilderTab === 'info' ? (
                                        <>
                                            <button type="button" className="btn" onClick={() => setShowLessonModal(false)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '10px 20px' }}>Cancel</button>
                                            <button type="submit" className="btn" disabled={uploading} style={{ background: '#4285f4', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px' }}>
                                                {uploading ? (
                                                    <><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</>
                                                ) : (
                                                    editingLesson ? 'Update Lesson' : 'Create Lesson'
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button type="button" className="btn" onClick={() => setLessonBuilderTab('info')} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '10px 20px' }}>
                                                <i className="bi bi-arrow-left me-1"></i>Back to Lesson Info
                                            </button>
                                            <span style={{ fontSize: 13, color: '#6b7280' }}>
                                                <i className="bi bi-check-circle-fill me-1" style={{ color: '#16a34a' }}></i>Changes saved automatically
                                            </span>
                                        </>
                                    )}
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
