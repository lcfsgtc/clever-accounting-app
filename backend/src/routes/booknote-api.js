// routes/booknote-api.js - 重构后的读书笔记 API 路由文件 (Supabase 版本)

// 导出路由数组，供 src/index.js 导入
export const booknoteRoutes = [
    // 获取读书笔记列表 (GET /api/booknotes)
    {
        method: 'GET',
        pattern: '/booknotes',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const queryParams = apiContext.parseQuery(new URL(request.url).search.substring(1));

            const {
                searchTitle,
                searchAuthor,
                searchCategory,
                minRating,
                page = 1,
                limit = 10
            } = queryParams;

            let query = apiContext.supabase
                .from('booknotes')
                .select('*', { count: 'exact' }) // 请求数据和总计数
                .eq('user_id', userId); // 强制按用户 ID 过滤

            // 构建筛选条件
            if (searchTitle) {
                // Supabase 不直接支持 $or 包含多个 ilike，需要使用 or() 函数
                query = query.or(`title.ilike.%${searchTitle}%,notes.ilike.%${searchTitle}%`);
            }
            if (searchAuthor) {
                query = query.ilike('author', `%${searchAuthor}%`);
            }
            if (searchCategory) {
                query = query.ilike('category', `%${searchCategory}%`);
            }
            if (minRating) {
                query = query.gte('rating', parseInt(minRating));
            }

            // 分页
            const parsedPage = parseInt(page);
            const parsedLimit = parseInt(limit);
            const startRange = (parsedPage - 1) * parsedLimit;
            const endRange = startRange + parsedLimit - 1;
            query = query.range(startRange, endRange);

            // 排序
            query = query.order('read_date', { ascending: false }).order('created_at', { ascending: false });

            try {
                const { data: bookNotes, count: totalCount, error } = await query;

                if (error) {
                    console.error('Error fetching book notes from Supabase:', error);
                    return new Response(JSON.stringify({ message: '服务器错误，无法获取读书笔记。', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                return new Response(JSON.stringify({
                    bookNotes,
                    currentPage: parsedPage,
                    totalPages: Math.ceil((totalCount || 0) / parsedLimit),
                    limit: parsedLimit,
                    totalCount: totalCount || 0
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error fetching book notes (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法获取读书笔记。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 新增读书笔记 (POST /api/booknotes)
    {
        method: 'POST',
        pattern: '/booknotes',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const { title, author, publishYear, category, tags, readDate, rating, notes } = await request.json();

            // 基础验证
            if (!title || !notes) {
                return new Response(JSON.stringify({ message: '标题和笔记内容是必填项。' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            // 将 tags 字符串转换为数组
            const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];

            try {
                const newBookNoteData = {
                    user_id: userId, // Supabase 字段名
                    title,
                    author: author || '未知',
                    publish_year: publishYear ? parseInt(publishYear) : null, // Supabase 字段名，使用 null 而非 undefined
                    category: category || '未分类',
                    tags: tagsArray, // 存储为数组
                    read_date: readDate ? new Date(readDate).toISOString() : new Date().toISOString(), // 存储为 ISO 字符串
                    rating: rating ? parseInt(rating) : null,
                    notes
                };

                const { data: insertedBookNote, error } = await apiContext.supabase
                    .from('booknotes')
                    .insert([newBookNoteData])
                    .select() // 返回插入的数据
                    .single(); // 期望只插入一条数据

                if (error) {
                    console.error('Error adding book note to Supabase:', error);
                    return new Response(JSON.stringify({ message: '服务器错误，无法新增读书笔记。', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '读书笔记添加成功！', bookNote: insertedBookNote }), { status: 201, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error adding book note (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法新增读书笔记。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 获取单个读书笔记详情 (GET /api/booknotes/:id)
    {
        method: 'GET',
        pattern: '/booknotes/:id',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const bookNoteId = request.params.id; // Supabase 通常使用 UUID 作为 ID

            try {
                const { data: bookNote, error } = await apiContext.supabase
                    .from('booknotes')
                    .select('*')
                    .eq('id', bookNoteId)
                    .eq('user_id', userId)
                    .single(); // 期望只返回一个结果

                if (error || !bookNote) {
                    console.error('Error fetching book note details from Supabase:', error);
                    const status = error && error.code === 'PGRST116' ? 404 : 500; // PGRST116: no rows found
                    const message = error && error.code === 'PGRST116' ? '未找到该读书笔记或无权限访问。' : '服务器错误，无法获取读书笔记详情。';
                    return new Response(JSON.stringify({ message: message, details: error ? error.message : 'Not found.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify(bookNote), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error fetching book note for edit (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法获取读书笔记。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 更新读书笔记 (PUT /api/booknotes/:id)
    {
        method: 'PUT',
        pattern: '/booknotes/:id',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const bookNoteId = request.params.id;
            const { title, author, publishYear, category, tags, readDate, rating, notes } = await request.json();

            // 基础验证
            if (!title || !notes) {
                return new Response(JSON.stringify({ message: '标题和笔记内容是必填项。' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];

            try {
                const updateData = {
                    title,
                    author: author || '未知',
                    publish_year: publishYear ? parseInt(publishYear) : null,
                    category: category || '未分类',
                    tags: tagsArray,
                    rating: rating ? parseInt(rating) : null,
                    notes,
                    updated_at: new Date().toISOString() // 手动更新 updated_at
                };
                if (readDate) { // 只有在有值时才更新 read_date
                    updateData.read_date = new Date(readDate).toISOString();
                }

                const { data: updatedNote, error } = await apiContext.supabase
                    .from('booknotes')
                    .update(updateData)
                    .eq('id', bookNoteId)
                    .eq('user_id', userId) // 确保用户只能更新自己的笔记
                    .select() // 返回更新后的数据
                    .single(); // 期望只更新一条数据

                if (error || !updatedNote) {
                    console.error('Error updating book note in Supabase:', error);
                    const status = error && error.code === 'PGRST116' ? 404 : 500;
                    const message = error && error.code === 'PGRST116' ? '未找到该读书笔记或无权限更新。' : '服务器错误，无法更新读书笔记。';
                    return new Response(JSON.stringify({ message: message, details: error ? error.message : 'Not found or unauthorized.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '读书笔记更新成功！', bookNote: updatedNote }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error updating book note (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法更新读书笔记。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 删除读书笔记 (DELETE /api/booknotes/:id)
    {
        method: 'DELETE',
        pattern: '/booknotes/:id',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const bookNoteId = request.params.id;

            try {
                // 先检查是否存在且属于当前用户
                const { data: existingNote, error: checkError } = await apiContext.supabase
                    .from('booknotes')
                    .select('id')
                    .eq('id', bookNoteId)
                    .eq('user_id', userId)
                    .single();

                if (checkError || !existingNote) {
                    console.error('Error checking book note existence for deletion:', checkError);
                    const status = checkError && checkError.code === 'PGRST116' ? 404 : 500;
                    const message = checkError && checkError.code === 'PGRST116' ? '未找到该读书笔记或无权限删除。' : '服务器错误，无法检查读书笔记。';
                    return new Response(JSON.stringify({ message: message, details: checkError ? checkError.message : 'Not found.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }

                // 执行删除操作
                const { error: deleteError } = await apiContext.supabase
                    .from('booknotes')
                    .delete()
                    .eq('id', bookNoteId)
                    .eq('user_id', userId);

                if (deleteError) {
                    console.error('Error deleting book note from Supabase:', deleteError);
                    return new Response(JSON.stringify({ message: '服务器错误，无法删除读书笔记。', details: deleteError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '读书笔记删除成功！' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error deleting book note (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法删除读书笔记。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 读书笔记统计 (GET /api/booknotes/statistics)
    {
        method: 'GET',
        pattern: '/booknotes/statistics',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const queryParams = apiContext.parseQuery(new URL(request.url).search.substring(1));
            const { startDate, endDate, groupByField = 'category' } = queryParams;

            let query = apiContext.supabase
                .from('booknotes')
                .select('read_date, author, category, publish_year, rating') // 选择所有可能用于分组和统计的字段
                .eq('user_id', userId);

            if (startDate) {
                query = query.gte('read_date', startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                query = query.lte('read_date', end.toISOString());
            }

            try {
                const { data: bookNotes, error } = await query;

                if (error) {
                    console.error('Error fetching book notes for statistics from Supabase:', error);
                    return new Response(JSON.stringify({ message: '服务器错误，无法获取读书笔记统计数据。', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                // 在 Worker 端进行内存中的聚合
                const statisticsMap = new Map();
                if (bookNotes) {
                    bookNotes.forEach(note => {
                        let groupKey;
                        let rating = note.rating || 0; // 默认评分为0

                        switch (groupByField) {
                            case 'author':
                                groupKey = note.author || '未知作者';
                                break;
                            case 'category':
                                groupKey = note.category || '未分类';
                                break;
                            case 'publishYear':
                                groupKey = note.publish_year ? String(note.publish_year) : '未知年份';
                                break;
                            case 'rating':
                                groupKey = String(rating); // 将评分作为字符串键
                                break;
                            case 'readYear':
                                groupKey = note.read_date ? new Date(note.read_date).getFullYear().toString() : '未知年份';
                                break;
                            case 'readMonth':
                                groupKey = note.read_date ? `${new Date(note.read_date).getFullYear()}-${(new Date(note.read_date).getMonth() + 1).toString().padStart(2, '0')}` : '未知日期';
                                break;
                            default: // 默认按 category 分组
                                groupKey = note.category || '未分类';
                                break;
                        }

                        if (!statisticsMap.has(groupKey)) {
                            statisticsMap.set(groupKey, { count: 0, totalRating: 0 });
                        }
                        const currentStats = statisticsMap.get(groupKey);
                        currentStats.count += 1;
                        currentStats.totalRating += rating;
                    });
                }

                // 格式化统计结果并排序
                let statistics = Array.from(statisticsMap).map(([key, stats]) => ({
                    _id: key,
                    count: stats.count,
                    avgRating: stats.count > 0 ? parseFloat((stats.totalRating / stats.count).toFixed(2)) : 0
                }));

                // 根据 groupByField 重新排序，特别是对于日期
                if (groupByField === 'readYear' || groupByField === 'publishYear') {
                    statistics.sort((a, b) => parseInt(a._id) - parseInt(b._id));
                } else if (groupByField === 'readMonth') {
                    statistics.sort((a, b) => {
                        const [yearA, monthA] = a._id.split('-').map(Number);
                        const [yearB, monthB] = b._id.split('-').map(Number);
                        if (yearA !== yearB) return yearA - yearB;
                        return monthA - monthB;
                    });
                } else {
                    statistics.sort((a, b) => String(a._id).localeCompare(String(b._id)));
                }


                // 获取所有不重复的作者、类别、年份、标签
                const { data: distinctAuthorsData } = await apiContext.supabase.from('booknotes').select('author').eq('user_id', userId).not('author', 'is', null).not('author', 'eq', '');
                const distinctAuthors = distinctAuthorsData ? [...new Set(distinctAuthorsData.map(d => d.author))].sort() : [];

                const { data: distinctCategoriesData } = await apiContext.supabase.from('booknotes').select('category').eq('user_id', userId).not('category', 'is', null).not('category', 'eq', '');
                const distinctCategories = distinctCategoriesData ? [...new Set(distinctCategoriesData.map(d => d.category))].sort() : [];

                const { data: distinctPublishYearsData } = await apiContext.supabase.from('booknotes').select('publish_year').eq('user_id', userId).not('publish_year', 'is', null);
                const distinctPublishYears = distinctPublishYearsData ? [...new Set(distinctPublishYearsData.map(d => d.publish_year))].sort((a, b) => a - b) : [];

                // 标签需要特殊处理，因为它是数组
                const { data: allTagsData } = await apiContext.supabase.from('booknotes').select('tags').eq('user_id', userId);
                let distinctTags = [];
                if (allTagsData) {
                    const allTags = allTagsData.flatMap(note => note.tags || []);
                    distinctTags = [...new Set(allTags)].filter(tag => tag !== null && tag !== '').sort();
                }

                return new Response(JSON.stringify({
                    statistics,
                    startDate: startDate || '',
                    endDate: endDate || '',
                    groupByField,
                    distinctAuthors,
                    distinctCategories,
                    distinctPublishYears,
                    distinctTags,
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error generating book notes statistics (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法生成读书笔记统计数据。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 导出读书笔记 (GET /api/booknotes/export)
    {
        method: 'GET',
        pattern: '/booknotes/export',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const queryParams = apiContext.parseQuery(new URL(request.url).search.substring(1));

            let query = apiContext.supabase
                .from('booknotes')
                .select('*')
                .eq('user_id', userId);

            // Apply filters from queryParams (similar to list endpoint if needed for export filters)
            const {
                searchTitle,
                searchAuthor,
                searchCategory,
                minRating,
                startDate,
                endDate
            } = queryParams;

            if (searchTitle) {
                query = query.or(`title.ilike.%${searchTitle}%,notes.ilike.%${searchTitle}%`);
            }
            if (searchAuthor) {
                query = query.ilike('author', `%${searchAuthor}%`);
            }
            if (searchCategory) {
                query = query.ilike('category', `%${searchCategory}%`);
            }
            if (minRating) {
                query = query.gte('rating', parseInt(minRating));
            }
            if (startDate) {
                query = query.gte('read_date', startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                query = query.lte('read_date', end.toISOString());
            }

            query = query.order('read_date', { ascending: false }).order('created_at', { ascending: false });

            try {
                const { data: bookNotesToExport, error } = await query;

                if (error) {
                    console.error('Error fetching book notes for export from Supabase:', error);
                    return new Response(JSON.stringify({ message: '服务器错误，无法导出读书笔记数据。', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                if (!bookNotesToExport || bookNotesToExport.length === 0) {
                    return new Response(JSON.stringify({ message: '没有找到符合条件的读书笔记可供导出。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }

                // Define fields for CSV, mapping Supabase snake_case to display labels
                const fields = [
                    { label: '书名', value: 'title' },
                    { label: '作者', value: 'author' },
                    { label: '出版年份', value: 'publish_year' }, // Supabase 字段名
                    { label: '类别', value: 'category' },
                    { label: '标签', value: row => row.tags ? row.tags.join(', ') : '' },
                    { label: '阅读日期', value: row => row.read_date ? apiContext.formatDate(row.read_date) : '' }, // Supabase 字段名
                    { label: '评分', value: 'rating' },
                    { label: '笔记内容', value: 'notes' },
                    { label: '创建时间', value: row => row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '' }, // Supabase 字段名
                    { label: '更新时间', value: row => row.updated_at ? new Date(row.updated_at).toLocaleString('zh-CN') : '' } // Supabase 字段名
                ];

                const json2csvParser = new apiContext.Json2csvParser({ fields });
                const csv = json2csvParser.parse(bookNotesToExport);

                return new Response(csv, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv; charset=utf-8',
                        'Content-Disposition': `attachment; filename=booknotes_export_${Date.now()}.csv`,
                    },
                });

            } catch (err) {
                console.error('Error exporting book notes (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法导出读书笔记。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },
];
