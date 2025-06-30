import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 配置开发服务器
  server: {
    // 设置前端开发服务器的端口
    port: 5173, // 例如：您的前端应用将在 http://localhost:5173 运行
    // 配置代理，将特定的 API 请求转发到后端 API Worker
    proxy: {
      '/api': {
        // 目标后端 API Worker 的地址。请根据您的后端部署地址进行调整。 
        // 例如，如果您的后端 API Worker 在本地运行于 3000 端口，则为 'http://localhost:3000'。
        // 如果部署到 Cloudflare Worker，这里应该是您的 Worker 的 URL。
        target: 'https://cleaverapp.lcfsgtc.workers.dev/',//'http://localhost:3000', // 假设后端运行在 3000 端口
        changeOrigin: true//, // 改变源，解决跨域问题
        //rewrite: (path) => path.replace(/^\/api/, ''), // 重写路径，移除 /api 前缀
      },
    },
  },
  // 配置路径解析别名，用于 '@/components' 这样的导入
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
      //'@': '/src'// 将 @ 映射到 src 目录
      // 例如：如果您有 'src/components' 目录，您可以使用 import Button from '@/components/ui/button';
    },
  }
});
