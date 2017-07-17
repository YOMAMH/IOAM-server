/**
 * Created by renminghe on 2017/5/15.
 */
"use strict";
const Sequelize = require('../../global/sequelize');
const sequelize = require('sequelize');
const changeHistory = require('./changeHistory');
const aliCloud = require('../../global/aliyunAuth/aliyunSLB');
const co = require('co');
const crypto = require('crypto');

function selectTable() {
    let SLB = Sequelize.define('ali_slb_info_base', {
        CreateTimeStamp: sequelize.INTEGER,
        LoadBalancerName: sequelize.STRING,
        RegionIdAlias: sequelize.STRING,
        LoadBalancerId: {
            type: sequelize.STRING,
            primaryKey: true
        },
        VSwitchId: sequelize.STRING,
        InternetChargeType: sequelize.STRING,
        VpcId: '',
        SlaveZoneId: sequelize.STRING,
        NetworkType: sequelize.STRING,
        MasterZoneId: sequelize.STRING,
        CreateTime: sequelize.STRING,
        Address: sequelize.STRING,
        RegionId: sequelize.STRING,
        AddressType: sequelize.STRING,
        PayType: sequelize.STRING,
        LoadBalancerStatus: sequelize.STRING
        
        
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    
    return SLB;
}

// 变更记录表
function selectHistoryTable() {
    let Info = Sequelize.define("ali_slb_change_history_info", {
        id: {    // 主键自增id
            type: sequelize.INTEGER,
            primaryKey: true
        },
        LoadBalancerId: sequelize.STRING,    // id
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


module.exports = {
    
    // 获取本地数据量
    localInstanceInfoCount: () => {
        let SLB = selectTable();
        return SLB.count().then(data => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(err => {
            throw err;
        });
    },
    
    // 批量导入阿里云主机数据
    cloudInstanceInfoCopy: () => co(function *() {
        let hostArr = [];
        let hb2 = yield aliCloud.describeLoadBalancers({});
        console.log(hb2);
        return handleAlicloudData([hb2], hostArr);
    }),
    
    // 本地阿里云数据
    localInstanceInfo: (arg) => selectData(arg),
    
    // 添加实例信息
    localInstanceCreate: (arg) => creatData(arg),
    
    // 阿里云数据
    instanceInfoALiCloud: (arg) => {
        if (!arg.hasOwnProperty("RegionId")) arg.RegionId = "";
        if (!arg.hasOwnProperty("LoadBalancerId")) arg.LoadBalancerId = "";
        return aliCloud.describeLoadBalancers({RegionId: arg.RegionId, LoadBalancerId: arg.LoadBalancerId});
    },
    
    // 删除数据
    localInstanceInfoDelete: (arg) => co(function *() {
        let delInstance = yield selectData({LoadBalancerId: arg});
        if (delInstance.hasOwnProperty("dataValues")) {
            return localInstanceInfoDelAll(delInstance.dataValues);
        }
        return {status: 500};
    }),
    
    // 更新数据
    localInstanceInfoUpdate: (arg) => co(function *() {
        let locaInstanceInfo = yield selectData({LoadBalancerId: arg.LoadBalancerId});
        let flag = 0;
        if (locaInstanceInfo.hasOwnProperty('dataValues')) {
            let locaInstanceInfoObj = locaInstanceInfo.dataValues;
            Object.keys(arg).forEach((val, key) => {
                if (val !== "InternetChargeType") {
                    if (arg[val] !== locaInstanceInfoObj[val]) {
                        flag = 1;
                        return;
                    }
                }
            });
            
            
            if (flag === 1) {
                flag = 0;
                return localInstanceInfoUpdate(arg);
            } else {
                return {status: 201};
            }
            
            
        } else {
            return {status: 404};
        }
        
    }),
    
    // 批量更新
    localInstanceInfoUpdateAll: (arg) => localInstanceInfoUpdate(arg),
    
    // 获取删除的主机信息
    localInstanceDropInfo: (arg) => {
        let Info = selectHistoryTable();
        if (arg) {
            return Info.findAll({where: {LoadBalancerId: arg, Action: "delete"}}).then((data) => {
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
            throw err;
        });
    },
    
    // 撤销删除
    cancelDropLocalInstance: function (arg) {
        let self = this;
        return co(function *() {
            let dropInfo = yield self.localInstanceDropInfo(arg);
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
    
    // 获取变更记录
    localInstance(arg) {
        let Info = selectHistoryTable();
        if (arg.hasOwnProperty('endDate') && arg.hasOwnProperty('begDate') && arg.hasOwnProperty('tag')) {
            let obj = {
                ChangeTime: {
                    lt: arg.endDate,
                    gte: arg.begDate
                }
            };
            if (arg.tag !== "all") obj['Tag'] = arg.tag;
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
    
};

// 处理ali云数据
function handleAlicloudData(arg, arr) {
    if (arg instanceof Array) {
        arg.forEach((item) => {
            if (item.hasOwnProperty('LoadBalancers') && item.LoadBalancers.hasOwnProperty('LoadBalancer')
                && item.LoadBalancers.LoadBalancer.length > 0) {
                item.LoadBalancers.LoadBalancer.forEach(data => {
                    arr.push(data);
                });
                
            }
        });
    }
    return arr;
}

// 添加主机信息
function creatData(arg) {
    let Host = selectTable();
    if (arg) {
        let argStr = JSON.stringify(arg);
        
        return Host.create(arg).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return changeHistory.createChangeInfo(arg, argStr, "create");
        }).catch(function (err) {
            throw err;
        });
    }
}

// 获取本地阿里云主机数据
function selectData(arg) {
    
    let SLB = selectTable();
    if (arg.hasOwnProperty('instanceName')) {
        return SLB.findAll({where: {LoadBalancerName: {$like: `%${arg.instanceName}%`}}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('LoadBalancerId')) {
        return SLB.findOne({where: {LoadBalancerId: arg.LoadBalancerId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('index')) {
        return SLB.findAll({where: {}, limit: 10, offset: parseInt(arg.index)}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('type') && arg.type === "all") {
        return SLB.findAll().then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    }
}

// 删除本地数据
function localInstanceInfoDelAll(arg) {
    let Host = selectTable();
    let argJson = JSON.stringify(arg);
    if (arg.hasOwnProperty('LoadBalancerId')) {
        
        return Host.destroy({where: {LoadBalancerId: arg.LoadBalancerId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return changeHistory.createChangeInfo(arg, argJson, "delete");
        }).catch(function (err) {
            throw err;
        });
    } else {
        return {status: 500};
    }
}

// 更新数据库
function localInstanceInfoUpdate(arg) {
    let Host = selectTable();
    if (arg.hasOwnProperty('LoadBalancerId')) {
        
        let argJson = JSON.stringify(arg);
        return Host.update(arg, {where: {LoadBalancerId: arg.LoadBalancerId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return changeHistory.createChangeInfo(arg, argJson, "update");
        }).catch(function (err) {
            throw err;
        });
    } else {
        return {status: 500};
    }
}

// 还原实例数据
function resetData(arg) {
    let Instance = selectTable();
    if (arg) {
        return Instance.create(arg).then((data) => {
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
            LoadBalancerId: createRes.dataValues.LoadBalancerId,
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

// SHA
function sha(strHash) {
    strHash = JSON.stringify(strHash);
    let shasum = crypto.createHash('sha1');
    shasum.update(strHash);
    return shasum.digest('hex');
}