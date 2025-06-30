// routes/diary-api.js - 重构后的日记 API 路由文件 (Supabase 版本)

// 导出路由数组，供 src/index.js 导入
export const diaryRoutes = [
    // 获取日记列表 (GET /api/diaries)
    {
        method: 'GET',
        pattern: '/diaries',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const queryParams = apiContext.parseQuery(new URL(request.url).search.substring(1));

            const {
                searchTitle,
                searchWeather,
                searchMood,
                searchLocation,
                searchPeople,
                searchTags,
                startDate,
                endDate,
                page = 1,
                limit = 10
            } = queryParams;

            let query = apiContext.supabase
                .from('diaries')
                .select('*', { count: 'exact' }) // 请求数据和总计数
                .eq('user_id', userId); // 强制按用户 ID 过滤

            // 添加模糊搜索条件
            if (searchTitle) {
                // Supabase 不直接支持 $or 包含多个 ilike，需要使用 or() 函数
                // 对于数组字段的模糊搜索，Supabase 默认不能直接进行文本匹配，通常需要先转换为文本再匹配
                // 这里我们假设 title 和 summary 是普通文本，plan_list 和 event_list 是 TEXT[]。
                // 对于 TEXT[] 字段的模糊搜索，需要使用 `cs` (contains string) 或 `like` 与 any 结合。
                // 为了简化，这里对数组字段进行简单的文本匹配（如果前端传的是单个关键词）
                query = query.or(
                    `title.ilike.%${searchTitle}%,summary.ilike.%${searchTitle}%`
                    // For array fields, if you need to search within their elements:
                    // `,plan_list.cs.{%${searchTitle}%},event_list.cs.{%${searchTitle}%}`
                    // Note: `cs` checks if an array contains *all* given elements. For `any` match, it's more complex.
                    // For simpler text search across array elements, it's often easier to fetch and filter in JS
                );
            }
            if (searchWeather) {
                query = query.ilike('weather', `%${searchWeather}%`);
            }
            if (searchMood) {
                query = query.ilike('mood', `%${searchMood}%`);
            }
            if (searchLocation) {
                query = query.ilike('location', `%${searchLocation}%`);
            }
            if (searchPeople) {
                // If people is TEXT[], `cs` is used for "contains string(s)" (all elements specified must be present).
                // For a loose "any element contains substring", you might need a different strategy or fetch and filter in JS.
                // Assuming simple exact match or contained substring for `people` array elements:
                // This is a common pattern for searching within a text array in Supabase/PostgreSQL.
                query = query.filter('people', 'cs', [searchPeople]); // Checks if array contains this exact string
            }
            if (searchTags) {
                query = query.filter('tags', 'cs', [searchTags]); // Checks if array contains this exact string
            }

            if (startDate || endDate) {
                if (startDate) {
                    const start = new Date(startDate);
                    start.setUTCHours(0, 0, 0, 0);
                    query = query.gte('date', start.toISOString());
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setUTCHours(23, 59, 59, 999);
                    query = query.lte('date', end.toISOString());
                }
            }

            try {
                const parsedPage = parseInt(page);
                const parsedLimit = parseInt(limit);
                const startRange = (parsedPage - 1) * parsedLimit;
                const endRange = startRange + parsedLimit - 1;

                const { data: diaries, count: totalCount, error } = await query
                    .order('date', { ascending: false }) // Sort by date descending
                    .order('created_at', { ascending: false }) // Then by creation date descending
                    .range(startRange, endRange);

                if (error) {
                    console.error('Error fetching diary list from Supabase:', error);
                    return new Response(JSON.stringify({ message: '服务器错误，无法获取日记列表。', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                return new Response(JSON.stringify({
                    diaries,
                    currentPage: parsedPage,
                    totalPages: Math.ceil((totalCount || 0) / parsedLimit),
                    limit: parsedLimit,
                    totalCount: totalCount || 0
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error fetching diary list (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法获取日记列表。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 获取单个日记详情 (GET /api/diaries/:id)
    {
        method: 'GET',
        pattern: '/diaries/:id',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const diaryId = request.params.id; // Supabase uses UUID for ID

            try {
                const { data: diary, error } = await apiContext.supabase
                    .from('diaries')
                    .select('*')
                    .eq('id', diaryId)
                    .eq('user_id', userId)
                    .single(); // Expect a single result

                if (error || !diary) {
                    console.error('Error fetching diary details from Supabase:', error);
                    const status = error && error.code === 'PGRST116' ? 404 : 500; // PGRST116: no rows found
                    const message = error && error.code === 'PGRST116' ? '日记未找到或无权限访问。' : '服务器错误，无法获取日记详情。';
                    return new Response(JSON.stringify({ message: message, details: error ? error.message : 'Not found.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify(diary), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error fetching diary details (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法获取日记详情。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 添加日记 (POST /api/diaries)
    {
        method: 'POST',
        pattern: '/diaries',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;

            // Use handleFileUpload to process multipart/form-data
            const { imageUrls, fileData } = await apiContext.handleFileUpload(request, env);

            const { date, title, weather, mood, planList, eventList, feeling, summary, isPublic, location, people, tags } = fileData;

            // Basic validation
            if (!date || !title) {
                return new Response(JSON.stringify({ message: '日期和标题是必填项。' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            try {
                const newDiaryData = {
                    date: new Date(date).toISOString(), // Convert to ISO string for Supabase
                    title: title || '无标题',
                    weather: weather || '',
                    mood: mood || '',
                    location: location || '',
                    people: people ? (Array.isArray(people) ? people : people.split(',').map(p => p.trim())) : [],
                    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
                    plan_list: planList ? (Array.isArray(planList) ? planList : planList.split('\n').map(p => p.trim())) : [], // snake_case
                    event_list: eventList ? (Array.isArray(eventList) ? eventList : eventList.split('\n').map(e => e.trim())) : [], // snake_case
                    feeling: feeling || '',
                    summary: summary || '',
                    image_urls: imageUrls || [], // Use image_urls, assign from R2
                    is_public: isPublic === 'true' || isPublic === true, // snake_case, handle boolean conversion
                    user_id: userId // snake_case
                };

                const { data: insertedDiary, error } = await apiContext.supabase
                    .from('diaries')
                    .insert([newDiaryData])
                    .select() // Return inserted data
                    .single(); // Expect a single inserted row

                if (error) {
                    console.error('Error creating diary entry in Supabase:', error);
                    return new Response(JSON.stringify({ message: '服务器错误，无法新增日记。', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '日记添加成功！', diary: insertedDiary }), { status: 201, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error creating diary entry (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法新增日记。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 更新日记 (PUT /api/diaries/:id)
    {
        method: 'PUT',
        pattern: '/diaries/:id',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const diaryId = request.params.id;

            // Fetch existing diary to get current image_urls and ensure ownership
            const { data: diaryToUpdate, error: fetchError } = await apiContext.supabase
                .from('diaries')
                .select('image_urls')
                .eq('id', diaryId)
                .eq('user_id', userId)
                .single();

            if (fetchError || !diaryToUpdate) {
                console.error('Error fetching diary for update from Supabase:', fetchError);
                const status = fetchError && fetchError.code === 'PGRST116' ? 404 : 500;
                const message = fetchError && fetchError.code === 'PGRST116' ? '日记未找到或无权限。' : '服务器错误，无法获取日记详情以进行更新。';
                return new Response(JSON.stringify({ message: message, details: fetchError ? fetchError.message : 'Not found.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
            }

            const { imageUrls: newImageUrls, fileData } = await apiContext.handleFileUpload(request, env); // Process new image uploads

            const { date, title, weather, mood, planList, eventList, feeling, summary, isPublic, location, people, tags, imagesToDelete: imagesToDeleteJson } = fileData;

            const imagesToDelete = imagesToDeleteJson ? JSON.parse(imagesToDeleteJson) : [];

            // Delete old images from R2 that are marked for deletion
            if (imagesToDelete && imagesToDelete.length > 0) {
                await apiContext.deleteR2Images(imagesToDelete, env);
                // Filter out deleted images from the existing list
                diaryToUpdate.image_urls = (diaryToUpdate.image_urls || []).filter(url => !imagesToDelete.includes(url));
            }

            // Combine existing images (after deletion) and newly uploaded images
            const allImageUrls = [...(diaryToUpdate.image_urls || []), ...(newImageUrls || [])];

            const updateData = {
                date: new Date(date).toISOString(),
                title: title || '无标题',
                weather: weather || '',
                mood: mood || '',
                location: location || '',
                people: people ? (Array.isArray(people) ? people : people.split(',').map(p => p.trim())) : [],
                tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
                plan_list: planList ? (Array.isArray(planList) ? planList : planList.split('\n').map(p => p.trim())) : [],
                event_list: eventList ? (Array.isArray(eventList) ? eventList : eventList.split('\n').map(e => e.trim())) : [],
                feeling: feeling || '',
                summary: summary || '',
                image_urls: allImageUrls, // Assign the combined array
                is_public: isPublic === 'true' || isPublic === true,
                updated_at: new Date().toISOString() // Manually update updated_at if not automatically handled by Supabase trigger
            };

            try {
                const { data: updatedDiary, error } = await apiContext.supabase
                    .from('diaries')
                    .update(updateData)
                    .eq('id', diaryId)
                    .eq('user_id', userId) // Ensure user can only update their own diary
                    .select() // Return updated data
                    .single(); // Expect a single updated row

                if (error || !updatedDiary) {
                    console.error('Error updating diary in Supabase:', error);
                    const status = error && error.code === 'PGRST116' ? 404 : 500;
                    const message = error && error.code === 'PGRST116' ? '日记未找到或无权限更新。' : '服务器错误，无法更新日记。';
                    return new Response(JSON.stringify({ message: message, details: error ? error.message : 'Not found or unauthorized.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ message: '日记更新成功！', diary: updatedDiary }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error updating diary (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法更新日记。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 删除日记 (DELETE /api/diaries/:id)
    {
        method: 'DELETE',
        pattern: '/diaries/:id',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const diaryId = request.params.id;

            try {
                // Fetch the diary to get image_urls for R2 deletion and ensure ownership
                const { data: diaryToDelete, error: fetchError } = await apiContext.supabase
                    .from('diaries')
                    .select('image_urls')
                    .eq('id', diaryId)
                    .eq('user_id', userId)
                    .single();

                if (fetchError || !diaryToDelete) {
                    console.error('Error fetching diary for deletion from Supabase:', fetchError);
                    const status = fetchError && fetchError.code === 'PGRST116' ? 404 : 500;
                    const message = fetchError && fetchError.code === 'PGRST116' ? '日记未找到或无权限删除。' : '服务器错误，无法检查日记。';
                    return new Response(JSON.stringify({ message: message, details: fetchError ? fetchError.message : 'Not found.' }), { status: status, headers: { 'Content-Type': 'application/json' } });
                }

                // Delete associated images from R2
                if (diaryToDelete.image_urls && diaryToDelete.image_urls.length > 0) {
                    await apiContext.deleteR2Images(diaryToDelete.image_urls, env);
                }

                // Delete the diary entry from Supabase
                const { error: deleteError } = await apiContext.supabase
                    .from('diaries')
                    .delete()
                    .eq('id', diaryId)
                    .eq('user_id', userId);

                if (deleteError) {
                    console.error('Error deleting diary from Supabase:', deleteError);
                    return new Response(JSON.stringify({ message: '服务器错误，无法删除日记。', details: deleteError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                return new Response(JSON.stringify({ message: '日记删除成功！' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                console.error('Error deleting diary (general catch):', err);
                return new Response(JSON.stringify({ message: '服务器错误，无法删除日记。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },

    // 日记统计 (GET /api/diaries/statistics)
    {
        method: 'GET',
        pattern: '/diaries/statistics',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const queryParams = apiContext.parseQuery(new URL(request.url).search.substring(1));
            const { startDate, endDate, mood, weather, location, tags, period, publicOnly } = queryParams;

            let query = apiContext.supabase
                .from('diaries')
                .select('date, mood, weather, location, tags') // Select all fields needed for in-memory aggregation
                .eq('user_id', userId);

            // Time period filter
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                query = query.gte('date', start.toISOString()).lte('date', end.toISOString());
            }

            // Mood filter
            if (mood && mood !== '') {
                query = query.eq('mood', mood);
            }

            // Weather filter
            if (weather && weather !== '') {
                query = query.eq('weather', weather);
            }

            // Location filter (exact match)
            if (location && location !== '') {
                query = query.eq('location', location);
            }

            // Tags filter (at least one specified tag is present in the array)
            if (tags) {
                const tagsArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                if (tagsArray.length > 0) {
                    // This checks if the tags array in the DB *contains* any of the specified tags.
                    // Supabase's `ov` (overlaps) operator is suitable for "at least one match".
                    query = query.filter('tags', 'ov', `{${tagsArray.join(',')}}`);
                }
            }

            // Public/Private filter
            if (publicOnly === 'true' || publicOnly === true) {
                query = query.eq('is_public', true);
            }

            try {
                const { data: diaries, error } = await query;

                if (error) {
                    console.error('Error fetching diary data for statistics from Supabase:', error);
                    return new Response(JSON.stringify({ message: '服务器错误，无法获取日记统计数据。', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                // Perform in-memory aggregation
                const statisticsMap = new Map();

                if (diaries) {
                    diaries.forEach(diary => {
                        let groupKey;
                        const dateObj = new Date(diary.date);

                        switch (period) {
                            case 'year':
                                groupKey = dateObj.getFullYear();
                                break;
                            case 'month':
                                groupKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
                                break;
                            case 'day':
                                groupKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
                                break;
                            default:
                                groupKey = 'overall'; // Default for overall statistics
                                break;
                        }

                        if (!statisticsMap.has(groupKey)) {
                            statisticsMap.set(groupKey, {
                                totalDiaries: 0,
                                moods: {},
                                weathers: {},
                                locations: {},
                                tags: {}
                            });
                        }
                        const currentStats = statisticsMap.get(groupKey);
                        currentStats.totalDiaries += 1;

                        // Count mood
                        const moodVal = diary.mood || '';
                        if (moodVal !== '') {
                            currentStats.moods[moodVal] = (currentStats.moods[moodVal] || 0) + 1;
                        }

                        // Count weather
                        const weatherVal = diary.weather || '';
                        if (weatherVal !== '') {
                            currentStats.weathers[weatherVal] = (currentStats.weathers[weatherVal] || 0) + 1;
                        }

                        // Count location
                        const locationVal = diary.location || '';
                        if (locationVal !== '') {
                            currentStats.locations[locationVal] = (currentStats.locations[locationVal] || 0) + 1;
                        }

                        // Count tags (assuming tags is an array)
                        (diary.tags || []).forEach(tag => {
                            if (tag !== '') {
                                currentStats.tags[tag] = (currentStats.tags[tag] || 0) + 1;
                            }
                        });
                    });
                }

                // Format statistics for response
                let formattedStatistics = Array.from(statisticsMap).map(([key, stats]) => {
                    return {
                        _id: key,
                        totalDiaries: stats.totalDiaries,
                        moodDistribution: Object.entries(stats.moods).map(([mood, count]) => ({ mood, count })),
                        weatherDistribution: Object.entries(stats.weathers).map(([weather, count]) => ({ weather, count })),
                        locationDistribution: Object.entries(stats.locations).map(([location, count]) => ({ location, count })),
                        tagDistribution: Object.entries(stats.tags).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count)
                    };
                });

                // Sort by key (especially important for time periods)
                if (period === 'year' || period === 'month' || period === 'day') {
                    formattedStatistics.sort((a, b) => String(a._id).localeCompare(String(b._id)));
                }

                // Get all distinct moods, weathers, locations, and tags for filters
                const { data: allMoodsData } = await apiContext.supabase.from('diaries').select('mood').eq('user_id', userId).not('mood', 'is', null).not('mood', 'eq', '');
                const allMoods = allMoodsData ? [...new Set(allMoodsData.map(d => d.mood))].sort() : [];

                const { data: allWeathersData } = await apiContext.supabase.from('diaries').select('weather').eq('user_id', userId).not('weather', 'is', null).not('weather', 'eq', '');
                const allWeathers = allWeathersData ? [...new Set(allWeathersData.map(d => d.weather))].sort() : [];

                const { data: allLocationsData } = await apiContext.supabase.from('diaries').select('location').eq('user_id', userId).not('location', 'is', null).not('location', 'eq', '');
                const allLocations = allLocationsData ? [...new Set(allLocationsData.map(d => d.location))].sort() : [];

                const { data: allTagsData } = await apiContext.supabase.from('diaries').select('tags').eq('user_id', userId);
                let allTags = [];
                if (allTagsData) {
                    const flattenedTags = allTagsData.flatMap(d => d.tags || []);
                    allTags = [...new Set(flattenedTags)].filter(t => t !== null && t !== '').sort();
                }

                return new Response(JSON.stringify({
                    statistics: formattedStatistics,
                    startDate: startDate || '',
                    endDate: endDate || '',
                    mood: mood || '',
                    weather: weather || '',
                    location: location || '',
                    tags: tags || '',
                    period: period || '',
                    publicOnly: publicOnly === 'true' || publicOnly === true,
                    allMoods,
                    allWeathers,
                    allLocations,
                    allTags,
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });

            } catch (err) {
                console.error("Error fetching diary statistics (general catch):", err);
                return new Response(JSON.stringify({ message: '服务器错误，无法获取日记统计数据。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },
    // 导出日记到 CSV
    {
        method: 'GET',
        pattern: '/diaries/export',
        handler: async (request, env, apiContext) => {
            const authCheck = await apiContext.requireLogin(request, env);
            if (authCheck) return authCheck;

            const userId = request.userId;
            const queryParams = apiContext.parseQuery(new URL(request.url).search.substring(1));

            // Reuse filter logic from /api/diaries for consistency
            const {
                searchTitle,
                searchWeather,
                searchMood,
                searchLocation,
                searchPeople,
                searchTags,
                startDate,
                endDate
            } = queryParams;

            let query = apiContext.supabase
                .from('diaries')
                .select('*')
                .eq('user_id', userId);

            if (searchTitle) {
                query = query.or(`title.ilike.%${searchTitle}%,summary.ilike.%${searchTitle}%`);
            }
            if (searchWeather) {
                query = query.ilike('weather', `%${searchWeather}%`);
            }
            if (searchMood) {
                query = query.ilike('mood', `%${searchMood}%`);
            }
            if (searchLocation) {
                query = query.ilike('location', `%${searchLocation}%`);
            }
            if (searchPeople) {
                query = query.filter('people', 'cs', [searchPeople]);
            }
            if (searchTags) {
                query = query.filter('tags', 'cs', [searchTags]);
            }

            if (startDate || endDate) {
                if (startDate) {
                    const start = new Date(startDate);
                    start.setUTCHours(0, 0, 0, 0);
                    query = query.gte('date', start.toISOString());
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setUTCHours(23, 59, 59, 999);
                    query = query.lte('date', end.toISOString());
                }
            }

            query = query.order('date', { ascending: false }).order('created_at', { ascending: false });

            try {
                const { data: diariesToExport, error } = await query;

                if (error) {
                    console.error('Error fetching diaries for export from Supabase:', error);
                    return new Response(JSON.stringify({ message: '服务器错误，无法导出日记数据。', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                if (!diariesToExport || diariesToExport.length === 0) {
                    return new Response(JSON.stringify({ message: '没有找到符合条件的日记可供导出。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }

                const fields = [
                    { label: '日期', value: row => apiContext.formatDate(row.date) },
                    { label: '标题', value: 'title' },
                    { label: '天气', value: 'weather' },
                    { label: '心情', value: 'mood' },
                    { label: '地点', value: 'location' },
                    { label: '相关人物', value: row => row.people ? row.people.join(', ') : '' },
                    { label: '标签', value: row => row.tags ? row.tags.join(', ') : '' },
                    { label: '计划列表', value: row => row.plan_list ? row.plan_list.join('\n') : '' }, // snake_case
                    { label: '事件列表', value: row => row.event_list ? row.event_list.join('\n') : '' }, // snake_case
                    { label: '感受', value: 'feeling' },
                    { label: '总结', value: 'summary' },
                    { label: '图片链接', value: row => row.image_urls ? row.image_urls.join('\n') : '' }, // snake_case
                    { label: '是否公开', value: row => row.is_public ? '是' : '否' }, // snake_case
                    { label: '创建时间', value: row => row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '' }, // snake_case
                    { label: '更新时间', value: row => row.updated_at ? new Date(row.updated_at).toLocaleString('zh-CN') : '' } // snake_case
                ];

                const json2csvParser = new apiContext.Json2csvParser({ fields });
                const csv = json2csvParser.parse(diariesToExport);

                return new Response(csv, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv; charset=utf-8',
                        'Content-Disposition': `attachment; filename=diaries_export_${Date.now()}.csv`,
                    },
                });

            } catch (err) {
                console.error("Error exporting diaries (general catch):", err);
                return new Response(JSON.stringify({ message: '服务器错误，无法导出日记。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
    },
];
