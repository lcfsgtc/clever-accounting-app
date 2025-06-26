// models/BookNote.js - 重构后的 BookNote 模型文件

import mongoose from 'mongoose'; // 使用 ES 模块导入
import mongoosePaginate from 'mongoose-paginate-v2'; // 使用 ES 模块导入

const bookNoteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        trim: true,
        default: '未知'
    },
    publishYear: {
        type: Number,
        min: 1000,
        max: 9999,
        required: false // 出版年份可以为空
    },
    category: { // 图书大类，例如：小说、历史、技术
        type: String,
        trim: true,
        default: '未分类'
    },
    tags: [String], // 标签，方便分类和查询
    readDate: {
        type: Date,
        default: Date.now // 默认为当前日期
    },
    rating: { // 评分，例如1-5星
        type: Number,
        min: 1,
        max: 5,
        required: false
    },
    notes: { // 笔记内容
        type: String,
        required: true
    }
}, { timestamps: true }); // 添加 timestamps 选项以自动管理 createdAt 和 updatedAt 字段

// 移除手动更新 updatedAt 的 pre-save 钩子，因为 timestamps: true 会自动处理
// bookNoteSchema.pre('save', function(next) {
//     this.updatedAt = Date.now();
//     next();
// });

bookNoteSchema.plugin(mongoosePaginate);

export default mongoose.model('BookNote', bookNoteSchema); // 使用 ES 模块导出
