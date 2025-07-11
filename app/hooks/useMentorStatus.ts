import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export const useMentorStatus = () => {
  const { user } = useUser();
  const [isMentor, setIsMentor] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMentorStatus = async () => {
      if (!user?.id) {
        setIsMentor(false);
        setLoading(false);
        return;
      }

      console.log('user?.id', user?.id);

      try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();
        console.log('data', data);
        setIsMentor(data.data.mentor !== null);
      } catch (error) {
        console.error('Error checking mentor status:', error);
        setIsMentor(false);
      } finally {
        setLoading(false);
      }
    };

    checkMentorStatus();
  }, [user?.id]);

  return { isMentor, loading };
}; 