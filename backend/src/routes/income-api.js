// routes/income-api.js - 重构后的收入 API 路由文件 (Supabase 版本)

// 导出路由数组，供 src/index.js 导入
export const incomeRoutes = [
    // 1. 收入统计 (GET /api/incomes/statistics) - 最具体，放最前面
    {
        method: 'GET',
        pattern: '/incomes/statistics',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const queryParams = apiContext.parseQuery(new URL(request.url).search.substring(1)) || {};
            // const url = new URL(request.url);
            // const params = new URLSearchParams(url.search);
            // const queryParams = {};
            // for (const [key, value] of params.entries()) {
            //     queryParams[key] = value;
            // }
            const { startDate, endDate, categoryType, category, subcategory, minAmount, maxAmount, period, year } = queryParams;

            console.log('--- Income Statistics Request Query Params ---');
            console.log('startDate:', startDate);
            console.log('endDate:', endDate);
            console.log('categoryType:', categoryType);
            console.log('category:', category);
            console.log('subcategory:', subcategory);
            console.log('minAmount:', minAmount);
            console.log('maxAmount:', maxAmount);
            console.log('period:', period);
            console.log('year:', year);
            console.log('--------------------------------------------');


            let query = apiContext.supabase
                .from('incomes')
                .select('amount, category, subcategory, date')
                .eq('user_id', userId);

            // Apply date filters
            if (startDate) {
                const isoStartDate = new Date(startDate).toISOString();
                console.log('Applying startDate filter:', startDate, '->', isoStartDate);
                query = query.gte('date', isoStartDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                const isoEndDate = end.toISOString();
                console.log('Applying endDate filter:', endDate, '->', isoEndDate);
                query = query.lte('date', isoEndDate);
            }

            // Apply amount filters
            if (minAmount) {
                console.log('Applying minAmount filter:', minAmount);
                query = query.gte('amount', parseFloat(minAmount));
            }
            if (maxAmount) {
                console.log('Applying maxAmount filter:', maxAmount);
                query = query.lte('amount', parseFloat(maxAmount));
            }

            // If a specific year is provided for month-based statistics, filter by that year
            if (period === 'month' && year) {
                const startOfYear = new Date(parseInt(year), 0, 1).toISOString();
                const endOfYear = new Date(parseInt(year) + 1, 0, 1).toISOString();
                console.log('Applying year filter for month period:', year, '->', startOfYear, 'to', endOfYear);
                query = query.gte('date', startOfYear).lt('date', endOfYear);
            }

            // Apply category and subcategory filters UNCONDITIONALLY if they are present.
            if (category) {
                console.log('Applying category filter:', category);
                query = query.eq('category', category);
            }
            if (subcategory) {
                console.log('Applying subcategory filter:', subcategory);
                query = query.eq('subcategory', subcategory);
            }

            try {
                // IMPORTANT: Supabase queries are lazy. The actual fetch happens when .data/.error is accessed.
                // We cannot console.log the "query string" in a directly readable SQL-like format from Supabase client
                // but these logs above help verify the conditions being applied.
                const { data: incomes, error } = await query;

                if (error) {
                    console.error('Error fetching income data for statistics from Supabase:', error);
                    return new Response(JSON.stringify({ message: 'Server Error fetching income statistics', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                console.log(`Fetched ${incomes ? incomes.length : 0} incomes for statistics.`);
                // console.log('Fetched incomes:', incomes); // This might be too verbose, enable if needed

                const statisticsMap = new Map();
                let totalOverallAmount = 0;

                if (incomes) {
                    incomes.forEach(income => {
                        totalOverallAmount += income.amount;

                        let groupKey;
                        const incomeDate = new Date(income.date);

                        // Determine the grouping key based on `categoryType` and `period`
                        if (categoryType === 'category') {
                            if (period === 'year') {
                                groupKey = `${income.category || '未知类别'}-${incomeDate.getFullYear()}`;
                            } else if (period === 'month') {
                                groupKey = `${income.category || '未知类别'}-${incomeDate.getFullYear()}-${(incomeDate.getMonth() + 1).toString().padStart(2, '0')}`;
                            } else {
                                groupKey = income.category || '未知类别';
                            }
                        } else if (categoryType === 'subcategory') {
                            if (period === 'year') {
                                groupKey = `${income.subcategory || '未知子类别'}-${incomeDate.getFullYear()}`;
                            } else if (period === 'month') {
                                groupKey = `${income.subcategory || '未知子类别'}-${incomeDate.getFullYear()}-${(incomeDate.getMonth() + 1).toString().padStart(2, '0')}`;
                            } else {
                                groupKey = income.subcategory || '未知子类别';
                            }
                        } else if (categoryType === 'categoryAndSubcategory') {
                            if (period === 'year') {
                                groupKey = `${income.category || '未知类别'} - ${income.subcategory || '未知子类别'}-${incomeDate.getFullYear()}`;
                            } else if (period === 'month') {
                                groupKey = `${income.category || '未知类别'} - ${income.subcategory || '未知子类别'}-${incomeDate.getFullYear()}-${(incomeDate.getMonth() + 1).toString().padStart(2, '0')}`;
                            } else {
                                groupKey = `${income.category || '未知类别'} - ${income.subcategory || '未知子类别'}`;
                            }
                        } else if (period === 'year') {
                            groupKey = incomeDate.getFullYear().toString();
                        } else if (period === 'month') {
                            groupKey = `${incomeDate.getFullYear()}-${(incomeDate.getMonth() + 1).toString().padStart(2, '0')}`;
                        } else {
                            // If no period or categoryType is selected for grouping,
                            // this income won't be added to the statisticsMap (as it's not grouped).
                            // The overall total is handled separately below.
                            return;
                        }

                        if (!statisticsMap.has(groupKey)) {
                            statisticsMap.set(groupKey, 0);
                        }
                        statisticsMap.set(groupKey, statisticsMap.get(groupKey) + income.amount);
                    });
                }

                let statistics = [];
                // If no categoryType and no period grouping is selected, show only the overall total.
                if (!categoryType && !period) {
                    statistics = [{ id: '总计', totalAmount: parseFloat(totalOverallAmount.toFixed(2)) }];
                } else {
                    statistics = Array.from(statisticsMap).map(([key, amount]) => ({
                        id: key,
                        totalAmount: parseFloat(amount.toFixed(2))
                    }));

                    if (period === 'year' || period === 'month') {
                        statistics.sort((a, b) => String(a.id).localeCompare(String(b.id)));
                    } else if (categoryType) {
                        statistics.sort((a, b) => b.totalAmount - a.totalAmount);
                    }
                }
                console.log('Generated statistics:', statistics);

                const { data: distinctYearsData } = await apiContext.supabase
                    .from('incomes')
                    .select('date')
                    .eq('user_id', userId)
                    .not('date', 'is', null);

                const distinctYears = distinctYearsData ? [...new Set(distinctYearsData.map(d => new Date(d.date).getFullYear()))].sort((a, b) => a - b) : [];

                const { data: distinctCategoriesData } = await apiContext.supabase
                    .from('incomes')
                    .select('category')
                    .eq('user_id', userId)
                    .not('category', 'is', null) // Filter out null categories
                    .not('category', 'eq', ''); // Filter out empty string categories
                const distinctCategories = distinctCategoriesData ? [...new Set(distinctCategoriesData.map(d => d.category))].sort() : [];

                const { data: distinctSubcategoriesData } = await apiContext.supabase
                    .from('incomes')
                    .select('subcategory')
                    .eq('user_id', userId)
                    .not('subcategory', 'is', null) // Filter out null subcategories
                    .not('subcategory', 'eq', ''); // Filter out empty string subcategories
                const distinctSubcategories = distinctSubcategoriesData ? [...new Set(distinctSubcategoriesData.map(d => d.subcategory))].sort() : [];


                return new Response(JSON.stringify({
                    statistics,
                    startDate: startDate || '',
                    endDate: endDate || '',
                    categoryType: categoryType || '',
                    minAmount: minAmount || '',
                    maxAmount: maxAmount || '',
                    period: period || '',
                    distinctCategories,
                    distinctSubcategories,
                    distinctYears,
                    query: queryParams
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });

            } catch (err) {
                console.error('Error fetching income statistics (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error fetching income statistics: ' + err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },
    // 2. 导出收入数据 (GET /api/incomes/export) - 其次具体，放在参数路由之前
    {
        method: 'GET',
        pattern: '/incomes/export', // <-- 重新加上 /api 前缀
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const queryParams = apiContext.parseQuery(new URL(request.url).search.substring(1)) || {};
            const { startDate, endDate, category, subcategory } = queryParams;

            let query = apiContext.supabase
                .from('incomes')
                .select('*')
                .eq('user_id', userId);

            if (startDate) {
                query = query.gte('date', new Date(startDate).toISOString());
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                query = query.lte('date', end.toISOString());
            }

            if (category) {
                query = query.eq('category', category);
            }

            if (subcategory) {
                query = query.eq('subcategory', subcategory);
            }

            query = query.order('date', { ascending: false }).order('created_at', { ascending: false });

            try {
                const { data: incomesToExport, error } = await query;

                if (error) {
                    console.error('Error fetching incomes for export from Supabase:', error);
                    return new Response(JSON.stringify({ message: 'Server Error exporting incomes', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                if (!incomesToExport || incomesToExport.length === 0) {
                    return new Response(JSON.stringify({ message: '没有找到符合条件的收入记录可供导出。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }

                // Define fields for CSV export, mapping Supabase snake_case to desired labels
                const fields = [
                    { label: '描述', value: 'description' },
                    { label: '金额', value: 'amount' },
                    { label: '类别', value: 'category' },
                    { label: '子类别', value: 'subcategory' },
                    { label: '日期', value: row => apiContext.formatDate(row.date) }, // Format date for CSV
                    { label: '创建时间', value: row => row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '' },
                    { label: '更新时间', value: row => row.updated_at ? new Date(row.updated_at).toLocaleString('zh-CN') : '' }
                ];
                //const opts = { fields };
                //const parser = new apiContext.Json2csvParser(opts);
                //const csv = parser.parse(incomesToExport);
                // 使用新的 jsonToCsv 函数
                const csv = apiContext.jsonToCsv(incomesToExport, fields);
                
                return new Response(csv, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv; charset=utf-8',
                        'Content-Disposition': `attachment; filename=incomes_export_${Date.now()}.csv`,
                    },
                });
            } catch (err) {
                console.error('Error exporting incomes (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error exporting incomes: ' + err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },
    // 3. 获取所有唯一的收入类别 (GET /api/incomes/categories) - 固定路径，放在参数路由之前
    {
        method: 'GET',
        pattern: '/incomes/categories', // <-- 重新加上 /api 前缀
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;

            try {
                const { data, error } = await apiContext.supabase
                    .from('incomes')
                    .select('category')
                    .eq('user_id', userId)
                    .not('category', 'is', null) // Filter out null categories
                    .not('category', 'eq', ''); // Filter out empty string categories

                if (error) {
                    console.error('Error fetching income categories from Supabase:', error);
                    return new Response(JSON.stringify({ message: 'Server Error fetching income categories', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                // Extract unique categories and sort them
                const categories = [...new Set(data.map(item => item.category))].sort();
                return new Response(JSON.stringify(categories), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error fetching income categories (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error fetching income categories' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 4. 获取所有唯一的收入子类别 (GET /api/incomes/subcategories) - 固定路径，放在参数路由之前
    {
        method: 'GET',
        pattern: '/incomes/subcategories', // <-- 重新加上 /api 前缀
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const queryParams = apiContext.parseQuery(new URL(request.url).search.substring(1)) || {};
            const category = queryParams.category;

            let query = apiContext.supabase
                .from('incomes')
                .select('subcategory')
                .eq('user_id', userId)
                .not('subcategory', 'is', null) // Filter out null subcategories
                .not('subcategory', 'eq', ''); // Filter out empty string subcategories

            if (category) {
                query = query.eq('category', category);
            }

            try {
                const { data, error } = await query;

                if (error) {
                    console.error('Error fetching income subcategories from Supabase:', error);
                    return new Response(JSON.stringify({ message: 'Server Error fetching income subcategories', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                // Extract unique subcategories and sort them
                const subcategories = [...new Set(data.map(item => item.subcategory))].sort();
                return new Response(JSON.stringify(subcategories), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error fetching income subcategories (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error fetching income subcategories' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },
    // 5. 获取所有收入列表 (GET /api/incomes) - 相对通用，但没有参数，放在参数路由之前
    {
        method: 'GET',
        pattern: '/incomes', // <-- 重新加上 /api 前缀
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const url = new URL(request.url);
            const queryParams = apiContext.parseQuery(url.search.substring(1)) || {};
            const { startDate, endDate, category, subcategory, page = 1, limit = 10 } = queryParams;

            let query = apiContext.supabase
                .from('incomes')
                .select('*', { count: 'exact' }) // Request data and total count
                .eq('user_id', userId); // Enforce filtering by user ID

            if (startDate) {
                query = query.gte('date', new Date(startDate).toISOString());
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999); // Ensure end date includes the entire day
                query = query.lte('date', end.toISOString());
            }

            if (category) {
                query = query.eq('category', category);
            }

            if (subcategory) {
                query = query.eq('subcategory', subcategory);
            }

            try {
                const parsedLimit = parseInt(limit);
                const parsedPage = parseInt(page);
                const startRange = (parsedPage - 1) * parsedLimit;
                const endRange = startRange + parsedLimit - 1;

                const { data: incomes, count: totalIncomes, error } = await query
                    .order('date', { ascending: false }) // Sort by date descending
                    .order('created_at', { ascending: false }) // Then by creation date descending
                    .range(startRange, endRange);

                if (error) {
                    console.error('Error fetching income list from Supabase:', error);
                    return new Response(JSON.stringify({ message: 'Server Error fetching income list', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                const finalIncomes = incomes || []; // Ensure incomes is array
                const finalTotalCount = totalIncomes || 0; // Ensure totalCount is number
                const finalTotalPages = Math.ceil(finalTotalCount / parsedLimit) || 1; // Ensure totalPages is number and at least 1
                return new Response(JSON.stringify({
                    incomes: finalIncomes,
                    totalCount: finalTotalCount,
                    currentPage: parsedPage,
                    totalPages: finalTotalPages,
                    limit: parsedLimit
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error fetching income list (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error fetching income list' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },
    // 6. 新增收入 (POST /api/incomes/add) - POST 请求通常不会被 GET 路径参数路由冲突
    {
        method: 'POST',
        pattern: '/incomes/add', // <-- 重新加上 /api 前缀
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const { description, amount, category, subcategory, date } = await request.json();

            // Basic validation for required fields
            if (!description || !amount || !category || !subcategory || !date) {
                return new Response(JSON.stringify({ message: 'Description, amount, category, subcategory, and date are required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return new Response(JSON.stringify({ message: 'Amount must be a valid positive number.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            try {
                const newIncomeData = {
                    user_id: userId, // snake_case
                    description,
                    amount: parsedAmount,
                    category,
                    subcategory,
                    date: new Date(date).toISOString(), // Store as ISO string
                };

                const { data: insertedIncome, error } = await apiContext.supabase
                    .from('incomes')
                    .insert([newIncomeData])
                    .select() // Return inserted data
                    .single(); // Expect a single inserted row

                if (error) {
                    console.error('Error adding income to Supabase:', error);
                    return new Response(JSON.stringify({ message: 'Server Error adding income', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '收入记录添加成功！', income: insertedIncome }), { status: 201, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error adding income (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error adding income' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },
    // 7. 获取单个收入详情 (GET /api/incomes/:id) - 最通用，放最后
    {
        method: 'GET',
        pattern: '/incomes/:id', // <-- 重新加上 /api 前缀
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const incomeId = request.params.id; // Get ID from URL parameters

            try {
                const { data: income, error } = await apiContext.supabase
                    .from('incomes')
                    .select('*')
                    .eq('id', incomeId) // Assume 'id' is the primary key in Supabase
                    .eq('user_id', userId)
                    .single(); // Expect a single result

                if (error || !income) {
                    console.error('Error fetching income details from Supabase:', error);
                    const status = error && error.code === 'PGRST116' ? 404 : 500; // PGRST116: no rows found
                    const message = error && error.code === 'PGRST116' ? 'Income not found or unauthorized' : 'Server Error fetching income details';
                    return new Response(JSON.stringify({ message: message, details: error ? error.message : 'Not found.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify(income), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error fetching income details (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error fetching income details' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },
    // 8. 更新收入 (PUT /api/incomes/:id) - PUT 和 DELETE 带有 :id 参数，通常放在 GET :id 附近或其后
    {
        method: 'PUT',
        pattern: '/incomes/:id', // <-- 重新加上 /api 前缀
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const incomeId = request.params.id;
            const { description, amount, category, subcategory, date } = await request.json();

            // Basic validation for required fields
            if (!description || !amount || !category || !subcategory || !date) {
                return new Response(JSON.stringify({ message: 'Description, amount, category, subcategory, and date are required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return new Response(JSON.stringify({ message: 'Amount must be a valid positive number.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            try {
                const updateData = {
                    description,
                    amount: parsedAmount,
                    category,
                    subcategory,
                    date: new Date(date).toISOString(),
                    updated_at: new Date().toISOString()
                };

                const { data: updatedIncome, error } = await apiContext.supabase
                    .from('incomes')
                    .update(updateData)
                    .eq('id', incomeId)
                    .eq('user_id', userId) // Ensure user can only update their own income
                    .select() // Return updated data
                    .single(); // Expect a single updated row

                if (error || !updatedIncome) {
                    console.error('Error updating income in Supabase:', error);
                    const status = error && error.code === 'PGRST116' ? 404 : 500;
                    const message = error && error.code === 'PGRST116' ? 'Income not found or unauthorized' : 'Server Error updating income';
                    return new Response(JSON.stringify({ message: message, details: error ? error.message : 'Not found or unauthorized.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '收入记录更新成功！', income: updatedIncome }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error updating income (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error updating income' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },
    // 9. 删除收入 (DELETE /api/incomes/:id)
    {
        method: 'DELETE',
        pattern: '/incomes/:id', // <-- 重新加上 /api 前缀
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const incomeId = request.params.id;

            try {
                // First, check if the income exists and belongs to the user
                const { data: existingIncome, error: checkError } = await apiContext.supabase
                    .from('incomes')
                    .select('id')
                    .eq('id', incomeId)
                    .eq('user_id', userId)
                    .single();

                if (checkError || !existingIncome) {
                    console.error('Error checking income existence for deletion:', checkError);
                    const status = checkError && checkError.code === 'PGRST116' ? 404 : 500;
                    const message = checkError && checkError.code === 'PGRST116' ? 'Income not found or unauthorized' : 'Server Error checking income';
                    return new Response(JSON.stringify({ message: message, details: checkError ? checkError.message : 'Not found.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }

                // If exists and authorized, proceed with deletion
                const { error: deleteError, count } = await apiContext.supabase
                    .from('incomes')
                    .delete()
                    .eq('id', incomeId)
                    .eq('user_id', userId);

                if (deleteError) {
                    console.error('Error deleting income from Supabase:', deleteError);
                    return new Response(JSON.stringify({ message: 'Server Error deleting income', details: deleteError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                if (count === 0) {
                    return new Response(JSON.stringify({ message: 'Income not found or you do not have permission to delete it.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '收入记录删除成功！' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error deleting income (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error deleting income' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },
];
