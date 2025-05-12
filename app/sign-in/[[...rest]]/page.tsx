'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '5rem' }}>
            <SignIn path="/sign-in" routing="path" />
        </div>
    );
}
