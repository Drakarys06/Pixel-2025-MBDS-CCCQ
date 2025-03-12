import React, { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';
import '../../styles/ui/TimeRemaining.css';

interface TimeRemainingProps {
  creationTime: string;
  durationMinutes: number;
  closeTime: string | null;
  showProgressBar?: boolean;
  className?: string;
  badge?: boolean;
  onTimeExpired?: () => void;
}

interface TimeData {
  timeRemaining: string;
  isExpired: boolean;
  percentRemaining: number;
}

const TimeRemaining: React.FC<TimeRemainingProps> = ({
  creationTime,
  durationMinutes,
  closeTime,
  showProgressBar = true,
  className = '',
  badge = false,
  onTimeExpired
}) => {
  const [timeData, setTimeData] = useState<TimeData>({
    timeRemaining: "Calculating...",
    isExpired: false,
    percentRemaining: 100
  });

  useEffect(() => {
    // Calculate time data initially
    calculateTime();
    
    // Update every 10 seconds
    const timer = setInterval(() => {
      calculateTime();
    }, 10000);
    
    return () => clearInterval(timer);
  }, [creationTime, durationMinutes, closeTime]);

  const calculateTime = () => {
    const now = new Date();
    const creation = new Date(creationTime);
    const durationMs = durationMinutes * 60 * 1000;
    const endTime = closeTime ? new Date(closeTime) : new Date(creation.getTime() + durationMs);
    
    // Check if board time has expired
    if (closeTime || now >= endTime) {
      setTimeData({
        timeRemaining: "Expired",
        isExpired: true,
        percentRemaining: 0
      });
      
      if (onTimeExpired) {
        onTimeExpired();
      }
      
      return;
    }
    
    // Calculate remaining time
    const totalMs = durationMs;
    const elapsedMs = now.getTime() - creation.getTime();
    const remainingMs = Math.max(totalMs - elapsedMs, 0);
    const percentRemaining = Math.round((remainingMs / totalMs) * 100);
    
    // Format the time remaining
    const remainingMinutes = Math.floor(remainingMs / 60000);
    const remainingHours = Math.floor(remainingMinutes / 60);
    
    let timeString;
    if (remainingHours > 0) {
      const mins = remainingMinutes % 60;
      timeString = `${remainingHours}h ${mins}m`;
    } else {
      timeString = `${remainingMinutes}m`;
    }
    
    setTimeData({
      timeRemaining: timeString,
      isExpired: false,
      percentRemaining
    });
  };

  const { timeRemaining, isExpired, percentRemaining } = timeData;
  
  // Apply different styles based on time remaining
  const getStatusClass = () => {
    if (isExpired) return 'time-expired';
    if (percentRemaining < 25) return 'time-ending-soon';
    return '';
  };

  if (badge) {
    const badgeClasses = [
      'time-badge',
      getStatusClass(),
      className
    ].filter(Boolean).join(' ');
    
    return <div className={badgeClasses}>{timeRemaining}</div>;
  }

  const containerClasses = [
    'time-remaining',
    getStatusClass(),
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className="time-text">{timeRemaining}</div>
      {showProgressBar && !isExpired && (
        <ProgressBar 
          value={percentRemaining} 
          height={6}
        />
      )}
    </div>
  );
};

export default TimeRemaining;