/**
 * Created by renminghe on 2017/5/15.
 */
const Sequelize = require('../../global/sequelize');
const sequelize = require('sequelize');
const hostChangeHistory = require('./hostChangeHistory');
const aliCloud = require('../../global/aliyunAuth/aliyunECS');
const co = require('co');
const crypto = require('crypto');

function selectTable() {
    let Host = Sequelize.define('ali_host_info_base', {
        InnerIpAddress: sequelize.STRING,            // 内网地址 string
        ImageId: sequelize.STRING,                   // 镜像id string
        InstanceTypeFamily: sequelize.STRING,        // 实例规格族 string
        VlanId: sequelize.STRING,
        InstanceId: {                                // 实例id，唯一主键
            type: sequelize,
            primaryKey: true
        },
        EipAddress: sequelize.STRING,                 // EipAddressAssociateType类型 string
        InternetMaxBandwidthIn: sequelize.INTEGER,    // 公网入带宽最大值 int
        ZoneId: sequelize.STRING,                     // 实例所属可用区 string
        InternetChargeType: sequelize.STRING,
        SpotStrategy: sequelize.STRING,
        SerialNumber: sequelize.STRING,
        IoOptimized: sequelize.STRING,
        Memory: sequelize.INTEGER,
        Cpu: sequelize.INTEGER,
        VpcAttributes: sequelize.STRING,
        InternetMaxBandwidthOut: sequelize.INTEGER,
        DeviceAvailable: sequelize.STRING,
        SecurityGroupIds: sequelize.STRING,
        AutoReleaseTime: sequelize.STRING,
        InstanceName: sequelize.STRING,
        Description: sequelize.STRING,
        OSType: sequelize.STRING,
        OSName: sequelize.STRING,
        InstanceNetworkType: sequelize.STRING,
        PublicIpAddress: sequelize.STRING,
        HostName: sequelize.STRING,
        InstanceType: sequelize.STRING,
        CreationTime: sequelize.STRING,
        Status: sequelize.STRING,
        ClusterId: sequelize.STRING,
        RegionId: sequelize.STRING,
        GPUSpec: sequelize.STRING,
        OperationLocks: sequelize.STRING,
        InstanceChargeType: sequelize.STRING,
        GPUAmount: sequelize.INTEGER,
        ExpiredTime: sequelize.STRING,
        
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    
    return Host;
}

// 变更记录表
function selectHistoryTable() {
    let Info = Sequelize.define("ali_host_change_history_info", {
        id: {    // 主键自增id
            type: sequelize.INTEGER,
            primaryKey: true
        },
        InstanceId: sequelize.STRING,    // 主机id
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
    hostInfoCount: () => {
        let Host = selectTable();
        return Host.count().then(data => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(err => {
            throw err;
        });
    },
    
    // 批量导入阿里云主机数据
    hostInfoCopy: () => co(function *() {
        let hostArr = [];
        let hb1 = yield aliCloud.describeInstances({RegionId: "cn-qingdao"});
        let hb2 = yield aliCloud.describeInstances({RegionId: "cn-beijing"});
        let hd1 = yield aliCloud.describeInstances({RegionId: "cn-hangzhou"});
        let hd2 = yield aliCloud.describeInstances({RegionId: "cn-shanghai"});
        return handleAlicloudData([hb1, hb2, hd1, hd2], hostArr);
    }),
    
    // 本地阿里云主机数据
    hostInfo: (arg) => selectData(arg),
    
    // 添加主机信息
    hostCreate: (arg) => creatData(arg),
    
    // 阿里云数据
    alCloudInfo: (arg) => aliCloud.describeInstances({RegionId: arg.region, InstanceIds:arg.id}),
    
    // 删除数据
    hostInfoDelete: (arg) => co(function *() {
        let delHost = yield selectData({InstanceId: arg});
        if (delHost.hasOwnProperty("dataValues")) {
            return hostInfoDelAll(delHost.dataValues);
        }
        return {status: 500};
    }),
    
    // 更新数据
    hostInfoUpdate: (arg) => co(function *() {
        let locaInfo = yield selectData({InstanceId: arg.InstanceId});
        if (locaInfo.hasOwnProperty('dataValues')) {
            let locaObj = locaInfo.dataValues;
            
            // 本地数据
            let locaInnerIpAddressStr = sha(locaObj.InnerIpAddress);
            let locaEipAddressStr = sha(locaObj.EipAddress);
            let locaVpcAttributesStr = sha(locaObj.VpcAttributes);
            let locaSecurityGroupIdsStr = sha(locaObj.SecurityGroupIds);
            let locaPublicIpAddressStr = sha(locaObj.PublicIpAddress);
            let locaOperationLocksStr = sha(locaObj.OperationLocks);
            
            // 远程数据
            let InnerIpAddressStr = sha(JSON.stringify(arg.InnerIpAddress));
            let EipAddressStr = sha(JSON.stringify(arg.EipAddress));
            let VpcAttributesStr = sha(JSON.stringify(arg.VpcAttributes));
            let SecurityGroupIdsStr = sha(JSON.stringify(arg.SecurityGroupIds));
            let PublicIpAddressStr = sha(JSON.stringify(arg.PublicIpAddress));
            let OperationLocksStr = sha(JSON.stringify(arg.OperationLocks));
    
            let flag = 0;
            
            Object.keys(arg).forEach((val, key) => {

                if(val !== "InnerIpAddress" && val !== "EipAddress" && val !== "VpcAttributes" &&
                    val !== "SecurityGroupIds" && val !== "PublicIpAddress" && val !== "OperationLocks") {

                    if (arg[val] !== locaObj[val]) {
                        flag = 1;
                        return;
                    }
                } else if (locaInnerIpAddressStr !==InnerIpAddressStr || locaEipAddressStr !== EipAddressStr
                    || locaVpcAttributesStr !== VpcAttributesStr || locaSecurityGroupIdsStr !== SecurityGroupIdsStr
                    || locaPublicIpAddressStr !== PublicIpAddressStr || locaOperationLocksStr !== OperationLocksStr) {
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
    hostInfoUpdateAll(arg) {
        return hostInfoUpdate(arg);
    },
    
    // 获取删除的主机信息
    hostDropInfo: (arg) => {
        let Info = selectHistoryTable();
        if (arg) {
            return Info.findAll({where: {InstanceId: arg, Action: "delete"}}).then((data) => {
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
    
    // 获取变更记录
    history(arg) {
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
    
    // others
    others(arg) {
        let Info = selectTable();
        if (arg.hasOwnProperty('tag') && arg.hasOwnProperty('zone')) {
            let queryObj = {};
            if (arg.zone !== "all") queryObj.RegionId = arg.zone;
            return Info.findAll({where: queryObj}).then(data => {
                if (!data) return {status: 500};
                return data;
            }).catch(err => {throw err});
        }
        
    },
    
};

// 处理ali云数据
function handleAlicloudData(arg, arr) {
    if (arg instanceof Array) {
        arg.forEach((item) => {
            if (item.hasOwnProperty('TotalCount') && item.TotalCount > 0) {
                item.Instances.Instance.forEach(data => {
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
        arg.InnerIpAddress = JSON.stringify(arg.InnerIpAddress);
        arg.EipAddress = JSON.stringify(arg.EipAddress);
        arg.VpcAttributes = JSON.stringify(arg.VpcAttributes);
        arg.SecurityGroupIds = JSON.stringify(arg.SecurityGroupIds);
        arg.PublicIpAddress = JSON.stringify(arg.PublicIpAddress);
        arg.OperationLocks = JSON.stringify(arg.OperationLocks);
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

// 获取本地阿里云主机数据
function selectData(arg) {
    
    let Host = selectTable();
    if (arg.hasOwnProperty('hostName')) {
        return Host.findAll({where: {InstanceName: {$like: '%' + arg.hostName + '%'}}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('InstanceId')) {
        return Host.findOne({where: {InstanceId: arg.InstanceId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('index')) {
        return Host.findAll({where: {}, limit: 10, offset: parseInt(arg.index)}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    } else if (arg.hasOwnProperty('type') && arg.type === "all") {
        return Host.findAll().then((data) => {
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
    if (arg.hasOwnProperty('InstanceId')) {
        
        return Host.destroy({where: {InstanceId: arg.InstanceId}}).then((data) => {
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

// 更新数据库
function hostInfoUpdate(arg) {
    let Host = selectTable();
    if (arg.hasOwnProperty('InstanceId')) {
        arg.InnerIpAddress = JSON.stringify(arg.InnerIpAddress);
        arg.EipAddress = JSON.stringify(arg.EipAddress);
        arg.VpcAttributes = JSON.stringify(arg.VpcAttributes);
        arg.SecurityGroupIds = JSON.stringify(arg.SecurityGroupIds);
        arg.PublicIpAddress = JSON.stringify(arg.PublicIpAddress);
        arg.OperationLocks = JSON.stringify(arg.OperationLocks);
        let argJson = JSON.stringify(arg);
        return Host.update(arg, {where: {InstanceId: arg.InstanceId}}).then((data) => {
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
            InstanceId: createRes.dataValues.InstanceId,
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