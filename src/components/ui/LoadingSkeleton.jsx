import React from 'react';
import '../../styles/components/LoadingSkeleton.css';

/**
 * LoadingSkeleton - Shows placeholder while data loads
 * @param {string} type - Skeleton type (card, list, text, circle)
 * @param {number} count - Number of skeleton items
 */
export default function LoadingSkeleton({ type = 'text', count = 1, height, width }) {
  const items = Array.from({ length: count }, (_, i) => (
    <div 
      key={i} 
      className={`skeleton ${type}`}
      style={{ 
        height: height, 
        width: width,
        animationDelay: `${i * 0.1}s` 
      }}
    />
  ));

  return <>{items}</>;
}

/**
 * DashboardSkeleton - Full dashboard loading state
 */
export function DashboardSkeleton() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <LoadingSkeleton type="text" width="300px" height="32px" />
        <LoadingSkeleton type="text" width="200px" height="20px" />
      </div>
      
      <div className="stats-grid">
        {[1, 2, 3, 4].map(i => (
          <LoadingSkeleton key={i} type="card" height="120px" />
        ))}
      </div>
      
      <section className="dashboard-section">
        <LoadingSkeleton type="text" width="150px" height="24px" />
        {[1, 2, 3].map(i => (
          <LoadingSkeleton key={i} type="list" height="80px" />
        ))}
      </section>
      
      <div className="bottom-grid">
        <LoadingSkeleton type="card" height="200px" />
        <LoadingSkeleton type="card" height="200px" />
      </div>
    </div>
  );
}
