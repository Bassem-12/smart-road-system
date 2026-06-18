import React from 'react';
import '../../styles/components/ErrorState.css';

/**
 * ErrorState - Displays error message with retry option
 * @param {string} message - Error message to display
 * @param {function} onRetry - Callback to retry the action
 * @param {string} title - Optional custom title
 */
export default function ErrorState({ 
  message = 'Something went wrong', 
  onRetry, 
  title = 'Error' 
}) {
  return (
    <div className="error-state">
      <div className="error-icon">
        <svg 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="error-title">{title}</h3>
      <p className="error-message">{message}</p>
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * EmptyState - Displays when no data is available
 * @param {string} message - Message to display
 * @param {ReactNode} icon - Optional custom icon
 */
export function EmptyState({ message = 'No data available', icon }) {
  return (
    <div className="empty-state">
      {icon || (
        <div className="empty-icon">
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
        </div>
      )}
      <p className="empty-message">{message}</p>
    </div>
  );
}
