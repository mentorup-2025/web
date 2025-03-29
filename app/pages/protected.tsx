import { useEffect, useState } from 'react'

export default function ProtectedPage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')

    if (token) {
      // 验证 JWT
      fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setUser(data.user))
    }
  }, [])

  if (!user) {
    return <p>Loading...</p>
  }

  return <div>Protected content</div>
}
