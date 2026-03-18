import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import './ActivityLogs.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        document.title = 'Activity Logs | Admin Dashboard';
        fetchLogs();
    }, [currentPage, filterAction]);

    const fetchLogs = async () => {
        try {
            let url = `${baseUrl}/activity-logs/?page=${currentPage}`;
            if (filterAction) {
                url += `&action=${filterAction}`;
            }
            const response = await axios.get(url);
            if (response.data.results) {
                setLogs(response.data.results);
                setTotalPages(Math.ceil(response.data.count / 8));
            } else {
                setLogs(response.data);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action) => {
        const badges = {
            login: 'bg-success',
            logout: 'bg-secondary',
            create: 'bg-primary',
            update: 'bg-info text-dark',
            delete: 'bg-danger',
            view: 'bg-light text-dark',
            export: 'bg-warning text-dark',
            import: 'bg-dark'
        };
        return badges[action] || 'bg-secondary';
    };

    const getActionIcon = (action) => {
        const icons = {
            login: 'bi-box-arrow-in-right',
            logout: 'bi-box-arrow-right',
            create: 'bi-plus-circle',
            update: 'bi-pencil-square',
            delete: 'bi-trash',
            view: 'bi-eye',
            export: 'bi-download',
            import: 'bi-upload'
        };
        return icons[action] || 'bi-activity';
    };

    if (loading) {
        return (
            <div className="admin-loading-wrapper">
                <LoadingSpinner size="lg" text="Loading activity logs..." />
            </div>
        );
    }

    return (
        <>
            <div className="activity-logs-container">
                <div className="logs-header">
                    <h2>
                        <i className="bi bi-clock-history" style={{color: '#2563eb'}}></i>
                        Activity Logs
                    </h2>
                    <p>
                        Track and monitor all administrative activities.
                    </p>
                </div>

                {/* Filter */}
                <div className="filter-card">
                    <div className="filter-grid">
                        <label className="filter-label">Filter by Action:</label>
                        <div>
                                    <select
                                        className="form-select"
                                        value={filterAction}
                                        onChange={(e) => {
                                            setFilterAction(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        style={{
                                            padding: '10px 14px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            backgroundColor: '#f9fafb'
                                        }}
                                    >
                                        <option value="">All Actions</option>
                                        <option value="login">Login</option>
                                        <option value="logout">Logout</option>
                                        <option value="create">Create</option>
                                        <option value="update">Update</option>
                                        <option value="delete">Delete</option>
                                        <option value="view">View</option>
                                        <option value="export">Export</option>
                                        <option value="import">Import</option>
                        </select>
                        </div>
                        <button
                            className="btn-clear"
                            onClick={() => {
                                setFilterAction('');
                                setCurrentPage(1);
                            }}
                        >
                            <i className="bi bi-x-circle me-1"></i>
                            Clear
                        </button>
                    </div>
                </div>

                {/* Logs Timeline */}
                <div className="logs-card">
                    {logs.length > 0 ? (
                        <div className="timeline">
                            {logs.map((log, index) => {
                                const actionColors = {
                                    login: '#dcfce7',
                                    logout: '#f3f4f6',
                                    create: '#dbeafe',
                                    update: '#e0f2fe',
                                    delete: '#fee2e2',
                                    view: '#f9fafb',
                                    export: '#f3e8ff',
                                    import: '#dbeafe'
                                };
                                const actionTextColors = {
                                    login: '#15803d',
                                    logout: '#4b5563',
                                    create: '#1e40af',
                                    update: '#0369a1',
                                    delete: '#b91c1c',
                                    view: '#374151',
                                    export: '#6b21a8',
                                    import: '#1e40af'
                                };
                                const bgColor = actionColors[log.action] || '#f3f4f6';
                                const textColor = actionTextColors[log.action] || '#4b5563';
                                
                                return (
                                    <div key={log.id || index} className="timeline-item">
                                        <div className="timeline-icon">
                                            <span className="timeline-badge" style={{backgroundColor: bgColor, color: textColor}}>
                                                <i className={`bi ${getActionIcon(log.action)}`}></i>
                                            </span>
                                        </div>
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <div>
                                                    <span className="timeline-action">{log.action}</span>
                                                    {log.model_name && (
                                                        <span className="timeline-action-detail">
                                                            on {log.model_name}
                                                        </span>
                                                    )}
                                                    {log.object_id && (
                                                        <span className="timeline-action-detail">
                                                            #{log.object_id}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="timeline-time">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            {log.description && (
                                                <p className="timeline-description">{log.description}</p>
                                            )}
                                            <div className="timeline-meta">
                                                <span>
                                                    <i className="bi bi-person"></i>
                                                    {log.admin?.full_name || log.teacher?.full_name || log.student?.fullname || 'System'}
                                                </span>
                                                {log.ip_address && (
                                                    <span className="timeline-meta-item">
                                                        <i className="bi bi-globe"></i>
                                                        {log.ip_address}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <i className="bi bi-inbox"></i>
                            <p>No activity logs found.</p>
                        </div>
                    )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <nav className="pagination-wrapper">
                        <div className="pagination-list">
                            <button 
                                className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                Previous
                            </button>
                            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button 
                                        key={i}
                                        className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button 
                                className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </nav>
                )}
                </div>
            </div>
        </>
    );
};

export default ActivityLogs;
