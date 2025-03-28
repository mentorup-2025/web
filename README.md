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
