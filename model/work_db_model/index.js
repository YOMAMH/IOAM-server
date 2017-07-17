/**
 * Created by renminghe on 2017/7/7.
 */
const Sequelize = require("../../global/sequelize");
const sequelize = require("sequelize");
const co = require('co');
const fileFormate = require('../../global/fileFormate');
const WorkOrderLog = require('../../global/Log');
'use strict';

// 数据库信息
function selectTable() {
    let DbInfo = Sequelize.define('schema', {
        id: {    // 唯一id 主键 string
            type: sequelize.INTEGER,
            primaryKey: true
        },
        name: sequelize.STRING,    // 数据库名
        comment: sequelize.STRING,    // 备注名
        create_timestamp: sequelize.STRING,    // 创建时间
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    
    return DbInfo;
}

// 数据库工单信息
function selectSchemaTable() {
    let SchemaInfo = Sequelize.define('work_order_schema', {
        id: {    // 唯一id 主键 string
            type: sequelize.INTEGER,
            primaryKey: true
        },
        schema_name: sequelize.STRING,    // 数据库名
        update_target: sequelize.STRING,    // 升级目标
        update_type: sequelize.STRING,    // 升级类型
        update_note: sequelize.STRING,    // 操作备注
        update_step: sequelize.STRING,    // 操作步骤
        sql_file: sequelize.STRING,    // sql文件存放位置
        send_user: sequelize.STRING,   // 工单提交者
        accept_user: sequelize.STRING,   // 工单处理者
        accept_user_last: sequelize.STRING,    // 最终处理人
        work_order_timeline: sequelize.STRING,    // 工单的操作历史记录
        order_type: sequelize.STRING,    // 工单处理状态
        reason: sequelize.STRING,    // 处理结果原因
        create_time: sequelize.STRING,    // 工单创建时间
        handle_time: sequelize.STRING,    // 工单处理时间
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    
    return SchemaInfo;
}

module.exports = {
    
    // 数据库列表
    orderDbListInfo: () => {
        let DbInfo = selectTable();
        return DbInfo.findAll({where: {}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 创建数据库变更工单
    createDbOrder: (arg) => {
        let SchemaInfo = selectSchemaTable();
        let body = arg.body;
        let file_path = "";
        if (arg.hasOwnProperty("files")) {
            file_path = fileFormate.renameFile(arg.files);
        }
        let order = {
            schema_name: body.schema_name,
            update_target: body.update_target,
            update_type: body.update_type,
            update_note: body.update_note,
            update_step: body.update_step,
            send_user: body.send_user,
            accept_user: body.accept_user,
            accept_user_last: body.accept_user_last,
            order_type: body.order_type,
            work_order_timeline: WorkOrderLog.workOrderLog("创建", body.send_user, body.accept_user),
            sql_file: file_path.sql_file ? file_path.sql_file : "",
        };
        
        return SchemaInfo.create(order).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 数据库工单数据
    workOrderDBInfo: (arg) => {
        let index = parseInt(arg.index);
        let SchemaInfo = selectSchemaTable();
        let argObj = {};
        if (arg.hasOwnProperty('user')) argObj = {send_user: arg.user};
        return SchemaInfo.findAll({
            where: argObj,
            limit: 10,
            offset: index,
            order: "id DESC",
        }).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 查找文件存储位置
    searchDonwloadFiles: (arg) => {
        
        let SchemaInfo = selectSchemaTable();
        return SchemaInfo.findOne({where: {id: arg}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        });
    },
    
    // 获取数据库工单数量
    workOrderDBInfoCount: (arg) => {
        let SchemaInfo = selectSchemaTable();
        let argObj = {};
        if (arg.hasOwnProperty('user')) argObj = {send_user: arg.user};
        return SchemaInfo.count({
            where: argObj
        }).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 处理数据库工单
    updateDbOrder: (arg) => {
        let SchemaInfo = selectSchemaTable();
        return SchemaInfo.findOne({where: {id: arg.id}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            let timeline = data.dataValues.work_order_timeline;
            
            timeline += WorkOrderLog.workOrderLog(arg.action, arg.accept_user_last);
            return SchemaInfo.update({
                    accept_user_last: arg.accept_user_last,
                    accept_user: arg.accept_user,
                    order_type: arg.action,
                    work_order_timeline: timeline,
                    reason: arg.reason ? arg.reason : '',
                    handle_time: new Date().toLocaleString()
                },
                {where: {id: arg.id}}).then((data) => {
                if (!data) {
                    return {status: 500};
                }
                return data;
            }).catch(function (err) {
                return err;
            });
            
        }).catch(function (err) {
            return err;
        });
    },
    
    // 关单与再次提交
    manageHandledDbOrder:(arg) => {
        let SchemaInfo = selectSchemaTable();
        if (arg.hasOwnProperty("body") && arg.body.order_type === "已关单") {
            return SchemaInfo.findOne({where: {id: arg.body.id}}).then((data) => {
                if (!data) {
                    return {status: 500};
                }
                let timeline = data.dataValues.work_order_timeline;
                timeline += WorkOrderLog.workOrderLog("已关单", arg.body.user, arg.body.user);
                return SchemaInfo.update({
                        accept_user_last: arg.body.user,
                        work_order_timeline: timeline,
                        order_type: arg.body.order_type,
                        handle_time: new Date().toLocaleString(),
                    },
                    {where: {id: arg.body.id}}).then((data) => {
                    if (!data) {
                        return {status: 500};
                    }
                    // socketio.sendCreateOrder({msg:"您有一个新的工单，请及时处理", accept:arg.accept_user_last});
                    return data;
                }).catch(function (err) {
                    return err;
                });
            }).catch(function (err) {
                return err;
            });
        } else if (arg.hasOwnProperty("body") && arg.body.order_type === "再次提交") {
            return SchemaInfo.findOne({where: {id: arg.body.id}}).then((data) => {
                if (!data) {
                    return {status: 500};
                }
                let timeline = data.dataValues.work_order_timeline;
                timeline += WorkOrderLog.workOrderLog("再次提交", arg.body.send_user, arg.accept_user_last);
                let body = arg.body;
                let file_path = "";
                if (arg.hasOwnProperty("files")) {
                    file_path = fileFormate.renameFile(arg.files);
                }
                let order = {
                    id: body.id,
                    schema_name: body.schema_name,
                    update_target: body.update_target,
                    update_type: body.update_type,
                    update_note: body.update_note,
                    update_step: body.update_step,
                    send_user: body.send_user,
                    accept_user: body.accept_user,
                    accept_user_last: body.accept_user_last,
                    order_type: body.order_type,
                    work_order_timeline: timeline,
                    sql_file: file_path.sql_file ? file_path.sql_file : "",
                };
            
                return SchemaInfo.update(order, {where: {id: order.id}}).then((data) => {
                    if (!data) {
                        return {status: 500};
                    }
                    // socketio.sendCreateOrder({msg:"您有一个新的工单，请及时处理", accept:arg.accept_user_last});
                    return data;
                }).catch(function (err) {
                    return err;
                });
            })
        }
    
    }
};
