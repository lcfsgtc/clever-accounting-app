// routes/auth-api.js - 重构后的认证和用户管理 API 路由文件 (Supabase 版本)

// 注意：这里不再需要 import jwt from '@tsndr/cloudflare-worker-jwt';
// 因为 apiContext 中已经包含了 jwt 对象，我们可以直接通过 apiContext.jwt 访问。

// 导出路由数组，供 src/index.js 导入
export const authRoutes = [
// 临时管理员创建路由 - 执行后必须删除！
   /* { method: 'GET', pattern: '/api/create-admin-initial', handler: async (request, env, apiContext) => {
        // 确保只在开发环境执行，并且加一个简单的安全检查
        //if (env.NODE_ENV !== 'development' && request.headers.get('Authorization') !== `Bearer ${env.ADMIN_INIT_TOKEN}`) {
        //    return new Response('Unauthorized', { status: 401 });
        //}

        try {
            const username = 'admin';
            const email = 'lcfsgtc@126.com'; // 可以是虚拟的
            const password = '111111';

            // 检查用户是否已存在
            const { data: existingUser, error: checkError } = await apiContext.supabase
                .from('users')
                .select('user_id')
                .or(`username.eq.${username},email.eq.${email}`);

            if (checkError) {
                console.error('检查现有用户错误:', checkError);
                return new Response(JSON.stringify({ message: '服务器错误，无法检查用户存在性', details: checkError.message }), { status: 500 });
            }

            if (existingUser && existingUser.length > 0) {
                return new Response(JSON.stringify({ message: '管理员用户已存在，无需重复创建。' }), { status: 200 });
            }

            const { hash: hashedPassword, salt: passwordSalt } = await apiContext.hashPassword(password);

            const { data, error: insertError } = await apiContext.supabase
                .from('users')
                .insert([
                    {
                        username: username,
                        email: email,
                        hashed_password: hashedPassword,
                        salt: passwordSalt,
                        is_admin: true ,// 设置为管理员
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()                       
                    }
                ])
                .select('user_id, username, email, is_admin')
                .single();

            if (insertError) {
                console.error('创建管理员错误:', insertError);
                return new Response(JSON.stringify({ message: '创建管理员失败', details: insertError.message }), { status: 500 });
            }

            return new Response(JSON.stringify({ message: '管理员账号创建成功！', user: data }), { status: 201 });

        } catch (error) {
            console.error('创建管理员过程中发生意外错误:', error);
            return new Response(JSON.stringify({ message: '服务器错误，创建管理员失败', details: error.message }), { status: 500 });
        }
    }},*/


    // 注册 (POST /api/register)
    { method: 'POST', pattern: '/register', handler: async (request, env, apiContext) => {
        try {
            const { username, password, email } = await request.json();
            if (!username || !password || !email) {
                return new Response(JSON.stringify({ message: '缺少必填字段' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            // 检查用户名或邮箱是否已存在
            const { data: existingUsers, error: fetchError } = await apiContext.supabase
                .from('users')
                .select('user_id, username, email') // 选择 user_id, username 和 email 以进行准确判断
                .or(`username.eq.${username},email.eq.${email}`);

            if (fetchError) {
                console.error('查询现有用户错误:', fetchError);
                return new Response(JSON.stringify({ message: '服务器错误，无法检查用户存在性', details: fetchError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }

            if (existingUsers && existingUsers.length > 0) {
                // Supabase 返回的 data 中包含 username 和 email
                const usernameExists = existingUsers.some(user => user.username === username);
                const emailExists = existingUsers.some(user => user.email === email);

                if (usernameExists && emailExists) {
                    return new Response(JSON.stringify({ message: '用户名和邮箱都已存在' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
                } else if (usernameExists) {
                    return new Response(JSON.stringify({ message: '用户名已存在' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
                } else if (emailExists) {
                    return new Response(JSON.stringify({ message: '邮箱已存在' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
                }
            }

            // 使用 apiContext 中提供的密码哈希函数
            const { hash: hashedPassword, salt: passwordSalt } = await apiContext.hashPassword(password);

            // 将用户数据插入 Supabase
            const { data, error: insertError } = await apiContext.supabase
                .from('users')
                .insert([
                    {
                        username: username,
                        email: email,
                        hashed_password: hashedPassword, // 存储哈希密码
                        salt: passwordSalt,             // 存储盐
                        registration_date: new Date().toISOString(), // Supabase 建议 ISO 格式日期
                        is_admin: false // 默认非管理员
                    }
                ])
                .select('user_id, username, email, is_admin') // 注册成功后返回一些非敏感信息，使用 user_id
                .single(); // 期望插入成功返回单个对象

            if (insertError) {
                console.error('注册错误:', insertError);
                return new Response(JSON.stringify({ message: '服务器错误，注册失败', details: insertError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ message: '用户注册成功', user: data }), { status: 201, headers: { 'Content-Type': 'application/json' } });

        } catch (error) {
            console.error('注册过程中发生意外错误:', error);
            return new Response(JSON.stringify({ message: '服务器错误，注册失败', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }},

    // 登录 (POST /api/login)
    { method: 'POST', pattern: '/login', handler: async (request, env, apiContext) => {
        try {
            const { username, password } = await request.json();
            if (!username || !password) {
                return new Response(JSON.stringify({ message: '缺少用户名/邮箱或密码' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            // 登录时，用户可能输入用户名或邮箱，所以使用 .or 条件
            const { data: user, error } = await apiContext.supabase
                .from('users')
                .select('user_id, username, email, hashed_password, salt, is_admin') // 确保选择 user_id, hashed_password 和 salt 字段
                .or(`username.eq.${username},email.eq.${username}`) // 同时支持用户名或邮箱登录
                .single();

            if (error) {
                console.error('登录查询错误:', error);
                // Supabase 当没有找到行时，error.code 是 'PGRST116'
                if (error.code === 'PGRST116') {
                    return new Response(JSON.stringify({ message: '无效的凭据：用户不存在' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '服务器错误，登录失败', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
            if (!user) { // 如果 Supabase 返回 error 但 data 为 null 的情况
                 return new Response(JSON.stringify({ message: '无效的凭据：用户不存在' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }

            // 使用 apiContext 中提供的密码验证函数
            const passwordMatch = await apiContext.verifyPassword(password, user.hashed_password, user.salt);
            if (!passwordMatch) {
                return new Response(JSON.stringify({ message: '无效的凭据：密码不正确' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }

            // 使用 apiContext 中提供的 jwt 实例生成 JWT，使用 user_id
            const token = await apiContext.jwt.sign({ userId: user.user_id, isAdmin: user.is_admin || false }, env.JWT_SECRET, { expiresIn: '1h' });
            return new Response(JSON.stringify({ token, userId: user.user_id, isAdmin: user.is_admin, message: '登录成功' }), { status: 200, headers: { 'Content-Type': 'application/json' } });

        } catch (error) {
            console.error('登录错误:', error);
            return new Response(JSON.stringify({ message: '服务器错误，登录失败', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }},

    // 登出 (GET /api/logout)
    { method: 'GET', pattern: '/logout', handler: async (request, env, apiContext) => {
        // 在纯 API 模式下，登出通常意味着客户端删除其 JWT。
        // 服务器端通常无需特殊处理，除非需要维护 JWT 黑名单等复杂逻辑。
        // 对于本示例，只需返回成功消息。
        return new Response(JSON.stringify({ message: '已成功登出。' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }},

    // 修改密码 (POST /api/change-password)
    {
        method: 'POST',
        pattern: '/change-password',
        handler: async (request, env, apiContext) => {
            // apiContext.requireLogin 确保 request 上已有 userId (user_id) 和 isAdmin
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck; // 未登录则返回错误响应

            const { oldPassword, newPassword, confirmPassword } = await request.json();
            const userId = request.userId; // 从 requireLogin 中获取用户 ID (此时应为 user_id)

            // 验证新密码和确认密码是否一致
            if (newPassword !== confirmPassword) {
                return new Response(JSON.stringify({ message: '新密码和确认密码不匹配。' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            try {
                const { data: user, error: fetchUserError } = await apiContext.supabase
                    .from('users')
                    .select('hashed_password, salt') // 获取哈希密码和盐
                    .eq('user_id', userId) // 使用 user_id
                    .single();

                if (fetchUserError) {
                    console.error('获取用户错误:', fetchUserError);
                    if (fetchUserError.code === 'PGRST116') {
                        return new Response(JSON.stringify({ message: '用户未找到。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                    }
                    return new Response(JSON.stringify({ message: '数据库查询错误。', details: fetchUserError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                if (!user) { // 如果 Supabase 返回 error 但 data 为 null 的情况
                    return new Response(JSON.stringify({ message: '用户未找到。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }

                // 验证旧密码
                const passwordMatch = await apiContext.verifyPassword(oldPassword, user.hashed_password, user.salt);
                if (!passwordMatch) {
                    return new Response(JSON.stringify({ message: '旧密码不正确。' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }

                // 对新密码进行哈希处理
                const { hash: hashedNewPassword, salt: newPasswordSalt } = await apiContext.hashPassword(newPassword);
                const { error: updateError } = await apiContext.supabase
                    .from('users')
                    .update({ hashed_password: hashedNewPassword, salt: newPasswordSalt }) // 更新哈希密码和盐
                    .eq('user_id', userId); // 使用 user_id

                if (updateError) {
                    console.error('更新密码错误:', updateError);
                    return new Response(JSON.stringify({ message: '服务器错误，无法修改密码。', details: updateError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                return new Response(JSON.stringify({ message: '密码修改成功！' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('修改密码错误:', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法修改密码。', details: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 用户管理列表 (GET /api/admin/users) - 仅管理员可见
    {
        method: 'GET',
        pattern: '/admin/users',
        handler: async (request, env, apiContext) => {
            const adminCheck = await apiContext.requireAdmin(request, env);
            if (adminCheck) return adminCheck; // 非管理员返回错误

            try {
                // 仅返回必要的用户信息，过滤掉密码等敏感数据
                const { data: users, error } = await apiContext.supabase
                    .from('users')
                    .select('user_id, username, email, is_admin, created_at, updated_at'); // 选择 user_id, created_at, updated_at

                if (error) {
                    console.error('获取用户列表错误:', error);
                    return new Response(JSON.stringify({ message: '服务器错误，无法获取用户列表。', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify(users), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('获取用户列表错误:', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法获取用户列表。', details: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 获取单个用户详情 (GET /api/admin/users/:id) - 仅管理员可见
    {
        method: 'GET',
        pattern: '/admin/users/:id',
        handler: async (request, env, apiContext) => {
            const adminCheck = await apiContext.requireAdmin(request, env);
            if (adminCheck) return adminCheck;

            const userId = request.params.id; // 从 URL 参数获取用户 ID (此时应为 user_id)

            try {
                // 同样过滤敏感信息
                const { data: user, error } = await apiContext.supabase
                    .from('users')
                    .select('user_id, username, email, is_admin, created_at, updated_at') // 选择 user_id, created_at, updated_at
                    .eq('user_id', userId) // 使用 user_id
                    .single();

                if (error) {
                    console.error('获取用户详情错误:', error);
                    if (error.code === 'PGRST116') {
                        return new Response(JSON.stringify({ message: '用户未找到。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                    }
                    return new Response(JSON.stringify({ message: '数据库查询错误。', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                if (!user) { // 如果 Supabase 返回 error 但 data 为 null 的情况
                    return new Response(JSON.stringify({ message: '用户未找到。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify(user), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('获取用户详情错误:', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法获取用户详情。', details: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 更新用户 (PUT /api/admin/users/:id) - 仅管理员可见
    {
        method: 'PUT',
        pattern: '/admin/users/:id',
        handler: async (request, env, apiContext) => {
            const adminCheck = await apiContext.requireAdmin(request, env);
            if (adminCheck) return adminCheck;

            const userId = request.params.id; // 从 URL 参数获取用户 ID (此时应为 user_id)
            const { username, email, isAdmin } = await request.json();

            // 服务器端验证：邮件格式
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { // 允许 email 为空，但如果提供了必须是有效格式
                return new Response(JSON.stringify({ message: '请输入有效的电子邮件地址。' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            try {
                const { data: currentUser, error: fetchCurrentUserError } = await apiContext.supabase
                    .from('users')
                    .select('user_id, username, email, is_admin') // 选择 user_id
                    .eq('user_id', userId) // 使用 user_id
                    .single();

                if (fetchCurrentUserError) {
                    console.error('获取当前用户错误:', fetchCurrentUserError);
                    if (fetchCurrentUserError.code === 'PGRST116') {
                         return new Response(JSON.stringify({ message: '用户未找到。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                    }
                    return new Response(JSON.stringify({ message: '数据库查询错误。', details: fetchCurrentUserError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                if (!currentUser) {
                    return new Response(JSON.stringify({ message: '用户未找到。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }

                const updateData = {};

                // 检查用户名唯一性，如果提供了新的用户名且与当前不同
                if (username && username !== currentUser.username) {
                    const { data: existingUser, error: checkUsernameError } = await apiContext.supabase
                        .from('users')
                        .select('user_id') // 选择 user_id
                        .eq('username', username)
                        .single();

                    if (checkUsernameError && checkUsernameError.code !== 'PGRST116') {
                        console.error('检查用户名唯一性错误:', checkUsernameError);
                        return new Response(JSON.stringify({ message: '服务器错误，无法检查用户名唯一性。', details: checkUsernameError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                    }
                    // 确保不是当前用户自己的用户名 (比较 user_id)
                    if (existingUser && existingUser.user_id !== userId) {
                        return new Response(JSON.stringify({ message: '用户名已存在。' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                    }
                    updateData.username = username;
                }

                // 检查邮箱唯一性，如果提供了新的邮箱且与当前不同
                if (email && email !== currentUser.email) {
                    const { data: existingUserWithEmail, error: checkEmailError } = await apiContext.supabase
                        .from('users')
                        .select('user_id') // 选择 user_id
                        .eq('email', email)
                        .single();

                    if (checkEmailError && checkEmailError.code !== 'PGRST116') {
                        console.error('检查邮箱唯一性错误:', checkEmailError);
                        return new Response(JSON.stringify({ message: '服务器错误，无法检查邮箱唯一性。', details: checkEmailError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                    }
                    // 确保不是当前用户自己的邮箱 (比较 user_id)
                    if (existingUserWithEmail && existingUserWithEmail.user_id !== userId) {
                        return new Response(JSON.stringify({ message: '该邮箱已被其他用户注册。' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                    }
                    updateData.email = email;
                }

                // 更新 isAdmin 字段
                if (typeof isAdmin === 'boolean' && isAdmin !== currentUser.is_admin) {
                    updateData.is_admin = isAdmin;
                }

                if (Object.keys(updateData).length === 0) {
                    return new Response(JSON.stringify({ message: '没有需要更新的信息。' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                }

                const { error: updateError } = await apiContext.supabase
                    .from('users')
                    .update(updateData)
                    .eq('user_id', userId); // 使用 user_id

                if (updateError) {
                    console.error('更新用户错误:', updateError);
                    return new Response(JSON.stringify({ message: '服务器错误，无法更新用户。', details: updateError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '用户信息更新成功！' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('更新用户错误:', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法更新用户。', details: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 删除用户 (DELETE /api/admin/users/:id) - 仅管理员可见
    {
        method: 'DELETE',
        pattern: '/admin/users/:id',
        handler: async (request, env, apiContext) => {
            const adminCheck = await apiContext.requireAdmin(request, env);
            if (adminCheck) return adminCheck;

            const userIdToDelete = request.params.id; // 从 URL 参数获取用户 ID (此时应为 user_id)

            try {
                // 先查询用户是否存在，如果不存在则返回 404
                const { data: existingUser, error: checkError } = await apiContext.supabase
                    .from('users')
                    .select('user_id') // 选择 user_id
                    .eq('user_id', userIdToDelete) // 使用 user_id
                    .single();

                if (checkError) {
                    console.error('查询用户是否存在错误:', checkError);
                    if (checkError.code === 'PGRST116') {
                        return new Response(JSON.stringify({ message: '用户未找到。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                    }
                    return new Response(JSON.stringify({ message: '服务器错误，无法查询用户。', details: checkError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                if (!existingUser) { // 冗余检查，以防 Supabase 错误处理方式变化
                    return new Response(JSON.stringify({ message: '用户未找到。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }

                // 执行删除操作
                const { error: deleteError } = await apiContext.supabase
                    .from('users')
                    .delete()
                    .eq('user_id', userIdToDelete); // 使用 user_id

                if (deleteError) {
                    console.error('删除用户错误:', deleteError);
                    return new Response(JSON.stringify({ message: '服务器错误，无法删除用户。', details: deleteError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '用户删除成功！' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('删除用户错误:', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法删除用户。', details: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 重置用户密码 (POST /api/admin/users/reset-password/:id) - 仅管理员可见
    {
        method: 'POST',
        pattern: '/admin/users/reset-password/:id',
        handler: async (request, env, apiContext) => {
            const adminCheck = await apiContext.requireAdmin(request, env);
            if (adminCheck) return adminCheck;

            const userIdToReset = request.params.id; // 从 URL 参数获取用户 ID (此时应为 user_id)
            const DEFAULT_PASSWORD = '123456'; // 定义默认重置密码

            try {
                const { data: user, error: fetchUserError } = await apiContext.supabase
                    .from('users')
                    .select('user_id, username') // 选择 user_id 和 username 来打印日志
                    .eq('user_id', userIdToReset) // 使用 user_id
                    .single();

                if (fetchUserError) {
                    console.error('获取用户错误:', fetchUserError);
                    if (fetchUserError.code === 'PGRST116') {
                        return new Response(JSON.stringify({ message: '用户未找到。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                    }
                    return new Response(JSON.stringify({ message: '数据库查询错误。', details: fetchUserError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                if (!user) { // 冗余检查
                    return new Response(JSON.stringify({ message: '用户未找到。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }

                // 使用 apiContext 中提供的密码哈希函数
                const { hash: hashedPassword, salt: passwordSalt } = await apiContext.hashPassword(DEFAULT_PASSWORD);
                const { error: updateError } = await apiContext.supabase
                    .from('users')
                    .update({ hashed_password: hashedPassword, salt: passwordSalt }) // 更新哈希密码和盐
                    .eq('user_id', userIdToReset); // 使用 user_id

                if (updateError) {
                    console.error('更新密码错误:', updateError);
                    return new Response(JSON.stringify({ message: '服务器错误，无法重置用户密码。', details: updateError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                console.log(`用户 ${user.username} (ID: ${user.user_id}) 密码已重置为默认值。`);
                return new Response(JSON.stringify({ message: '用户密码重置成功！' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('重置用户密码错误:', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法重置用户密码。', details: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },
];