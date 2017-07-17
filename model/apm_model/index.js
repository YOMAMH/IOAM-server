/**
 * Created by renminghe on 2017/2/14.
 */
let Sequelize = require("../../global/sequelize");
let sequelize = require("sequelize");

// 根选择不同数据表
function selectTable(table) {
    let User = Sequelize.define(table, {
        id:{  //自增id 主键 int
            type: sequelize.INTEGER,
            primaryKey: true
        },
        name: sequelize.STRING, // 项目名称 string
        product_line: sequelize.STRING, // 所属产品线 string
        port: sequelize.STRING, // 端口 string
        use_path: sequelize.STRING, // 应用路径 string
        config_path: sequelize.STRING,  // 配置路径 string
        admin: sequelize.STRING, // 管理者 string
        depend_env: sequelize.STRING, // 依赖环境 string
        node_name: sequelize.STRING, // 节点名称 string
        create_time: sequelize.STRING, //创建时间 默认当前时间 string

    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });

    return User;
}

// 获取数据库数据方法
function selectNameById (arg, name) {
    let user = selectTable(name);
    if (arg.hasOwnProperty("proName")) {
        return user.findAll({where:{name: {$like: `%${arg.proName}%`}}}).then((data) => {
            if (!data) {
                return {status:500};
            }
            return data;
        }).catch(function(err){
            throw err;
        });
    } else if (arg.hasOwnProperty("index")){
        return user.findAll({
            where: {},
            limit: 10,
            offset: parseInt(arg.index),
        }).then((data) => {
            if (!data) {
                return {status:500};
            }
            return data;
        }).catch(function(err){
            throw err;
        });
    } else if (arg.hasOwnProperty("all")) {
        return user.findAll({}).then((data) => {
            if (!data) {
                return {status:500};
            }
            return data;
        }).catch(function(err){
            throw err;
        });
    } else if (arg.hasOwnProperty("appName")){
        return user.findOne({where: {node_name: arg.appName}}).then((data) => {
            if (!data) {
                return {status:500};
            }
            return data;
        }).catch(function(err){
            throw err;
        });
    }
}

// 插入数据库数据方法
function creatData (arg, name) {
    let user = selectTable(name);
    if (arg) {
        return user.create(arg).then((data) => {
            if (!data) {
                return {status:500};
            }
            return data;
        }).catch(function(err){
            throw err;
        });
    }
}

// 更新数据库数据方法
function upData(arg, name) {
    let user = selectTable(name);
    if (arg) {
        return user.update(arg, {where:{id:arg.id}}).then((data) => {
            if (!data) {
                return {status:500};
            }
            return data;
        }).catch(function(err){
            throw err;
        });
    }
}

// 删除数据库数据方法
function dropData(arg, name) {
    let user = selectTable(name);
    if (arg) {
        return user.destroy({where:{id:arg.id}}).then((data) => {
            if (!data) {
                return {status:500};
            }
            return data;
        }).catch(function(err){
            throw err;
        });
    }
}
module.exports = {

    // 听云app配置信息
    app: (arg) => selectNameById(arg, "apm_app"),

    // 听云browser配置信息
    browser: (arg) => selectNameById(arg, "apm_browser"),

    // 听云common配置信息
    common: (arg) => selectNameById(arg, "apm_common"),

    // 听云network配置信息
    network: (arg) => selectNameById(arg, "apm_network"),

    // 听云saas配置信息
    saas: (arg) => selectNameById(arg, "apm_saas"),

    // 听云server配置信息
    server: (arg) => selectNameById(arg, "apm_server"),
    
    // 听云netop配置信息
    netop: (arg) => selectNameById(arg, "apm_netop"),
    
    // 听云controller配置信息
    controller: (arg) => selectNameById(arg, "apm_controller"),
    
    // 听云alarm配置信息
    alarm: (arg) => selectNameById(arg, "apm_alarm"),
    
    // 听云base配置信息
    base: (arg) => selectNameById(arg, "apm_base"),
    

    // 创建听云app配置信息
    creatApp: (arg) => creatData(arg, "apm_app"),

    // 创建听云browser配置信息
    creatBrowser: (arg) => creatData(arg, "apm_browser"),

    // 创建听云common配置信息
    creatCommon: (arg) => creatData(arg, "apm_common"),

    // 创建听云network配置信息
    creatNetwork: (arg) => creatData(arg, "apm_network"),

    // 创建听云saas配置信息
    creatSaas: (arg) => creatData(arg, "apm_saas"),

    // 创建听云server配置信息
    creatServer: (arg) => creatData(arg, "apm_server"),
    
    // 创建听云netop配置信息
    creatNetop: (arg) => creatData(arg, "apm_netop"),
    
    // 创建听云netop配置信息
    creatController: (arg) => creatData(arg, "apm_controller"),
    
    // 创建听云alarm配置信息
    creatAlarm: (arg) => creatData(arg, "apm_alarm"),
    
    // 创建听云base配置信息
    creatBase: (arg) => creatData(arg, "apm_base"),


    // 修改听云app配置信息
    updateApp: (arg) => upData(arg, "apm_app"),

    // 修改听云browser配置信息
    updateBrowser: (arg) => upData(arg, "apm_browser"),

    // 修改听云common配置信息
    updateCommon: (arg) => upData(arg, "apm_common"),

    // 修改听云network配置信息
    updateNetwork: (arg) => upData(arg, "apm_network"),

    // 修改听云saas配置信息
    updateSaas: (arg) => upData(arg, "apm_saas"),

    // 修改听云server配置信息
    updateServer: (arg) => upData(arg, "apm_server"),
    
    // 修改听云netop配置信息
    updateNetop: (arg) => upData(arg, "apm_netop"),
    
    // 修改听云netop配置信息
    updateController: (arg) => upData(arg, "apm_controller"),

    // 修改听云alarm配置信息
    updateAlarm: (arg) => upData(arg, "apm_alarm"),
    
    // 修改听云alarm配置信息
    updateBase: (arg) => upData(arg, "apm_base"),


    // 删除听云app配置信息
    dropApp: (arg) => dropData(arg, "apm_app"),

    // 删除听云browser配置信息
    dropBrowser: (arg) => dropData(arg, "apm_browser"),

    // 删除听云common配置信息
    dropCommon: (arg) => dropData(arg, "apm_common"),

    // 删除听云network配置信息
    dropNetwork: (arg) => dropData(arg, "apm_network"),

    // 删除听云saas配置信息
    dropSaas: (arg) => dropData(arg, "apm_saas"),

    // 删除听云server配置信息
    dropServer: (arg) => dropData(arg, "apm_server"),
    
    // 删除听云netop配置信息
    dropNetop: (arg) => dropData(arg, "apm_netop"),
    
    // 删除听云controller配置信息
    dropController: (arg) => dropData(arg, "apm_controller"),
    
    // 删除听云alarm配置信息
    dropAlarm: (arg) => dropData(arg, "apm_alarm"),
    
    // 删除听云base配置信息
    dropBase: (arg) => dropData(arg, "apm_base"),
    
    // 数据量
    count: (arg) => {
        if (arg) {
            let user = selectTable(arg);
            return user.count().then((data) => {
                if (!data) {
                    return {status:500};
                }
                return data;
            }).catch(function(err){
                throw err;
            });
        }
    }

};