/**
 * Created by renminghe on 2017/3/23.
 */
const co = require('co');
const RedisBase = require('../../model/uMem_model/redis.base');
const RedisGroup = require('../../model/uMem_model/redis.group');
const crypto = require('crypto');
const ckAuKey = require('../../global/checkAuthKey');
let successCount = 0;

module.exports = {
    
    // 加密校验
    ckAuKeyFun: (req, res, next) => {
        ckAuKey(req, res, (data) => {
            if (data) {
                next();
            } else {
                res.createFailure();
            }
            
        })
    },

    // 获取redisBase信息
    redisBaseInfo: (req, res) => co(function *() {

        if (req.body.hasOwnProperty('SpaceId')) {

            let result = yield RedisBase.redisInfo(req.body);
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }

        } else if (req.body.hasOwnProperty('index')) {
            let result = yield RedisBase.redisInfo(parseInt(req.body.index));
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        } else if (req.body.hasOwnProperty('searchId')) {
            let result = yield RedisBase.searchId(req.body);
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        }
    }),

    // 获取redisGroup信息
    redisGroupInfo: (req, res) => co(function *() {

        if (req.body.hasOwnProperty('GroupId')) {

            let result = yield RedisGroup.redisInfo(req.body);
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }

        } else if (req.body.hasOwnProperty('index')) {
            let result = yield RedisGroup.redisInfo(parseInt(req.body.index));
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        } else if (req.body.hasOwnProperty('searchId')) {
            let result = yield RedisGroup.searchId(req.body);
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        }
    }),

    // 添加redis信息
    redisCreate: (req, res) => co(function *() {

        if (req.body.redisType == "base") {
            // 本地查重
            let result = yield RedisBase.redisInfo(req.body.info);
            if (result.hasOwnProperty('status') && result.status == 500) {
                let createResult = yield RedisBase.redisCreate(req.body.info);
                if (createResult) {
                    if (createResult.hasOwnProperty('dataValues')) {
                        res.createSuccess();
                    }
                } else {
                    res.createFailure({reason: createResult});
                }
            } else {
                res.createFailure({reason: "HostId existed"});
            }
        } else if (req.body.redisType == "group") {
            // 本地查重
            let result = yield RedisGroup.redisInfo(req.body.info);
            if (result.hasOwnProperty('status') && result.status == 500) {
                let createResult = yield RedisGroup.redisCreate(req.body.info);
                if (createResult) {
                    if (createResult.hasOwnProperty('dataValues')) {
                        res.createSuccess();
                    }
                } else {
                    res.createFailure({reason: createResult});
                }
            } else {
                res.createFailure({reason: "HostId existed"});
            }
        }


    }),

    // redisBaseucloud数据
    redisBaseInfoUCloud: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('id') && req.body.hasOwnProperty('reg')) {
            let result = yield RedisBase.redisInfoUCloud(req.body.reg, req.body.id);
            result = JSON.parse(result);
            if (result.hasOwnProperty('DataSet')) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        }

    }),

    // redisGroupcloud数据
    redisGroupInfoUCloud: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('id') && req.body.hasOwnProperty('reg')) {
            let result = yield RedisGroup.redisInfoUCloud(req.body.reg, req.body.id);
            result = JSON.parse(result);
            if (result.hasOwnProperty('DataSet')) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        }

    }),

    /**
     * 更新主机信息
     * @param req
     * @param res
     * 通过arg传递UHostId，先通过ucloud获取数据，
     * 更新本地数据库，并记录到变更记录表
     */
    redisInfoUpdate: (req, res) => co(function *() {

        if (req.body.type == "分布式版") {
            let result = yield RedisBase.redisInfoUCloud(req.body.reg, req.body.Id);     // 获取ucloud主机信息
            result = JSON.parse(result);
            if (result.TotalCount != 0) {
                let upResult = yield RedisBase.redisInfoUpdate(result.DataSet[0]);
                if (upResult.hasOwnProperty('status') && upResult.status == 500) {
                    res.createFailure({reason: upResult});

                } else if (upResult.hasOwnProperty('status') && upResult.status == 201) {
                    res.createFailure({reason: "data not changed"});
                } else {
                    res.createSuccess();
                }

            } else {
                res.createFailure({reason: "network error"});
            }
        } else if (req.body.type == "主备版") {
            let result = yield RedisGroup.redisInfoUCloud(req.body.reg, req.body.Id);     // 获取ucloud主机信息
            result = JSON.parse(result);
            if (result.TotalCount != 0) {
                let upResult = yield RedisGroup.redisInfoUpdate(result.DataSet[0]);
                if (upResult.hasOwnProperty('status') && upResult.status == 500) {
                    res.createFailure({reason: upResult});

                } else if (upResult.hasOwnProperty('status') && upResult.status == 201) {
                    res.createFailure({reason: "data not changed"});
                } else {
                    res.createSuccess();
                }

            } else {
                res.createFailure({reason: "network error"});
            }
        }

    }),

    // 初次获取本地信息总数
    redisInfoCount: (req, res) => co(function *() {
        let resultBase = yield RedisBase.redisInfoCount();
        let resultGroup = yield RedisGroup.redisInfoCount();

        if (resultBase.status == 500 && resultGroup.status == 500) {
            res.createSuccess({content: resultBase});
        } else {
            res.createFailure();
        }
    }),

    // 获取本地信息总数
    redisTotalCount: (req, res) => co(function *() {
        let resultBase = yield RedisBase.redisInfoCount();
        let resultGroup = yield RedisGroup.redisInfoCount();
        
        if ((resultBase.hasOwnProperty('status') && resultBase.status === 500) && (resultGroup.hasOwnProperty('status') && resultGroup.status === 500)) {
            res.createFailure();
        } else {
            if (resultBase.hasOwnProperty('status') && resultBase.status === 500) {
                res.createSuccess({content: resultGroup});
            } else if (resultGroup.hasOwnProperty('status') && resultGroup.status === 500) {
                res.createSuccess({content: resultBase});
            } else {
                res.createSuccess({content: resultBase > resultGroup ? resultBase : resultGroup});
            }
        }
    }),

    // 批量导入信息
    redisInfoCopy: (req, res) => co(function *() {
        let resultBase = yield RedisBase.redisInfoCopy();    // 获取redis分布式版数据
        let resultGroup = yield RedisGroup.redisInfoCopy();    // 获取redis主备版数据
        if (resultBase.length > 0 && resultGroup.length > 0) {
            let count = 0;
            let flag = 0;
            resultBase.forEach((val) => {    // 存入redis_base表
                co(function *() {
                    let resItem = yield RedisBase.redisCreate(val);
                    if (resItem.hasOwnProperty('dataValues')) {
                        count++;
                        if (count == resultBase.length - 1) {

                        } else {
                            flag = 1;
                        }
                    }
                });
            });

            count = 0;
            resultGroup.forEach((val) => {     // 存入redis_group表
                co(function *() {
                    let resItem = yield RedisGroup.redisCreate(val);
                    if (resItem.hasOwnProperty('dataValues')) {
                        count++;
                        if (count == resultGroup.length - 1) {

                        } else {
                            flag = 1;
                        }
                    }
                });
            });

            if (flag == 0) {
                res.createSuccess();
            } else {
                res.createFailure();
            }
        } else {
            res.createFailure();
        }
    }),

    // 删除redis数据
    redisInfoDelete: (req, res) => co(function *() {
        if (req.body.type == "分布式版") {
            let result = yield RedisBase.redisInfoDelete(req.body.hostId);
            if (result.hasOwnProperty('dataValues')) {
                res.createSuccess();
            } else {
                res.createFailure();
            }
        } else if (req.body.type == "主备版") {
            let result = yield RedisGroup.redisInfoDelete(req.body.hostId);
            if (result.hasOwnProperty('dataValues')) {
                res.createSuccess();
            } else {
                res.createFailure();
            }
        }

    }),

    // 获取删除的主机信息
    hostDropInfoBase: (req, res) => co(function *() {
        let result = yield RedisBase.hostDropInfo();
        if (result.length > 0) {
            let resArr = [];
            result.forEach((data) => {
                if (data.hasOwnProperty('dataValues')) {
                    resArr.push(JSON.parse(data['dataValues']['ChangeInfo']));
                }
            });
            resArr.forEach((data) => {
                Object.keys(data).forEach((da) => {
                    if (da == 'Address') {
                        data[da] = JSON.parse(data[da]);
                    }
                });
            });
            res.createSuccess({content: resArr});
        } else {
            res.createFailure();
        }
    }),

    // 获取删除的主机信息
    hostDropInfoGroup: (req, res) => co(function *() {
        let result = yield RedisGroup.hostDropInfo();
        if (result.length > 0) {
            let resArr = [];
            result.forEach((data) => {
                if (data.hasOwnProperty('dataValues')) {
                    resArr.push(JSON.parse(data['dataValues']['ChangeInfo']));
                }
            });
            res.createSuccess({content: resArr});
        } else {
            res.createFailure();
        }
    }),

    // 撤销删除
    cancelDropHost: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('UHostId') && req.body.hasOwnProperty('type')) {
            if (req.body.type == "分布式版") {
                let result = yield RedisBase.cancelDropHost(req.body.UHostId);
                if (result) {
                    res.createSuccess();
                } else {
                    res.createFailure();
                }
            } else if (req.body.type == "主备版") {
                let result = yield RedisGroup.cancelDropHost(req.body.UHostId);
                if (result) {
                    res.createSuccess();
                } else {
                    res.createFailure();
                }
            }

        }
    }),

    // 批量更新
    updateAll: (req, res) => co(function *() {
        let resultBase = yield RedisBase.redisInfoCopy();    // 获取redis分布式版数据
        let resultGroup = yield RedisGroup.redisInfoCopy();    // 获取redis主备版数据
        let resultBaseLocal = yield RedisBase.redisInfo(req.body);    // 本地数据
        let resultGroupLocal = yield RedisGroup.redisInfo(req.body);    // 本地数据
        let result1 = checkJson(resultBase, resultBaseLocal, res, "base");
        let result2 = checkJson(resultGroup, resultGroupLocal, res, "group");
        if (result1 || result2) {
            res.createSuccess();
        } else if (!result1 && !result2) {
            res.createFailure({reason: "data not changed"});
        }
    }),

    // 变更记录
    history: (req, res) => co(function *() {
        let result1 = yield RedisBase.history(req.query);
        let result2 = yield RedisGroup.history(req.query);
        if (result1 && result2) {
            result1.forEach((data) => {
               result2.push(data);
            });
            res.createSuccess({content: result2});
        } else {
            res.createFailure();
        }
    })

};

// 数据比对
function checkJson(arg, localInfo, res, type) {
    let typeClass = RedisBase;
    if (type == "group") typeClass = RedisGroup;
    let objArr = [{}];
    localInfo.forEach((data) => {
        Object.keys(data).forEach((f) => {
            if (f == "dataValues") {
                if (data[f].hasOwnProperty('Address')) {
                    data[f]['Address'] = JSON.parse(data[f]['Address']);
                }
                objArr.push(data[f]);
            }
        });
    });

    let bojDel = [];    // 存储本地有ucloud没有的数据
    let bojAdd = [];    // 存储ucloud有本地没有的数据
    let bojBase = [];    // 存储本地与ucloud不同的数据

    let argStr = JSON.stringify(localInfo);    // 字符化ucloud数据
    objArr.forEach((data, item) => {
        Object.keys(data).forEach((obj) => {
            let ty = 0;
            if (arg && arg.length > 0) {
                arg.forEach((da, i) => {
                    if (type == "base") {
                        if (argStr.indexOf('"SpaceId":"' + da['SpaceId'] + '"') == -1) {
                            bojAdd[i] = da;
                        }

                        if (da["SpaceId"] == data["SpaceId"]) {
                            ty = 1;
                            // Address数据比对
                            let uclAddress = sha(JSON.stringify(da['Address']));
                            let localAddress = sha(JSON.stringify(data['Address']));
                            if (uclAddress != localAddress) bojBase[item] = da;

                            // 其他数据
                            Object.keys(da).forEach((y) => {
                                if (y != "Address" && y != "UsedSize") {
                                    if (da[y]) {
                                        if (da[y] != data[y]) {
                                            bojBase[item] = da;
                                        }
                                    }
                                }
                            });
                        }
                    } else if (type == "group") {
                        if (argStr.indexOf('"GroupId":"' + da['GroupId'] + '"') == -1) {
                            bojAdd[i] = da;
                        }

                        if (da["GroupId"] == data["GroupId"]) {
                            ty = 1;
                            Object.keys(da).forEach((y) => {
                                if (da[y]) {
                                    if (y != "UsedSize") {
                                        if (da[y] != data[y]) {
                                            bojBase[item] = da;
                                        }
                                    }
                                }
                            });
                        }
                    }


                });
            } else {
                res.createFailure({reason: "network error"});
            }
            if (ty == 0) {
                bojDel[item] = data;
            }
        });
    });

    // // 如果有更新的内容
    if (bojBase.length > 0) {
        successCount++;
        let arr = [];
        bojBase.forEach((data) => {
            if (data) arr.push(data);
        });
        const count = arr.length;
        let current = 0;

        co(function *() {
            while (arr.length != 0) {
                let obj = arr.pop();
                if (obj) {

                    let result = yield typeClass.hostInfoUpdateAll(obj);
                    if (result.hasOwnProperty("dataValues")) {
                        current++;
                        if (current == count) {

                        }
                    }
                }
            }
        });
    }

    if (bojDel.length > 0) {    // 如果本地有远程删除的内容
        successCount++;
        let arr = [];
        bojDel.forEach((data) => {
            if (data) arr.push(data);
        });
        const count = arr.length;
        let current = 0;
        co(function *() {
            while (arr.length != 0) {
                let obj = arr.pop();
                if (obj) {

                    let result = yield typeClass.hostInfoDelAll(obj);
                    if (result.hasOwnProperty("dataValues")) {
                        current++;
                        if (current == count) {

                        }
                    }
                }
            }
        });

    }

    if (bojAdd.length > 0) {    // 如果远程有本地没有的内容
        successCount++;
        let arr = [];
        bojAdd.forEach((data) => {
            if (data) arr.push(data);
        });
        const count = arr.length;
        let current = 0;
        co(function *() {
            while (arr.length != 0) {
                let obj = arr.pop();
                if (obj) {

                    let result = yield typeClass.redisCreate(obj);
                    if (result.hasOwnProperty("dataValues")) {
                        current++;
                        if (current == count) {

                        }
                    }
                }
            }
        });
    }
    if (successCount == 0) {
        return 0;
    } else {
        successCount = 0;
        return 1;
    }
}

// SHA
function sha(strHash) {
    let shasum = crypto.createHash('sha1');
    shasum.update(strHash);
    return shasum.digest('hex');
}