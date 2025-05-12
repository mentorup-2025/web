
import { ClerkProvider } from '@clerk/nextjs';

export default function SignupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider>
            {children}
        </ClerkProvider>
    );
} 