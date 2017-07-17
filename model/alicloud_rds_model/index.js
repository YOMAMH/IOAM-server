/**
 * Created by renminghe on 2017/5/15.
 */
const Sequelize = require('../../global/sequelize');
const sequelize = require('sequelize');
const changeHistory = require('./changeHistory');
const aliCloud = require('../../global/aliyunAuth/aliyunRDS');
const co = require('co');
const crypto = require('crypto');

function selectTable() {
    let RDS = Sequelize.define('ali_rds_info_base', {
        LockMode: sequelize.STRING,
        DBInstanceNetType: sequelize.STRING,
        DBInstanceId: {
            type: sequelize,
            primaryKey: true
        },
        ZoneId: sequelize.STRING,
        ReadOnlyDBInstanceIds: sequelize.STRING,
        DBInstanceDescription: sequelize.STRING,
        ConnectionMode: sequelize.STRING,
        InstanceNetworkType: sequelize.STRING,
        VSwitchId: sequelize.STRING,
        VpcId: sequelize.STRING,
        Engine: sequelize.STRING,
        MutriORsignle: sequelize.STRING,
        InsId: sequelize.INTEGER,
        ExpireTime: sequelize.STRING,
        CreateTime: sequelize.STRING,
        DBInstanceType: sequelize.STRING,
        RegionId: sequelize.STRING,
        EngineVersion: sequelize.STRING,
        LockReason: sequelize.STRING,
        DBInstanceStatus: sequelize.STRING,
        PayType: sequelize.STRING,
       
        
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    
    return RDS;
}

// 变更记录表
function selectHistoryTable() {
    let Info = Sequelize.define("ali_rds_change_history_info", {
        id: {    // 主键自增id
            type: sequelize.INTEGER,
            primaryKey: true
        },
        DBInstanceId: sequelize.STRING,    // 主机id
        ChangeInfo: sequelize.TEXT,    // 变更内容
        ChangeTime: sequelize.STRING,    // 变更时间
        Action: sequelize.STRING,    // 变更方式  create update  delete
        Tag : sequelize.STRING    // 所属业务组
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    return Info;
}


module.exports = {
    
    // 获取本地数据量
    localInfoCount: () => {
        let RDS = selectTable();
        return RDS.count().then(data => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(err => {
            throw err;
        });
    },
    
    // 批量导入阿里云主机数据
    InfoCopy: () => co(function *() {
        let hostArr = [];
        let hb2 = yield aliCloud.describeDBInstances({});
        return handleAlicloudData([hb2], hostArr);
    }),
    
    // 本地阿里云数据
    localInfo: (arg) => selectData(arg),
    
    // 添加主机信息
    hostCreate: (arg) => creatData(arg),
    
    // 阿里云数据
    instanceInfoALiCloud: (arg) => {
        if (!arg.hasOwnProperty("RegionId")) arg.RegionId ="";
        if (!arg.hasOwnProperty("DBInstanceId")) arg.DBInstanceId ="";
        return aliCloud.describeDBInstances({RegionId: arg.RegionId, DBInstanceId:arg.DBInstanceId});
    },
    
    // 删除数据
    instanceInfoDelete: (arg) => co(function *() {
        let delHost = yield selectData({DBInstanceId: arg});
        if (delHost.hasOwnProperty("dataValues")) {
            return hostInfoDelAll(delHost.dataValues);
        }
        return {status: 500};
    }),
    
    // 更新数据
    localInstanceInfoUpdate: (arg) => co(function *() {
        let locaInfo = yield selectData({DBInstanceId: arg.DBInstanceId});
        if (locaInfo.hasOwnProperty('dataValues')) {
            let locaObj = locaInfo.dataValues;
            
            // 本地数据
            let locaReadOnlyDBInstanceIdsStr = sha(locaObj.ReadOnlyDBInstanceIds);
            
            // 远程数据
            let ReadOnlyDBInstanceIdsStr = sha(JSON.stringify(arg.ReadOnlyDBInstanceIds));
    
            let flag = 0;
            
            Object.keys(arg).forEach((val, key) => {

                if(val !== "ReadOnlyDBInstanceIds" && val !== "MutriORsignle") {

                    if (arg[val] !== locaObj[val]) {
                        flag = 1;
                        return;
                    }
                } else if (locaReadOnlyDBInstanceIdsStr !== ReadOnlyDBInstanceIdsStr) {
                    flag = 1;
                    return;
                }
            });
    
            
            if (flag === 1) {
                flag = 0;
                return hostInfoUpdate(arg);
            } else {
                return {status:201};
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
            return Info.findAll({where: {DBInstanceId: arg, Action: "delete"}}).then((data) => {
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
                }};
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
            if (item.hasOwnProperty('TotalRecordCount') && item.TotalRecordCount > 0) {
                item.Items.DBInstance.forEach(data => {
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
        arg.ReadOnlyDBInstanceIds = JSON.stringify(arg.ReadOnlyDBInstanceIds);
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
    
    let RDS = selectTable();
    if (arg.hasOwnProperty('instanceName')) {
        return RDS.findAll({where: {DBInstanceDescription: {$like: '%' + arg.instanceName + '%'}}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('DBInstanceId')) {
        return RDS.findOne({where: {DBInstanceId: arg.DBInstanceId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('index')) {
        return RDS.findAll({where: {}, limit: 10, offset: parseInt(arg.index)}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('type') && arg.type === "all") {
        return RDS.findAll().then((data) => {
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
    if (arg.hasOwnProperty('DBInstanceId')) {
        
        return Host.destroy({where: {DBInstanceId: arg.DBInstanceId}}).then((data) => {
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
    if (arg.hasOwnProperty('DBInstanceId')) {
        arg.ReadOnlyDBInstanceIds = JSON.stringify(arg.ReadOnlyDBInstanceIds);
        let argJson = JSON.stringify(arg);
        return Host.update(arg, {where: {DBInstanceId: arg.DBInstanceId}}).then((data) => {
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
            DBInstanceId: createRes.dataValues.DBInstanceId,
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