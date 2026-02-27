import React from 'react';
import './SchoolDashboard.css';

const SchoolSettings = () => {
    const schoolName = localStorage.getItem('schoolName');
    const schoolEmail = localStorage.getItem('schoolEmail');

    return (
        <>
            <h2 className="mb-4 school-dashboard-header">
                <i className="bi bi-gear me-2"></i>
                Settings
            </h2>

            <div className="card school-page-card">
                <div className="card-header">
                    <h5 className="mb-0">School Information</h5>
                </div>
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-bold">School Name</label>
                            <p className="form-control-plaintext">{schoolName || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold">Email</label>
                            <p className="form-control-plaintext">{schoolEmail || 'N/A'}</p>
                        </div>
                    </div>
                    <hr />
                    <p className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Contact your administrator to update school settings.
                    </p>
                </div>
            </div>
        </>
    );
};

export default SchoolSettings;
