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
    
    // Convert to PDT (UTC-7 for daylight saving, UTC-8 for standard time)
    // Using America/Los_Angeles timezone which handles DST automatically
    const pdtDate = new Date(utcDate.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles'
    }));
    
    // Format as ISO string in PDT
    const pdtTimeStr = pdtDate.toISOString();
    console.log('🕐 Time conversion:', { utc: utcTimeStr, pdt: pdtTimeStr });
    
    return pdtTimeStr;
  } catch (error) {
    console.error('Error converting UTC to PDT:', error);
    return utcTimeStr; // Return original if conversion fails
  }
} 