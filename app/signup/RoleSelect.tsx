'use client';
import { useRouter } from 'next/navigation';
import styles from './signupProcess.module.css';
import { useMentorStatus } from '../hooks/useMentorStatus';

interface RoleSelectProps {
    userId: string;
}

export default function RoleSelect({ userId }: RoleSelectProps) {
    const router = useRouter();
    const { isMentor } = useMentorStatus();

    // 把这个变量改成 false 就可以重启 Mentee Onboarding
    const menteeDisabled = true;

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
                    <div
                        className={`w-80 p-6 rounded-lg shadow-lg transition-shadow ${
                            menteeDisabled
                                ? 'bg-gray-100 cursor-not-allowed opacity-60'
                                : 'cursor-pointer hover:shadow-xl'
                        }`}
                        onClick={menteeDisabled ? undefined : () => handleRoleSelect('mentee')}
                    >
                        <h2 className="text-3xl font-normal text-purple-600 mb-4">Mentee</h2>
                        {menteeDisabled ? (
                            <p className="text-gray-500 font-medium">
                                Mentee onboarding is temporarily unavailable.
                            </p>
                        ) : (
                            <p className="text-gray-600">
                                I'm looking to learn, grow, and get guidance from experienced mentors.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}