/**
 * Created by renminghe on 2017/3/17.
 */
const Sequelize = require("../../global/sequelize");
const sequelize = require("sequelize");
const co = require('co');
const uclouldAuth = require('../../global/ucloudAuth');
const loadChangeHistory = require('./loadChangeHistory');

// 根选择不同数据表
function selectTable() {
    let Load = Sequelize.define('load_info_base', {
        ULBId: {    // 唯一id 主键 string
            type: sequelize.STRING,
            primaryKey: true
        },
        Tag: sequelize.STRING,   // 分组 string
        Name: sequelize.STRING,   // 主机名称 string
        CreateTime: sequelize.INTEGER,   //创建时间 默认当前时间 int
        Zone: sequelize.STRING,    // 可用区域
        VPCId: sequelize.STRING,
        SubnetId: sequelize.STRING,
        BusinessId: sequelize.STRING,
        PrivateIP: sequelize.STRING,    // 内网ip
        BandwidthType: sequelize.STRING,    // 带宽类型
        Bandwidth: sequelize.STRING,    // 带宽
        IPSet: sequelize.STRING,    // ip
        VServerSet: sequelize.STRING,
        ULBType: sequelize.STRING,
        Survive: sequelize.INTEGER,    // 存活状态

    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });

    return Load;
}

// 处理ucloud数据
function handleUcloudData(arg, arr) {
    if (arg instanceof Array) {
        arg.forEach((item, index) => {
            item = JSON.parse(item);
            if (item.TotalCount > 0) {
                item.DataSet.forEach((data) => {
                    if (index == 0) data['Zone'] = "cn-bj2";
                    if (index == 1) data['Zone'] = "hk";
                    arr.push(data);
                });
            }
        });
    }
    return arr;
}

// 插入数据库数据方法
function creatData(arg) {
    let Load = selectTable();
    if (arg) {
        arg.VServerSet = JSON.stringify(arg.VServerSet);
        arg.IPSet = JSON.stringify(arg.IPSet);
        let argJson = JSON.stringify(arg);
        return Load.create(arg).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return loadChangeHistory.createChangeInfo(arg, argJson, "create");
        }).catch(function (err) {
            throw err;
        });
    }
}

// 获取本地数据
function selectData(arg) {
    let Load = selectTable();
    if (arg.hasOwnProperty('ULBId')) {
        return Load.findOne({where: {ULBId: arg.ULBId, Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    } else if (arg.hasOwnProperty('type')) {
        return Load.findAll({where: {Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    } else {
        return Load.findAll({where: {Survive: 1}, limit: 10, offset: arg ? arg : 0}).then((data) => {
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
// arg : ULBId;
function getLoadInfoById(reg, arg) {
    return uclouldAuth.getLoadInfo(reg, arg);
}

// 更新信息
function loadInfoUpdate(arg) {
    let Load = selectTable();
    if (arg.hasOwnProperty('ULBId')) {
        arg.IPSet = JSON.stringify(arg.IPSet);
        arg.VServerSet = JSON.stringify(arg.VServerSet);
        let argJson = JSON.stringify(arg);
        return Load.update(arg, {where: {ULBId: arg.ULBId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return loadChangeHistory.createChangeInfo(arg, argJson, "update");
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
    if (arg.hasOwnProperty('ULBId')) {

        return Host.destroy({where: {ULBId: arg.ULBId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return loadChangeHistory.createChangeInfo(arg, argJson, "delete");
        }).catch(function (err) {
            throw err;
        });
    } else {
        return {status: 500};
    }
}

function selectHistoryTable() {
    let Info = Sequelize.define("load_change_history_info",{
        id : {    // 主键自增id
            type: sequelize.INTEGER,
            primaryKey: true
        },
        ULBId : sequelize.STRING,    // 主机id
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
            ULBId: createRes.dataValues.ULBId,
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

    // 本地数据量
    loadInfoCount: () => {
        let Load = selectTable();
        return Load.count({where: {Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    },

    // 批量从ucloud导入信息
    loadInfoCopy: () => co(function *() {
        let hostArr = [];
        let bj2 = yield uclouldAuth.getLoadInfo("cn-bj2", '','');
        let hk = yield uclouldAuth.getLoadInfo("hk", '', '');
        return handleUcloudData([bj2, hk], hostArr);
    }),

    // 创建主机
    loadCreate: (arg) => creatData(arg),

    // 本地负载均衡数据
    loadInfo: (arg) => selectData(arg),

    // 模糊搜索
    searchId: (arg) => {
        let Load = selectTable();
        return Load.findAll({where: {Name: {$like: '%' + arg.searchId + '%'}}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    },

    // ucloud数据
    loadInfoUCloud: (reg, arg) => getLoadInfoById(reg, arg),

    // 更新主机信息
    loadInfoUpdate: (arg) => co(function *() {

        // 获取本地UHostId对应的数据
        let localInfo = yield selectData(arg);
        if (localInfo.hasOwnProperty('dataValues')) {
            let flag = 0;
            let obj = {};
            obj.IPSet = {};
            obj.VServerSet = {};
            localInfo.dataValues.IPSet = JSON.parse(localInfo.dataValues.IPSet);
            localInfo.dataValues.VServerSet = JSON.parse(localInfo.dataValues.VServerSet);

            // IPSet数据比对
            localInfo.dataValues.IPSet.forEach((data, item) => {
                if (arg['IPSet'][data] != data[data]) {
                    obj['IPSet'][data] = arg['IPSet'][data];
                    flag = 1;
                }
            });


            // VServerSet数据比对
            // localInfo.dataValues.VServerSet
            if (arg['VServerSet'] instanceof Array) {
                let loca = localInfo.dataValues.VServerSet;
                arg['VServerSet'].forEach((data, index) => {
                    let v = '';
                    for (v in data) {
                        if (data[v] instanceof Array) {
                            if (data[v].length > 0) {
                                data[v].forEach((k,ki) => {
                                    Object.keys(k).forEach((kv) => {
                                        if (k[kv] instanceof Array) {
                                            k[kv].forEach((kkk, kki) => {
                                                Object.keys(kkk).forEach((ks) => {
                                                    if (kkk[ks] != loca[index][v][ki][kv][kki][ks]) {
                                                        flag = 1;
                                                        obj['VServerSet'][kv][ks] = loca[index][v][ki][kv][kki][ks];
                                                    }
                                                });
                                            });
                                        } else {
                                            if (k[kv]) {
                                                if (k[kv] != loca[index][v][ki][kv]) {
                                                    flag = 1;
                                                    obj['VServerSet'][kv] = loca[index][v][ki][kv];

                                                }
                                            }
                                        }
                                    })
                                });
                            }
                        } else {
                            if (arg['VServerSet'][index][v] && data[v] != arg['VServerSet'][index][v]) {
                                flag = 1;
                                obj['VServerSet'][v] = arg['VServerSet'][index][v];
                            }
                        }

                    }
                });
            }


            // 其他属性对比
            Object.keys(arg).forEach((attr, data) => {
                if (attr != "IPSet" && attr != "VServerSet") {
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
                    return loadInfoUpdate(arg, localInfo, obj);
                }
            } else {
                return {status: 500};
        }

    }),

    // 删除主机信息
    loadInfoDelete: (arg) => co(function *() {
        let delHost = yield selectData({ULBId: arg});
        if (delHost.hasOwnProperty("dataValues")) {
            return hostInfoDelAll(delHost.dataValues);
        }
        return {status: 500};
    }),

    // 获取删除的主机信息
    hostDropInfo: (arg) => {
        let Info = selectHistoryTable();
        if (arg) {
            return Info.findAll({where: {ULBId: arg, Action: "delete"}}).then((data) => {
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
        return loadInfoUpdate(arg);
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
    }

};