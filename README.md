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

### 启用 LangGraph 五 Agent 导师

导师 API 使用 LangGraph 按事件调度五个角色：问题理解、苏格拉底提问、代码分析、元认知监测和评估反思。请复制 `.env.example` 为 `.env.local`（不要提交它），并填入：

```bash
OPENAI_API_KEY=your_api_key_here
# 可选；不设置时使用 gpt-4.1-mini
OPENAI_MODEL=gpt-4.1-mini
```

重新启动开发服务器后，`/api/tutor/message` 会自动使用 LangGraph 条件路由。不同事件只运行必要的 Agent，并通过共享 Tutor State 传递结构化结果。没有配置 Key 时，系统会自动使用内置规则导师，方便继续离线开发和演示。

当前四级 Hint 边界：Level 0 元认知提问、Level 1 概念提示、Level 2 语法方向、Level 3 伪代码或与当前题目无关的极小语法示例。所有等级都禁止输出当前题目的完整答案代码。

元认知 Agent 还会计算可解释的学习信号，包括重复提问、中英文不确定表达、连续请求提示、失败测试、运行错误、超时和空闲时间。这些证据共同形成 `struggleScore`，用于决定是否逐级增加 Hint，并记录在 Agent Trace 中，方便后续教师端展示和研究分析。

问题理解 Agent 会将学生的计划按目标、输入、输出、约束和步骤顺序五个维度进行 0–10 分评估，并为有明确文本证据的误解添加标签。学生在规划面板先提交 1–5 的自信评分；系统将自评与五维平均分比较，区分校准准确、自信偏高和自信偏低。自信只用于调节引导方式，不作为正确性的证据。

苏格拉底提问 Agent 会在预测、反例、问题拆分、策略比较、执行跟踪、解释推理和知识迁移七种策略之间按场景选择，并避开近期已经使用的策略。每次响应只允许一个核心问题和一个不含问号的可选支持语句。内部 Guard 会检查重复问题、完整答案或代码泄露、多个问题和 Hint Level 越界；首次不合格会自动重写，第二次仍不合格则使用本地安全问题。

代码分析 Agent 会区分语法、实现、算法、题意误解和测试问题，生成带证据来源的最小反例与最多 8 步变量轨迹，并记录可复用的错误模式。由于当前执行后端没有逐行变量快照，轨迹只能标记为静态推断或学生预测；反例只有匹配真实测试输入时才会升级为运行证据。相同错误模式的次数由系统从历史结构化结果中统计。题意误解会通过 LangGraph 回流到问题理解 Agent。

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
