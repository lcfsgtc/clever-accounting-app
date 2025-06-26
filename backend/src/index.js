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
import { dashboardRoutes } from './routes/dashboard-api'; // <--- 修改：导入 dashboardRoutes (复数)

// 定义全局变量用于 Supabase 客户端和路由器实例
let supabaseClient = null;
let isSupabaseClientInitialized = false;

// 将 apiRouter 定义在模块的顶层作用域，只初始化一次
const apiRouter = Router();

// --- Supabase 客户端初始化函数 (保持不变，但现在由 apiContext 管理) ---

/**
 * 初始化 Supabase 客户端。此函数应只被调用一次。
 * 它从 Worker 运行时提供的环境变量中检索 SUPABASE_URL 和 SUPABASE_KEY。
 * @param {object} env - Worker 运行时提供的环境变量对象。
 * @returns {object} 已初始化的 Supabase 客户端实例。
 * @throws {Error} 如果 SUPABASE_URL 或 SUPABASE_KEY 缺失或无效。
 */
async function initializeSupabaseClient(env) {
    if (isSupabaseClientInitialized && supabaseClient) {
        console.log('Supabase 客户端已初始化。');
        return supabaseClient;
    }

    console.log('尝试初始化 Supabase 客户端...');
    try {
        const { SUPABASE_URL, SUPABASE_KEY } = env;

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            const missingVars = [];
            if (!SUPABASE_URL) missingVars.push('SUPABASE_URL');
            if (!SUPABASE_KEY) missingVars.push('SUPABASE_KEY');
            const errorMessage = `缺少必需的环境变量: ${missingVars.join(', ')}。`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }

        try {
            new URL(SUPABASE_URL);
        } catch (e) {
            const errorMessage = `SUPABASE_URL 格式无效: "${SUPABASE_URL}"。请确保它是有效的 URL (例如，https://your-project.supabase.co)。`;
            console.error(errorMessage, e);
            throw new Error(errorMessage);
        }

        // 创建 Supabase 客户端
        const client = createClient(SUPABASE_URL, SUPABASE_KEY);
        supabaseClient = client; // 设置全局变量
        apiContext.setSupabaseClient(client); // <--- 将 Supabase 客户端设置到 apiContext
        isSupabaseClientInitialized = true;
        console.log('Supabase 客户端初始化成功。');
        return client;
    } catch (error) {
        console.error('Supabase 客户端初始化失败:', error.message);
        console.error('Supabase 初始化完整错误对象:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        throw new Error(`Supabase 客户端初始化失败。请检查 SUPABASE_URL 和 SUPABASE_KEY: ${error.message}`);
    }
}


// --- 注册所有 API 路由 ---
// 这部分代码在 Worker 启动时运行一次

// 辅助函数，用于统一注册路由
const registerRoutes = (routesArray) => {
    routesArray.forEach(route => {
        apiRouter[route.method.toLowerCase()](route.pattern, async (request, env, ctx) => {
            // apiContext.setSupabaseClient(supabaseClient); // <--- 移除：Supabase 客户端已在 initializeSupabaseClient 中设置到 apiContext
            return route.handler(request, env, apiContext); // 传入 apiContext
        });
    });
};

registerRoutes(authRoutes);
registerRoutes(incomeRoutes);
registerRoutes(expenseRoutes);
registerRoutes(assetRoutes);
registerRoutes(booknoteRoutes);
registerRoutes(diaryRoutes);
registerRoutes(dashboardRoutes); // <--- 修改：使用 dashboardRoutes (复数)


// Fallback 路由：如果所有其他路由都不匹配，则返回 404
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
        // --- 1. 确保 Supabase 客户端已初始化 ---
        if (!isSupabaseClientInitialized) {
            try {
                await initializeSupabaseClient(env);
            } catch (initError) {
                console.error('初始服务设置失败:', initError);
                return new Response(JSON.stringify({
                    message: `服务不可用: 初始化后端服务失败。${initError.message}`,
                    details: initError.stack
                }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // --- 2. 处理 CORS 预检请求 (OPTIONS 方法) ---
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204, // No Content
                headers: {
                    'Access-Control-Allow-Origin': '*', // 生产环境请限制为您的前端域名
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400', // 24 hours
                },
            });
        }

        // --- 3. 让路由器处理传入请求，并添加全局 CORS 头部 ---
        let response;
        try {
            response = await apiRouter.handle(request, env, ctx);
        } catch (error) {
            // 这是捕获所有未被路由处理器内部 catch 块处理的运行时错误
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

        // --- 4. 添加全局 CORS 头部到所有响应 ---
        // 确保 response 存在且 headers 可设置
        if (response && response.headers) {
            response.headers.set('Access-Control-Allow-Origin', '*'); // 生产环境请限制为您的前端域名
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }

        return response;
    },
};
