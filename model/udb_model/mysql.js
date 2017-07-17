/**
 * Created by renminghe on 2017/3/21.
 */
const Sequelize = require("../../global/sequelize");
const sequelize = require("sequelize");
const co = require('co');
const uclouldAuth = require('../../global/ucloudAuth');
const mysqlChangeHistory = require('./mysqlChangeHistory');

// 根选择不同数据表
function selectTable() {
    let Mysql = Sequelize.define('udb_mysql_base', {
        DBId: {    // 唯一id 主键 string
            type: sequelize.STRING,
            primaryKey: true
        },
        Name: sequelize.STRING,   // mysql名称 string
        DBTypeId: sequelize.STRING,   // mysql类型 string
        InstanceTypeId: sequelize.INTEGER,
        ParamGroupId: sequelize.INTEGER,
        AdminUser: sequelize.STRING,    // 管理者账户
        VirtualIP: sequelize.STRING,
        VirtualIPMac: sequelize.STRING,
        Port: sequelize.INTEGER,    // 端口
        SrcDBId: sequelize.STRING,
        BackupCount: sequelize.INTEGER,
        BackupBeginTime: sequelize.INTEGER,
        BackupDuration: sequelize.INTEGER,
        State: sequelize.STRING,    // 运行状态
        CreateTime: sequelize.INTEGER,   //创建时间 int
        ModifyTime: sequelize.INTEGER,
        ExpiredTime: sequelize.INTEGER,    // 有效时间
        ChargeType: sequelize.STRING,
        MemoryLimit: sequelize.INTEGER,
        DiskSpace: sequelize.INTEGER,
        UseSSD: sequelize.STRING,
        SSDType: sequelize.STRING,
        Role: sequelize.STRING,
        DiskUsedSize: sequelize.STRING,
        SystemFileSize: sequelize.STRING,
        LogFileSize: sequelize.STRING,
        BackupDate: sequelize.STRING,
        ReplicateSetId: sequelize.STRING,
        Tag: sequelize.STRING,
        VPCId: sequelize.STRING,
        SubnetId: sequelize.STRING,
        InstanceMode: sequelize.STRING,
        Zone: sequelize.STRING,
        InstanceType: sequelize.STRING,
        DataSet: sequelize.STRING,
        Survive: sequelize.INTEGER,
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });

    return Mysql;
}

// 处理ucloud数据
function handleUcloudData(arg, arr) {
    if (arg instanceof Array) {
        arg.forEach((item) => {
            item = JSON.parse(item);
            if (item.TotalCount > 0) {
                item.DataSet.forEach((data) => {
                    arr.push(data);
                });
            }
        });
    }
    return arr;
}

// 插入数据库数据方法
function creatData(arg) {
    let Mysql = selectTable();
    if (arg) {
        if (arg.Role === "master") {
            arg.DataSet = JSON.stringify(arg.DataSet);
            let argJson = JSON.stringify(arg);
            return Mysql.create(arg).then((data) => {
                if (!data) {
                    return {status: 500};
                }
                return mysqlChangeHistory.createChangeInfo(arg, argJson, "create");
            }).catch(function (err) {
                throw err;
            });
        } else if (arg.Role === "slave") {
            return Mysql.findOne({where: {DBId: arg.SrcDBId, Survive: 1}}).then((data) => {
                if (!data) {
                    return {status: 500};
                }
                data.dataValues.DataSet = JSON.parse(data.dataValues.DataSet);
                if (!data.dataValues.DataSet) data.dataValues.DataSet = [];
                data.dataValues.DataSet.push(arg);
                data.dataValues.DataSet = JSON.stringify(data.dataValues.DataSet);
                return Mysql.update({DataSet:data.dataValues.DataSet}, {where:{DBId: arg.SrcDBId}}).then((data) => {
                    if (!data) {
                        return {status: 500};
                    }
                    return mysqlChangeHistory.createChangeInfo({DBId:arg.SrcDBId}, JSON.stringify({DataSet:arg}), "update");
                }).catch(function (err) {
                    throw err;
                });
            }).catch(function (err) {
                console.log(err);
            });
        }
    }
}

// 获取本地数据
function selectData(arg) {
    let Mysql = selectTable();
    if (arg.hasOwnProperty('DBId')) {
        return Mysql.findOne({where: {DBId: arg.DBId, Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    } else if (arg.hasOwnProperty('type')) {
        return Mysql.findAll({where: {Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    } else {
        return Mysql.findAll({where: {Survive: 1}, limit: 10, offset: arg ? arg : 0}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    }
}

// 通过id查找ucloud数据
// reg : 区域;
// arg : UHostId;
function getHostInfoById(reg, arg) {
    return uclouldAuth.getUdbInfo({Region: reg, ClassType: "SQL", Offset: 0, argId: arg});
}

// 更新信息
function mysqlInfoUpdate(arg) {
    let Mysql = selectTable();
    if (arg.hasOwnProperty('DBId')) {
        arg.DataSet = JSON.stringify(arg.DataSet);
        let argJson = JSON.stringify(arg);
        return Mysql.update(arg, {where: {DBId: arg.DBId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return mysqlChangeHistory.createChangeInfo(arg, argJson, "update");
        }).catch(function (err) {
            throw err;
        });
    } else {
        return {status: 500};
    }
}

function hostInfoDelAll(arg) {
    let Mysql = selectTable();
    let argJson = JSON.stringify(arg);
    if (arg.hasOwnProperty('DBId')) {

        return Mysql.destroy({where: {DBId: arg.DBId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return mysqlChangeHistory.createChangeInfo(arg, argJson, "delete");
        }).catch(function (err) {
            throw err;
        });
    } else {
        return {status: 500};
    }
}

function selectHistoryTable() {
    let Info = Sequelize.define("udb_mysql_change_history_info", {
        id: {    // 主键自增id
            type: sequelize.INTEGER,
            primaryKey: true
        },
        DBId: sequelize.STRING,    // 主机id
        ChangeInfo: sequelize.TEXT,    // 变更内容
        ChangeTime: sequelize.STRING,    // 变更时间
        Action: sequelize.STRING,    // 变更方式  create update  delete
        Tag: sequelize.STRING    // 所属业务组
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    return Info;
}

// 还原主机数据
function resetData(arg) {
    let Host = selectTable();
    if (arg) {
        return Host.create(arg).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    }
}

// 撤销删除
function cancleDelFun(createRes) {
    let Info = selectHistoryTable();
    return Info.destroy({
        where: {
            DBId: createRes.dataValues.DBId,
            Action: "delete"
        }
    }).then((data) => {
        if (!data) {
            return {status: 500};
        }
        return data;
    }).catch(function (err) {
        console.log(err);
    });
}

module.exports = {

    // 批量从ucloud导入主机信息
    mysqlInfoCopy: () => co(function *() {
        let hostArr = [];
        let bj1 = yield uclouldAuth.getUdbInfo({Region: "cn-bj1", ClassType: "SQL", Offset: 0});
        let bj2 = yield uclouldAuth.getUdbInfo({Region: "cn-bj2", ClassType: "SQL", Offset: 0});
        return handleUcloudData([bj1, bj2], hostArr);
    }),

    // 添加主机信息
    mysqlInfoCreate: (arg) => creatData(arg),

    // 获取mysql数据总数
    mysqlInfoCount: () => {
        let Mysql = selectTable();
        return Mysql.count({where: {Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    },

    // 获取本地主机信息
    mysqlInfo: (arg) => selectData(arg),

    // 获取ucloud主机数据
    mysqlInfoUCloud: (reg, arg) => getHostInfoById(reg, arg),

    // 创建mysql数据
    mysqlCreate: (arg) => creatData(arg),

    // 更新mysql信息
    mysqlInfoUpdate: (arg) => co(function *() {

        // 获取本地UHostId对应的数据
        let localInfo = yield selectData(arg);
        if (localInfo.hasOwnProperty('dataValues')) {
            let flag = 0;
            let obj = {};
            obj.DataSet = [{}];
            arg.DataSet = [];    // 为ucloud主数据库添加从数据库属性

            // 1.通过本地主数据库获取本地从数据库数据
            let slave = localInfo.dataValues.DataSet;
            if (slave.length > 0) {    // 如果有从数据库
                slave = JSON.parse(slave);

                // 2.通过本地从主数据库数据找到ucloud上对应的数据
                let i = 0;
                for (i; i < slave.length; i++) {
                    let Region = slave[i]['Zone'].substring(0, 6);
                    let slaveObj = yield getHostInfoById(Region, slave[i]['DBId']);
                    slaveObj = JSON.parse(slaveObj);
                    arg.DataSet.push(slaveObj.DataSet[0]);
                }

                // 3.比对本地和ucloud从主数据库数据
                arg.DataSet.forEach((data, item) => {
                    Object.keys(data).forEach((result) => {
                        if (data[result] != slave[item][result]) {
                            flag = 1;
                            obj.DataSet[item][result] = data[result];
                        }

                    });
                });

            }
            // 其他属性对比
            Object.keys(arg).forEach((attr, data) => {
                if (attr != "DataSet") {
                    if (localInfo.dataValues[attr]) {
                        if ((localInfo.dataValues[attr] != arg[attr])) {
                            flag = 1;
                            obj[attr] = arg[attr];

                        }
                    }

                }
            });
            // 如果是0说明没有数据没有变化
            if (flag == 0) {
                return {status: 201};
            } else {
                return mysqlInfoUpdate(arg, localInfo, obj);
            }
        } else {
            return {status: 500};
        }

    }),

    // 模糊搜索
    searchId: (arg) => {
        let Mysql = selectTable();
        return Mysql.findAll({where: {Name: {$like: '%' + arg.searchId + '%'}}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    },

    // 删除主机信息
    mysqlInfoDelete: (arg) => co(function *() {
        let delHost = yield selectData({DBId: arg});
        if (delHost.hasOwnProperty("dataValues")) {
            return hostInfoDelAll(delHost.dataValues);
        }
        return {status: 500};
    }),

    // 获取删除的主机信息
    hostDropInfo: (arg) => {
        let Info = selectHistoryTable();
        if (arg) {
            return Info.findAll({where: {DBId: arg, Action: "delete"}}).then((data) => {
                if (!data) {
                    return {status: 500};
                }
                return data;
            }).catch(function (err) {
                console.log(err);
            });
        }
        return Info.findAll({where: {Action: "delete"}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    },

    // 撤销删除
    cancelDropHost: function (arg) {
        let self = this;
        return co(function *() {
            let dropInfo = yield self.hostDropInfo(arg);
            if (dropInfo[0].hasOwnProperty("dataValues")) {
                let dropObj = JSON.parse(dropInfo[0].dataValues.ChangeInfo);
                let createRes = yield resetData(dropObj);
                if (createRes) {
                    return yield cancleDelFun(createRes);
                } else {
                    return {status: 500};
                }
            }
        });
    },

    // 批量更新
    hostInfoUpdateAll(arg) {
        return mysqlInfoUpdate(arg);
    },

    // 批量删除
    hostInfoDelAll(arg) {
        return hostInfoDelAll(arg);
    },

    // 获取变更记录
    history(arg) {
        let Info = selectHistoryTable();
        if (arg.hasOwnProperty('endDate') && arg.hasOwnProperty('begDate') && arg.hasOwnProperty('tag')) {
            let obj = {
                ChangeTime: {
                    lt: arg.endDate,
                    gte: arg.begDate
                }
            };
            if (arg.tag != "all") obj['Tag'] = arg.tag;
            return Info.findAll({where: obj}).then((data) => {
                if (!data) {
                    return {status: 500};
                }
                return data;
            }).catch(function (err) {
                console.log(err);
            });
        } else {
            return {status: 304};
        }
    }

};