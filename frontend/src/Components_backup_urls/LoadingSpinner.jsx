import React from 'react';
import './LoadingSpinner.css';

/**
 * Unified Loading Spinner Component for EduLearning
 * 
 * @param {string} size - 'sm', 'md', 'lg', 'xl' (default: 'md')
 * @param {string} text - Loading text to display (optional)
 * @param {boolean} fullScreen - Whether to show full screen loading (default: false)
 * @param {string} variant - 'primary', 'light', 'dark' (default: 'primary')
 */
const LoadingSpinner = ({ 
    size = 'md', 
    text = '', 
    fullScreen = false,
    variant = 'primary'
}) => {
    const sizeClasses = {
        sm: 'spinner-sm',
        md: 'spinner-md',
        lg: 'spinner-lg',
        xl: 'spinner-xl'
    };

    if (fullScreen) {
        return (
            <div className={`loading-fullscreen variant-${variant}`}>
                <div className="loading-content">
                    <div className={`music-loader ${sizeClasses[size] || sizeClasses.md}`}>
                        <span className="bar bar1"></span>
                        <span className="bar bar2"></span>
                        <span className="bar bar3"></span>
                        <span className="bar bar4"></span>
                        <span className="bar bar5"></span>
                    </div>
                    {text && <p className="loading-text">{text}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className={`loading-container variant-${variant}`}>
            <div className="loading-content">
                <div className={`music-loader ${sizeClasses[size] || sizeClasses.md}`}>
                    <span className="bar bar1"></span>
                    <span className="bar bar2"></span>
                    <span className="bar bar3"></span>
                    <span className="bar bar4"></span>
                    <span className="bar bar5"></span>
                </div>
                {text && <p className="loading-text">{text}</p>}
            </div>
        </div>
    );
};

export default LoadingSpinner;
