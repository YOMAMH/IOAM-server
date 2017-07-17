/**
 * Created by renminghe on 2017/3/16.
 */
const co = require('co');
const uphost = require('../../model/uphost_model');
const uclouldAuth = require('../../global/ucloudAuth');
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

    // 获取主机信息
    upHostInfo: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('PHostId')) {

            let result = yield uphost.upHostInfo(req.body);
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }

        } else if (req.body.hasOwnProperty('index')) {
            let result = yield uphost.upHostInfo(parseInt(req.body.index));
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        } else if (req.body.hasOwnProperty('searchId')) {
            let result = yield uphost.searchId(req.body);
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        }
    }),

    // 批量添加主机信息
    addUpHostInfo: (req, res) => co(function *() {
        let result = yield uphost.upHostInfoCopy();
        if (result.length > 0) {
            let count = 0;
            if (result instanceof Array) {
                result.forEach((val) => {
                    co(function *() {
                        let resItem = yield uphost.upHostCreate(val);
                        if (resItem.hasOwnProperty('dataValues')) {
                            count ++;
                            if (count == result.length) {
                                res.createSuccess();
                            }
                        }
                    });
                });
            }
        } else {
            res.createFailure();
        }
    }),

    // 获取主机数据量
    upHosInfoCount: (req, res) => co(function *() {
        let result = yield uphost.upHostInfoCount();
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),

    // 获取ucloud物理主机信息
    hostInfoUCloud: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('id') && req.body.hasOwnProperty('reg')) {
            let result = yield uphost.hostInfoUCloud(req.body.reg, req.body.id);
            result = JSON.parse(result);
            if (result.TotalCount > 0) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        }
    }),

    // 添加主机信息
    hostCreate: (req, res) => co(function *() {

        // 本地查重
        let result = yield uphost.upHostInfo(req.body);
        if (result.hasOwnProperty('status') && result.status == 500) {
            let createResult = yield uphost.upHostCreate(req.body);
            if (createResult) {
                if (createResult.hasOwnProperty('dataValues')) {
                    res.createSuccess();
                } else {
                    res.createFailure();
                }
            } else {
                res.createFailure({reason: createResult});
            }
        } else {
            res.createFailure({reason: "HostId existed"});
        }

    }),

    /**
     * 更新主机信息
     * @param req
     * @param res
     * 通过arg传递UHostId，先通过ucloud获取数据，
     * 更新本地数据库，并记录到变更记录表
     */
    hostInfoUpdate: (req, res) => co(function *() {
        let result = yield uphost.hostInfoUCloud(req.body.reg, req.body.PHostId);     // 获取ucloud主机信息
        result = JSON.parse(result);
        if (result.TotalCount != 0) {
            let upResult = yield uphost.hostInfoUpdate(result.PHostSet[0]);
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
    }),

    // 删除本地主机信息
    hostInfoDelete: (req, res) => co(function *() {
        let result = yield uphost.hostInfoDelete(req.body.hostId);
        if (result.hasOwnProperty('dataValues')) {
            res.createSuccess();
        } else {
            res.createFailure();
        }
    }),

    // 获取删除的主机信息
    hostDropInfo: (req, res) => co(function *() {
        let result = yield uphost.hostDropInfo();
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
        if (req.body.hasOwnProperty('UHostId')) {
            let result = yield uphost.cancelDropHost(req.body.UHostId);
            if (result) {
                res.createSuccess();
            } else {
                res.createFailure();
            }
        }
    }),

    // 批量更新
    updateAll: (req, res) => co(function *() {
        let bj2 = yield uclouldAuth.getUpHostInfo("cn-bj2", '', '');
        let bj2Obj = JSON.parse(bj2);
        let hostArrLocal = yield uphost.upHostInfo(req.body);    // 本地数据
        checkJson(bj2Obj.PHostSet, hostArrLocal, res);
    }),

    // 变更记录
    history: (req, res) => co(function *() {
        let result = yield uphost.history(req.query);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // others
    others: (req, res) => co(function *() {
        let result = yield uphost.others(req.query);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
};

// 数据比对
function checkJson(arg, localInfo, res) {
    let objArr = [{}];
    localInfo.forEach((data) => {
        Object.keys(data).forEach((f) => {
            if (f == "dataValues") {
                data[f]['IPSet'] = JSON.parse(data[f]['IPSet']);
                data[f]['DiskSet'] = JSON.parse(data[f]['DiskSet']);
                data[f]['CPUSet'] = JSON.parse(data[f]['CPUSet']);
                objArr.push(data[f]);
            }
        });
    });

    let bojDel = [];    // 存储本地有ucloud没有的数据
    let bojAdd = [];    // 存储ucloud有本地没有的数据
    let bojBase = [];    // 存储本地与ucloud不同的数据
    
    objArr.forEach((data, item) => {
        Object.keys(data).forEach((obj) => {
            let ty = 0;
            if (arg && arg.length > 0) {
                arg.forEach((da, i) => {
                    if (da["PHostId"] == data["PHostId"]) {
                        ty = 1;
                        // IPSet数据比对
                        let uclIPSet = sha(JSON.stringify(da['IPSet']));
                        let localIPSet = sha(JSON.stringify(data['IPSet']));
                        if (uclIPSet != localIPSet) bojBase[item] = da;

                        // DiskSet
                        let uclDiskSet = sha(JSON.stringify(da['DiskSet']));
                        let localDiskSet = sha(JSON.stringify(data['DiskSet']));
                        if (uclDiskSet != localDiskSet) bojBase[item] = da;

                        // CPUSet
                        let uclCPUSet= sha(JSON.stringify(da['CPUSet']));
                        let localCPUSet = sha(JSON.stringify(data['CPUSet']));
                        if (uclCPUSet !== localCPUSet) bojBase[item] = da;

                        // 其他数据
                        Object.keys(da).forEach((y) => {
                            if (y !== "IPSet" && y !== "DiskSet" && y !== "CPUSet") {
                                if (da[y]) {
                                    if (da[y] !== data[y]) {
                                        bojBase[item] = da;
                                    }
                                }
                            }
                        });
                    }
                });
            } else {
                res.createFailure({reason: "network error"});
            }
            if (ty === 0) {
                bojDel[item] = data;
            }
        });
    });
    
    let addTy = 0;
    arg.forEach((da, i) => {
        objArr.forEach((data, item) => {
            if (da.PHostId === data.PHostId) {
                addTy = 1;
                return;
            }
        });
        if (addTy === 0) {
            bojAdd[i] = da;
        } else {
            addTy = 0;
        }
        
    });

    // // 如果有更新的内容
    if (bojBase.length > 0) {
        successCount ++;
        let arr = [];
        bojBase.forEach((data) => {
            if (data) arr.push(data);
        });
        const count = arr.length;
        let current = 0;

        co(function *() {
            while (arr.length != 0) {
                let obj = arr.pop();
                if (obj && obj.hasOwnProperty("PHostId")) {

                    let result = yield uphost.hostInfoUpdateAll(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("PHostId")) {
                        current ++;
                        if (current == count) {

                        }
                    }
                }
            }
        });
    }

    if (bojDel.length > 0) {    // 如果本地有远程删除的内容
        successCount ++;
        let arr = [];
        bojDel.forEach((data) => {
            if (data) arr.push(data);
        });
        const count = arr.length;
        let current = 0;
        co(function *() {
            while (arr.length != 0) {
                let obj = arr.pop();
                if (obj && obj.hasOwnProperty("PHostId")) {

                    let result = yield uphost.hostInfoDelAll(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("PHostId")) {
                        current ++;
                        if (current == count) {

                        }
                    }
                }
            }
        });

    }

    if (bojAdd.length > 0) {    // 如果远程有本地没有的内容
        successCount ++;
        let arr = [];
        bojAdd.forEach((data) => {
            if (data) arr.push(data);
        });
        const count = arr.length;
        let current = 0;
        co(function *() {
            while (arr.length != 0) {
                let obj = arr.pop();
                if (obj && obj.hasOwnProperty("PHostId")) {

                    let result = yield uphost.upHostCreate(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("PHostId")) {
                        current ++;
                        if (current == count) {

                        }
                    }
                }
            }
        });
    }
    if (successCount == 0) {
        res.createFailure({reason: "data not changed"});
    } else {
        successCount = 0;
        res.createSuccess();
    }
}

// SHA
function sha(strHash) {
    let shasum = crypto.createHash('sha1');
    shasum.update(strHash);
    return shasum.digest('hex');
}