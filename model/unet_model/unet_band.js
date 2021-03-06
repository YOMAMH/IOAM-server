/**
 * Created by renminghe on 2017/4/10.
 */
const Sequelize = require("../../global/sequelize");
const sequelize = require("sequelize");
const co = require('co');
const crypto = require('crypto');
const uclouldAuth = require('../../global/ucloudAuth');
const ChangeHistory = require('./unet_band_changeHistory');

// 根选择不同数据表
function selectTable() {
    let Host = Sequelize.define('unet_band_base', {
        ShareBandwidthId: {    // 唯一id 主键 string
            type: sequelize.STRING,
            primaryKey: true
        },
        ShareBandwidth: sequelize.INTEGER,
        Name: sequelize.STRING,
        ExpireTime: sequelize.INTEGER,
        CreateTime: sequelize.INTEGER,   //创建时间 默认当前时间 int
        ChargeType: sequelize.STRING,
        EIPSet: sequelize.STRING,
        Zone: sequelize.STRING
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    
    return Host;
}

// 变更记录表
function selectHistoryTable() {
    let Info = Sequelize.define("unet_band_change_history_info",{
        id : {    // 主键自增id
            type: sequelize.INTEGER,
            primaryKey: true
        },
        ShareBandwidthId : sequelize.STRING,
        ChangeInfo : sequelize.TEXT,    // 变更内容
        ChangeTime : sequelize.STRING,    // 变更时间
        Action : sequelize.STRING,    // 变更方式  create update  delete
        Tag : sequelize.STRING    // 所属业务组
    },{
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
    if (arg.hasOwnProperty('ShareBandwidthId')) {
        return Host.findOne({where: {ShareBandwidthId: arg.ShareBandwidthId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    } else if (arg.hasOwnProperty('type')) {
        return Host.findAll().then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    } else {
        return Host.findAll({where: {}, limit: 10, offset: arg ? arg : 0}).then((data) => {
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
        arg.EIPSet = JSON.stringify(arg.EIPSet);
        let argStr = JSON.stringify(arg);
        return Host.create(arg).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return ChangeHistory.createChangeInfo(arg, argStr, "create");
        }).catch(function (err) {
            throw err;
        });
    }
}

// 还原主机数据
function resetData(arg) {
    let Host = selectTable();
    if (arg) {
        arg.EIPSet = JSON.stringify(arg.EIPSet);
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
function getInfoById(reg, arg) {
    return uclouldAuth.getUnetBandInfo({Region: reg, argId: arg});
}

// 更新主机信息
function hostInfoUpdate(arg) {
    let Ip = selectTable();
    if (arg.hasOwnProperty('ShareBandwidthId')) {
        arg.EIPSet = JSON.stringify(arg.EIPSet);
        let argJson = JSON.stringify(arg);
        return Ip.update(arg, {where: {ShareBandwidthId: arg.ShareBandwidthId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return ChangeHistory.createChangeInfo(arg, argJson, "update");
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
    if (arg.hasOwnProperty('ShareBandwidthId')) {
        
        return Host.destroy({where: {ShareBandwidthId: arg.ShareBandwidthId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return ChangeHistory.createChangeInfo(arg, argJson, "delete");
        }).catch(function (err) {
            throw err;
        });
    } else {
        return {status: 500};
    }
}

function handleUcloudData(arg, arr) {
    let rangeArr = ["cn-bj1", "cn-bj2", "hk"];
    if (arg instanceof Array) {
        arg.forEach((item, i) => {
            item = JSON.parse(item);
            if (item.TotalCount > 0) {
                item.DataSet.forEach((data) => {
                    data['Zone'] = rangeArr[i];
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
            ShareBandwidthId: createRes.dataValues.ShareBandwidthId,
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
    let shasum = crypto.createHash('sha1');
    shasum.update(strHash);
    return shasum.digest('hex');
}

module.exports = {
    
    // 获取本地信息
    Info: (arg) => selectData(arg),
    
    // 添加信息
    createInfo: (arg) => creatData(arg),
    
    // 获取ucloud主机数据
    InfoUCloud: (reg, arg) => getInfoById(reg, arg),
    
    // 更新信息
    InfoUpdate: (arg) => co(function *() {
        // 获取本地UHostId对应的数据
        let localInfo = yield selectData(arg);
        if (localInfo.hasOwnProperty('dataValues')) {
            
            // EIPSet数据比对
            if (sha(localInfo.dataValues.EIPSet) !== sha(JSON.stringify(arg.EIPSet))) return hostInfoUpdate(arg);
            
            // 其他属性对比
            for (let k in arg) {
                if (k !== "EIPSet") {
                    if (localInfo.dataValues[k]) {
                        if ((localInfo.dataValues[k] !== arg[k])) {
                            return hostInfoUpdate(arg);
                        }
                    }
                    
                }
            }
            return {status: 201};
            
        } else {
            return {status: 500};
        }
        
    }),
    
    // 删除主机信息
    InfoDelete: (arg) => co(function *() {
        let delHost = yield selectData({ShareBandwidthId: arg});
        if (delHost.hasOwnProperty("dataValues")) {
            return hostInfoDelAll(delHost.dataValues);
        }
        return {status: 500};
    }),
    
    // 获取信息总数
    InfoCount: () => {
        let IP = selectTable();
        return IP.count().then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    },
    
    // 批量从ucloud导入主机信息
    InfoCopy: () => co(function *() {
        let hostArr = [];
        let bj1 = yield uclouldAuth.getUnetBandInfo({Region: "cn-bj1"});
        let bj2 = yield uclouldAuth.getUnetBandInfo({Region: "cn-bj2"});
        return handleUcloudData([bj1, bj2], hostArr);
    }),
    
    // 模糊搜索
    searchId: (arg) => {
        let Host = selectTable();
        return Host.findAll({where: {Name: {$like: '%' + arg.searchId + '%'}}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    },
    
    // 获取删除的主机信息
    dropInfo: (arg) => {
        let Info = selectHistoryTable();
        if (arg) {
            return Info.findAll({where: {ShareBandwidthId: arg, Action: "delete"}}).then((data) => {
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
    cancelDrop: function (arg) {
        let self = this;
        return co(function *() {
            let dropInfo = yield self.dropInfo(arg);
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
    InfoUpdateAll(arg) {
        return hostInfoUpdate(arg);
    },
    
    // 批量删除
    InfoDelAll(arg) {
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
