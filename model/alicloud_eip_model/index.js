/**
 * Created by renminghe on 2017/5/15.
 */
'use strict';
const Sequelize = require('../../global/sequelize');
const sequelize = require('sequelize');
const changeHistory = require('./changeHistory');
const aliCloud = require('../../global/aliyunAuth/aliyunECS');
const co = require('co');
const crypto = require('crypto');

function selectTable() {
    let EIP = Sequelize.define('ali_eip_info_base', {
        ChargeType: sequelize.STRING,
        Status: sequelize.STRING,
        AllocationId: {
            type: sequelize,
            primaryKey: true
        },
        AllocationTime: sequelize.STRING,
        InstanceId: sequelize.STRING,
        RegionId: sequelize.STRING,
        IpAddress: sequelize.STRING,
        OperationLocks: sequelize.STRING,
        ExpiredTime: sequelize.STRING,
        InternetChargeType: sequelize.STRING,
        InstanceType: sequelize.STRING,
        Bandwidth: sequelize.STRING,
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    
    return EIP;
}

// 变更记录表
function selectHistoryTable() {
    let Info = Sequelize.define("ali_eip_change_history_info", {
        id: {    // 主键自增id
            type: sequelize.INTEGER,
            primaryKey: true
        },
        AllocationId: sequelize.STRING,    // id
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
        let EIP = selectTable();
        return EIP.count().then(data => {
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
        let hb2 = yield aliCloud.describeEipAddresses({});
        return handleAlicloudData([hb2], hostArr);
    }),
    
    // 本地阿里云数据
    localInstanceInfo: (arg) => selectData(arg),
    
    // 添加主机信息
    localInstanceCreate: (arg) => creatData(arg),
    
    // 阿里云数据
    instanceInfoALiCloud: (arg) => {
        if (!arg.hasOwnProperty("RegionId")) arg.RegionId = "";
        if (!arg.hasOwnProperty("AllocationId")) arg.AllocationId = "";
        return aliCloud.describeEipAddresses({RegionId: arg.RegionId, AllocationId: arg.AllocationId});
    },
    
    // 删除数据
    localInstanceInfoDelete: (arg) => co(function *() {
        let delHost = yield selectData({AllocationId: arg});
        if (delHost.hasOwnProperty("dataValues")) {
            return hostInfoDelAll(delHost.dataValues);
        }
        return {status: 500};
    }),
    
    // 更新数据
    localInstanceInfoUpdate: (arg) => co(function *() {
        let locaInfo = yield selectData({AllocationId: arg.AllocationId});
        if (locaInfo.hasOwnProperty('dataValues')) {
            let locaObj = locaInfo.dataValues;
            
            // 本地数据
            let locaOperationLocksStr = sha(locaObj.OperationLocks);
            
            // 远程数据
            let OperationLocksStr = sha(JSON.stringify(arg.OperationLocks));
            
            let flag = 0;
            
            Object.keys(arg).forEach((val, key) => {
                
                if (val !== "OperationLocks") {
                    if (arg[val] !== locaObj[val]) {
                        console.log(val);
                        flag = 1;
                        return;
                    }
                } else if (locaOperationLocksStr !== OperationLocksStr) {
                    flag = 1;
                    return;
                }
            });
            
            
            if (flag === 1) {
                flag = 0;
                return hostInfoUpdate(arg);
            } else {
                return {status: 201};
            }
            
            
        } else {
            return {status: 404};
        }
        
    }),
    
    // 批量更新
    localInstanceInfoUpdateAll(arg) {
        return hostInfoUpdate(arg);
    },
    
    // 获取删除的主机信息
    localInstanceDropInfo: (arg) => {
        let Info = selectHistoryTable();
        if (arg) {
            return Info.findAll({where: {AllocationId: arg, Action: "delete"}}).then((data) => {
                if (!data) {
                    return {status: 500};
                }
                return data;
            }).catch(function (err) {
                throw err;
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
                throw err;
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
            if (item.hasOwnProperty('TotalCount') && item.TotalCount > 0) {
                item.EipAddresses.EipAddress.forEach(data => {
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
        arg.OperationLocks = JSON.stringify(arg.OperationLocks);
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
    
    let EIP = selectTable();
    if (arg.hasOwnProperty('instanceName')) {
        return EIP.findAll({where: {AllocationId: {$like: `%${arg.instanceName}%`}}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('AllocationId')) {
        return EIP.findOne({where: {AllocationId: arg.AllocationId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('index')) {
        return EIP.findAll({where: {}, limit: 10, offset: parseInt(arg.index)}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('type') && arg.type === "all") {
        return EIP.findAll().then((data) => {
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
function hostInfoDelAll(arg) {
    let Host = selectTable();
    let argJson = JSON.stringify(arg);
    if (arg.hasOwnProperty('AllocationId')) {
        
        return Host.destroy({where: {AllocationId: arg.AllocationId}}).then((data) => {
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
function hostInfoUpdate(arg) {
    let Host = selectTable();
    if (arg.hasOwnProperty('AllocationId')) {
        arg.OperationLocks = JSON.stringify(arg.OperationLocks);
        let argJson = JSON.stringify(arg);
        return Host.update(arg, {where: {AllocationId: arg.AllocationId}}).then((data) => {
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
            AllocationId: createRes.dataValues.AllocationId,
            Action: "delete"
        }
    }).then((data) => {
        if (!data) {
            return {status: 500};
        }
        return data;
    }).catch(function (err) {
        throw err;
    });
}

// SHA
function sha(strHash) {
    strHash = JSON.stringify(strHash);
    let shasum = crypto.createHash('sha1');
    shasum.update(strHash);
    return shasum.digest('hex');
}