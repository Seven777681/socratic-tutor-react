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
# OpenAI
LLM_PROVIDER=openai
LLM_API_KEY=your_api_key_here
LLM_MODEL=gpt-4.1-mini
```

也可以使用 DeepSeek 的 OpenAI-compatible 接口，不需要修改五个 Agent：

```bash
LLM_PROVIDER=deepseek
LLM_API_KEY=your_deepseek_api_key_here
LLM_MODEL=deepseek-v4-flash
LLM_BASE_URL=https://api.deepseek.com
```

旧的 `OPENAI_API_KEY` / `OPENAI_MODEL` 仍然兼容；只设置
`DEEPSEEK_API_KEY` 时也会自动识别为 DeepSeek。所有 Key 只在服务端读取，真实值只能放在
不会被 Git 跟踪的 `.env.local`。DeepSeek 使用兼容的函数调用模式生成结构化 Agent
结果，OpenAI 继续使用严格 JSON Schema 模式。

重新启动开发服务器后，`/api/tutor/message` 会自动使用 LangGraph 条件路由。不同事件只运行必要的 Agent，并通过共享 Tutor State 传递结构化结果。没有配置 Key 时，系统会自动使用内置规则导师，方便继续离线开发和演示。

项目只有这一套正式 Agent Graph。`socratic_backend` 的 Python 服务只负责运行学生代码，不再维护另一套导师逻辑，避免两套 Agent 状态和提示策略逐渐分叉。

当前四级 Hint 边界：Level 0 元认知提问、Level 1 概念提示、Level 2 语法方向、Level 3 伪代码或与当前题目无关的极小语法示例。所有等级都禁止输出当前题目的完整答案代码。

元认知 Agent 还会计算可解释的学习信号，包括重复提问、中英文不确定表达、连续请求提示、失败测试、运行错误、超时和空闲时间。这些证据共同形成 `struggleScore`，用于决定是否逐级增加 Hint，并记录在 Agent Trace 中，方便后续教师端展示和研究分析。

Agent 4 会进一步区分有效挣扎与无效卡住：失败期间持续进行有意义的代码修改会标记为 `productiveStruggle`，系统优先等待而不是立即增加提示；恢复进展或表现独立时，Hint Level 每次最多降低一级。跨轮次状态分为 exploring、uncertain、stuck、recovering 和 independent，并从 wait、encourage、ask_prediction、break_down_problem、show_counterexample、increase_hint、return_to_plan 中选择干预。每位学生还会保存 60–120 秒的等待时间、2–4 次尝试阈值和偏好的问题风格。达到个人等待时间且没有新活动时，前端只发送一次轻量关怀问题；新的代码、运行或学生消息会重新开始计时。

问题理解 Agent 会将学生的计划按目标、输入、输出、约束和步骤顺序五个维度进行 0–10 分评估，并为有明确文本证据的误解添加标签。学生在规划面板先提交 1–5 的自信评分；系统将自评与五维平均分比较，区分校准准确、自信偏高和自信偏低。自信只用于调节引导方式，不作为正确性的证据。

五个 Agent 共享统一的 `learnerState`：当前学习焦点、焦点尝试次数、连续答非所问次数、最新回答质量和各理解维度的证据状态。Agent 1 初始化理解状态，Agent 4 根据最新回答与确定性学习信号更新它，Agent 2 只围绕尚未解决的当前焦点提问。题库的核心概念、期望计划要素和常见误解会作为评估标准传入 Agent，但不会被当作学生已经理解的证据。

苏格拉底提问 Agent 会在预测、反例、问题拆分、策略比较、执行跟踪、解释推理和知识迁移七种策略之间按场景选择，并避开近期已经使用的策略。每次响应只允许一个核心问题和一个不含问号的可选支持语句。内部 Guard 会检查重复问题、完整答案或代码泄露、多个问题和 Hint Level 越界；首次不合格会自动重写，第二次仍不合格则使用本地安全问题。

代码分析 Agent 会区分语法、实现、算法、题意误解和测试问题，生成带证据来源的最小反例与最多 8 步变量轨迹，并记录可复用的错误模式。由于当前执行后端没有逐行变量快照，轨迹只能标记为静态推断或学生预测；反例只有匹配真实测试输入时才会升级为运行证据。相同错误模式的次数由系统从历史结构化结果中统计。题意误解会通过 LangGraph 回流到问题理解 Agent。

评估反思 Agent 会输出 problemUnderstanding、planning、implementation、debugging、reflection 和 independence 六个 0–5 分能力维度。每条评价和时间线事件必须引用实际计划、学生消息、代码诊断、运行结果或反思记录的证据 ID；不存在的证据会被过滤。它还会生成一个训练相同薄弱能力但题面不同的迁移任务，以及教师报告中的常见困难、最高 Hint Level、AI 依赖程度、有效提问策略和理解结论。系统不会把“测试通过”单独当作真正理解：缺少规划、解释、调试或反思证据时，结论最多为部分理解。学生界面会把六维能力、证据评价、学习时间线和迁移任务显示为学习报告，不渲染教师报告字段。当前尚未建立账号、教师角色和数据库权限，因此这只是界面分层，不等同于正式的数据隔离；正式教师端必须在服务端按角色单独返回报告。

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
