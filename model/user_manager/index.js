/**
 * Created by renminghe on 2017/2/24.
 */
const Sequelize = require("../../global/sequelize");
const sequelize = require("sequelize");
const co = require('co');
const crypto = require('crypto');

// 用户权限信息
function selectTable() {
    let User = Sequelize.define('user_base', {
        id: {    // 唯一id 主键 string
            type: sequelize.INTEGER,
            primaryKey: true
        },
        uidNumber: sequelize.INTEGER,    // 用户唯一编码
        name: sequelize.STRING,    // 用户名
        group: sequelize.STRING, // 所属业务组
        auth: sequelize.STRING,    // 权限
        create_time: sequelize.STRING,   //创建时间 默认当前时间
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    
    return User;
}


module.exports = {
    createUser: (arg) => {    // 创建用户权限数据
        let User = selectTable();
        let userObj = {};
        userObj['name'] = arg.user;
        userObj['uidNumber'] = parseInt(arg.uidNum);
        return User.create(userObj).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            return err;
        });
    },
    
    userInfo: (arg) => {    // 获取用户权限数据
        let User = selectTable();
        if (arg === "all") {
            return User.findAll().then((data) => {
                if (!data) {
                    return {status: 500};
                }
                return data;
            }).catch(function (err) {
                throw err;
            });
        } else if (typeof arg === "object") {
            if (arg.hasOwnProperty("group") && arg.hasOwnProperty("auth")) {
                return User.findOne({where: {group: {$like:'%' + arg.group + '%'}, auth: {$like:'%' + arg.auth + '%'}}}).then((data) => {
                    if (!data) {
                        return {status: 500};
                    }
                    return data;
                }).catch(function (err) {
                    throw err;
                });
            } else {
                return User.findOne({where: {name: arg.gecos, uidNumber: arg.uidNumber}}).then((data) => {
                    if (!data) {
                        return {status: 500};
                    }
                    return data;
                }).catch(function (err) {
                    throw err;
                });
            }
        }
    },
    
    // 变更用户权限
    userInfoUpdate: (arg) => {
        let User = selectTable();
        return User.update(arg, {where: {uidNumber:arg.uidNumber}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch((err) => {
            throw err
        });
    },
    
    // 分页查询
    userInfoPage: (arg) => {
        let User = selectTable();
        return User.findAll({where: {}, limit: 10, offset: arg ? arg : 0}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    },
    
    // 获取用户数据量
    userInfoCount: () => {
        let User = selectTable();
        return User.count().then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    }
};