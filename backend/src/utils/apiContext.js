// src/utils/apiContext.js - 通用 API 上下文工具
// 从 Mongoose 切换到 Supabase

// 导入所需的库
import jwt from '@tsndr/cloudflare-worker-jwt'; // 用于 JWT 认证
// import bcryptjs from 'bcryptjs'; // <--- 删除：在 Workers 环境中直接使用 bcryptjs 会有问题

// --- Web Crypto API 密码哈希和验证辅助函数 ---
// 将这些函数从 src/index.js 移动到这里
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH_ALGORITHM = 'SHA-256';

function arrayBufferToHex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

function hexToUint8Array(hexString) {
    const bytes = new Uint8Array(Math.ceil(hexString.length / 2));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }
    return bytes;
}

async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordBuffer = new TextEncoder().encode(password);

    const key = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: PBKDF2_HASH_ALGORITHM,
        },
        key,
        256
    );

    return {
        hash: arrayBufferToHex(hashBuffer),
        salt: arrayBufferToHex(salt),
    };
}

async function verifyPassword(password, storedHash, storedSalt) {
    const salt = hexToUint8Array(storedSalt);
    const passwordBuffer = new TextEncoder().encode(password);

    const key = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    const derivedHashBuffer = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: PBKDF2_HASH_ALGORITHM,
        },
        key,
        256
    );

    const derivedHashHex = arrayBufferToHex(derivedHashBuffer);
    return derivedHashHex === storedHash;
}

// 内部变量用于存储 Supabase 客户端实例
let _supabaseClient = null;

// 定义 API 上下文对象
const apiContext = {
    // 设置 Supabase 客户端实例
    setSupabaseClient(client) {
        _supabaseClient = client;
    },

    // 获取 Supabase 客户端实例
    get supabase() {
        if (!_supabaseClient) {
            throw new Error("Supabase client has not been initialized in apiContext. Call setSupabaseClient first.");
        }
        return _supabaseClient;
    },

     // 将 jwt 模块本身作为 apiContext 的一个属性暴露出去
    jwt: jwt, // <-- 新增这一行，将导入的 jwt 模块赋给 apiContext.jwt

    // Bcryptjs 实例 (现在使用 Web Crypto API 的兼容接口)
    bcryptjs: {
        hash: async (password, saltRounds = 10) => { // saltRounds 参数在这里不适用，但保留接口兼容性
            // 内部实现使用 hashPassword
            const { hash, salt } = await hashPassword(password);
            // 对于 bcryptjs.hash，它通常返回一个包含盐和哈希的单个字符串。
            // 这里为了兼容性，可以返回一个组合字符串或约定外部使用方式
            // 最好的做法是让 authRoutes 中的 handler 直接使用 hashPassword 和 verifyPassword
            // 如果 authRoutes 确实依赖 bcryptjs.hash(password, salt) 这种形式，
            // 那么这个封装需要更精细。
            // 但如果它只依赖 hashPassword(password) 和 verifyPassword(password, storedHash, storedSalt)
            // 那么这个接口可以直接使用，或者我们直接提供这两个函数。
            // 假设 authRoutes 只需要一个哈希和盐，我们将返回一个对象
            return { hash, salt }; // 或者根据 authRoutes 的实际需求调整返回格式
        },
        compare: verifyPassword // 直接使用 verifyPassword
    },
    // 同时直接提供这两个函数，以便 authRoutes 更直接地使用它们
    hashPassword: hashPassword,
    verifyPassword: verifyPassword,


    /**
     * 验证用户是否登录并设置 request.userId 和 request.isAdmin
     * @param {Request} request - 传入的 Request 对象
     * @param {Object} env - Cloudflare Workers 环境对象，包含 secrets 和 bindings (例如 JWT_SECRET)
     * @returns {Response|null} 如果未认证返回 Response 对象，否则返回 null
     */
    requireLogin: async (request, env) => {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ message: '未授权：缺少令牌' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const token = authHeader.substring(7); // 去掉 "Bearer " 前缀

        try {
            // 验证 JWT
            const isValid = await jwt.verify(token, env.JWT_SECRET); // 使用环境变量中的密钥
            if (!isValid) {
                return new Response(JSON.stringify({ message: '未授权：无效令牌' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }

            const decoded = jwt.decode(token);
            // 假设 JWT payload 中包含 userId，并且它是 Supabase user 的 UUID
            // 注意：您前端存储的 userId 可能与 JWT payload 中的字段名不同。
            // 检查您的 JWT 签名逻辑（在 /api/login 路由中）确保字段名一致
            // 您在 /api/login 中生成 JWT 的 payload 是 { userId: user.user_id, ... }
            // 所以这里应该用 decoded.payload.userId
            const userId = decoded.payload.userId;

            // 查询 Supabase 数据库以获取完整的用户信息和 isAdmin 状态
            // 假设用户表名为 'users'，并且用户ID字段为 'user_id' (根据您 login 路由的 user.user_id)
            const { data: user, error } = await apiContext.supabase
                .from('users') // 您的 Supabase 用户表名
                .select('user_id, is_admin') // 选择用户 ID 和 isAdmin 字段
                .eq('user_id', userId) // 根据 user_id 查找用户
                .single(); // 期望只返回一个结果

            if (error) {
                console.error('Supabase query error for user:', error);
                // 对于 PGRST116 (没有找到行) 视为用户不存在
                if (error.code === 'PGRST116') {
                    return new Response(JSON.stringify({ message: '未授权：用户不存在或已删除' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '未授权：数据库查询失败', details: error.message }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }
            if (!user) {
                return new Response(JSON.stringify({ message: '未授权：用户不存在' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }

            // 将 userId 和 isAdmin 附加到 request 对象
            request.userId = user.user_id; // 确保这里是正确的字段名
            request.isAdmin = user.is_admin || false; // 假设 isAdmin 字段在 Supabase 中名为 is_admin

            return null; // 认证成功
        } catch (err) {
            console.error('JWT 认证失败或 Supabase 查询失败:', err);
            return new Response(JSON.stringify({ message: '未授权：令牌验证失败或用户信息获取失败', details: err.message }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
    },

    /**
     * 验证用户是否为管理员
     * @param {Request} request - 传入的 Request 对象
     * @param {Object} env - Cloudflare Workers 环境对象
     * @returns {Response|null} 如果不是管理员返回 Response 对象，否则返回 null
     */
    requireAdmin: async (request, env) => {
        // requireLogin 已经将 isAdmin 附加到 request 对象
        const authCheck = await apiContext.requireLogin(request, env);
        if (authCheck) return authCheck; // 如果未登录，返回登录错误

        if (!request.isAdmin) {
            return new Response(JSON.stringify({ message: '未授权：您不是管理员' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        return null; // 是管理员
    },

    // 其他实用工具函数 (parseQuery, handleFileUpload, deleteR2Images, formatDate, Json2csvParser) 保持不变
    parseQuery: (queryString) => {
        const params = {};

        // 如果 queryString 为空或null，直接返回空对象
        if (!queryString) {
            return params;
        }

        // 移除查询字符串开头的 '?'，以便 URLSearchParams 正确处理
        const cleanQueryString = queryString.startsWith('?') ? queryString.substring(1) : queryString;

        // 使用 URLSearchParams API
        const urlSearchParams = new URLSearchParams(cleanQueryString);

        // 遍历所有参数，处理重复键的情况
        for (const [key, value] of urlSearchParams.entries()) {
            if (params.hasOwnProperty(key)) {
                // 如果参数已存在，将其转换为数组或向现有数组添加新值
                if (Array.isArray(params[key])) {
                    params[key].push(value);
                } else {
                    params[key] = [params[key], value];
                }
            } else {
                // 如果参数不存在，直接赋值
                params[key] = value;
            }
        }
        return params;        
    },
    handleFileUpload: async (request, env) => { /* ... */ },
    deleteR2Images: async (imageUrls, env) => { /* ... */ },
    /**
     * 格式化日期输入为 YYYY-MM-DD 字符串。
     * 可以处理 ISO 字符串、Date 对象或时间戳。
     *
     * @param {string|Date|number|null|undefined} dateInput - 要格式化的日期输入。
     * @returns {string} 格式化后的日期字符串 (YYYY-MM-DD)，如果输入无效则返回空字符串。
     */
    formatDate: (dateInput) => {
        if (!dateInput) {
            return ''; // 处理 null 或 undefined 输入
        }

        let date;
        try {
            // 尝试创建 Date 对象
            date = new Date(dateInput);
        } catch (e) {
            console.error('Error parsing dateInput:', dateInput, e);
            return ''; // 解析失败返回空字符串
        }

        // 检查 Date 对象是否有效 (例如，对于 'invalid date' 会返回 Invalid Date 对象)
        if (isNaN(date.getTime())) {
            return ''; // 无效日期返回空字符串
        }

        // 获取年份、月份和日期，并补零
        const year = date.getFullYear();
        // getMonth() 返回 0-11，所以需要加 1
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    },
  /**
     * 将 JSON 数据转换为 CSV 字符串。
     * 适用于 Cloudflare Workers 环境。
     *
     * @param {Array<Object>} data - 要转换的 JSON 对象数组。
     * @param {Array<Object>} fields - 字段定义数组，格式为 { label: '列头', value: '数据字段名' | Function }
     * @returns {string} CSV 格式的字符串
     */
    jsonToCsv: (data, fields) => {
        if (!data || data.length === 0) {
            return fields.map(f => f.label).join(','); // 即使没有数据也生成表头
        }

        // 确保字段列表存在且是数组
        const header = fields.map(field => field.label).join(',');

        const rows = data.map(row => {
            return fields.map(field => {
                let value;
                if (typeof field.value === 'function') {
                    value = field.value(row);
                } else {
                    value = row[field.value];
                }

                // 处理 null/undefined 为空字符串
                if (value === null || typeof value === 'undefined') {
                    value = '';
                }

                // 对包含逗号、双引号或换行的值进行 CSV 引号转义
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
                    // 双引号自身需要转义为两个双引号
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(',');
        });

        return [header, ...rows].join('\n');
    }
};

export default apiContext;