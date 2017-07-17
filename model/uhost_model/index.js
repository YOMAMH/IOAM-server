/**
 * Created by renminghe on 2017/3/3.
 */
const Sequelize = require("../../global/sequelize");
const sequelize = require("sequelize");
const request = require("request");
const keys = require("./keys");
const co = require('co');
const uclouldAuth = require('../../global/ucloudAuth');
const hostChangeHistory = require('./hostChangeHistory');
const globConfig = require('../../conf/ty_cmdb_config.json');

// 根选择不同数据表
function selectTable() {
    let Host = Sequelize.define('host_info_base', {
        UHostId: {    // 主机唯一id 主键 string
            type: sequelize.STRING,
            primaryKey: true
        },
        OsName: sequelize.STRING,   // 操作系统名称 string
        Tag: sequelize.STRING,   // 分组 string
        Name: sequelize.STRING,   // 主机名称 string
        State: sequelize.STRING,   // 运行状态 string
        TotalDiskSpace: sequelize.INTEGER,    // 数据磁盘大小 int
        DiskSet: sequelize.STRING,   // 操作系统磁盘 string
        IPSet: sequelize.STRING,   // IP设置 string
        OsType: sequelize.STRING,   // 操作系统类型 string
        CreateTime: sequelize.INTEGER,   //创建时间 默认当前时间 int
        CPU: sequelize.STRING,   // CPU int
        GPU: sequelize.STRING,   // GPU  int
        Memory: sequelize.STRING,   // 内存 int
        Zone: sequelize.STRING,    // 可用区域
        ImageId: sequelize.STRING,    // 镜像id
        BasicImageId: sequelize.STRING,    // 主镜像id
        BasicImageName: sequelize.STRING,    // 主镜像名字
        Remark: sequelize.STRING,
        NetworkState: sequelize.STRING,    // 网路状态
        StorageType: sequelize.STRING,
        NetCapability: sequelize.STRING,
        SubnetType: sequelize.STRING,
        ChargeType: sequelize.STRING,
        ExpireTime: sequelize.INTEGER,
        AutoRenew: sequelize.STRING,
        IsExpire: sequelize.STRING,
        UHostType: sequelize.STRING,
        TimemachineFeature: sequelize.STRING,
        HotplugFeature: sequelize.STRING,
        NetCapFeature: sequelize.STRING,
        BootDiskState: sequelize.STRING,
        Survive: sequelize.INTEGER
        
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    
    return Host;
}

// 变更记录表
function selectHistoryTable() {
    let Info = Sequelize.define("host_change_history_info", {
        id: {    // 主键自增id
            type: sequelize.INTEGER,
            primaryKey: true
        },
        UHostId: sequelize.STRING,    // 主机id
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

/**
 * 获取数据库数据方法
 * @param arg : UHostId
 * 如果有则是通过id查询，没有则查询字段为Survive=YES（活跃状态）的数据
 * @returns {Promise.<TResult>}
 */
function selectData(arg) {
    
    let Host = selectTable();
    if (arg.hasOwnProperty('UHostId')) {
        return Host.findOne({where: {UHostId: arg.UHostId, Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    } else if (arg.hasOwnProperty('type')) {
        return Host.findAll({where: {Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    } else {
        return Host.findAll({where: {Survive: 1}, limit: 10, offset: arg ? arg : 0}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    }
}

// 插入数据库数据方法
function creatData(arg) {
    let Host = selectTable();
    if (arg) {
        arg.DiskSet = JSON.stringify(arg.DiskSet);
        arg.IPSet = JSON.stringify(arg.IPSet);
        let argStr = JSON.stringify(arg);
        return Host.create(arg).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return hostChangeHistory.createChangeInfo(arg, argStr, "create");
        }).catch(function (err) {
            throw err;
        });
    }
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

// 通过id查找ucloud数据
// reg : 区域;
// arg : UHostId;
function getHostInfoById(reg, arg) {
    return uclouldAuth.getHostInfo(reg, arg);
}

// 更新主机信息
function hostInfoUpdate(arg) {
    let Host = selectTable();
    if (arg.hasOwnProperty('UHostId')) {
        arg.DiskSet = JSON.stringify(arg.DiskSet);
        arg.IPSet = JSON.stringify(arg.IPSet);
        let argJson = JSON.stringify(arg);
        return Host.update(arg, {where: {UHostId: arg.UHostId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return hostChangeHistory.createChangeInfo(arg, argJson, "update");
        }).catch(function (err) {
            throw err;
        });
    } else {
        return {status: 500};
    }
}

function hostInfoDelAll(arg) {
    let Host = selectTable();
    let argJson = JSON.stringify(arg);
    if (arg.hasOwnProperty('UHostId')) {
        
        return Host.destroy({where: {UHostId: arg.UHostId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return hostChangeHistory.createChangeInfo(arg, argJson, "delete");
        }).catch(function (err) {
            throw err;
        });
    } else {
        return {status: 500};
    }
}

function handleUcloudData(arg, arr) {
    if (arg instanceof Array) {
        arg.forEach((item) => {
            item = JSON.parse(item);
            if (item.TotalCount > 0) {
                item.UHostSet.forEach((data) => {
                    arr.push(data);
                });
            }
        });
    }
    return arr;
}

// 撤销删除
function cancleDelFun(createRes) {
    let Info = selectHistoryTable();
    return Info.destroy({
        where: {
            UHostId: createRes.dataValues.UHostId,
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
    
    // 获取主机信息
    hostInfo: (arg) => selectData(arg),
    
    // 添加主机信息
    hostCreate: (arg) => creatData(arg),
    
    // 获取ucloud主机数据
    hostInfoUCloud: (reg, arg) => getHostInfoById(reg, arg),
    
    // 更新主机信息
    hostInfoUpdate: (arg) => co(function *() {
        
        // 获取本地UHostId对应的数据
        let localInfo = yield selectData(arg);
        if (localInfo.hasOwnProperty('dataValues')) {
            let flag = 0;
            localInfo.dataValues.IPSet = JSON.parse(localInfo.dataValues.IPSet);
            localInfo.dataValues.DiskSet = JSON.parse(localInfo.dataValues.DiskSet);
            
            // IPSet数据比对
            localInfo.dataValues.IPSet.forEach((data, item) => {
                Object.keys(data).forEach((res, index) => {
                    if (arg['IPSet'][item][res] != data[res]) {
                        flag = 1;
                        
                    }
                });
            });
            
            // DiskSet数据比对
            localInfo.dataValues.DiskSet.forEach((data, item) => {
                Object.keys(data).forEach((res, index) => {
                    
                    if (arg['DiskSet'][item][res] != data[res]) {
                        flag = 1;
                        
                    }
                });
            });
            
            // 其他属性对比
            Object.keys(arg).forEach((attr, data) => {
                if (attr != "IPSet" && attr != "DiskSet") {
                    if (localInfo.dataValues[attr]) {
                        if ((localInfo.dataValues[attr] != arg[attr])) {
                            flag = 1;
                            
                        }
                    }
                    
                }
            });
            
            // 如果是0说明没有数据没有变化
            if (flag == 0) {
                return {status: 201};
            } else {
                return hostInfoUpdate(arg);
            }
        } else {
            return {status: 500};
        }
        
    }),
    
    // 删除主机信息
    hostInfoDelete: (arg) => co(function *() {
        let delHost = yield selectData({UHostId: arg});
        if (delHost.hasOwnProperty("dataValues")) {
            return hostInfoDelAll(delHost.dataValues);
        }
        return {status: 500};
    }),
    
    // 获取主机信息总数
    hostInfoCount: () => {
        let Host = selectTable();
        return Host.count({where: {Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    },
    
    // 批量从ucloud导入主机信息
    hostInfoCopy: () => co(function *() {
        let hostArr = [];
        let bj1 = yield uclouldAuth.getHostInfo("cn-bj1", '', '');
        let bj2 = yield uclouldAuth.getHostInfo("cn-bj2", '', '');
        let hk = yield uclouldAuth.getHostInfo("hk", '', '');
        return handleUcloudData([bj1, bj2, hk], hostArr);
    }),
    
    // 模糊搜索
    searchId: (arg) => {
        let Host = selectTable();
        return Host.findAll({where: {Name: {$like: '%' + arg.searchId + '%'}, Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    },
    
    // 获取删除的主机信息
    hostDropInfo: (arg) => {
        let Info = selectHistoryTable();
        if (arg) {
            return Info.findAll({where: {UHostId: arg, Action: "delete"}}).then((data) => {
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
        return hostInfoUpdate(arg);
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
    },
    
    // others
    others(arg) {
        let Info = selectTable();
        if (arg.hasOwnProperty('tag') && arg.hasOwnProperty('zone')) {
            let queryObj = {Tag: arg.tag};
            if (arg.zone !== "all") {
                return Info.findAll({where: {Tag: arg.tag, Zone: {$like: `%${arg.zone}%`}}}).then(data => {
                    if (!data) return {status: 500};
                    return data;
                }).catch(err => {
                    throw err
                });
            } else {
                return Info.findAll({where: {Tag: arg.tag}}).then(data => {
                    if (!data) return {status: 500};
                    return data;
                }).catch(err => {
                    throw err
                });
            }
            
        }
        
    },
    
    // 业务组主机列表
    group() {
        let promise = new Promise((resolve, reject) => {
            request(globConfig.nodeApi.api, function (error, response, body) {
                if (error) throw error;
                resolve(response);
            });
        });
        
        return promise;
        
    },
    
    // 搜索主机名
    searchName: (arg) => {
        let Host = selectTable();
        return Host.findOne({where: {Name: arg}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    },
    
};
