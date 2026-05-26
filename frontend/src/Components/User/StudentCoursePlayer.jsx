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
    const [playbackRate, setPlaybackRate] = useState(1);
    const [loopEnabled, setLoopEnabled] = useState(false);
    const [loopStart, setLoopStart] = useState(0);
    const [loopEnd, setLoopEnd] = useState(0);
    const [metronomeEnabled, setMetronomeEnabled] = useState(false);
    const metronomeIntervalRef = useRef(null);
    const metronomeAudioRef = useRef(null);
    const METRONOME_BPM = 60;
    const recorderRef = useRef(null);
    const recorderStreamRef = useRef(null);
    const recorderTimerRef = useRef(null);
    const recorderChunksRef = useRef([]);
    const [recordingType, setRecordingType] = useState('audio');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [recordedUrl, setRecordedUrl] = useState(null);
    const [sendingSubmission, setSendingSubmission] = useState(false);
    const [lessonSubmission, setLessonSubmission] = useState(null);
    const [recorderSupported, setRecorderSupported] = useState(true);
    const [showUploadFallback, setShowUploadFallback] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);

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
                await fetchLessonSubmission(lesson_id);

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

    const fetchLessonSubmission = async (targetLessonId) => {
        if (!studentId || !targetLessonId) return;
        try {
            const res = await axios.get(`${baseUrl}/student/${studentId}/lesson/${targetLessonId}/submission/`);
            setLessonSubmission(res.data?.submission || null);
        } catch (err) {
            console.error('Error fetching lesson submission:', err);
            setLessonSubmission(null);
        }
    };

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

    useEffect(() => {
        const supported = !!(navigator.mediaDevices && window.MediaRecorder);
        setRecorderSupported(supported);
        if (!supported) {
            setShowUploadFallback(true);
        }
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

    const handleRepeatAfterMeAction = async (action) => {
        try {
            await axios.post(`${baseUrl}/student/${studentId}/lesson/${lesson_id}/repeat-after-me/`, { action });
            const labelMap = {
                done: 'Done',
                again: 'Practice Again',
                got_it: 'I Got It'
            };
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `✅ ${labelMap[action]}`,
                showConfirmButton: false,
                timer: 1800,
                timerProgressBar: true,
                background: '#1a1a2e',
                color: '#fff'
            });
        } catch (error) {
            console.error('Error recording Repeat After Me action:', error);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Could not record action',
                showConfirmButton: false,
                timer: 1800,
                timerProgressBar: true
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

    const playMetronomeTick = () => {
        const AudioContextRef = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextRef) return;
        if (!metronomeAudioRef.current) {
            metronomeAudioRef.current = new AudioContextRef();
        }
        const ctx = metronomeAudioRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = 'square';
        oscillator.frequency.value = 1000;
        gainNode.gain.value = 0.08;
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.05);
    };

    const startMetronome = () => {
        stopMetronome();
        playMetronomeTick();
        const intervalMs = Math.round(60000 / METRONOME_BPM);
        metronomeIntervalRef.current = setInterval(playMetronomeTick, intervalMs);
    };

    const stopMetronome = () => {
        if (metronomeIntervalRef.current) {
            clearInterval(metronomeIntervalRef.current);
            metronomeIntervalRef.current = null;
        }
    };

    const handleMetronomeToggle = () => {
        setMetronomeEnabled((prev) => {
            const next = !prev;
            if (next) {
                startMetronome();
            } else {
                stopMetronome();
            }
            return next;
        });
    };

    const handlePlaybackRateChange = (rate) => {
        setPlaybackRate(rate);
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
        }
    };

    const handleReplay = () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = 0;
        audioRef.current.play();
    };

    const handleSetLoopStart = () => {
        if (!audioRef.current) return;
        setLoopStart(Math.floor(audioRef.current.currentTime));
    };

    const handleSetLoopEnd = () => {
        if (!audioRef.current) return;
        setLoopEnd(Math.floor(audioRef.current.currentTime));
    };

    const handleLoopToggle = () => {
        setLoopEnabled((prev) => !prev);
    };

    const handleAudioTimeUpdate = () => {
        if (!audioRef.current || !loopEnabled) return;
        if (loopEnd > loopStart && audioRef.current.currentTime >= loopEnd) {
            audioRef.current.currentTime = loopStart;
        }
    };

    useEffect(() => {
        setPlaybackRate(1);
        setLoopEnabled(false);
        setLoopStart(0);
        setLoopEnd(0);
        stopMetronome();
        stopRecording();
        clearRecording();
    }, [lesson_id]);

    useEffect(() => () => stopMetronome(), []);
    useEffect(() => () => stopRecording(), []);

    const startRecording = async (type) => {
        try {
            const constraints = type === 'video'
                ? { audio: true, video: true }
                : { audio: true };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            recorderStreamRef.current = stream;

            const mimeType = type === 'video'
                ? 'video/webm;codecs=vp8,opus'
                : 'audio/webm;codecs=opus';
            const recorder = new MediaRecorder(stream, { mimeType });
            recorderRef.current = recorder;
            recorderChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recorderChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blobType = type === 'video' ? 'video/webm' : 'audio/webm';
                const blob = new Blob(recorderChunksRef.current, { type: blobType });
                setRecordedBlob(blob);
                const url = URL.createObjectURL(blob);
                setRecordedUrl(url);
                if (recorderStreamRef.current) {
                    recorderStreamRef.current.getTracks().forEach((track) => track.stop());
                }
            };

            recorder.start(100);
            setRecordingType(type);
            setIsRecording(true);
            setRecordingDuration(0);
            setRecordedBlob(null);
            if (recordedUrl) URL.revokeObjectURL(recordedUrl);
            setRecordedUrl(null);

            recorderTimerRef.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Recording error:', err);
            Swal.fire({
                icon: 'error',
                title: 'Recording unavailable',
                text: 'Please allow microphone/camera access to record.',
                confirmButtonColor: '#3b82f6'
            });
        }
    };

    const stopRecording = () => {
        if (recorderRef.current && isRecording) {
            recorderRef.current.stop();
        }
        if (recorderTimerRef.current) {
            clearInterval(recorderTimerRef.current);
            recorderTimerRef.current = null;
        }
        setIsRecording(false);
    };

    const clearRecording = () => {
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedBlob(null);
        setRecordedUrl(null);
        setRecordingDuration(0);
    };

    const submitRecording = async () => {
        if (!recordedBlob || !currentLesson || !studentId) return;
        setSendingSubmission(true);
        try {
            const payload = new FormData();
            payload.append('submission_type', recordingType);
            if (recordingType === 'video') {
                payload.append('video_file', recordedBlob, `lesson_${lesson_id}_video.webm`);
            } else {
                payload.append('audio_file', recordedBlob, `lesson_${lesson_id}_audio.webm`);
            }

            await axios.post(
                `${baseUrl}/student/${studentId}/lesson/${lesson_id}/submit-media/`,
                payload,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            await fetchLessonSubmission(lesson_id);
            clearRecording();
            Swal.fire({
                icon: 'success',
                title: 'Submitted!',
                text: 'Your recording was submitted to your teacher.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Submit error:', err);
            Swal.fire({
                icon: 'error',
                title: 'Submission failed',
                text: err?.response?.data?.message || 'Please try again.',
                confirmButtonColor: '#3b82f6'
            });
        } finally {
            setSendingSubmission(false);
        }
    };

    const submitUploadFile = async () => {
        if (!uploadFile || !currentLesson || !studentId) return;
        setSendingSubmission(true);
        try {
            const payload = new FormData();
            payload.append('submission_type', recordingType);
            if (recordingType === 'video') {
                payload.append('video_file', uploadFile);
            } else {
                payload.append('audio_file', uploadFile);
            }

            await axios.post(
                `${baseUrl}/student/${studentId}/lesson/${lesson_id}/submit-media/`,
                payload,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            await fetchLessonSubmission(lesson_id);
            setUploadFile(null);
            Swal.fire({
                icon: 'success',
                title: 'Submitted!',
                text: 'Your upload was submitted to your teacher.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Upload submit error:', err);
            Swal.fire({
                icon: 'error',
                title: 'Submission failed',
                text: err?.response?.data?.message || 'Please try again.',
                confirmButtonColor: '#3b82f6'
            });
        } finally {
            setSendingSubmission(false);
        }
    };

    const formatRecordingTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const rem = (secs % 60).toString().padStart(2, '0');
        return `${mins}:${rem}`;
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

    // Extract YouTube video ID from common URL formats and normalize it for embeds.
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;

        const normalizedUrl = String(url).trim();
        let videoId = null;

        try {
            const urlObj = new URL(normalizedUrl);
            const hostname = urlObj.hostname.replace(/^www\./, '');

            if (hostname.includes('youtube.com')) {
                videoId = urlObj.searchParams.get('v');

                if (!videoId) {
                    const pathMatch = urlObj.pathname.match(/\/(?:embed|v|shorts)\/([a-zA-Z0-9_-]{11})/);
                    if (pathMatch) videoId = pathMatch[1];
                }
            } else if (hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.split('/').filter(Boolean)[0];
            }
        } catch (e) {
            // Try regex as fallback for pasted links or slightly malformed URLs.
            const match = normalizedUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (match) videoId = match[1];
        }

        return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
    };

    const getPlayAlongConfig = (lesson) => {
        if (!lesson) return { enabled: false, trackType: null };
        let config = lesson.interaction_config;
        if (typeof config === 'string') {
            try {
                config = JSON.parse(config);
            } catch (err) {
                config = null;
            }
        }
        const trackType = config?.track_type || null;
        const enabled = lesson.interaction_type === 'play_along' || !!trackType;
        return { enabled, trackType };
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
        
        // If the lesson has a YouTube link, prioritize the embed for video lessons.
        if (youtubeEmbedUrl && content_type === 'video') {
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
                const playAlongConfig = getPlayAlongConfig(currentLesson);
                return (
                    <div className="content-section-wrapper">
                        <div className="content-player-wrapper audio-wrapper">
                            <div className="audio-player-container">
                                <div className="audio-player-icon">
                                    <i className="bi bi-music-note-beamed"></i>
                                </div>
                                <audio
                                    ref={audioRef}
                                    className="audio-player"
                                    controls
                                    onPause={saveVideoPosition}
                                    onEnded={saveVideoPosition}
                                    onTimeUpdate={handleAudioTimeUpdate}
                                    playbackRate={playbackRate}
                                >
                                    <source src={fileUrl} type="audio/mpeg" />
                                    Your browser does not support the audio tag.
                                </audio>
                            </div>
                            {playAlongConfig.enabled && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '14px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    background: '#f8fafc'
                                }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Speed</span>
                                            {[0.75, 1, 1.25, 1.5].map(rate => (
                                                <button
                                                    key={rate}
                                                    type="button"
                                                    onClick={() => handlePlaybackRateChange(rate)}
                                                    style={{
                                                        border: '1px solid #e2e8f0',
                                                        background: playbackRate === rate ? '#dbeafe' : '#fff',
                                                        color: playbackRate === rate ? '#1d4ed8' : '#334155',
                                                        padding: '6px 10px',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {rate}x
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Loop</span>
                                            <button
                                                type="button"
                                                onClick={handleSetLoopStart}
                                                style={{
                                                    border: '1px solid #e2e8f0',
                                                    background: '#fff',
                                                    color: '#334155',
                                                    padding: '6px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Set A
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSetLoopEnd}
                                                style={{
                                                    border: '1px solid #e2e8f0',
                                                    background: '#fff',
                                                    color: '#334155',
                                                    padding: '6px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Set B
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleLoopToggle}
                                                style={{
                                                    border: '1px solid #e2e8f0',
                                                    background: loopEnabled ? '#dcfce7' : '#fff',
                                                    color: loopEnabled ? '#15803d' : '#334155',
                                                    padding: '6px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {loopEnabled ? 'Loop On' : 'Loop Off'}
                                            </button>
                                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                {loopStart}s - {loopEnd}s
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={handleReplay}
                                                style={{
                                                    border: '1px solid #e2e8f0',
                                                    background: '#fff',
                                                    color: '#334155',
                                                    padding: '6px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Replay
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleMetronomeToggle}
                                                style={{
                                                    border: '1px solid #e2e8f0',
                                                    background: metronomeEnabled ? '#fee2e2' : '#fff',
                                                    color: metronomeEnabled ? '#b91c1c' : '#334155',
                                                    padding: '6px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {metronomeEnabled ? 'Metronome On' : 'Metronome Off'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
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

                    {/* Repeat After Me */}
                    {currentLesson?.repeat_after_me_enabled && !currentLesson.is_locked && (
                        <div className="repeat-after-me-container" style={{
                            marginTop: '20px',
                            padding: '16px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            background: '#f8fafc'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: '#e0e7ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="bi bi-mic-fill" style={{ color: '#4338ca' }}></i>
                                </div>
                                <div>
                                    <h6 style={{ margin: 0, color: '#1e293b', fontWeight: 700 }}>Repeat After Me</h6>
                                    <small style={{ color: '#64748b' }}>Listen, practice, then mark your progress.</small>
                                </div>
                                {currentLesson.repeat_after_me_status?.action && (
                                    <span style={{
                                        marginLeft: 'auto',
                                        background: '#dcfce7',
                                        color: '#166534',
                                        padding: '4px 10px',
                                        borderRadius: '999px',
                                        fontSize: '12px',
                                        fontWeight: 600
                                    }}>
                                        {currentLesson.repeat_after_me_status.action === 'done' && '✅ Done'}
                                        {currentLesson.repeat_after_me_status.action === 'again' && '🔁 Practicing'}
                                        {currentLesson.repeat_after_me_status.action === 'got_it' && '⭐ Got It'}
                                    </span>
                                )}
                            </div>
                            {currentLesson.repeat_after_me_prompt && (
                                <p style={{ marginBottom: '12px', color: '#334155' }}>
                                    {currentLesson.repeat_after_me_prompt}
                                </p>
                            )}
                            {currentLesson.repeat_after_me_audio && (
                                <audio
                                    controls
                                    style={{ width: '100%', marginBottom: '12px' }}
                                    src={currentLesson.repeat_after_me_audio.startsWith('http')
                                        ? currentLesson.repeat_after_me_audio
                                        : `${mediaUrl}${currentLesson.repeat_after_me_audio.startsWith('/') ? '' : '/'}${currentLesson.repeat_after_me_audio}`}
                                />
                            )}
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button
                                    className="btn"
                                    onClick={() => handleRepeatAfterMeAction('done')}
                                    style={{ background: '#16a34a', color: '#fff', borderRadius: '10px', padding: '8px 14px', border: 'none' }}
                                >
                                    ✅ Done
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => handleRepeatAfterMeAction('again')}
                                    style={{ background: '#f59e0b', color: '#fff', borderRadius: '10px', padding: '8px 14px', border: 'none' }}
                                >
                                    🔁 Practice Again
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => handleRepeatAfterMeAction('got_it')}
                                    style={{ background: '#3b82f6', color: '#fff', borderRadius: '10px', padding: '8px 14px', border: 'none' }}
                                >
                                    ⭐ I Got It
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Lesson Submission */}
                    {currentLesson && !currentLesson.is_locked && (
                        <div className="lesson-submission-card">
                            <div className="lesson-submission-header">
                                <div className="lesson-submission-title">
                                    <i className="bi bi-record-circle"></i>
                                    <div>
                                        <h6>Submit your recording</h6>
                                        <p>Record audio or video right here and send to your teacher.</p>
                                    </div>
                                </div>
                                {lessonSubmission && (
                                    <span className={`lesson-submission-status ${lessonSubmission.points_awarded !== null && lessonSubmission.points_awarded !== undefined
                                        ? (lessonSubmission.points_awarded > 0 ? 'approved' : 'rejected')
                                        : 'submitted'}`}>
                                        {lessonSubmission.points_awarded !== null && lessonSubmission.points_awarded !== undefined
                                            ? (lessonSubmission.points_awarded > 0 ? 'Approved' : 'Rejected')
                                            : 'Submitted'}
                                    </span>
                                )}
                            </div>

                            {lessonSubmission && (
                                <div className="lesson-submission-meta">
                                    <span>
                                        Last submission: {new Date(lessonSubmission.submitted_at).toLocaleString()}
                                    </span>
                                    {lessonSubmission.points_awarded !== null && lessonSubmission.points_awarded !== undefined && (
                                        <span className="lesson-submission-score">
                                            Score: {lessonSubmission.points_awarded} / {lessonSubmission.assignment_max_points || 100}
                                        </span>
                                    )}
                                    {lessonSubmission.teacher_feedback && (
                                        <span className="lesson-submission-feedback">
                                            Feedback: {lessonSubmission.teacher_feedback}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="lesson-submission-controls">
                                <div className="lesson-submission-toggle">
                                    <button
                                        type="button"
                                        className={recordingType === 'audio' ? 'active' : ''}
                                        onClick={() => setRecordingType('audio')}
                                        disabled={isRecording}
                                    >
                                        <i className="bi bi-mic"></i> Audio
                                    </button>
                                    <button
                                        type="button"
                                        className={recordingType === 'video' ? 'active' : ''}
                                        onClick={() => setRecordingType('video')}
                                        disabled={isRecording}
                                    >
                                        <i className="bi bi-camera-video"></i> Video
                                    </button>
                                </div>

                                <div className="lesson-submission-actions">
                                    {recorderSupported && !isRecording && !recordedBlob && !showUploadFallback && (
                                        <button
                                            type="button"
                                            className="record-btn"
                                            onClick={() => startRecording(recordingType)}
                                        >
                                            <i className="bi bi-record-circle"></i> Start Recording
                                        </button>
                                    )}
                                    {recorderSupported && isRecording && (
                                        <button
                                            type="button"
                                            className="stop-btn"
                                            onClick={stopRecording}
                                        >
                                            <i className="bi bi-stop-circle"></i> Stop ({formatRecordingTime(recordingDuration)})
                                        </button>
                                    )}
                                    {recorderSupported && recordedBlob && !isRecording && (
                                        <>
                                            <button
                                                type="button"
                                                className="discard-btn"
                                                onClick={clearRecording}
                                            >
                                                Discard
                                            </button>
                                            <button
                                                type="button"
                                                className="submit-btn"
                                                onClick={submitRecording}
                                                disabled={sendingSubmission}
                                            >
                                                {sendingSubmission ? 'Submitting...' : 'Submit'}
                                            </button>
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        className="upload-toggle-btn"
                                        onClick={() => setShowUploadFallback((prev) => !prev)}
                                        disabled={isRecording}
                                    >
                                        {showUploadFallback ? 'Hide Upload' : 'Upload Instead'}
                                    </button>
                                </div>
                            </div>

                            {showUploadFallback && (
                                <div className="lesson-submission-upload">
                                    <label className="upload-input">
                                        <input
                                            type="file"
                                            accept={recordingType === 'video' ? 'video/*' : 'audio/*'}
                                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        />
                                        <span>{uploadFile ? uploadFile.name : 'Choose file'}</span>
                                    </label>
                                    <button
                                        type="button"
                                        className="submit-btn"
                                        onClick={submitUploadFile}
                                        disabled={sendingSubmission || !uploadFile}
                                    >
                                        {sendingSubmission ? 'Submitting...' : 'Submit Upload'}
                                    </button>
                                </div>
                            )}

                            {recordedUrl && recordingType === 'audio' && (
                                <audio className="lesson-submission-preview" controls src={recordedUrl} />
                            )}
                            {recordedUrl && recordingType === 'video' && (
                                <video className="lesson-submission-preview" controls src={recordedUrl} />
                            )}
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