/**
 * Converts UTC time string to PDT time string
 * @param utcTimeStr - UTC time string (ISO format)
 * @returns PDT time string (ISO format)
 */
export function convertUTCToPDT(utcTimeStr: string): string {
  try {
    const utcDate = new Date(utcTimeStr);
    
    if (isNaN(utcDate.getTime())) {
      console.error('Invalid UTC time string:', utcTimeStr);
      return utcTimeStr; // Return original if invalid
    }
    
    // Convert to PDT using toLocaleString with timezone
    const pdtTimeStr = utcDate.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    console.log('🕐 Time conversion:', { utc: utcTimeStr, pdt: pdtTimeStr });
    
    return pdtTimeStr;
  } catch (error) {
    console.error('Error converting UTC to PDT:', error);
    return utcTimeStr; // Return original if conversion fails
  }
} 