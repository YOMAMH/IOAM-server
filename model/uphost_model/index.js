/**
 * Created by renminghe on 2017/3/16.
 */
const Sequelize = require("../../global/sequelize");
const sequelize = require("sequelize");
const co = require('co');
const uclouldAuth = require('../../global/ucloudAuth');
const hostChangeHistory = require('./upHostChangeHistory');

// 根选择不同数据表
function selectTable() {
    let UpHost = Sequelize.define('uphost_info_base', {
        PHostId: {    // 主机唯一id 主键 string
            type: sequelize.STRING,
            primaryKey: true
        },
        SN: sequelize.STRING,   // 序列号 string
        PMStatus: sequelize.STRING,    // 状态 string
        Tag: sequelize.STRING,   // 分组 string
        Name: sequelize.STRING,   // 主机名称 string
        DiskSet: sequelize.STRING,   // 操作系统磁盘 string
        IPSet: sequelize.STRING,   // IP设置 string
        OSname: sequelize.STRING,    // 操作系统名字 string
        OSType: sequelize.STRING,   // 操作系统类型 string
        CreateTime: sequelize.INTEGER,   //创建时间 默认当前时间 int
        Memory: sequelize.STRING,   // 内存 int
        Zone: sequelize.STRING,    // 可用区域 string
        ImageName: sequelize.STRING,    // 镜像名字 string
        Remark: sequelize.STRING,
        ChargeType: sequelize.STRING,
        ExpireTime: sequelize.INTEGER,
        AutoRenew: sequelize.STRING,
        PowerState: sequelize.STRING,
        PHostType: sequelize.STRING,    // 机型 string
        IsSupportKVM: sequelize.STRING,    // 是否支持KVM string
        CPUSet: sequelize.STRING,    // CPU信息 string
        Survive: sequelize.INTEGER,    // 存活状态


    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });

    return UpHost;
}

// 处理ucloud数据
function handleUcloudData(arg, arr) {
    if (arg instanceof Array) {
        arg.forEach((item) => {
            item = JSON.parse(item);
            if (item.TotalCount > 0) {
                item.PHostSet.forEach((data) => {
                    arr.push(data);
                });
            }
        });
    }
    return arr;
}

// 插入数据库数据方法
function creatData(arg) {
    let UpHost = selectTable();
    if (arg) {
        arg.DiskSet = JSON.stringify(arg.DiskSet);
        arg.IPSet = JSON.stringify(arg.IPSet);
        arg.CPUSet = JSON.stringify(arg.CPUSet);
        let argJson = JSON.stringify(arg);
        return UpHost.create(arg).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return hostChangeHistory.createChangeInfo(arg, argJson, "create");
        }).catch(function (err) {
            throw err;
        });
    }
}

// 获取本地数据
function selectData(arg) {
    let UpHost = selectTable();
    if (arg.hasOwnProperty('PHostId')) {
        return UpHost.findOne({where: {PHostId: arg.PHostId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    } else if (arg.hasOwnProperty('type')) {
        return UpHost.findAll({where: {Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    } else {
        return UpHost.findAll({where: {Survive: 1}, limit: 10, offset: arg ? arg : 0}).then((data) => {
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
    return uclouldAuth.getUpHostInfo(reg, arg);
}


// 更新主机信息
function hostInfoUpdate(arg) {
    let Host = selectTable();
    if (arg.hasOwnProperty('PHostId')) {
        arg.DiskSet = JSON.stringify(arg.DiskSet);
        arg.IPSet = JSON.stringify(arg.IPSet);
        arg.CPUSet = JSON.stringify(arg.CPUSet);
        let argJson = JSON.stringify(arg);
        return Host.update(arg, {where: {PHostId: arg.PHostId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return hostChangeHistory.createChangeInfo(arg, "更改信息：" + argJson, "update");
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
    if (arg.hasOwnProperty('PHostId')) {

        return Host.destroy({where: {PHostId: arg.PHostId}}).then((data) => {
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

// 还原主机数据
function resetData(arg) {
    let UpHost = selectTable();
    if (arg) {
        return UpHost.create(arg).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    }
}

// 变更记录表
function selectHistoryTable() {
    let Info = Sequelize.define("uphost_change_history_info",{
        id : {    // 主键自增id
            type: sequelize.INTEGER,
            primaryKey: true
        },
        PHostId : sequelize.STRING,    // 主机id
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

// 撤销删除
function cancleDelFun(createRes) {
    let Info = selectHistoryTable();
    return Info.destroy({
        where: {
            PHostId: createRes.dataValues.PHostId,
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
    upHostInfoCopy: () => co(function *() {
        let hostArr = [];
        let bj2 = yield uclouldAuth.getUpHostInfo("cn-bj2", '', '');
        return handleUcloudData([bj2], hostArr);
    }),

    // 添加主机信息
    upHostCreate: (arg) => creatData(arg),

    // 获取主机信息总数
    upHostInfoCount: () => {
        let UpHost = selectTable();
        return UpHost.count({where:{Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    },

    // 获取本地主机信息
    upHostInfo: (arg) => selectData(arg),

    // 获取ucloud主机数据
    hostInfoUCloud: (reg, arg) => getHostInfoById(reg, arg),

    // 模糊搜索
    searchId: (arg) => {
        let UpHost = selectTable();
        return UpHost.findAll({where: {Name:{$like:'%'+arg.searchId+'%'}}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    },

    // 更新主机信息
    hostInfoUpdate: (arg) => co(function *() {

        // 获取本地UHostId对应的数据
        let localInfo = yield selectData(arg);
        if (localInfo.hasOwnProperty('dataValues')) {
            let flag = 0;
            let obj = {};
            obj.IPSet = {};
            obj.DiskSet = {};
            obj.CPUSet = {};
            localInfo.dataValues.IPSet = JSON.parse(localInfo.dataValues.IPSet);
            localInfo.dataValues.DiskSet = JSON.parse(localInfo.dataValues.DiskSet);
            localInfo.dataValues.CPUSet = JSON.parse(localInfo.dataValues.CPUSet);

            // IPSet数据比对
            localInfo.dataValues.IPSet.forEach((data, item) => {
                Object.keys(data).forEach((res, index) => {
                    if (arg['IPSet'][item][res] != data[res]) {
                        flag = 1;
                        obj['IPSet'][res] = arg['IPSet'][item][res];
                    }
                });
            });

            // DiskSet数据比对
            localInfo.dataValues.DiskSet.forEach((data, item) => {
                Object.keys(data).forEach((res, index) => {

                    if (arg['DiskSet'][item][res] != data[res]) {
                        flag = 1;
                        obj['DiskSet'][res] = arg['DiskSet'][item][res];

                    }
                });
            });

            // CPUSet数据比对
            if (localInfo.dataValues.CPUSet instanceof Array) {
                localInfo.dataValues.CPUSet.forEach((data, item) => {
                    Object.keys(data).forEach((res, index) => {

                        if (arg['CPUSet'][item][res] != data[res]) {
                            flag = 1;
                            obj['CPUSet'][res] = arg['CPUSet'][item][res];

                        }
                    });
                });
            } else {
                Object.keys(localInfo.dataValues.CPUSet).forEach( (data) => {
                    if (localInfo.dataValues.CPUSet.data != arg.CPUSet.data) {
                        flag = 1;
                        obj['CPUSet'][res] = arg['CPUSet'][data];
                    }
                });
            }


            // 其他属性对比
            Object.keys(arg).forEach((attr, data) => {
                if (attr != "IPSet" && attr != "DiskSet" && attr != "CPUSet") {
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
                return hostInfoUpdate(arg, localInfo, obj);
            }
        } else {
            return {status: 500};
        }

    }),

    // 删除主机信息
    hostInfoDelete: (arg) => co(function *() {
        let delHost = yield selectData({PHostId: arg});
        if (delHost.hasOwnProperty("dataValues")) {
            return hostInfoDelAll(delHost.dataValues);
        }
        return {status: 500};
    }),

    // 获取删除的主机信息
    hostDropInfo: (arg) => {
        let Info = selectHistoryTable();
        if (arg) {
            return Info.findAll({where: {PHostId: arg, Action: "delete"}}).then((data) => {
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
                }};
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

};