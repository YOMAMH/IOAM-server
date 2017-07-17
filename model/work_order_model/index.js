/**
 * Created by renminghe on 2017/4/14.
 */
const Sequelize = require("../../global/sequelize");
const sequelize = require("sequelize");
const co = require('co');
const WorkOrderLog = require('../../global/Log');
// const socketio = require('../../socket');

// 工单主表
function selectTable() {
    let Order = Sequelize.define('work_order_base', {
        id: {    // 唯一id 主键 string
            type: sequelize.INTEGER,
            primaryKey: true
        },
        title: sequelize.STRING,    // 标题：工单主题
        type: sequelize.STRING,    // 状态：工单处理状态，【已通过，未处理，未通过，撤销】
        query_type: sequelize.STRING,    // 申请类型
        reason: sequelize.STRING,    // 处理结果原因
        tag: sequelize.STRING,    // 业务组
        zone: sequelize.STRING,    // 机房
        note: sequelize.STRING,    // 备注
        send_user: sequelize.STRING,    // 工单提交者
        accept_user: sequelize.STRING,    // 工单处理者
        priority: sequelize.STRING,    // 优先级: 【一般（0） 高（1） 非常高（2）】
        accept_user_last: sequelize.STRING,    // 最终处理人
        create_time: sequelize.STRING,   // 创建时间
        handle_time: sequelize.STRING,   // 处理时间
        work_order_timeline: sequelize.STRING,    // 工单的操作记录
        change_type: sequelize.STRING,    // 主机变更状态
        change_instance_name: sequelize.STRING,    // 变更实例名字
        change_content: sequelize.STRING,    // 变更记录
        change_title: sequelize.STRING,    // 变更主题
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    
    return Order;
}

module.exports = {
    
    // 创建工单
    createOrder: (arg) => {
        let Order = selectTable();
        arg['work_order_timeline'] = WorkOrderLog.workOrderLog("创建", arg.send_user, arg.accept_user);
        return Order.create(arg).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 获取已解决工单
    workOrderInfo: (arg) => {
        let index = parseInt(arg.index);
        let Order = selectTable();
        return Order.findAll({
            where: {send_user: arg.user},
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
    
    // 获取已解决的工单数量
    handledOrderInfoCount: (arg) => {
        let Order = selectTable();
        return Order.count({where: {send_user: arg.user}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 获取个人未解决工单
    workOrderUnHandleInfo: (arg) => {
        let index = parseInt(arg.index);
        let Order = selectTable();
        return Order.findAll({
            where: {send_user: arg.user, type: ["再次提交", "未处理"]},
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
    
    // 获取个人未解决的工单数量
    unHandleOrderInfoCount: (arg) => {
        let Order = selectTable();
        return Order.count({where: {send_user: arg.user, type: ["再次提交", "未处理"]}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 删除个人未处理工单
    dropUnHandleOrderInfo: (arg) => {
        let Order = selectTable();
        return Order.destroy({where: {id: arg.id}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 获取个人受理工单
    myAcceptOrder: (arg) => {
        let Order = selectTable();
        return Order.findAll({
            where: {},
            limit: 10,
            offset: parseInt(arg.index),
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
    
    // 处理个人受理工单
    updateMyAcceptOrder: (arg) => {
        let Order = selectTable();
        return Order.findOne({where: {id: arg.id}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            let timeline = data.dataValues.work_order_timeline;
            if (arg.hasOwnProperty('orderAction')) {
                timeline += WorkOrderLog.workOrderLog("转出", arg.user, arg.accept_user_last);
                return Order.update({
                        accept_user_last: arg.accept_user_last,
                        work_order_timeline: timeline,
                        reason: arg.reason,
                        handle_time: new Date().toLocaleString(),
                    },
                    {where: {id: arg.id}}).then((data) => {
                    if (!data) {
                        return {status: 500};
                    }
                    // socketio.sendCreateOrder({msg:"您有一个新的工单，请及时处理", accept:arg.accept_user_last});
                    return data;
                }).catch(function (err) {
                    return err;
                });
            } else {
                timeline += WorkOrderLog.workOrderLog(arg.active, arg.user);
                return Order.update({
                        accept_user_last: arg.user,
                        type: arg.active,
                        work_order_timeline: timeline,
                        reason: arg.reason,
                        handle_time: new Date().toLocaleString(),
                        change_content: arg.change_content,
                        change_instance_name: arg.change_instance_name,
                        change_title: arg.change_title,
                    },
                    {where: {id: arg.id}}).then((data) => {
                    if (!data) {
                        return {status: 500};
                    }
                    return data;
                }).catch(function (err) {
                    return err;
                });
            }
            
        }).catch(function (err) {
            return err;
        });
    },
    
    // 确认工单
    manageHandledOrder: (arg) => {
        let Order = selectTable();
        return Order.findOne({where: {id: arg.id}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            let timeline = data.dataValues.work_order_timeline;
            if (arg.type === "已通过，已确认" || arg.type === "未通过，已确认") {
                timeline += WorkOrderLog.workOrderLog("已确认", arg.user, arg.accept_user_last);
                return Order.update({
                        accept_user_last: arg.accept_user_last,
                        work_order_timeline: timeline,
                        type: arg.type,
                        handle_time: new Date().toLocaleString(),
                    },
                    {where: {id: arg.id}}).then((data) => {
                    if (!data) {
                        return {status: 500};
                    }
                    // socketio.sendCreateOrder({msg:"您有一个新的工单，请及时处理", accept:arg.accept_user_last});
                    return data;
                }).catch(function (err) {
                    return err;
                });
            } else if (arg.type === "再次提交") {
                timeline += WorkOrderLog.workOrderLog("再次提交", arg.user, arg.accept_user_last);
                return Order.update({
                        accept_user_last: arg.accept_user_last,
                        work_order_timeline: timeline,
                        type: arg.type,
                        note: arg.note,
                        handle_time: new Date().toLocaleString(),
                    },
                    {where: {id: arg.id}}).then((data) => {
                    if (!data) {
                        return {status: 500};
                    }
                    // socketio.sendCreateOrder({msg:"您有一个新的工单，请及时处理", accept:arg.accept_user_last});
                    return data;
                }).catch(function (err) {
                    return err;
                });
            }
            
            
        }).catch(function (err) {
            return err;
        });
    },
    
    // 个人未处理的受理工单总数
    unHandleAcceptOrderCount: (arg) => {
        let Order = selectTable();
        return Order.count({where: {accept_user_last: arg.user, type: "未处理"}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 个人已处理的受理工单总数
    handledAcceptOrderCount: (arg) => {
        let Order = selectTable();
        return Order.count({where: {}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 获取公共受理工单
    publicAcceptOrder: (arg) => {
        let Order = selectTable();
        if (arg.type === "unHandle") {
            return Order.findAll({where: {accept_user: "不限", type: "未处理"}, order: "id DESC",}).then((data) => {
                if (!data) {
                    return {status: 500};
                }
                return data;
            }).catch(function (err) {
                return err;
            });
        } else if (arg.type === "handled") {
            return Order.findAll({where: {accept_user: "不限", type: {ne: "未处理"}}, order: "id DESC",}).then((data) => {
                if (!data) {
                    return {status: 500};
                }
                return data;
            }).catch(function (err) {
                return err;
            });
        }
    },
    
    // 获取未处理公共受理工单
    unHandlePublicAcceptOrderCount: () => {
        let Order = selectTable();
        return Order.count({where: {accept_user: "不限", type: "未处理"}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 获取已处理公共受理工单
    handledPublicAcceptOrderCount: () => {
        let Order = selectTable();
        return Order.count({where: {accept_user: "不限", type: {ne: "未处理"}}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 所有未处理的工单
    workOrderUnHandleInfoAll: (arg) => {
        let Order = selectTable();
        return Order.findAll({
            where: {type: ["未处理", "再次提交"]},
            limit: 10,
            offset: parseInt(arg.index),
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
    
    // 所有未处理的工单数量
    unHandleOrderInfoAllCount: () => {
        let Order = selectTable();
        return Order.count({where: {type: ["未处理", "再次提交"]}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 所有已处理的工单
    workOrderHandledInfoAll: (arg) => {
        let Order = selectTable();
        return Order.findAll({
            where: {type: ["已通过，已确认", "未通过，已确认", "未通过，待确认", "已通过，待确认"]},
            limit: 10,
            offset: parseInt(arg.index),
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
    
    // 所有已处理的工单数量
    handledOrderInfoAllCount: () => {
        let Order = selectTable();
        return Order.count({where: {type: ["已通过，已确认", "未通过，已确认", "未通过，待确认", "已通过，待确认"]}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 获取指定实例id的工单信息
    OrdersInfo: (arg) => {
        let Order = selectTable();
        return Order.findAll({
            where: {type: ["已通过，已确认", "已通过，待确认"], change_instance_name: {$like: `%${arg.change_instance_name}%`}}
        }).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
};