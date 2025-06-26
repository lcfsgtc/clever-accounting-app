// models/User.js - 重构后的 User 模型文件

import mongoose from 'mongoose'; // 使用 ES 模块导入
// const Schema = mongoose.Schema; // Schema 可以在 mongoose 对象中直接访问，无需单独导入

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { // Add this new field
        type: String,
        required: true,
        unique: true, // Email should also be unique
        lowercase: true, // Store email in lowercase for consistency
        trim: true, // Remove whitespace from both ends
        match: [/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/, 'Please enter a valid email address'] // Basic email regex validation
    },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    registrationDate: { type: Date, default: Date.now }
}, { timestamps: true }); // 添加 timestamps 选项以自动管理 createdAt 和 updatedAt 字段

export default mongoose.model('User', userSchema); // 使用 ES 模块导出
