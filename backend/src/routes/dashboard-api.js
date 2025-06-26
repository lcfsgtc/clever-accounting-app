// backend/src/routes/dashboard-api.js

// !!! 注意：这里不再导入 'express' 或 'verifyToken' from '../utils/auth.js' !!!
// 认证逻辑现在通过 apiContext 提供。

/**
 * 处理 /api/dashboard 和 /api/ 路径的请求。
 * 如果前端 Dashboard.jsx 仅作为导航入口，不请求数据，
 * 则此后端路由只用于确保访问该路径时不会出现 404，
 * 并且可以验证用户认证状态。
 *
 * @param {Request} request - 传入的 Request 对象。
 * @param {Object} env - Worker 环境变量。
 * @param {Object} apiContext - 包含 Supabase 客户端、认证和其他实用工具的 API 上下文对象。
 * @returns {Response} 响应对象。
 */
export async function handleDashboardRequest(request, env, apiContext) { // <--- 修改点 1: 添加 apiContext 参数
    try {
        // --- 修改点 2: 使用 apiContext.requireLogin 进行认证检查 ---
        // apiContext.requireLogin 会返回一个 Response 对象（如果认证失败），或 null（如果认证成功）。
        const authResponse = await apiContext.requireLogin(request, env); 
        if (authResponse) {
            // 如果 authResponse 存在，说明认证失败，直接返回认证失败的响应
            return authResponse;
        }

        // --- 修改点 3: 认证成功后，用户ID和isAdmin已由 apiContext.requireLogin 附加到 request 对象上 ---
        const userId = request.userId; // 从 request 对象获取用户ID
        // const isAdmin = request.isAdmin; // 如果需要isAdmin，也可以从 request 对象获取

        // 由于前端 Dashboard.jsx 仅作为导航，后端无需提供具体数据
        // 只返回一个成功的状态和消息，确认认证通过
        return new Response(JSON.stringify({ 
            message: "导航页路径访问成功，无需额外数据。",
            userId: userId // 可以选择返回用户ID作为确认
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        // 捕获 requireLogin 或其他逻辑中未预料的错误
        console.error('Error in handleDashboardRequest:', error);
        // 确保始终返回一个 Response 对象
        return new Response(JSON.stringify({ 
            message: '服务器内部错误', 
            error: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// 导出路由数组，以便在 index.js 中进行注册
export const dashboardRoutes = [
    { method: 'GET', pattern: '/', handler: handleDashboardRequest },
    { method: 'GET', pattern: '/dashboard', handler: handleDashboardRequest }
];
