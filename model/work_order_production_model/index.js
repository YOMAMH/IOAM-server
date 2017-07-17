/**
 * Created by renminghe on 2017/6/12.
 */
const Sequelize = require("../../global/sequelize");
const sequelize = require("sequelize");
const co = require('co');
const path = require('path');
const fs = require('fs');
const WorkOrderLog = require('../../global/Log');
'use strict';

// 应用工单表
function selectTable() {
    let Order = Sequelize.define('work_order_production', {
        id: {    // 唯一id 主键 string
            type: sequelize.INTEGER,
            primaryKey: true
        },
        pro_type: sequelize.STRING,    // 业务类别
        pro_name: sequelize.STRING,    // 应用名称
        update_type: sequelize.INTEGER,    // 升级类型：0: 修复bug;  1: 产品发布；
        update_verson: sequelize.STRING,    // 迭代版本
        jenkins_name: sequelize.STRING,    // Jenkins项目名称
        build_num: sequelize.STRING,    // build_num
        change_title: sequelize.STRING,    // 变更主题
        change_content: sequelize.STRING,    // 变更内容列表
        conf_update: sequelize.STRING,    // 配置文件修改
        update_depend: sequelize.STRING,    // 升级依赖描述
        app_file: sequelize.STRING,    // 程序附件
        sql_file: sequelize.STRING,    // sql附件
        send_user: sequelize.STRING,   // 工单提交者
        accept_user: sequelize.STRING,   // 工单处理者
        accept_user_last: sequelize.STRING,    // 最终处理人
        work_order_timeline: sequelize.STRING,    // 工单的操作历史记录
        order_type: sequelize.STRING,    // 工单处理状态
        reason: sequelize.STRING,    // 处理结果原因
        proer_action: sequelize.STRING,    // 产品意见
        tester_action: sequelize.STRING,    // 测试意见
        create_time: sequelize.STRING,    // 工单创建时间
        handle_time: sequelize.STRING,    // 工单处理时间
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    
    return Order;
}

// 产品线列表
function selectApplicationTable() {
    let AppList = Sequelize.define('work_order_products_info', {
        id: {    // 唯一id 主键 string
            type: sequelize.INTEGER,
            primaryKey: true
        },
        pro_type: sequelize.STRING,    // 业务类别
        pro_name: sequelize.STRING,    // 应用名称
        pro_val: sequelize.INTEGER,    // 应用名对应value
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    
    return AppList;
}

module.exports = {
    
    // 创建应用工单
    createProdOrder: (arg) => {
        let Order = selectTable();
        let body = arg.body;
        let file_path = "";
        if (arg.hasOwnProperty("files")) {
            file_path = renameFile(arg.files);
        }
        let order = {
            pro_type: body.pro_type,
            pro_name: body.pro_name,
            update_type: body.update_type,
            update_verson: body.update_verson,
            jenkins_name: body.jenkins_name,
            build_num: body.build_num,
            change_content: body.change_content,
            conf_update: body.conf_update,
            update_depend: body.update_depend,
            send_user: body.send_user,
            accept_user: body.accept_user,
            accept_user_last: body.accept_user_last,
            order_type: body.order_type,
            work_order_timeline: WorkOrderLog.workOrderLog("创建", body.send_user, body.accept_user),
            app_file: file_path.app_file ? file_path.app_file : "",
            sql_file: file_path.sql_file ? file_path.sql_file : "",
        };
        
        return Order.create(order).then((data) => {
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
        
        let Order = selectTable();
        return Order.findOne({where: {id: arg}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        });
    },
    
    // 获取个人未解决工单
    workOrderUnHandleInfo: (arg) => {
        let index = parseInt(arg.index);
        let Order = selectTable();
        return Order.findAll({
            where: {send_user: arg.user, order_type: ["再次提交", "未处理"]},
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
    
    // 删除个人未处理工单
    dropUnHandleOrderInfo: (arg) => {
        Object.keys(arg).forEach(item => {
            if (item !== "id") deleteFile(arg[item]);
        });
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
            where: {accept_user_last: arg.user},
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
    
    // 获取个人未解决的工单数量
    unHandleOrderInfoCount: (arg) => {
        let Order = selectTable();
        return Order.count({where: {send_user: arg.user, order_type: ["再次提交", "未处理"]}}).then((data) => {
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
                        accept_user_last: arg.accept_user_last,
                        accept_user: arg.accept_user,
                        order_type: arg.active,
                        work_order_timeline: timeline,
                        reason: arg.reason ? arg.reason : '',
                        tester_action: arg.tester_action ? arg.tester_action : '',
                        proer_action: arg.proer_action ? arg.proer_action : '',
                        handle_time: new Date().toLocaleString(),
                        change_content: arg.change_content,
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
    
    
    // 个人处理的受理工单总数
    handledAcceptOrderCount: (arg) => {
        let Order = selectTable();
        return Order.count({where: {accept_user_last: arg.user}}).then((data) => {
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
            return Order.findAll({
                where: {accept_user: "不限", order_type: "未处理"},
                order: "id DESC",
            }).then((data) => {
                if (!data) {
                    return {status: 500};
                }
                return data;
            }).catch(function (err) {
                return err;
            });
        } else if (arg.type === "handled") {
            return Order.findAll({
                where: {accept_user: "不限", order_type: {ne: "未处理"}},
                order: "id DESC",
            }).then((data) => {
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
        return Order.count({where: {accept_user: "不限", order_type: "未处理"}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 获取已处理公共受理工单数量
    handledPublicAcceptOrderCount: () => {
        let Order = selectTable();
        return Order.count({where: {accept_user: "不限", order_type: {ne: "未处理"}}}).then((data) => {
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
            where: {order_type: ["未处理", "再次提交"]},
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
        return Order.count({where: {order_type: ["未处理", "再次提交"]}}).then((data) => {
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
    
    // 所有已处理的工单数量
    handledOrderInfoAllCount: () => {
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
    
    // 确认工单
    manageHandledOrder: (arg) => {
        let Order = selectTable();
        if (arg.hasOwnProperty("order_type") && arg.order_type === "已关单") {
            return Order.findOne({where: {id: arg.id}}).then((data) => {
                if (!data) {
                    return {status: 500};
                }
                let timeline = data.dataValues.work_order_timeline;
                timeline += WorkOrderLog.workOrderLog("已关单", arg.user, arg.user);
                return Order.update({
                        accept_user_last: arg.user,
                        work_order_timeline: timeline,
                        order_type: arg.order_type,
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
            }).catch(function (err) {
                return err;
            });
        } else if (arg.hasOwnProperty("body") && arg.body.order_type === "再次提交，测试审核中") {
            return Order.findOne({where: {id: arg.body.id}}).then((data) => {
                if (!data) {
                    return {status: 500};
                }
                let timeline = data.dataValues.work_order_timeline;
                timeline += WorkOrderLog.workOrderLog("再次提交，测试审核中", arg.body.send_user, arg.accept_user_last);
                let body = arg.body;
                let file_path = "";
                if (arg.hasOwnProperty("files")) {
                    file_path = renameFile(arg.files);
                }
                let order = {
                    id: body.id,
                    pro_type: body.pro_type,
                    pro_name: body.pro_name,
                    update_type: body.update_type,
                    update_verson: body.update_verson,
                    jenkins_name: body.jenkins_name,
                    build_num: body.build_num,
                    change_content: body.change_content,
                    conf_update: body.conf_update,
                    update_depend: body.update_depend,
                    send_user: body.send_user,
                    accept_user: body.accept_user,
                    accept_user_last: body.accept_user_last,
                    order_type: body.order_type,
                    note: arg.note,
                    work_order_timeline: timeline,
                    handle_time: new Date().toLocaleString(),
                    app_file: file_path.app_file ? file_path.app_file : "",
                    sql_file: file_path.sql_file ? file_path.sql_file : "",
                };
                
                return Order.update(order, {where: {id: order.id}}).then((data) => {
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
        
    },
    
    // 获取指定实例id的工单信息
    OrdersInfo: (arg) => {
        let Order = selectTable();
        return Order.findAll({
            where: {id: arg.id}
        }).then((data) => {
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
        return Order.count({
            where: {send_user: arg.user}
        }).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    // 获取应用工单变更最多top5
    orderProdMaxRound: (arg) => {
        let queryStr = `select * from (select count(1) t_counts, pro_name from cmdb.work_order_production
        where pro_type="${arg.type}" and handle_time >= '${arg.date}' and order_type="已关单" group by pro_name order by count(1) desc ) t_1 limit 0, 5`;
        // let queryStr = `select * from (select count(1) t_counts, pro_name from ty_cmdb.work_order_production
        // where pro_type="${arg.type}" and handle_time >= '${arg.date}' and order_type="已关单" group by pro_name order by count(1) desc ) t_1 limit 0, 5`;
        return Sequelize.query(queryStr, {type: sequelize.QueryTypes.SELECT}).then(data => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(err => {
            throw err
        });
    },
    
    
    // 获取特定应用工单记录
    orderProdsByName: (arg) => {
        let AppList = selectTable();
        return AppList.findAll({where: {pro_name: arg}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
};

// 重命名文件名
function renameFile(files) {
    let date = new Date();
    let dataStr = `${date.getFullYear()}-${date.getMonth() + 1}`;
    let pathStr = path.join(__dirname, `/../../public/${dataStr}/`);
    let pathMap = {};
    
    Object.keys(files).forEach(data => {
        if (data && files[data].hasOwnProperty("path")) {
            try {
                let stat = fs.existsSync(pathStr);
                let file_path = "";
                if (!stat) {
                    fs.mkdirSync(pathStr);
                    let source = fs.readFileSync(path.join(files[data]["path"]), "utf-8");
                    file_path = `${pathStr}${new Date().getTime()}%^${files[data]["originalFilename"]}`;
                    fs.writeFileSync(file_path, source)
                } else {
                    let source = fs.readFileSync(path.join(files[data]["path"]), "utf-8");
                    file_path = `${pathStr}${new Date().getTime()}%^${files[data]["originalFilename"]}`;
                    fs.writeFileSync(file_path, source)
                }
                pathMap[files[data]["fieldName"]] = file_path;
                fs.unlinkSync(path.join(files[data]["path"]));
            } catch (err) {
                throw err;
            }
            
            
        }
    });
    return pathMap;
}

// 删除文件
function deleteFile(files) {
    try {
        files = new Buffer(files).toString();
        fs.unlinkSync(files);
    } catch (err) {
        throw err
    }
}