'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '5rem' }}>
            <SignUp path="/sign-up" routing="path" />
        </div>
    );
}
