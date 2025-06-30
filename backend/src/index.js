// src/index.js

// Import necessary modules
import { createClient } from '@supabase/supabase-js';
import { Router } from 'itty-router';

// 导入您的通用 API 上下文工具
import apiContext from './utils/apiContext';

// 导入您的认证和用户管理路由
import { authRoutes } from './routes/auth-api';
import { incomeRoutes } from './routes/income-api';
import { expenseRoutes } from './routes/expense-api';
import { assetRoutes } from './routes/asset-api';
import { booknoteRoutes } from './routes/booknote-api';
import { diaryRoutes } from './routes/diary-api';
import { dashboardRoutes } from './routes/dashboard-api';

// <--- 新增：定义允许跨域请求的来源列表
const allowedOrigins = [
    'http://localhost:5173', // 您的本地 Vite 前端开发服务器
    // 'https://your-production-frontend.com' // 部署后，请在此处添加您的生产环境前端域名
];


// 定义全局变量用于 Supabase 客户端和路由器实例
let supabaseClient = null;
let isSupabaseClientInitialized = false;

// 将 apiRouter 定义在模块的顶层作用域，只初始化一次
const apiRouter = Router();

// --- Supabase 客户端初始化函数 (保持不变) ---
async function initializeSupabaseClient(env) {
    if (isSupabaseClientInitialized && supabaseClient) {
        return supabaseClient;
    }
    console.log('尝试初始化 Supabase 客户端...');
    try {
        const { SUPABASE_URL, SUPABASE_KEY } = env;
        if (!SUPABASE_URL || !SUPABASE_KEY) {
            throw new Error(`缺少必需的环境变量: SUPABASE_URL, SUPABASE_KEY。`);
        }
        const client = createClient(SUPABASE_URL, SUPABASE_KEY);
        supabaseClient = client;
        apiContext.setSupabaseClient(client);
        isSupabaseClientInitialized = true;
        console.log('Supabase 客户端初始化成功。');
        return client;
    } catch (error) {
        console.error('Supabase 客户端初始化失败:', error.message);
        throw new Error(`Supabase 客户端初始化失败: ${error.message}`);
    }
}

// --- 注册所有 API 路由 (保持不变) ---
const registerRoutes = (routesArray) => {
    routesArray.forEach(route => {
        apiRouter[route.method.toLowerCase()](route.pattern, async (request, env, ctx) => {
            return route.handler(request, env, apiContext);
        });
    });
};

registerRoutes(authRoutes);
registerRoutes(incomeRoutes);
registerRoutes(expenseRoutes);
registerRoutes(assetRoutes);
registerRoutes(booknoteRoutes);
registerRoutes(diaryRoutes);
registerRoutes(dashboardRoutes);

// Fallback 路由 (保持不变)
apiRouter.all('*', (request, env, ctx) => {
    console.warn(`未匹配到路由: ${request.method} ${request.url}`);
    return new Response(JSON.stringify({ message: 'API 路由未找到', path: request.url }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
    });
});

// 主要的 Worker fetch 处理器。
export default {
    async fetch(request, env, ctx) {
        console.log(`Received request: ${request.method} ${request.url}`);
        
        // <--- 新增：CORS 预处理逻辑
        const origin = request.headers.get('Origin');
        const isOriginAllowed = origin && allowedOrigins.includes(origin);
        
        // <--- 新增：预设 CORS 响应头
        // 只有当来源被允许时，我们才会使用这些头部
        const corsHeaders = {
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400', // 24 hours
            'Access-Control-Allow-Credentials': 'true', // <--- 新增：允许发送凭据 (如 Cookie 或 Authorization 头)
        };
        if (isOriginAllowed) {
            corsHeaders['Access-Control-Allow-Origin'] = origin; // <--- 修改：动态设置允许的来源
        }

        // --- 1. 确保 Supabase 客户端已初始化 (保持不变) ---
        if (!isSupabaseClientInitialized) {
            try {
                await initializeSupabaseClient(env);
            } catch (initError) {
                console.error('初始服务设置失败:', initError);
                // <--- 修改：为错误响应也添加 CORS 头部
                const response = new Response(JSON.stringify({
                    message: `服务不可用: 初始化后端服务失败。${initError.message}`,
                    details: initError.stack
                }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                });
                if (isOriginAllowed) {
                    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
                }
                return response;
            }
        }

        // --- 2. 处理 CORS 预检请求 (OPTIONS 方法) ---
        // <--- 修改：使用新的 CORS 逻辑
        if (request.method === 'OPTIONS') {
            if (isOriginAllowed) {
                return new Response(null, {
                    status: 204, // No Content
                    headers: corsHeaders,
                });
            } else {
                // 如果来源不允许，返回一个简单的文本响应或错误
                return new Response('CORS policy does not allow this origin', { status: 403 });
            }
        }

        // --- 3. 让路由器处理传入请求 ---
        // <--- 修改：移除此处的 CORS 头部添加逻辑，统一在最后处理
        let response;
        try {
            response = await apiRouter.handle(request, env, ctx);
        } catch (error) {
            console.error('未处理的 Worker 运行时错误:', error);
            response = new Response(JSON.stringify({
                message: '后端发生未处理的错误',
                details: error.message,
                stack: error.stack
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- 4. 添加全局 CORS 头部到所有最终响应 ---
        // <--- 修改：这是最终添加 CORS 头部的唯一地方
        if (isOriginAllowed) {
            // 创建一个可变的 Headers 对象，以防原始 response 的 headers 是不可变的
            const finalHeaders = new Headers(response.headers);
            // 添加我们预设的所有 CORS 头部
            Object.entries(corsHeaders).forEach(([key, value]) => {
                finalHeaders.set(key, value);
            });
            // 返回一个带有新头部的全新 Response 对象
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: finalHeaders,
            });
        }
        
        // 如果来源不被允许，则返回原始响应（浏览器会因缺少CORS头而拒绝它）
        return response;
    },
};