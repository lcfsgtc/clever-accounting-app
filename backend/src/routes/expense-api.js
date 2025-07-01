// routes/expense-api.js

export const expenseRoutes = [
    // 获取所有费用 (GET /api/expenses) - (此部分代码无需修改)
    {
        method: 'GET',
        pattern: '/expenses',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const url = new URL(request.url);
            const queryParams = apiContext.parseQuery(url.search);

            const {
                category,
                subcategory, // 添加 subcategory 筛选
                minAmount,
                maxAmount,
                startDate,
                endDate,
                page = 1,
                limit = 10
            } = queryParams;

            let query = apiContext.supabase
                .from('expenses')
                .select('*', { count: 'exact' })
                .eq('user_id', userId);

            // 应用筛选
            if (category) query = query.eq('category', category);
            if (subcategory) query = query.eq('subcategory', subcategory); // 添加对 subcategory 的支持
            if (minAmount) query = query.gte('amount', parseFloat(minAmount));
            if (maxAmount) query = query.lte('amount', parseFloat(maxAmount));
            if (startDate) query = query.gte('date', new Date(startDate).toISOString());
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setUTCHours(23, 59, 59, 999);
                query = query.lte('date', endOfDay.toISOString());
            }

            try {
                const parsedPage = parseInt(page);
                const parsedLimit = parseInt(limit);
                const startRange = (parsedPage - 1) * parsedLimit;
                const endRange = startRange + parsedLimit - 1;

                const { data: expenses, count: totalCount, error } = await query
                    .order('date', { ascending: false })
                    .order('created_at', { ascending: false })
                    .range(startRange, endRange);

                if (error) throw error;

                return new Response(JSON.stringify({
                    expenses,
                    totalCount: totalCount || 0,
                    currentPage: parsedPage,
                    totalPages: Math.ceil((totalCount || 0) / parsedLimit),
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });

            } catch (err) {
                console.error('Error fetching expenses:', err);
                return new Response(JSON.stringify({ message: '获取支出记录时发生服务器错误', details: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

     // GET /api/expenses/categories (获取所有唯一的费用类别) - (最终修正版)
    {
        method: 'GET',
        pattern: '/expenses/categories',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            try {
                // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
                // 这是最终的、正确的查询方式：简化数据库查询
                // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
                const { data, error } = await apiContext.supabase
                    .from('expenses')
                    .select('category')
                    .eq('user_id', request.userId);

                if (error) throw error;

                // 在 JavaScript 中进行过滤和去重，这更安全、更可靠
                const categories = [...new Set(data.map(item => item.category).filter(Boolean))].sort();
                // .filter(Boolean) 会优雅地移除所有 null, undefined, '' 等 "falsy" 值

                return new Response(JSON.stringify(categories), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error fetching expense categories:', err);
                return new Response(JSON.stringify({ message: '获取支出分类时发生服务器错误', details: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // GET /api/expenses/subcategories (获取唯一的费用子类别) - (最终修正版)
    {
        method: 'GET',
        pattern: '/expenses/subcategories',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const url = new URL(request.url);
            const queryParams = apiContext.parseQuery(url.search);
            const { category } = queryParams;

            try {
                // 同样地，简化数据库查询
                let query = apiContext.supabase
                    .from('expenses')
                    .select('subcategory')
                    .eq('user_id', request.userId);

                // 如果前端提供了 category 参数，则根据该大类进行筛选
                if (category) {
                    query = query.eq('category', category);
                }

                const { data, error } = await query;

                if (error) throw error;

                // 在 JavaScript 中过滤和去重
                const subcategories = [...new Set(data.map(item => item.subcategory).filter(Boolean))].sort();
                
                return new Response(JSON.stringify(subcategories), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err)
            {
                console.error('Error fetching expense subcategories:', err);
                return new Response(JSON.stringify({ message: '获取支出子分类时发生服务器错误', details: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // --- 其他路由 (GET by ID, POST, PUT, DELETE, export, statistics) ---
    // (此处省略您已有的、未作修改的其他路由代码，以保持简洁)
    // ...
    // 请确保将您文件中的其他路由处理器粘贴回此处
    // ...
    // 获取单个费用详情 (GET /api/expenses/:id)
    {
        method: 'GET',
        pattern: '/expenses/:id',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const expenseId = request.params.id;

            try {
                const { data: expense, error } = await apiContext.supabase
                    .from('expenses')
                    .select('*')
                    .eq('id', expenseId)
                    .eq('user_id', userId)
                    .single(); // Expect a single result

                if (error || !expense) {
                    console.error('Error fetching expense details from Supabase:', error);
                    const status = error && error.code === 'PGRST116' ? 404 : 500; // PGRST116: no rows found
                    const message = error && error.code === 'PGRST116' ? 'Expense not found or unauthorized' : 'Server Error fetching expense details';
                    return new Response(JSON.stringify({ message: message, details: error ? error.message : 'Not found.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify(expense), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error fetching expense details (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error fetching expense details' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 新增费用 (POST /api/expenses)
    {
        method: 'POST',
        pattern: '/expenses',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const { description, amount, category, date, subcategory } = await request.json();

            if (!description || !amount || !category || !date || !subcategory) {
                return new Response(JSON.stringify({ message: 'Description, amount, category, subcategory, and date are required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            try {
                const newExpenseData = {
                    user_id: userId,
                    description,
                    amount: parseFloat(amount),
                    category,
                    subcategory,
                    date: new Date(date).toISOString(), // Store as ISO string
                };

                const { data: insertedExpense, error } = await apiContext.supabase
                    .from('expenses')
                    .insert([newExpenseData])
                    .select()
                    .single();

                if (error) {
                    console.error('Error adding expense to Supabase:', error);
                    return new Response(JSON.stringify({ message: 'Server Error adding expense', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: 'Expense added successfully!', expense: insertedExpense }), { status: 201, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error adding expense (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error adding expense' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 更新费用 (PUT /api/expenses/:id)
    {
        method: 'PUT',
        pattern: '/expenses/:id',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const expenseId = request.params.id;
            const { description, amount, category, date, subcategory } = await request.json();

            if (!description || !amount || !category || !date || !subcategory) {
                return new Response(JSON.stringify({ message: 'Description, amount, category, subcategory, and date are required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            try {
                const updateData = {
                    description,
                    amount: parseFloat(amount),
                    category,
                    subcategory,
                    date: new Date(date).toISOString(),
                    updated_at: new Date().toISOString() // Manually update updated_at
                };

                const { data: updatedExpense, error } = await apiContext.supabase
                    .from('expenses')
                    .update(updateData)
                    .eq('id', expenseId)
                    .eq('user_id', userId)
                    .select()
                    .single();

                if (error || !updatedExpense) {
                    console.error('Error updating expense in Supabase:', error);
                    const status = error && error.code === 'PGRST116' ? 404 : 500;
                    const message = error && error.code === 'PGRST116' ? 'Expense not found or unauthorized' : 'Server Error updating expense';
                    return new Response(JSON.stringify({ message: message, details: error ? error.message : 'Not found or unauthorized.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: 'Expense updated successfully!', expense: updatedExpense }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error updating expense (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error updating expense' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 删除费用 (DELETE /api/expenses/:id)
    {
        method: 'DELETE',
        pattern: '/expenses/:id',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const expenseId = request.params.id;

            try {
                // First, check if the expense exists and belongs to the user
                const { data: existingExpense, error: checkError } = await apiContext.supabase
                    .from('expenses')
                    .select('id')
                    .eq('id', expenseId)
                    .eq('user_id', userId)
                    .single();

                if (checkError || !existingExpense) {
                    console.error('Error checking expense existence for deletion:', checkError);
                    const status = checkError && checkError.code === 'PGRST116' ? 404 : 500;
                    const message = checkError && checkError.code === 'PGRST116' ? 'Expense not found or unauthorized' : 'Server Error checking expense';
                    return new Response(JSON.stringify({ message: message, details: checkError ? checkError.message : 'Not found.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }

                // If exists and authorized, proceed with deletion
                const { error: deleteError } = await apiContext.supabase
                    .from('expenses')
                    .delete()
                    .eq('id', expenseId)
                    .eq('user_id', userId);

                if (deleteError) {
                    console.error('Error deleting expense from Supabase:', deleteError);
                    return new Response(JSON.stringify({ message: 'Server Error deleting expense', details: deleteError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: 'Expense deleted successfully!' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error deleting expense (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error deleting expense' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 导出费用数据 (GET /api/expenses/export)
    {
        method: 'GET',
        pattern: '/expenses/export',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const queryParams = apiContext.parseQuery(new URL(request.url).search.substring(1));

            const {
                category,
                minAmount,
                maxAmount,
                startDate,
                endDate
            } = queryParams;

            let query = apiContext.supabase
                .from('expenses')
                .select('*')
                .eq('user_id', userId);

            if (category) {
                query = query.eq('category', category);
            }
            if (minAmount) {
                query = query.gte('amount', parseFloat(minAmount));
            }
            if (maxAmount) {
                query = query.lte('amount', parseFloat(maxAmount));
            }
            if (startDate) {
                query = query.gte('date', new Date(startDate).toISOString());
            }
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setUTCHours(23, 59, 59, 999);
                query = query.lte('date', endOfDay.toISOString());
            }

            query = query.order('date', { ascending: false }).order('created_at', { ascending: false });

            try {
                const { data: expensesToExport, error } = await query;

                if (error) {
                    console.error('Error fetching expenses for export from Supabase:', error);
                    return new Response(JSON.stringify({ message: 'Server Error fetching expenses for export', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                if (!expensesToExport || expensesToExport.length === 0) {
                    return new Response(JSON.stringify({ message: 'No expenses found for export with applied filters.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }
                 // 使用 apiContext.jsonToCsv
                 const fields = [
                    { label: '描述', value: 'description' },
                    { label: '金额', value: 'amount' },
                    { label: '类别', value: 'category' },
                    { label: '子类别', value: 'subcategory' },
                    { label: '日期', value: row => apiContext.formatDate(row.date) },
                    { label: '创建时间', value: row => row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '' },
                    { label: '更新时间', value: row => row.updated_at ? new Date(row.updated_at).toLocaleString('zh-CN') : '' }
                ];

                const csv = apiContext.jsonToCsv(expensesToExport, fields);

                return new Response(csv, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv; charset=utf-8',
                        'Content-Disposition': `attachment; filename=expenses_export_${Date.now()}.csv`,
                    },
                });
            } catch (err) {
                console.error('Error exporting expenses (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error exporting expenses' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 费用统计 (GET /api/expenses/statistics)
    {
        method: 'GET',
        pattern: '/expenses/statistics',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const queryParams = apiContext.parseQuery(new URL(request.url).search.substring(1));
            const { startDate, endDate, category, subcategory, minAmount, maxAmount, period, categoryType, year } = queryParams;

            let query = apiContext.supabase
                .from('expenses')
                .select('amount, category, subcategory, date') // Select fields needed for statistics
                .eq('user_id', userId);

            // Date filtering
            if (startDate) {
                query = query.gte('date', new Date(startDate).toISOString());
            }
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setUTCHours(23, 59, 59, 999);
                query = query.lte('date', endOfDay.toISOString());
            }

            // Category filtering
            if (category) {
                query = query.eq('category', category);
            }
            if (subcategory) {
                query = query.eq('subcategory', subcategory);
            }

            // Amount filtering
            if (minAmount) {
                query = query.gte('amount', parseFloat(minAmount));
            }
            if (maxAmount) {
                query = query.lte('amount', parseFloat(maxAmount));
            }

            // If a specific year is provided for month-based statistics
            if (period === 'month' && year) {
                const startOfYear = new Date(parseInt(year), 0, 1).toISOString();
                const endOfYear = new Date(parseInt(year) + 1, 0, 1).toISOString();
                query = query.gte('date', startOfYear).lt('date', endOfYear);
            }


            try {
                const { data: expenses, error } = await query;

                if (error) {
                    console.error('Error fetching expense data for statistics from Supabase:', error);
                    return new Response(JSON.stringify({ message: 'Server Error fetching expense statistics', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                const statisticsMap = new Map();
                
                if (expenses) {
                    expenses.forEach(expense => {
                        let groupKey;
                        const expenseDate = new Date(expense.date);
                         // Determine the grouping key based on `period` and `categoryType`
                         if (period === 'year' && !categoryType) {
                            groupKey = expenseDate.getFullYear();
                        } else if (period === 'month' && !categoryType) {
                            groupKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
                        } else if (categoryType === 'category' && !period) {
                            groupKey = expense.category;
                        } else if (categoryType === 'subcategory' && !period) {
                            groupKey = expense.subcategory;
                        } else if (categoryType === 'categoryAndSubcategory' && !period) {
                            groupKey = `${expense.category} - ${expense.subcategory}`;
                        } else if (categoryType && period) {
                            // Combined grouping (e.g., by category per year)
                            const timePart = period === 'year' ? expenseDate.getFullYear() : `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
                            if (categoryType === 'category') groupKey = `${expense.category} - ${timePart}`;
                            else if (categoryType === 'subcategory') groupKey = `${expense.subcategory} - ${timePart}`;
                            else if (categoryType === 'categoryAndSubcategory') groupKey = `${expense.category} - ${expense.subcategory} - ${timePart}`;
                            else groupKey = timePart; // fallback to time if categoryType is invalid
                        } else {
                            groupKey = '总计';
                        }


                        if (!statisticsMap.has(groupKey)) {
                            statisticsMap.set(groupKey, 0);
                        }
                        statisticsMap.set(groupKey, statisticsMap.get(groupKey) + expense.amount);
                    });
                }

                let statistics = [];
                if (!period && !categoryType) {
                    const totalOverallAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
                    statistics = [{ _id: '总计', totalAmount: parseFloat(totalOverallAmount.toFixed(2)) }];
                } else {
                    statistics = Array.from(statisticsMap).map(([key, amount]) => ({
                        _id: key,
                        totalAmount: parseFloat(amount.toFixed(2))
                    }));

                    // Sort based on period or amount
                    if (period === 'year' || period === 'month') {
                        statistics.sort((a, b) => String(a._id).localeCompare(String(b._id)));
                    } else if (categoryType) { // sort by amount if grouping by category
                        statistics.sort((a, b) => b.totalAmount - a.totalAmount); 
                    }
                }

                // Get distinct years for year dropdown
                const { data: distinctYearsData } = await apiContext.supabase
                    .from('expenses')
                    .select('date')
                    .eq('user_id', userId)
                    .not('date', 'is', null);

                const distinctYears = distinctYearsData ? [...new Set(distinctYearsData.map(d => new Date(d.date).getFullYear()))].sort((a, b) => a - b) : [];

                // Get distinct categories and subcategories for filters
                const { data: distinctCategoriesData } = await apiContext.supabase
                    .from('expenses')
                    .select('category')
                    .eq('user_id', userId)
                    .not('category', 'is', null)
                    .not('category', 'eq', '');
                const distinctCategories = distinctCategoriesData ? [...new Set(distinctCategoriesData.map(d => d.category))].sort() : [];

                const { data: distinctSubcategoriesData } = await apiContext.supabase
                    .from('expenses')
                    .select('subcategory')
                    .eq('user_id', userId)
                    .not('subcategory', 'is', null)
                    .not('subcategory', 'eq', '');
                const distinctSubcategories = distinctSubcategoriesData ? [...new Set(distinctSubcategoriesData.map(d => d.subcategory))].sort() : [];

                return new Response(JSON.stringify({
                    statistics,
                    distinctCategories,
                    distinctSubcategories,
                    distinctYears,
                    query: queryParams
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error fetching expense statistics (general catch):', err);
                return new Response(JSON.stringify({ message: 'Server Error fetching expense statistics' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    }
];