// models/Asset.js - 重构后的 Asset 模型文件

import mongoose from 'mongoose'; // 使用 ES 模块导入

const assetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    cost: {
        type: Number,
        required: true
    },
    currentValue: { // 资产现值
        type: Number,
        required: true,
        default: 0 // 默认为0
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    condition: { // 资产状况
        type: String,
        enum: ['全新', '良好', '一般', '较差', '报废'], // 可选值
        default: '良好'
    },
    depreciationMethod: { // 折旧方法
        type: String,
        enum: ['直线折旧', '余额递减'],  // 可以添加更多折旧方法
        default: '直线折旧'
    },
    depreciationRate: { // 折旧率
        type: Number,
        default: 0
    },
    notes: {
        type: String
    },
    userId: {  // 更改为 userId 以与 JWT 中的 userId 字段匹配，并与模型命名约定保持一致
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // 引用 User 模型
        required: true
    }
}, { timestamps: true }); // 添加 timestamps 选项以自动管理 createdAt 和 updatedAt 字段

export default mongoose.model('Asset', assetSchema); // 使用 ES 模块导出
