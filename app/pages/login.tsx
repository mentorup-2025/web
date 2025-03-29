import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function LoginPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async (provider: string) => {
    setIsLoggingIn(true)

    const res = await signIn(provider, {
      redirect: false, // 不自动重定向
    })

    if (res?.error) {
      alert('Failed to login')
    } else {
      // 登录成功，调用自定义的 API 获取 JWT
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
      })

      if (loginRes.ok) {
        const { token } = await loginRes.json()
        // 将 JWT 存储在 LocalStorage 或 Cookie 中
        localStorage.setItem('auth_token', token)
        alert('Login successful')
      }
    }

    setIsLoggingIn(false)
  }

  return (
    <div>
      <button onClick={() => handleLogin('google')} disabled={isLoggingIn}>
        Login with Google
      </button>
      <button onClick={() => handleLogin('facebook')} disabled={isLoggingIn}>
        Login with Facebook
      </button>
      <button onClick={() => handleLogin('discord')} disabled={isLoggingIn}>
        Login with Discord
      </button>
    </div>
  )
}
