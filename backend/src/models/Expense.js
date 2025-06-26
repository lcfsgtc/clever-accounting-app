// models/Expense.js - 修正后的 Expense 模型文件

import mongoose from 'mongoose'; // 使用 ES 模块导入
import mongoosePaginate from 'mongoose-paginate-v2'; // 使用 ES 模块导入
// const Schema = mongoose.Schema; // Schema 可以在 mongoose 对象中直接访问，无需单独导入

const expenseSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: {
        type: String,
        required: true,
        // 添加 enum 属性，限制 category 只能是这些值
        enum: ['衣', '食', '住', '行', '医', '娱', '人情', '其他']
    },
    subcategory: { type: String, required: true }, // 恢复为 required: true
    date: { type: Date, required: true, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true }); // 添加 timestamps 选项以自动管理 createdAt 和 updatedAt 字段

// 移除手动更新 updatedAt 的 pre-save 钩子，因为 timestamps: true 会自动处理
// expenseSchema.pre('save', function(next) {
//     this.updatedAt = Date.now();
//     next();
// });

expenseSchema.plugin(mongoosePaginate);

export default mongoose.model('Expense', expenseSchema); // 使用 ES 模块导出
