import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import Swal from 'sweetalert2';

const AudioRecorder = ({ teacherId, students = [], onMessageSent = null }) => {
  const baseUrl = API_BASE_URL;
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [sending, setSending] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [title, setTitle] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      stopRecording();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up analyser for waveform
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setShowPlayer(true);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);
      setAudioBlob(null);
      setAudioUrl(null);
      setShowPlayer(false);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      drawWaveform();
    } catch (err) {
      const isInsecure = window.location.protocol === 'http:' && window.location.hostname !== 'localhost';
      Swal.fire({
        icon: 'error',
        title: 'Microphone Access',
        text: isInsecure
          ? 'Microphone requires a secure (HTTPS) connection. Please access the site via HTTPS.'
          : 'Please allow microphone access to record audio. Check your browser permissions.'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setShowPlayer(false);
    setDuration(0);
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const sendMessage = async () => {
    if (!audioBlob || !selectedStudent) {
      Swal.fire({ icon: 'warning', title: 'Missing Info', text: 'Please select a student and record audio first.' });
      return;
    }

    setSending(true);
    const formData = new FormData();
    formData.append('teacher', teacherId);
    formData.append('student', selectedStudent);
    formData.append('title', title || `Audio Message - ${new Date().toLocaleDateString()}`);
    formData.append('audio_file', audioBlob, `audio_message_${Date.now()}.webm`);
    formData.append('duration_seconds', duration);

    try {
      await axios.post(`${baseUrl}/teacher/${teacherId}/audio-messages/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      Swal.fire({ icon: 'success', title: 'Sent!', text: 'Audio message sent to student.', timer: 1500, showConfirmButton: false });
      discardRecording();
      setTitle('');
      setSelectedStudent('');
      if (onMessageSent) onMessageSent();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send audio message';
      if (err.response?.data?.requires_upgrade) {
        Swal.fire({ icon: 'warning', title: 'Limit Reached', text: msg, confirmButtonText: 'OK' });
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: msg });
      }
    }
    setSending(false);
  };

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: '40px', height: '40px', backgroundColor: '#fef3c7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-mic" style={{ fontSize: '20px', color: '#f59e0b' }}></i>
        </div>
        <div>
          <h5 style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>Send Audio Message</h5>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Record and send audio feedback to your students</p>
        </div>
      </div>

      {/* Student selector + title */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}>
          <option value="">Select student...</option>
          {students.map(s => (
            <option key={s.id || s.student?.id} value={s.student?.id || s.id}>
              {s.student?.fullname || s.fullname || s.student_name}
            </option>
          ))}
        </select>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Message title (optional)" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
      </div>

      {/* Waveform / Recording area */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
        {isRecording && (
          <canvas ref={canvasRef} width={400} height={60} style={{ width: '100%', height: '60px', marginBottom: '12px', borderRadius: '8px' }}></canvas>
        )}
        
        <div style={{ fontSize: '32px', fontWeight: '700', color: isRecording ? '#ef4444' : '#1e293b', fontFamily: 'monospace', marginBottom: '8px' }}>
          {formatTime(duration)}
        </div>

        {isRecording && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#ef4444', fontSize: '13px' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
            Recording...
          </div>
        )}

        {showPlayer && audioUrl && (
          <div style={{ marginTop: '12px' }}>
            <audio controls src={audioUrl} style={{ width: '100%', borderRadius: '8px' }}></audio>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        {!isRecording && !audioBlob && (
          <button onClick={startRecording} style={{ padding: '12px 28px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
            <i className="bi bi-mic-fill"></i> Start Recording
          </button>
        )}
        {isRecording && (
          <button onClick={stopRecording} style={{ padding: '12px 28px', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
            <i className="bi bi-stop-fill"></i> Stop
          </button>
        )}
        {audioBlob && !isRecording && (
          <>
            <button onClick={discardRecording} style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '500', cursor: 'pointer', fontSize: '14px' }}>
              <i className="bi bi-trash me-1"></i> Discard
            </button>
            <button onClick={startRecording} style={{ padding: '10px 20px', backgroundColor: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '10px', fontWeight: '500', cursor: 'pointer', fontSize: '14px' }}>
              <i className="bi bi-arrow-clockwise me-1"></i> Re-record
            </button>
            <button onClick={sendMessage} disabled={sending} style={{ padding: '10px 24px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {sending ? <><span className="spinner-border spinner-border-sm"></span> Sending...</> : <><i className="bi bi-send-fill"></i> Send</>}
            </button>
          </>
        )}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
};

export default AudioRecorder;
