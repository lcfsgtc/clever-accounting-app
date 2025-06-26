/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme"); // 导入默认字体

export default {
  // 启用 JIT 模式，以提高编译速度和生产环境的输出大小
  mode: 'jit',
  // Purge 选项已在 Tailwind CSS v3.0 中被 content 选项取代
  // content 选项指定了 Tailwind CSS 需要扫描的文件，以便找出所有使用的类名
  content: [
    "./index.html", // 主 HTML 文件
    "./src/**/*.{js,ts,jsx,tsx}", // 扫描 src 目录下所有 JS/TS/JSX/TSX 文件
    // 如果您有 shadcn/ui 组件，通常它们的源文件位于 components/ui/ 目录下，
    // 确保这些路径也被包含在内
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // 扩展 Tailwind 的默认主题
    extend: {
      colors: {
        // 自定义颜色，这里是 shadcn/ui 默认的颜色变量
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        // shadcn/ui 的圆角变量
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // 使用 'Inter' 字体，如果未设置，则回退到 Tailwind 的默认 sans-serif 字体栈
        inter: ['Inter', ...fontFamily.sans],
      },
      keyframes: {
        // shadcn/ui 的动画关键帧
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        // shadcn/ui 的动画
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  // 插件：例如 tailwindcss-animate 用于动画
  plugins: [require("tailwindcss-animate")],
};
