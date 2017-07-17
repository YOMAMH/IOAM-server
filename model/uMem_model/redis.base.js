/**
 * Created by renminghe on 2017/3/23.
 */
const Sequelize = require("../../global/sequelize");
const sequelize = require("sequelize");
const co = require('co');
const uclouldAuth = require('../../global/ucloudAuth');
const redisBaseChangeHistory = require('./redisBaseChangeHistory');

// 根选择不同数据表
function selectTable() {
    let Redis = Sequelize.define('umem_umemspace', {
        SpaceId: {    // 唯一id 主键 string
            type: sequelize.STRING,
            primaryKey: true
        },
        Zone: sequelize.STRING,    // 可用区域
        Name: sequelize.STRING,   // redis名称 string
        CreateTime: sequelize.INTEGER,   //创建时间 int
        Type: sequelize.STRING,    // 类型
        Protocol: sequelize.STRING,    // 数据库类型 redis\memcache
        Size: sequelize.INTEGER,    // 大小
        State: sequelize.STRING,    // 运行状态
        UsedSize: sequelize.INTEGER,    // 已使用大小
        ChargeType: sequelize.STRING,
        ExpireTime: sequelize.INTEGER,    // 有效时间
        Address: sequelize.STRING,    // 地址
        Tag: sequelize.STRING,    // 工作组
        Survive: sequelize.INTEGER,    // 存活状态

    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });

    return Redis;
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
    let Redis = selectTable();
    if (arg) {
        arg.Address = JSON.stringify(arg.Address);
        let argJson = JSON.stringify(arg);
        return Redis.create(arg).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return redisBaseChangeHistory.createChangeInfo(arg, argJson, "create");
        }).catch(function (err) {
            throw err;
        });
    }
}

// 获取本地数据
function selectData(arg) {

    let Redis = selectTable();
    if (arg.hasOwnProperty('SpaceId')) {
        return Redis.findOne({where: {SpaceId: arg.SpaceId, Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    } else if (arg.hasOwnProperty('type')) {
        return Redis.findAll({where: {Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    } else {
        return Redis.findAll({where: {Protocol: "redis", Survive: 1}, limit: 10, offset: arg ? arg : 0}).then((data) => {
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
    return uclouldAuth.getUMemBaseInfo({Region: reg, argId: arg});
}

// 更新信息
function redisInfoUpdate(arg) {
    let Redis = selectTable();
    if (arg.hasOwnProperty('SpaceId')) {
        arg.Address = JSON.stringify(arg.Address);
        let argJson = JSON.stringify(arg);
        return Redis.update(arg, {where: {SpaceId: arg.SpaceId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return redisBaseChangeHistory.createChangeInfo(arg, argJson, "update");
        }).catch(function (err) {
            throw err;
        });
    } else {
        return {status: 500};
    }
}

function hostInfoDelAll(arg) {
    let Redis = selectTable();
    let argJson = JSON.stringify(arg);
    if (arg.hasOwnProperty('SpaceId')) {

        return Redis.destroy({where: {SpaceId: arg.SpaceId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return redisBaseChangeHistory.createChangeInfo(arg, argJson, "delete");
        }).catch(function (err) {
            throw err;
        });
    } else {
        return {status: 500};
    }
}

function selectHistoryTable() {
    let Info = Sequelize.define("umem_redisbase_change_history_info",{
        id : {    // 主键自增id
            type: sequelize.INTEGER,
            primaryKey: true
        },
        SpaceId : sequelize.STRING,    // redis id
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
module.exports = {
    createChangeInfo:(arg, changeInfo, action) => {
        if (arg) {
            let Info = selectTable();
            return Info.create({
                SpaceId:arg.SpaceId,
                ChangeInfo:changeInfo,
                Action:action
            }).then((data) => {
                if (!data) return '';
                return data;
            }).catch((err) => console.log(err));
        }
    }
};

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
            SpaceId: createRes.dataValues.SpaceId,
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

    // 批量从ucloud导入信息
    redisInfoCopy: () => co(function *() {
        let hostArr = [];
        let bj2 = yield uclouldAuth.getUMemBaseInfo({Region: 'cn-bj2'});
        return handleUcloudData([bj2], hostArr);
    }),

    // 获取redis数据总数
    redisInfoCount: () => {
        let Redis = selectTable();
        return Redis.count({where:{Survive: 1}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    },

    // 获取本地主机信息
    redisInfo: (arg) => selectData(arg),

    // 获取ucloud主机数据
    redisInfoUCloud: (reg, arg) => getHostInfoById(reg, arg),

    // 创建redis数据
    redisCreate: (arg) => creatData(arg),

    // 更新redis信息
    redisInfoUpdate: (arg) => co(function *() {

        // 获取本地UHostId对应的数据
        let localInfo = yield selectData(arg);
        if (localInfo.hasOwnProperty('dataValues')) {
            let loca = localInfo.dataValues;

            loca.Address = JSON.parse(loca.Address);
            let flag = 0;
            let obj = {};
            obj.Address = [{}];

            // Address对比
            arg.Address.forEach((redisObj, item) => {
                Object.keys(redisObj).forEach((data) => {
                    if (redisObj[data] != loca.Address[item][data]) {
                        flag = 1;
                        obj.Address[item][data] = redisObj[data];
                    }
                });
            });

            // 其他属性对比
            Object.keys(arg).forEach((attr, data) => {
                if (attr != "Address") {
                    if ((loca[attr] != arg[attr])) {
                        flag = 1;
                        obj[attr] = arg[attr];
                    }
                }
            });

            // 如果是0说明没有数据没有变化
            if (flag == 0) {
                return {status: 201};
            } else {
                return redisInfoUpdate(arg, localInfo, obj);
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

    //  删除redis数据
    redisInfoDelete: (arg) => co(function *() {
        let delHost = yield selectData({SpaceId: arg});
        if (delHost.hasOwnProperty("dataValues")) {
            return hostInfoDelAll(delHost.dataValues);
        }
        return {status: 500};
    }),

    // 获取删除的主机信息
    hostDropInfo: (arg) => {
        let Info = selectHistoryTable();
        if (arg) {
            return Info.findAll({where: {SpaceId: arg, Action: "delete"}}).then((data) => {
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
        return redisInfoUpdate(arg);
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