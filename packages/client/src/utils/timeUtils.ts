/**
 * Calculate time remaining for a pixel board
 */
export function calculateRemainingTime(
    creationTime: string,
    durationMinutes: number,
    closeTime: string | null
  ): {
    timeRemaining: string;
    isExpired: boolean;
    percentRemaining: number;
  } {
    const now = new Date();
    const creation = new Date(creationTime);
    const durationMs = durationMinutes * 60 * 1000;
    const endTime = closeTime ? new Date(closeTime) : new Date(creation.getTime() + durationMs);
    
    // Check if board time has expired
    if (closeTime || now >= endTime) {
      return {
        timeRemaining: "Expired",
        isExpired: true,
        percentRemaining: 0
      };
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
    
    return {
      timeRemaining: timeString,
      isExpired: false,
      percentRemaining
    };
  }