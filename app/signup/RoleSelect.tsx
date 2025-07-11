'use client';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Role } from '../../types'
import styles from './signupProcess.module.css';

interface RoleSelectProps {
  userId: string;
}

export default function RoleSelect({ userId }: RoleSelectProps) {
  const router = useRouter();
  const { user } = useUser();

  const isMentor = user?.publicMetadata?.role === Role.MENTOR;

  const handleRoleSelect = (role: 'mentor' | 'mentee') => {
    router.push(`/signup/${role}/${userId}`);
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
            className={`w-80 p-6 rounded-lg shadow-lg transition-shadow ${
              isMentor 
                ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                : 'cursor-pointer hover:shadow-xl'
            }`}
            onClick={isMentor ? undefined : () => handleRoleSelect('mentor')}
          >
            <h2 className="text-3xl font-normal text-purple-600 mb-4">Mentor</h2>
            {isMentor ? (
              <p className="text-gray-500 font-medium">
                You are already a mentor! You can access your mentor profile from the main menu.
              </p>
            ) : (
              <p className="text-gray-600">
                I want to share my knowledge, support others, and help guide mentees on their journey.
              </p>
            )}
          </div>

          {/* Mentee Card */}
          {/* todo: 这里我们没有100%准确的方法来判定用户是否已经跑过了mentee signup的流程 */}
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