'use client';

import { useRouter } from 'next/navigation';
import styles from './signupProcess.module.css';

interface RoleSelectProps {
  userId: string;
}

export default function RoleSelect({ userId }: RoleSelectProps) {
  const router = useRouter();

  const handleRoleSelect = (role: 'mentor' | 'mentee') => {
    router.push(`/signup-process/${role}/${userId}`);
  };

  return (
    <div>
      <div className={styles.content}>
        <h1 className="text-2xl font-bold mb-8 text-center text-gray-800">
          Choose your role to personalize your experience.
        </h1>
        <br/><br/><br/>
        
        <div className="flex gap-8 justify-center">
          {/* Mentor Card */}
          <div 
            className="w-80 p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => handleRoleSelect('mentor')}
          >
            <h2 className="text-3xl font-normal text-purple-600 mb-4">Mentor</h2>
            <p className="text-gray-600">
              I want to share my knowledge, support others, and help guide mentees on their journey.
            </p>
          </div>

          {/* Mentee Card */}
          <div 
            className="w-80 p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => handleRoleSelect('mentee')}
          >
            <h2 className="text-3xl font-normal text-purple-600 mb-4">Mentee</h2>
            <p className="text-gray-600">
              I'm looking to learn, grow, and get guidance from experienced mentors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 