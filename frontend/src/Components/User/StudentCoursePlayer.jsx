import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Sidebar from './Sidebar';
import LoadingSpinner from '../LoadingSpinner';
import './StudentCoursePlayer.css';
import { checkLessonAccess, recordLessonAccess, getStudentSubscription, formatAccessLevel } from '../../services/subscriptionService';

import { API_BASE_URL, SITE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const mediaUrl = SITE_URL;

const StudentCoursePlayer = () => {
    const { course_id, lesson_id } = useParams();
    const navigate = useNavigate();
    const studentId = localStorage.getItem('studentId');
    const studentLoginStatus = localStorage.getItem('studentLoginStatus');
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showDownloadables, setShowDownloadables] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [floatingObjectivesOpen, setFloatingObjectivesOpen] = useState(false);
    const [floatingResourcesOpen, setFloatingResourcesOpen] = useState(false);
    const [lessonAccess, setLessonAccess] = useState({ can_access: true, checking: true });
    const [subscriptionInfo, setSubscriptionInfo] = useState(null);
    const [showYouTubeModal, setShowYouTubeModal] = useState(false);

    const milestoneMessages = {
        25: { emoji: '🚀', title: 'Great Start!', text: "You're 25% through! Keep up the momentum!" },
        50: { emoji: '🔥', title: 'Halfway There!', text: "You've reached the halfway point! You're doing amazing!" },
        75: { emoji: '💪', title: 'Almost There!', text: "75% complete! The finish line is in sight!" },
        90: { emoji: '🎯', title: 'So Close!', text: "Just a bit more! You're about to finish!" }
    };

    const currentLesson = pageData?.current_lesson;
    const modules = pageData?.modules || [];
    const navigation = pageData?.navigation || { previous: null, next: null };
    const progress = pageData?.progress || {};
    const isEnrolled = pageData?.is_enrolled ?? false;

    useEffect(() => {
        const initializePage = async () => {
            if (studentLoginStatus !== 'true' || !studentId) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Login Required',
                    text: 'Please login to access course content',
                    confirmButtonColor: '#3b82f6'
                }).then(() => navigate('/student/login'));
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // Fetch initial course data (without lesson_id)
                const url = `${baseUrl}/student/${studentId}/course/${course_id}/full-page-data/`;
                
                const response = await axios.get(url);

                if (!response.data.is_enrolled) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Access Denied',
                        text: 'You must enroll in this course to access the lessons',
                        confirmButtonColor: '#3b82f6'
                    }).then(() => navigate(`/detail/${course_id}`));
                    setLoading(false);
                    return;
                }

                setPageData(response.data);

                if (!lesson_id && response.data.current_lesson) {
                    navigate(`/student/learn/${course_id}/lesson/${response.data.current_lesson.id}`, 
                            { replace: true });
                }

            } catch (err) {
                console.error('Error loading page data:', err);
                const errorMsg = err.response?.data?.error || err.message || 'Failed to load course content';
                setError(errorMsg);
                
                if (err.response?.status === 403) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Access Denied',
                        text: errorMsg,
                        confirmButtonColor: '#3b82f6'
                    }).then(() => navigate(`/detail/${course_id}`));
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error Loading Content',
                        text: errorMsg,
                        confirmButtonColor: '#3b82f6'
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        initializePage();
    }, [course_id, studentId, studentLoginStatus, navigate]);

    // Separate effect for loading specific lesson data when lesson_id changes
    useEffect(() => {
        if (!lesson_id || !course_id || !studentId) return;

        const loadLessonData = async () => {
            setLoading(true);
            setError(null);
            setShowResumePrompt(false);

            try {
                // Check lesson access first
                const [accessResult, subInfo] = await Promise.all([
                    checkLessonAccess(studentId, lesson_id),
                    getStudentSubscription(studentId)
                ]);
                
                setLessonAccess({ ...accessResult, checking: false });
                setSubscriptionInfo(subInfo);

                // If no access, show upgrade prompt
                if (!accessResult.can_access) {
                    setLoading(false);
                    return;
                }

                const url = `${baseUrl}/student/${studentId}/course/${course_id}/lesson/${lesson_id}/full-page-data/`;
                const response = await axios.get(url);

                setPageData(response.data);

                if (response.data.current_lesson?.last_position && 
                    response.data.current_lesson.last_position > 10 && 
                    !response.data.current_lesson.is_completed) {
                    setShowResumePrompt(true);
                }

                // Record lesson access for usage tracking
                await recordLessonAccess(studentId, lesson_id);
            } catch (err) {
                console.error('Error loading lesson data:', err);
                const errorMsg = err.response?.data?.error || err.message || 'Failed to load lesson content';
                setError(errorMsg);
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error Loading Content',
                    text: errorMsg,
                    confirmButtonColor: '#3b82f6'
                });
            } finally {
                setLoading(false);
            }
        };

        loadLessonData();
    }, [lesson_id, course_id, studentId]);

    useEffect(() => {
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const mobile = window.innerWidth <= 768;
                setIsMobile(mobile);
                if (mobile) setSidebarOpen(false);
            }, 250);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimeout);
        };
    }, []);

    const launchConfetti = (intensity = 'small') => {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const particles = [];
        const colors = ['#4ade80', '#22c55e', '#667eea', '#764ba2', '#f59e0b', '#ec4899'];
        const count = intensity === 'large' ? 150 : intensity === 'medium' ? 80 : 40;
        
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: canvas.height + Math.random() * 50,
                vx: (Math.random() - 0.5) * 10,
                vy: -Math.random() * 15 - 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }
        
        let frame = 0;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.3;
                p.rotation += p.rotationSpeed;
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });
            
            frame++;
            if (frame < 120) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(canvas);
            }
        };
        
        animate();
    };

    const handleMarkComplete = async () => {
        try {
            const currentProgress = progress.overall_progress || 0;
            const response = await axios.post(`${baseUrl}/student/${studentId}/lesson/${lesson_id}/complete/`);
            
            if (response.data.bool) {
                const newProgress = response.data.course_progress_percentage || currentProgress;
                
                triggerCelebration(
                    response.data.module_completed, 
                    response.data.course_completed,
                    currentProgress,
                    newProgress
                );
                
                const url = `${baseUrl}/student/${studentId}/course/${course_id}/lesson/${lesson_id}/full-page-data/`;
                const refreshResponse = await axios.get(url);
                setPageData(refreshResponse.data);
            }
        } catch (error) {
            console.error('Error marking lesson complete:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to mark lesson as complete',
                confirmButtonColor: '#3b82f6'
            });
        }
    };

    const checkMilestoneProgress = (oldProgress, newProgress) => {
        const milestones = [25, 50, 75, 90];
        for (const milestone of milestones) {
            if (oldProgress < milestone && newProgress >= milestone) {
                return milestone;
            }
        }
        return null;
    };

    const triggerCelebration = (moduleCompleted, courseCompleted, oldProgress = 0, newProgress = 0) => {
        if (courseCompleted) {
            launchConfetti('large');
            Swal.fire({
                icon: 'success',
                title: '🎉 Course Completed!',
                html: `<div style="text-align:center"><p style="font-size:18px;margin-bottom:10px">Congratulations! You have completed this entire course!</p><div style="font-size:48px;margin:20px 0">🏆</div><p style="color:#a0aec0">You're officially a graduate!</p></div>`,
                timer: 5000,
                showConfirmButton: false,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff'
            });
        } else if (moduleCompleted) {
            launchConfetti('medium');
            Swal.fire({
                icon: 'success',
                title: '🎯 Module Completed!',
                html: `<div style="text-align:center"><p>Great job! You've completed this module.</p><div style="font-size:32px;margin:15px 0">🌟</div><p style="color:#a0aec0;font-size:14px">Ready for the next challenge?</p></div>`,
                timer: 3000,
                showConfirmButton: false,
                background: '#1a1a2e',
                color: '#fff'
            });
            
            setTimeout(() => {
                const milestone = checkMilestoneProgress(oldProgress, newProgress);
                if (milestone) showProgressToast(milestone);
            }, 3200);
        } else {
            launchConfetti('small');
            const milestone = checkMilestoneProgress(oldProgress, newProgress);
            
            if (milestone) {
                const msg = milestoneMessages[milestone];
                Swal.fire({
                    icon: 'success',
                    title: `${msg.emoji} ${msg.title}`,
                    html: `<div style="text-align:center"><p>${msg.text}</p><div style="margin:15px 0"><div style="background:rgba(255,255,255,0.1);border-radius:10px;height:12px;overflow:hidden"><div style="background:linear-gradient(90deg,#4ade80,#22c55e);height:100%;width:${newProgress}%;transition:width 0.5s"></div></div><p style="color:#4ade80;font-weight:bold;margin-top:8px">${Math.round(newProgress)}% Complete</p></div></div>`,
                    timer: 3000,
                    showConfirmButton: false,
                    background: '#1a1a2e',
                    color: '#fff'
                });
            } else {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: '✅ Lesson Complete!',
                    text: 'Keep up the great work!',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    background: '#1a1a2e',
                    color: '#fff'
                });
            }
        }
    };

    const showProgressToast = (milestone) => {
        const msg = milestoneMessages[milestone];
        if (!msg) return;
        
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `${msg.emoji} ${msg.title}`,
            text: msg.text,
            showConfirmButton: false,
            timer: 3500,
            timerProgressBar: true,
            background: '#1a1a2e',
            color: '#fff',
            customClass: { popup: 'progress-toast-popup' }
        });
    };

    const handlePrevious = () => {
        if (navigation.previous) {
            setShowYouTubeModal(false);
            navigate(`/student/learn/${course_id}/lesson/${navigation.previous.id}`);
        }
    };

    const handleNext = () => {
        if (navigation.next) {
            if (navigation.next.is_locked) {
                Swal.fire({
                    icon: 'info',
                    title: '🔒 Next Lesson Locked',
                    text: 'Complete this lesson first to unlock the next one',
                    confirmButtonColor: '#3b82f6'
                });
                return;
            }
            setShowYouTubeModal(false);
            navigate(`/student/learn/${course_id}/lesson/${navigation.next.id}`);
        }
    };

    const handleDownload = async (downloadable) => {
        try {
            await axios.post(`${baseUrl}/downloadable/${downloadable.id}/increment/`, {
                student_id: studentId
            });
            window.open(downloadable.file, '_blank');
        } catch (error) {
            console.error('Error downloading:', error);
            Swal.fire({
                icon: 'warning',
                title: 'Download blocked',
                text: error?.response?.data?.message || 'Your subscription does not allow this download.',
                confirmButtonColor: '#3b82f6'
            });
        }
    };

    const handleResumeVideo = (resume) => {
        setShowResumePrompt(false);
        if (resume && videoRef.current) {
            videoRef.current.currentTime = currentLesson.last_position;
        }
    };

    const saveVideoPosition = () => {
        if (videoRef.current && videoRef.current.currentTime > 0) {
            const position = Math.floor(videoRef.current.currentTime);
            axios.post(`${baseUrl}/student/${studentId}/lesson/${lesson_id}/position/`, 
                { position },
                { headers: { 'Content-Type': 'application/json' } }
            ).catch(err => console.error('Error saving position:', err));
        }
    };

    const getContentTypeIcon = (type) => {
        const icons = {
            'video': 'bi-play-circle-fill',
            'audio': 'bi-music-note-beamed',
            'pdf': 'bi-file-pdf-fill',
            'image': 'bi-image-fill'
        };
        return icons[type] || 'bi-file-earmark';
    };

    const getDownloadIcon = (fileType) => {
        const icons = {
            'pdf': 'bi-file-pdf-fill text-danger',
            'sheet_music': 'bi-music-note-list text-primary',
            'audio_slow': 'bi-soundwave text-info',
            'audio_fast': 'bi-lightning-fill text-warning',
            'audio_playalong': 'bi-headphones text-success',
            'worksheet': 'bi-file-earmark-text-fill text-secondary',
            'other': 'bi-file-earmark-fill'
        };
        return icons[fileType] || 'bi-file-earmark-fill';
    };

    // Extract YouTube video ID from various URL formats
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        let videoId = null;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com')) {
                videoId = urlObj.searchParams.get('v');
            } else if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.slice(1);
            }
        } catch (e) {
            // Try regex as fallback
            const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (match) videoId = match[1];
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
    };

    const renderContent = () => {
        if (!currentLesson) {
            return (
                <div className="empty-state-container">
                    <div className="empty-state-icon">
                        <i className="bi bi-play-circle"></i>
                    </div>
                    <h5 className="empty-state-title">Ready to Learn?</h5>
                    <p className="empty-state-text">Select a lesson from the sidebar to begin</p>
                </div>
            );
        }

        if (currentLesson.is_locked) {
            return (
                <div className="locked-lesson-container">
                    <div className="locked-icon">
                        <i className="bi bi-lock-fill"></i>
                    </div>
                    <h4>🔒 Lesson Locked</h4>
                    <p>Complete the previous lessons to unlock this content</p>
                    <button 
                        className="btn-primary-gradient"
                        onClick={() => {
                            if (navigation.previous) {
                                navigate(`/student/learn/${course_id}/lesson/${navigation.previous.id}`);
                            }
                        }}
                    >
                        <i className="bi bi-arrow-left"></i>
                        Go to Previous Lesson
                    </button>
                </div>
            );
        }

        const { content_type, file, title, youtube_url } = currentLesson;
        const youtubeEmbedUrl = getYouTubeEmbedUrl(youtube_url);
        
        let fileUrl = file;
        if (file && !file.startsWith('http')) {
            fileUrl = `${mediaUrl}${file.startsWith('/') ? '' : '/'}${file}`;
        }
        
        if (!fileUrl && !youtubeEmbedUrl) {
            return (
                <div className="error-state-container">
                    <div className="error-state-icon">
                        <i className="bi bi-exclamation-triangle"></i>
                    </div>
                    <h5 className="empty-state-title">Content Unavailable</h5>
                    <p className="empty-state-text">This lesson doesn't have any content yet</p>
                </div>
            );
        }
        
        // YouTube-only lesson (no file uploaded)
        if (!fileUrl && youtubeEmbedUrl) {
            return (
                <div className="content-section-wrapper">
                    <div className="content-player-wrapper">
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px' }}>
                            <iframe
                                src={youtubeEmbedUrl}
                                title={title}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            );
        }

        const getContentTypeLabel = (type) => {
            const labels = {
                'video': 'Video Lesson',
                'audio': 'Audio Lesson',
                'pdf': 'PDF Document',
                'image': 'Image Content'
            };
            return labels[type] || 'Lesson Content';
        };

        const getContentTypeColor = (type) => {
            const colors = {
                'video': '#ef4444',
                'audio': '#8b5cf6',
                'pdf': '#ea580c',
                'image': '#06b6d4'
            };
            return colors[type] || '#3b82f6';
        };

        // YouTube watch button (opens popup modal)
        const YouTubeButton = () => youtubeEmbedUrl ? (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                    onClick={() => setShowYouTubeModal(true)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 28px',
                        background: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50px',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(255, 0, 0, 0.3)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(255, 0, 0, 0.4)'; }}
                    onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(255, 0, 0, 0.3)'; }}
                >
                    <i className="bi bi-youtube" style={{ fontSize: '20px' }}></i>
                    Watch YouTube Video
                </button>
            </div>
        ) : null;

        switch (content_type) {
            case 'video':
                return (
                    <div className="content-section-wrapper">
                        <div className="content-player-wrapper">
                            {showResumePrompt && (
                                <div className="resume-prompt">
                                    <div className="resume-content">
                                        <p>Resume from {Math.floor(currentLesson.last_position / 60)}:{String(Math.floor(currentLesson.last_position % 60)).padStart(2, '0')}?</p>
                                        <div className="resume-buttons">
                                            <button onClick={() => handleResumeVideo(true)} className="btn-yes">Resume</button>
                                            <button onClick={() => handleResumeVideo(false)} className="btn-no">Start from Beginning</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <video ref={videoRef} className="video-player" controls onPause={saveVideoPosition} onEnded={saveVideoPosition}>
                                <source src={fileUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <YouTubeButton />
                    </div>
                );

            case 'audio':
                return (
                    <div className="content-section-wrapper">
                        <div className="content-player-wrapper audio-wrapper">
                            <div className="audio-player-container">
                                <div className="audio-player-icon">
                                    <i className="bi bi-music-note-beamed"></i>
                                </div>
                                <audio ref={audioRef} className="audio-player" controls onPause={saveVideoPosition} onEnded={saveVideoPosition}>
                                    <source src={fileUrl} type="audio/mpeg" />
                                    Your browser does not support the audio tag.
                                </audio>
                            </div>
                        </div>
                        <YouTubeButton />
                    </div>
                );

            case 'pdf':
                return (
                    <div className="content-section-wrapper">
                        <div className="content-player-wrapper pdf-wrapper">
                            <iframe src={`${fileUrl}#toolbar=1`} style={{width: '100%', height: '600px', border: 'none', borderRadius: '12px'}} title="PDF Viewer"></iframe>
                        </div>
                        <YouTubeButton />
                    </div>
                );

            case 'image':
                return (
                    <div className="content-section-wrapper">
                        <div className="content-player-wrapper image-wrapper">
                            <img src={fileUrl} alt={title} className="lesson-image" />
                        </div>
                        <YouTubeButton />
                    </div>
                );

            default:
                return (
                    <div className="error-state-container">
                        <p>Unsupported content type: {content_type}</p>
                    </div>
                );
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen size="xl" text="Loading course content..." />;
    }

    // Check for subscription access denial
    if (!lessonAccess.checking && !lessonAccess.can_access) {
        return (
            <div className="course-player-container">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
                <div className="player-main-content" style={{ marginLeft: isMobile ? 0 : '250px' }}>
                    <div className="access-denied-container" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '60vh',
                        padding: '40px 20px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '24px'
                        }}>
                            <i className="bi bi-lock-fill" style={{ fontSize: '40px', color: '#f59e0b' }}></i>
                        </div>
                        <h3 style={{ marginBottom: '12px', color: '#1e293b', fontWeight: 700 }}>
                            Premium Content
                        </h3>
                        <p style={{ color: '#64748b', maxWidth: '400px', marginBottom: '8px' }}>
                            {lessonAccess.message || lessonAccess.reason || 'This lesson requires an upgraded subscription.'}
                        </p>
                        
                        {subscriptionInfo?.subscription && (
                            <div style={{
                                background: '#f8fafc',
                                borderRadius: '12px',
                                padding: '16px 24px',
                                marginBottom: '24px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                                    Your current plan: <strong style={{ color: '#3b82f6' }}>
                                        {subscriptionInfo.subscription.plan_name || 'Basic'}
                                    </strong>
                                </p>
                                {subscriptionInfo.usage && (
                                    <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                                        Weekly lessons: {subscriptionInfo.usage.lessons_this_week || 0} / {subscriptionInfo.usage.lessons_per_week || '∞'}
                                    </p>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Link 
                                to="/student/subscriptions" 
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white',
                                    padding: '12px 24px',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                            >
                                <i className="bi bi-star-fill"></i>
                                Upgrade Plan
                            </Link>
                            <button 
                                onClick={() => navigate(`/detail/${course_id}`)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    padding: '12px 24px',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <i className="bi bi-arrow-left"></i>
                                Back to Course
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="access-denied-container">
                <div className="access-denied-icon">
                    <i className="bi bi-exclamation-circle"></i>
                </div>
                <h4>Error Loading Content</h4>
                <p>{error}</p>
                <button onClick={() => navigate(`/detail/${course_id}`)} className="btn-primary-gradient">
                    Back to Course
                </button>
            </div>
        );
    }

    return (
        <div className="course-player-container">
            {/* Main Sidebar Component */}
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
            
            {/* Mobile overlay when sidebar is open */}
            {isMobile && sidebarOpen && (
                <div 
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
            
            <div className="course-player-content">
                {/* Mobile Header with Toggle */}
                <div className="player-mobile-header">
                    <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <i className="bi bi-list"></i>
                    </button>
                    <div className="course-title-mini">{pageData?.course?.title}</div>
                    <Link to={`/detail/${course_id}`} className="back-btn">
                        <i className="bi bi-x-lg"></i>
                    </Link>
                </div>

                <div className="player-main-content">
                    {/* Back to Course Button */}
                    <Link to={`/detail/${course_id}`} className="back-to-course-link">
                        <i className="bi bi-arrow-left"></i>
                        <span>Back to Course</span>
                    </Link>

                    {/* Lesson Header */}
                    {currentLesson && !currentLesson.is_locked && (
                        <div className="lesson-header">
                            <div className="lesson-header-content">
                                <div className="lesson-header-left">
                                    <h4 className="current-lesson-title">{currentLesson.title}</h4>
                                    {currentLesson.description && (
                                        <p className="lesson-description">{currentLesson.description}</p>
                                    )}
                                </div>
                                <div className="lesson-header-actions">
                                    {currentLesson.downloadables?.length > 0 && (
                                        <button 
                                            className={`action-btn ${floatingResourcesOpen ? 'active' : ''}`}
                                            onClick={() => setFloatingResourcesOpen(!floatingResourcesOpen)}
                                        >
                                            <i className="bi bi-download"></i>
                                            <span>Resources ({currentLesson.downloadables.length})</span>
                                        </button>
                                    )}
                                    {currentLesson.objectives_list?.length > 0 && (
                                        <button 
                                            className={`action-btn ${floatingObjectivesOpen ? 'active' : ''}`}
                                            onClick={() => setFloatingObjectivesOpen(!floatingObjectivesOpen)}
                                        >
                                            <i className="bi bi-bullseye"></i>
                                            <span>Objectives ({currentLesson.objectives_list.length})</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Downloadables */}
                            {showDownloadables && currentLesson.downloadables?.length > 0 && (
                                <div style={{marginBottom: '20px'}}></div>
                            )}
                        </div>
                    )}

                    {/* Empty State or Locked Lesson */}
                    {!currentLesson && (
                        <div className="empty-state-container">
                            <div className="empty-state-icon">
                                <i className="bi bi-play-circle"></i>
                            </div>
                            <h5 className="empty-state-title">Ready to Learn?</h5>
                            <p className="empty-state-text">Select a lesson from the sidebar to begin</p>
                        </div>
                    )}

                    {currentLesson?.is_locked && (
                        <div className="locked-lesson-container">
                            <div className="locked-icon">
                                <i className="bi bi-lock-fill"></i>
                            </div>
                            <h4>🔒 Lesson Locked</h4>
                            <p>Complete the previous lessons to unlock this content</p>
                            <button 
                                className="btn-primary-gradient"
                                onClick={() => {
                                    if (navigation.previous) {
                                        navigate(`/student/learn/${course_id}/lesson/${navigation.previous.id}`);
                                    }
                                }}
                            >
                                <i className="bi bi-arrow-left"></i>
                                Go to Previous Lesson
                            </button>
                        </div>
                    )}

                    {/* Media Player */}
                    {currentLesson && !currentLesson.is_locked && (
                        <div className="media-player-container">
                            {renderContent()}
                        </div>
                    )}

                    {/* Bottom Controls */}
                    <div className="bottom-controls">
                        <div className="controls-left">
                            <button 
                                className="nav-btn prev"
                                onClick={handlePrevious}
                                disabled={!navigation.previous}
                            >
                                <i className="bi bi-chevron-left"></i>
                                <span className="btn-text">Previous</span>
                            </button>
                            
                            <span className="lesson-counter">
                                {navigation.current_position || 0} of {navigation.total_lessons || 0}
                            </span>
                        </div>

                        <div className="controls-right">
                            {currentLesson && !currentLesson.is_completed && !currentLesson.is_locked && (
                                <button className="complete-btn" onClick={handleMarkComplete}>
                                    <i className="bi bi-check-lg"></i>
                                    <span>Mark Complete</span>
                                </button>
                            )}
                            
                            <button 
                                className="nav-btn next"
                                onClick={handleNext}
                                disabled={!navigation.next}
                            >
                                <span className="btn-text">Next</span>
                                <i className="bi bi-chevron-right"></i>
                            </button>
                        </div>
                    </div>

                    {/* Floating Objectives Panel */}
                    {currentLesson && currentLesson.objectives_list?.length > 0 && (
                        <>
                            {floatingObjectivesOpen && (
                                <div className="floating-overlay" onClick={() => setFloatingObjectivesOpen(false)}></div>
                            )}
                            <div className={`floating-objectives-panel ${floatingObjectivesOpen ? 'open' : ''}`}>
                                <div className="floating-objectives-header">
                                    <h6><i className="bi bi-bullseye" style={{marginRight: '8px'}}></i>What you'll learn</h6>
                                    <button 
                                        className="close-floating-btn"
                                        onClick={() => setFloatingObjectivesOpen(false)}
                                    >
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                                <ul className="floating-objectives-list">
                                    {currentLesson.objectives_list.map((obj, index) => (
                                        <li key={index}>
                                            <i className="bi bi-check-circle-fill"></i>
                                            <span>{obj}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}

                    {/* Floating Resources Panel */}
                    {currentLesson && currentLesson.downloadables?.length > 0 && (
                        <>
                            {floatingResourcesOpen && (
                                <div className="floating-overlay" onClick={() => setFloatingResourcesOpen(false)}></div>
                            )}
                            <div className={`floating-resources-panel ${floatingResourcesOpen ? 'open' : ''}`}>
                                <div className="floating-resources-header">
                                    <h6><i className="bi bi-folder2-open" style={{marginRight: '8px'}}></i>Lesson Resources</h6>
                                    <button 
                                        className="close-floating-btn"
                                        onClick={() => setFloatingResourcesOpen(false)}
                                    >
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                                <div className="floating-resources-grid">
                                    {currentLesson.downloadables.map((item) => (
                                        <div 
                                            key={item.id} 
                                            className="floating-resource-card"
                                            onClick={() => handleDownload(item)}
                                        >
                                            <div className="resource-icon">
                                                <i className={`bi ${getDownloadIcon(item.file_type)}`}></i>
                                            </div>
                                            <div className="resource-info">
                                                <div className="resource-title">{item.title}</div>
                                                <div className="resource-meta">
                                                    <span>{item.file_type_display}</span>
                                                    <span>{item.file_size_formatted}</span>
                                                </div>
                                            </div>
                                            <i className="bi bi-download download-icon"></i>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* YouTube Video Popup Modal */}
            {showYouTubeModal && currentLesson?.youtube_url && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        animation: 'fadeIn 0.2s ease'
                    }}
                    onClick={() => setShowYouTubeModal(false)}
                >
                    <div 
                        style={{
                            width: '100%',
                            maxWidth: '960px',
                            background: '#000',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 20px',
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                            borderBottom: '1px solid #333'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="bi bi-youtube" style={{ color: '#ff0000', fontSize: '22px' }}></i>
                                <span style={{ color: '#fff', fontWeight: 600, fontSize: '15px' }}>
                                    YouTube Video — {currentLesson.title}
                                </span>
                            </div>
                            <button
                                onClick={() => setShowYouTubeModal(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    color: '#fff',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                                onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        {/* YouTube Iframe */}
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                            <iframe
                                src={getYouTubeEmbedUrl(currentLesson.youtube_url)}
                                title={`${currentLesson.title} - YouTube`}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentCoursePlayer;