// routes/asset-api.js - 重构后的资产 API 路由文件 (Supabase 版本)

// 导出路由数组，供 src/index.js 导入
export const assetRoutes = [
    // 获取所有资产 (GET /api/assets)
    {
        method: 'GET',
        pattern: '/assets',
        handler: async (request, env, apiContext) => {
            // 认证检查，确保用户已登录。request.userId 和 request.isAdmin 会在此处设置。
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const queryParams = apiContext.parseQuery(new URL(request.url).search.substring(1)); // 解析查询参数

            const {
                startDate,
                endDate,
                type,
                page = 1,
                limit = 10
            } = queryParams;

            let query = apiContext.supabase
                .from('assets')
                .select('*', { count: 'exact' }) // 请求数据和总计数
                .eq('user_id', userId); // 强制按用户 ID 过滤

            // 添加日期筛选
            if (startDate) {
                query = query.gte('purchase_date', startDate);
            }
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setUTCHours(23, 59, 59, 999); // 设置到当天的最后一刻 (UTC)
                query = query.lte('purchase_date', endOfDay.toISOString()); // 转换为 ISO 字符串
            }
            // 添加类型筛选 (大小写不敏感模糊匹配)
            if (type) {
                query = query.ilike('type', `%${type}%`);
            }

            // 分页
            const parsedPage = parseInt(page);
            const parsedLimit = parseInt(limit);
            const startRange = (parsedPage - 1) * parsedLimit;
            const endRange = startRange + parsedLimit - 1;
            query = query.range(startRange, endRange);

            // 排序
            query = query.order('purchase_date', { ascending: false }).order('created_at', { ascending: false });

            try {
                const { data: assets, count: totalCount, error } = await query;

                if (error) {
                    console.error('Error fetching assets from Supabase:', error);
                    return new Response(JSON.stringify({ message: '服务器错误，无法获取资产。', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                // 计算总成本和总现值
                let totalCost = 0;
                let totalCurrentValue = 0;
                if (assets) {
                    assets.forEach(asset => {
                        totalCost += parseFloat(asset.cost || 0) * parseFloat(asset.quantity || 0);
                        totalCurrentValue += parseFloat(asset.current_value || 0) * parseFloat(asset.quantity || 0);
                    });
                }

                // 获取所有不重复的资产类型，用于前端筛选
                const { data: distinctTypesData, error: distinctTypeError } = await apiContext.supabase
                    .from('assets')
                    .select('type')
                    .eq('user_id', userId)
                    .not('type', 'is', null) // 排除 null 类型
                    .not('type', 'eq', '') // 排除空字符串类型
                    .order('type', { ascending: true });

                if (distinctTypeError) {
                    console.error('Error fetching distinct asset types from Supabase:', distinctTypeError);
                    // 即使获取类型失败，也允许主资产数据返回
                }
                const distinctTypes = distinctTypesData ? [...new Set(distinctTypesData.map(d => d.type))] : [];


                return new Response(JSON.stringify({
                    assets,
                    totalCount: totalCount || 0,
                    currentPage: parsedPage,
                    totalPages: Math.ceil((totalCount || 0) / parsedLimit),
                    limit: parsedLimit,
                    totalCost: totalCost.toFixed(2),
                    totalCurrentValue: totalCurrentValue.toFixed(2),
                    distinctTypes,
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error fetching assets (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法获取资产。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 资产统计 (GET /api/assets/statistics)
    {
        method: 'GET',
        pattern: '/assets/statistics',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const queryParams = apiContext.parseQuery(new URL(request.url).search.substring(1));
            const { type, startDate, endDate } = queryParams;

            let query = apiContext.supabase
                .from('assets')
                .select('type, quantity, cost, current_value') // 选择计算所需字段
                .eq('user_id', userId);

            if (startDate) {
                query = query.gte('purchase_date', startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                query = query.lte('purchase_date', end.toISOString());
            }
            if (type && type !== '') {
                query = query.eq('type', type);
            }

            try {
                const { data: assets, error } = await query;

                if (error) {
                    console.error('Error fetching assets for statistics from Supabase:', error);
                    return new Response(JSON.stringify({ message: '服务器错误，无法获取资产统计数据。', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                // 在 Worker 端进行聚合计算
                const statisticsMap = new Map();
                if (assets) {
                    assets.forEach(asset => {
                        const assetType = asset.type || '未知类型';
                        const currentVal = parseFloat(asset.current_value || 0) * parseFloat(asset.quantity || 0);

                        if (!statisticsMap.has(assetType)) {
                            statisticsMap.set(assetType, { totalCurrentValue: 0, count: 0 });
                        }
                        const currentStats = statisticsMap.get(assetType);
                        currentStats.totalCurrentValue += currentVal;
                        currentStats.count += 1;
                    });
                }
                // 将 Map 转换为数组并排序
                const statistics = Array.from(statisticsMap).map(([type, stats]) => ({
                    _id: type, // 为了与 Mongoose 聚合结果结构保持一致，这里使用 _id
                    totalCurrentValue: parseFloat(stats.totalCurrentValue.toFixed(2)),
                    count: stats.count
                })).sort((a, b) => b.totalCurrentValue - a.totalCurrentValue);


                // 获取所有不重复的资产类型，用于统计页面的类型下拉列表
                const { data: distinctAssetTypesData, error: distinctTypeError } = await apiContext.supabase
                    .from('assets')
                    .select('type')
                    .eq('user_id', userId)
                    .not('type', 'is', null)
                    .not('type', 'eq', '')
                    .order('type', { ascending: true });

                const distinctAssetTypes = distinctAssetTypesData ? [...new Set(distinctAssetTypesData.map(d => d.type))] : [];

                if (distinctTypeError) {
                    console.error('Error fetching distinct asset types for statistics from Supabase:', distinctTypeError);
                }

                return new Response(JSON.stringify({
                    statistics,
                    distinctAssetTypes,
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error fetching asset statistics (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法获取资产统计数据。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 导出资产数据 (GET /api/assets/export)
    {
        method: 'GET',
        pattern: '/assets/export',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const queryParams = apiContext.parseQuery(new URL(request.url).search.substring(1)); // 获取所有查询参数

            let query = apiContext.supabase
                .from('assets')
                .select('*')
                .eq('user_id', userId);

            // 根据查询参数构建筛选条件
            if (queryParams.startDate) {
                query = query.gte('purchase_date', queryParams.startDate);
            }
            if (queryParams.endDate) {
                const endDate = new Date(queryParams.endDate);
                endDate.setUTCHours(23, 59, 59, 999);
                query = query.lte('purchase_date', endDate.toISOString());
            }
            if (queryParams.type) {
                query = query.ilike('type', `%${queryParams.type}%`);
            }

            query = query.order('purchase_date', { ascending: false }); // 按购置日期倒序

            try {
                const { data: assetsToExport, error } = await query;

                if (error) {
                    console.error('Error fetching assets for export from Supabase:', error);
                    return new Response(JSON.stringify({ message: '服务器错误，无法导出资产数据。', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                if (!assetsToExport || assetsToExport.length === 0) {
                    return new Response(JSON.stringify({ message: '没有符合筛选条件的资产可供导出。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }

                // Define fields for CSV, mapping Supabase snake_case to display labels
                const fields = [
                    { label: '名称', value: 'name' },
                    { label: '类型', value: 'type' },
                    { label: '数量', value: 'quantity' },
                    { label: '成本', value: 'cost' },
                    { label: '现值', value: 'current_value' },
                    {
                        label: '购买日期',
                        value: (row) => row.purchase_date ? apiContext.formatDate(row.purchase_date) : '' // 使用辅助函数格式化日期
                    },
                    { label: '状况', value: 'condition' },
                    { label: '折旧方法', value: 'depreciation_method' },
                    { label: '折旧率', value: 'depreciation_rate' },
                    { label: '备注', value: 'notes' },
                    {
                        label: '创建时间',
                        value: (row) => row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : ''
                    },
                    {
                        label: '更新时间',
                        value: (row) => row.updated_at ? new Date(row.updated_at).toLocaleString('zh-CN') : ''
                    }
                ];

                const json2csvParser = new apiContext.Json2csvParser({ fields });
                const csv = json2csvParser.parse(assetsToExport);

                return new Response(csv, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv; charset=utf-8',
                        'Content-Disposition': `attachment; filename=assets_export_${Date.now()}.csv`,
                    },
                });

            } catch (err) {
                console.error('Error exporting assets (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法导出数据。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 新增资产 (POST /api/assets) - 遵循 RESTful API 命名
    {
        method: 'POST',
        pattern: '/assets',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const { name, type, quantity, cost, currentValue, purchaseDate, condition, depreciationMethod, depreciationRate, notes } = await request.json();

            // 基础验证
            if (!name || !type || quantity === undefined || cost === undefined) {
                return new Response(JSON.stringify({ message: '名称、类型、数量和成本是必填项。' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            try {
                const newAssetData = {
                    name,
                    type,
                    quantity: parseFloat(quantity),
                    cost: parseFloat(cost),
                    current_value: currentValue !== undefined ? parseFloat(currentValue) : 0,
                    purchase_date: purchaseDate ? new Date(purchaseDate).toISOString() : new Date().toISOString(), // 存储为 ISO 字符串
                    condition,
                    depreciation_method: depreciationMethod,
                    depreciation_rate: depreciationRate ? parseFloat(depreciationRate) : null, // 使用 null 而非 undefined
                    notes,
                    user_id: userId // 设置用户 ID
                };

                const { data: insertedAsset, error } = await apiContext.supabase
                    .from('assets')
                    .insert([newAssetData])
                    .select() // 返回插入的数据
                    .single(); // 期望只插入一条数据

                if (error) {
                    console.error('Error adding asset to Supabase:', error);
                    return new Response(JSON.stringify({ message: '服务器错误，无法新增资产。', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '资产新增成功！', asset: insertedAsset }), { status: 201, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error adding asset (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法新增资产。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 获取单个资产详情 (GET /api/assets/:id)
    {
        method: 'GET',
        pattern: '/assets/:id',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const assetId = request.params.id; // Supabase 通常使用 UUID 作为 ID

            try {
                const { data: asset, error } = await apiContext.supabase
                    .from('assets')
                    .select('*')
                    .eq('id', assetId)
                    .eq('user_id', userId)
                    .single(); // 期望只返回一个结果

                if (error || !asset) {
                    console.error('Error fetching asset details from Supabase:', error);
                    // Supabase 在找不到记录时 error.code 为 'PGRST116'
                    const status = error && error.code === 'PGRST116' ? 404 : 500;
                    const message = error && error.code === 'PGRST116' ? '资产未找到或无权限。' : '服务器错误，无法获取资产详情。';
                    return new Response(JSON.stringify({ message: message, details: error ? error.message : 'Asset not found.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify(asset), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error fetching asset details (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法获取资产详情。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 更新资产 (PUT /api/assets/:id) - 遵循 RESTful API 命名
    {
        method: 'PUT',
        pattern: '/assets/:id',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const assetId = request.params.id;
            const { name, type, quantity, cost, currentValue, purchaseDate, condition, depreciationMethod, depreciationRate, notes } = await request.json();

            // 基础验证
            if (!name || !type || quantity === undefined || cost === undefined) {
                return new Response(JSON.stringify({ message: '名称、类型、数量和成本是必填项。' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            try {
                const updateData = {
                    name,
                    type,
                    quantity: parseFloat(quantity),
                    cost: parseFloat(cost),
                    current_value: currentValue !== undefined ? parseFloat(currentValue) : 0,
                    condition,
                    depreciation_method: depreciationMethod,
                    depreciation_rate: depreciationRate ? parseFloat(depreciationRate) : null,
                    notes
                };
                // 只有在提供 purchaseDate 时才更新
                if (purchaseDate) {
                    updateData.purchase_date = new Date(purchaseDate).toISOString();
                }

                const { data: updatedAsset, error } = await apiContext.supabase
                    .from('assets')
                    .update(updateData)
                    .eq('id', assetId)
                    .eq('user_id', userId) // 确保用户只能更新自己的资产
                    .select() // 返回更新后的数据
                    .single(); // 期望只更新一条数据

                if (error || !updatedAsset) {
                    console.error('Error updating asset in Supabase:', error);
                    const status = error && error.code === 'PGRST116' ? 404 : 500;
                    const message = error && error.code === 'PGRST116' ? '资产未找到或无权限。' : '服务器错误，无法更新资产。';
                    return new Response(JSON.stringify({ message: message, details: error ? error.message : 'Asset not found or unauthorized.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '资产更新成功！', asset: updatedAsset }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error updating asset (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法更新资产。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 删除资产 (DELETE /api/assets/:id) - 遵循 RESTful API 命名
    {
        method: 'DELETE',
        pattern: '/assets/:id',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const assetId = request.params.id;

            try {
                // 先检查资产是否存在且属于当前用户
                const { data: existingAsset, error: checkError } = await apiContext.supabase
                    .from('assets')
                    .select('id')
                    .eq('id', assetId)
                    .eq('user_id', userId)
                    .single();

                if (checkError || !existingAsset) {
                    console.error('Error checking asset existence for deletion from Supabase:', checkError);
                    const status = checkError && checkError.code === 'PGRST116' ? 404 : 500;
                    const message = checkError && checkError.code === 'PGRST116' ? '资产未找到或无权限。' : '服务器错误，无法检查资产。';
                    return new Response(JSON.stringify({ message: message, details: checkError ? checkError.message : 'Asset not found.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }

                // 执行删除操作
                const { error: deleteError } = await apiContext.supabase
                    .from('assets')
                    .delete()
                    .eq('id', assetId)
                    .eq('user_id', userId);

                if (deleteError) {
                    console.error('Error deleting asset from Supabase:', deleteError);
                    return new Response(JSON.stringify({ message: '服务器错误，无法删除资产。', details: deleteError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '资产删除成功！' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error deleting asset (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法删除资产。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },
];
