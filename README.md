# Socratic AI Programming Tutor - React Version

这是使用 **React + Next.js + Framer Motion + Tailwind CSS** 构建的苏格拉底式编程教育平台登录页面。

## ✨ 特性

- 🎨 **SVG插图**: 使用SVG绘制精美的机器人、代码窗口和装饰元素
- 🎭 **Framer Motion动画**: 流畅的进入动画和交互效果
- 🎨 **Tailwind CSS**: 现代化的样式系统
- 📱 **响应式设计**: 完美适配各种屏幕尺寸
- ⚡ **Next.js 14**: 最新的React框架
- 🔒 **TypeScript**: 类型安全

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 运行开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 3. 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
socratic-tutor-react/
├── app/
│   ├── globals.css          # 全局样式
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 登录页面（包含SVG插图和动画）
├── public/                   # 静态资源
├── package.json              # 项目配置
├── tailwind.config.ts        # Tailwind配置
├── tsconfig.json             # TypeScript配置
└── next.config.js            # Next.js配置
```

## 🎨 技术亮点

### SVG插图
- AI机器人：使用SVG gradients和动画
- 代码窗口：glassmorphism效果
- 书本和学士帽：3D旋转效果
- 问号气泡：弹跳动画

### Framer Motion动画
- 页面元素淡入动画
- 悬停和点击交互
- 无限循环的浮动效果
- 流畅的过渡效果

### Tailwind CSS
- 自定义颜色主题
- 响应式布局
- 实用工具类
- 渐变背景

## 🔧 自定义

### 修改颜色主题

编辑 `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    500: '#6366f1',  // 主色调
    // ...
  },
}
```

### 调整动画

编辑 `app/page.tsx` 中的 Framer Motion 配置:

```typescript
<motion.div
  animate={{ y: [0, -10, 0] }}
  transition={{ duration: 3, repeat: Infinity }}
>
```

## 📝 功能说明

- ✅ Student ID 输入
- ✅ Password 输入（带显示/隐藏切换）
- ✅ Remember me 复选框
- ✅ Forgot password 链接
- ✅ 表单验证
- ✅ 登录提交处理

## 🌐 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 License

MIT

## 👨‍💻 开发者

Created for Socratic AI Programming Tutor Platform
