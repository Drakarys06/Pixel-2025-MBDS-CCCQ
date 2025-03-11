export const calculateRemainingTime = (
    creationTime: string,
    timeMinutes: number,
    closeTime: string | null
  ): { 
    timeRemaining: string; 
    isExpired: boolean;
    percentRemaining: number;
  } => {
    if (closeTime) {
      return {
        timeRemaining: "Closed",
        isExpired: true,
        percentRemaining: 0
      };
    }
  
    const creationDate = new Date(creationTime);
    const durationMs = timeMinutes * 60 * 1000;
    const closingDate = new Date(creationDate.getTime() + durationMs);
    const now = new Date();
  
    if (now > closingDate) {
      return {
        timeRemaining: "Expired",
        isExpired: true,
        percentRemaining: 0
      };
    }
  
    const remainingMs = closingDate.getTime() - now.getTime();
    const totalSeconds = Math.floor(remainingMs / 1000);
    
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
  
    const totalDurationMs = timeMinutes * 60 * 1000;
    const percentRemaining = Math.round((remainingMs / totalDurationMs) * 100);
  
    let timeRemaining = "";
    if (days > 0) {
      timeRemaining = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      timeRemaining = `${hours}h ${minutes}m ${seconds}s`;
    } else {
      timeRemaining = `${minutes}m ${seconds}s`;
    }
  
    return {
      timeRemaining,
      isExpired: false,
      percentRemaining
    };
  };