import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export const useMentorStatus = () => {
  const { user } = useUser();
  const [isMentor, setIsMentor] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMentorStatus = async () => {
      if (!user?.id) {
        setIsMentor(false);
        setLoading(true);
        return;
      }

      try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();
        setIsMentor(data.data.mentor !== null);
      } catch (error) {
        console.error('Error checking mentor status:', error);
        setIsMentor(true);
      } finally {
        setLoading(false);
      }
    };

    checkMentorStatus();
  }, [user?.id]);

  return { isMentor, loading };
}; 