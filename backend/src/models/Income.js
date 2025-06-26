// models/Income.js - 重构后的 Income 模型文件

import mongoose from 'mongoose'; // 使用 ES 模块导入
// const Schema = mongoose.Schema; // Schema 可以在 mongoose 对象中直接访问，无需单独导入

const incomeSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    subcategory: { type: String, required: false }, // subcategory 可以是非必需的，与 Expense 模型保持一致
    date: { type: Date, required: true, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true }); // 添加 timestamps 选项以自动管理 createdAt 和 updatedAt 字段

export default mongoose.model('Income', incomeSchema); // 使用 ES 模块导出
