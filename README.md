This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).


Install fnm
```
输入which fnm 查看路径（查到路径后可以问gpt对应的配置命令）

# fnm
mac
export PATH="$HOME/Library/Application Support/fnm:$PATH"
eval "`fnm env`"

windows
export PATH="$HOME/D/fnm:$PATH"
eval "`fnm env`"
```

Install nodejs
```
# 安装nodejs
fnm install v19.8.1
# 查看 nodejs 版本
node -v
# 查看 npm 版本
npm -v
```

Install pnpm (a better tool to manage dependency)
```
# 安装 pnpm
npm i -g pnpm
# 查看 pnpm 版本
pnpm -v
```

run these commands for pnpm

```
export PATH="$HOME/Library/Application Support/fnm:$PATH"
eval "`fnm env`"
export PATH="$HOME/D/fnm:$PATH"
eval "`fnm env`"

```

## Getting Started

First, run the development server:

```
pnpm dev

```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


## Local test
本地测试时，需要在root level加入`.env` 文件，并配置config。 目前有的key如下

STRIPE_PUBLISHABLE_KEY=pk_test_51Qx11jBti3NtFU1f0OGAS9VVgPGGw4MKot8l7WPiz9VBLigaRA7KaH1mOpNWsHc0oRgRyeMb0HyucWx21OC8TngW00xoA8X9CE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Qx11jBti3NtFU1f0OGAS9VVgPGGw4MKot8l7WPiz9VBLigaRA7KaH1mOpNWsHc0oRgRyeMb0HyucWx21OC8TngW00xoA8X9CE
STRIPE_SECRET_KEY=sk_test_51Qx11jBti3NtFU1fG0N7z37LZLTJu435f94mbQX4XkblopJmoMfdTSYFKasiWADvQe7Ojz9FGuTHlJEe0yBHeivf00KVbcn2B1
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_WEBHOOK_SECRET=whsec_18f7f082597973836095641ea35f1129482580901c098c59ee236543f5e0e8f6
RESEND_API_KEY=re_bt8XZifJ_NfZK5vtDf1momEcdmEswCLYk
NEXT_PUBLIC_SUPABASE_URL=https://bktwqkmnziitatemdecj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHdxa21uemlpdGF0ZW1kZWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0MTQyOTksImV4cCI6MjA1Njk5MDI5OX0.5Oy7j_K3rB2IjxV8bMMPE5vp2hVhTI0yMD0z2wd2c9Y
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHdxa21uemlpdGF0ZW1kZWNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTQxNDI5OSwiZXhwIjoyMDU2OTkwMjk5fQ.mp9Nvhz583e-xH9ND4ldIXSiBSmAZsNmDMpOZAy7tlk