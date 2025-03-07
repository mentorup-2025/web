import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import DiscordProvider from 'next-auth/providers/discord'
import jwt from 'jsonwebtoken'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  secret: process.env.JWT_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      // 当用户第一次登录时，将用户数据加入 token 中
      if (account && user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
        token.accessToken = account.access_token
      }

      return token
    },
    async session({ session, token }) {
      // 将 JWT token 中的用户信息加入 session 中
      session.user.id = token.id
      session.user.email = token.email
      session.user.name = token.name
      session.user.image = token.image
      session.accessToken = token.accessToken
      return session
    },
  },
  pages: {
    signIn: '/auth/signin', // 登录页面路径
  },
  session: {
    strategy: 'jwt', // 使用 JWT 作为会话管理方式
  },
})
