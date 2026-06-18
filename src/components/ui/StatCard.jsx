import React from 'react';
import '../../styles/components/StatCard.css';

/**
 * StatCard - Displays a statistic with title and value
 * @param {string} title - Card title
 * @param {string|number} value - Card value
 * @param {string} type - Card type (danger, warning, info, success)
 */
export default function StatCard({ title, value, type = 'info' }) {
  return (
    <div className={`stat-card ${type}`}>
      <p className="stat-card-title">{title}</p>
      <h2 className="stat-card-value">{value}</h2>
    </div>
  );
}
