/**
 * Created by renminghe on 2017/5/15.
 */
'use strict';
const Sequelize = require('../../global/sequelize');
const sequelize = require('sequelize');
const changeHistory = require('./changeHistory');
const aliCloud = require('../../global/aliyunAuth/aliyunVPC');
const co = require('co');
const crypto = require('crypto');

function selectTable() {
    let VPC = Sequelize.define('ali_vpc_info_base', {
        CreationTime: sequelize.STRING,
        CidrBlock: sequelize.STRING,
        VpcName: sequelize.STRING,
        Status: sequelize.STRING,
        Description: sequelize.STRING,
        VSwitchIds: sequelize.STRING,
        IsDefault: sequelize.STRING,
        UserCidrs: sequelize.STRING,
        RegionId: sequelize.STRING,
        VRouterId: sequelize.STRING,
        VpcId: {
            type: sequelize,
            primaryKey: true
        },
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    
    return VPC;
}

// 变更记录表
function selectHistoryTable() {
    let Info = Sequelize.define("ali_vpc_change_history_info", {
        id: {    // 主键自增id
            type: sequelize.INTEGER,
            primaryKey: true
        },
        VpcId: sequelize.STRING,    // id
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
        let VPC = selectTable();
        return VPC.count().then(data => {
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
        let hb2 = yield aliCloud.describeVpcs({});
        let hd1 = yield aliCloud.describeVpcs({RegionId: "cn-hangzhou"});
        return handleAlicloudData([hd1, hb2], hostArr);
    }),
    
    // 本地阿里云数据
    localInstanceInfo: (arg) => selectData(arg),
    
    // 添加主机信息
    localInstanceCreate: (arg) => creatData(arg),
    
    // 阿里云数据
    instanceInfoALiCloud: (arg) => {
        if (!arg.hasOwnProperty("RegionId")) arg.RegionId = "";
        if (!arg.hasOwnProperty("VpcId")) arg.VpcId = "";
        return aliCloud.describeVpcs({RegionId: arg.RegionId, VpcId: arg.VpcId});
    },
    
    // 删除数据
    localInstanceInfoDelete: (arg) => co(function *() {
        let delHost = yield selectData({VpcId: arg});
        if (delHost.hasOwnProperty("dataValues")) {
            return hostInfoDelAll(delHost.dataValues);
        }
        return {status: 500};
    }),
    
    // 更新数据
    localInstanceInfoUpdate: (arg) => co(function *() {
        let locaInfo = yield selectData({VpcId: arg.VpcId});
        if (locaInfo.hasOwnProperty('dataValues')) {
            let locaObj = locaInfo.dataValues;
            
            // 本地数据
            let locaVSwitchIdsStr = sha(locaObj.VSwitchIds);
            let locaUserCidrsStr = sha(locaObj.UserCidrs);
            
            // 远程数据
            let VSwitchIdsStr = sha(JSON.stringify(arg.VSwitchIds));
            let UserCidrsStr = sha(JSON.stringify(arg.UserCidrs));
            
            let flag = 0;
            
            Object.keys(arg).forEach((val, key) => {
                
                if (val !== "VSwitchIds" && val !== "UserCidrs" && val !== "IsDefault") {
                    if (arg[val] !== locaObj[val]) {
                        flag = 1;
                        return;
                    }
                } else if (locaVSwitchIdsStr !== VSwitchIdsStr || locaUserCidrsStr !== UserCidrsStr) {
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
            return Info.findAll({where: {VpcId: arg, Action: "delete"}}).then((data) => {
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
                item.Vpcs.Vpc.forEach(data => {
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
        arg.VSwitchIds = JSON.stringify(arg.VSwitchIds);
        arg.UserCidrs = JSON.stringify(arg.UserCidrs);
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
    
    let VPC = selectTable();
    if (arg.hasOwnProperty('instanceName')) {
        return VPC.findAll({where: {VpcName: {$like: `%${arg.instanceName}%`}}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('VpcId')) {
        return VPC.findOne({where: {VpcId: arg.VpcId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('index')) {
        return VPC.findAll({where: {}, limit: 10, offset: parseInt(arg.index)}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('type') && arg.type === "all") {
        return VPC.findAll().then((data) => {
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
    if (arg.hasOwnProperty('VpcId')) {
        
        return Host.destroy({where: {VpcId: arg.VpcId}}).then((data) => {
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
    if (arg.hasOwnProperty('VpcId')) {
        arg.VSwitchIds = JSON.stringify(arg.VSwitchIds);
        arg.UserCidrs = JSON.stringify(arg.UserCidrs);
        let argJson = JSON.stringify(arg);
        return Host.update(arg, {where: {VpcId: arg.VpcId}}).then((data) => {
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
            VpcId: createRes.dataValues.VpcId,
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