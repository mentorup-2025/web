import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const session = await getSession({ req })

    if (!session) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    // 创建 JWT 并返回给客户端
    const token = jwt.sign(
      {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
      JWT_SECRET,
      { expiresIn: '1h' } // JWT 过期时间设置为 1 小时
    )

    return res.status(200).json({ token })
  }

  return res.status(405).json({ error: 'Method Not Allowed' })
}
