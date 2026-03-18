import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import {
  getTeacherOfficeHours,
  createTeacherOfficeHours,
  updateTeacherOfficeHours,
  deleteTeacherOfficeHours
} from '../../services/messagingService';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOUR_OPTIONS = [];
for (let h = 0; h <= 23; h++) {
  for (let m = 0; m < 60; m += 30) {
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const label = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    HOUR_OPTIONS.push({ value: time, label });
  }
}

// Timezone offset in minutes (positive = ahead of UTC, e.g. UTC+5 = 300)
const TZ_OFFSET = -(new Date().getTimezoneOffset()); // JS getTimezoneOffset returns negative for ahead

/**
 * Convert local day (0-6) + time ("HH:MM") to UTC day + time.
 * Handles day wrapping (e.g. Monday 01:00 local in UTC+5 → Sunday 20:00 UTC).
 */
const localToUtc = (localDay, localTime) => {
  const [h, m] = localTime.split(':').map(Number);
  const totalMinutesLocal = h * 60 + m;
  const totalMinutesUtc = totalMinutesLocal - TZ_OFFSET;
  let utcDay = localDay;
  let utcMinutes = totalMinutesUtc;
  if (utcMinutes < 0) {
    utcMinutes += 1440; // 24 * 60
    utcDay = (utcDay - 1 + 7) % 7;
  } else if (utcMinutes >= 1440) {
    utcMinutes -= 1440;
    utcDay = (utcDay + 1) % 7;
  }
  const utcH = Math.floor(utcMinutes / 60);
  const utcM = utcMinutes % 60;
  return {
    day: utcDay,
    time: `${String(utcH).padStart(2, '0')}:${String(utcM).padStart(2, '0')}`
  };
};

/**
 * Convert UTC day (0-6) + time ("HH:MM") to local day + time.
 */
const utcToLocal = (utcDay, utcTime) => {
  const [h, m] = utcTime.split(':').map(Number);
  const totalMinutesUtc = h * 60 + m;
  const totalMinutesLocal = totalMinutesUtc + TZ_OFFSET;
  let localDay = utcDay;
  let localMinutes = totalMinutesLocal;
  if (localMinutes < 0) {
    localMinutes += 1440;
    localDay = (localDay - 1 + 7) % 7;
  } else if (localMinutes >= 1440) {
    localMinutes -= 1440;
    localDay = (localDay + 1) % 7;
  }
  const localH = Math.floor(localMinutes / 60);
  const localM = localMinutes % 60;
  return {
    day: localDay,
    time: `${String(localH).padStart(2, '0')}:${String(localM).padStart(2, '0')}`
  };
};

const TeacherOfficeHours = () => {
  const teacherId = localStorage.getItem('teacherId');
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ day_of_week: 0, start_time: '09:00', end_time: '10:00', is_active: true, notes: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Office Hours — Kannari Music Academy';
    fetchHours();
  }, []);

  const seedDefaultHours = async () => {
    // Auto-create Mon-Fri 9 AM - 5 PM local time defaults for teachers with no hours
    const defaults = [0, 1, 2, 3, 4].map(day => {
      const utcStart = localToUtc(day, '09:00');
      const utcEnd = localToUtc(day, '17:00');
      return {
        day_of_week: utcStart.day,
        start_time: utcStart.time,
        end_time: utcEnd.time,
        is_active: true,
        notes: 'Available for lessons & parent messaging'
      };
    });
    for (const payload of defaults) {
      try {
        await createTeacherOfficeHours(teacherId, payload);
      } catch (e) { /* ignore duplicates */ }
    }
  };

  const fetchHours = async () => {
    setLoading(true);
    try {
      const res = await getTeacherOfficeHours(teacherId);
      let data = Array.isArray(res.data) ? res.data : [];

      // Auto-seed defaults if teacher has no office hours yet
      if (data.length === 0) {
        await seedDefaultHours();
        const res2 = await getTeacherOfficeHours(teacherId);
        data = Array.isArray(res2.data) ? res2.data : [];
      }

      // Convert UTC times from backend to local times for display
      const localHours = data.map(h => {
        const localStart = utcToLocal(h.day_of_week, h.start_time?.slice(0, 5) || '00:00');
        const localEnd = utcToLocal(h.day_of_week, h.end_time?.slice(0, 5) || '00:00');
        return {
          ...h,
          _utc_day: h.day_of_week,
          _utc_start: h.start_time,
          _utc_end: h.end_time,
          day_of_week: localStart.day,
          start_time: localStart.time,
          end_time: localEnd.time
        };
      });
      setHours(localHours);
    } catch (err) {
      console.error('Error fetching office hours:', err);
    }
    setLoading(false);
  };

  const openAddForm = () => {
    setEditItem(null);
    setForm({ day_of_week: 0, start_time: '09:00', end_time: '10:00', is_active: true, notes: '' });
    setShowForm(true);
    setError('');
  };

  const openEditForm = (item) => {
    setEditItem(item);
    setForm({
      day_of_week: item.day_of_week,
      start_time: item.start_time?.slice(0, 5) || '09:00',
      end_time: item.end_time?.slice(0, 5) || '10:00',
      is_active: item.is_active !== false,
      notes: item.notes || ''
    });
    setShowForm(true);
    setError('');
  };

  const handleSave = async () => {
    if (form.start_time >= form.end_time) {
      setError('End time must be after start time');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Convert local times to UTC for the backend
      const utcStart = localToUtc(form.day_of_week, form.start_time);
      const utcEnd = localToUtc(form.day_of_week, form.end_time);
      const payload = {
        day_of_week: utcStart.day,
        start_time: utcStart.time,
        end_time: utcEnd.time,
        is_active: form.is_active,
        notes: form.notes
      };
      if (editItem) {
        await updateTeacherOfficeHours(editItem.id, payload);
      } else {
        await createTeacherOfficeHours(teacherId, payload);
      }
      await fetchHours();
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this office hour slot?')) return;
    try {
      await deleteTeacherOfficeHours(id);
      await fetchHours();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateTeacherOfficeHours(item.id, {
        day_of_week: item._utc_day,
        start_time: item._utc_start,
        end_time: item._utc_end,
        is_active: !item.is_active,
        notes: item.notes || ''
      });
      await fetchHours();
    } catch (err) {
      alert('Failed to update');
    }
  };

  // Group by day (API returns day_of_week as integer 0-6)
  const grouped = DAYS_OF_WEEK.reduce((acc, day, idx) => {
    acc[day] = hours.filter(h => h.day_of_week === idx).sort((a, b) => a.start_time?.localeCompare(b.start_time));
    return acc;
  }, {});

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    return new Date(`2000-01-01T${h}:${m}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const dayColors = {
    Monday: '#3b82f6', Tuesday: '#8b5cf6', Wednesday: '#10b981',
    Thursday: '#f59e0b', Friday: '#ef4444', Saturday: '#06b6d4', Sunday: '#ec4899'
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: '700', color: '#1e293b', fontSize: '22px' }}>
            <i className="bi bi-clock me-2" style={{ color: '#6366f1' }}></i>Office Hours
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
            Set your weekly availability for parent/student messaging
          </p>
        </div>
        <button onClick={openAddForm}
          style={{ padding: '10px 20px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="bi bi-plus-lg"></i> Add Hours
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ padding: '12px 20px', backgroundColor: '#eff6ff', borderRadius: '10px', flex: '1', minWidth: '140px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>{hours.length}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Total Slots</div>
        </div>
        <div style={{ padding: '12px 20px', backgroundColor: '#f0fdf4', borderRadius: '10px', flex: '1', minWidth: '140px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{hours.filter(h => h.is_active).length}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Active</div>
        </div>
        <div style={{ padding: '12px 20px', backgroundColor: '#fef2f2', borderRadius: '10px', flex: '1', minWidth: '140px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>{hours.filter(h => !h.is_active).length}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Inactive</div>
        </div>
      </div>

      {/* Form panel */}
      {showForm && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <h5 style={{ margin: '0 0 16px', fontWeight: '600', color: '#1e293b' }}>
            {editItem ? 'Edit Office Hours' : 'Add Office Hours'}
          </h5>
          {error && <div style={{ padding: '10px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Day</label>
              <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
                {DAYS_OF_WEEK.map((d, idx) => <option key={d} value={idx}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Start Time</label>
              <select value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
                {HOUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>End Time</label>
              <select value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
                {HOUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Notes (optional)</label>
            <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g., Available for voice lessons only" maxLength="200"
              style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              Active
            </label>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)}
              style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '8px 20px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : (editItem ? 'Update' : 'Create')}
            </button>
          </div>
        </div>
      )}

      {/* Weekly schedule */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <div className="spinner-border spinner-border-sm text-primary me-2"></div>Loading...
        </div>
      ) : hours.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <i className="bi bi-calendar-plus" style={{ fontSize: '48px', color: '#cbd5e1' }}></i>
          <h5 style={{ color: '#64748b', marginTop: '16px' }}>No office hours set</h5>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Add your weekly availability so parents know when you're available for messaging.</p>
          <button onClick={openAddForm}
            style={{ padding: '10px 24px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', marginTop: '8px' }}>
            <i className="bi bi-plus-lg me-1"></i> Add Your First Slot
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {DAYS_OF_WEEK.map(day => {
            const slots = grouped[day];
            if (slots.length === 0) return null;
            return (
              <div key={day} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', backgroundColor: `${dayColors[day]}10`, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dayColors[day] }}></div>
                  <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{day}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>({slots.length} slot{slots.length > 1 ? 's' : ''})</span>
                </div>
                {slots.map(slot => (
                  <div key={slot.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div style={{
                        padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                        backgroundColor: slot.is_active ? '#d1fae5' : '#fee2e2', color: slot.is_active ? '#065f46' : '#991b1b'
                      }}>
                        {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                      </div>
                      {slot.notes && <span style={{ fontSize: '13px', color: '#64748b' }}>{slot.notes}</span>}
                      {!slot.is_active && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>INACTIVE</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => toggleActive(slot)} title={slot.is_active ? 'Deactivate' : 'Activate'}
                        style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: slot.is_active ? '#10b981' : '#ef4444' }}>
                        <i className={`bi ${slot.is_active ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                      </button>
                      <button onClick={() => openEditForm(slot)} title="Edit"
                        style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#6366f1' }}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button onClick={() => handleDelete(slot.id)} title="Delete"
                        style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#ef4444' }}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherOfficeHours;
