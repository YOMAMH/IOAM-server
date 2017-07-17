/**
 * Created by renminghe on 2017/3/21.
 */
const co = require('co');
const Mysql = require('../../model/udb_model/mysql');
const mysqlChangeHistory = require('../../model/udb_model/mysqlChangeHistory');
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
    mysqlInfo: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('ULBId')) {

            let result = yield Mysql.mysqlInfo(req.body);
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }

        } else if (req.body.hasOwnProperty('index')) {
            let result = yield Mysql.mysqlInfo(parseInt(req.body.index));
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        } else if (req.body.hasOwnProperty('searchId')) {
            let result = yield Mysql.searchId(req.body);
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        }
    }),

    // 添加主机信息
    mysqlCreate: (req, res) => co(function *() {

        // 本地查重
        let result = yield Mysql.mysqlInfo(req.body);
        if (result.hasOwnProperty('status') && result.status == 500) {
            let createResult = yield Mysql.mysqlCreate(req.body);
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

    }),

    // ucloud数据
    mysqlInfoUCloud: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('id') && req.body.hasOwnProperty('reg')) {
            let result = yield Mysql.mysqlInfoUCloud(req.body.reg, req.body.id);
            result = JSON.parse(result);
            if (result.hasOwnProperty('DataSet')) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        }

    }),

    // 获取本地信息总数
    mysqlInfoCount: (req, res) => co(function *() {
        let result = yield Mysql.mysqlInfoCount();
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),

    // 批量导入主机信息
    mysqlInfoCopy: (req, res) => co(function *() {
        let result = yield Mysql.mysqlInfoCopy();
        if (result.length > 0) {
            let count = 0;
            result.forEach((val) => {
                co(function *() {
                    let resItem = yield Mysql.mysqlInfoCreate(val);
                    if (resItem.hasOwnProperty('dataValues')) {
                        count++;
                        if (count == result.length - 1) {
                            res.createSuccess();
                        }
                    }
                });
            });
        } else {
            res.createFailure();
        }
    }),

    /**
     * 更新mysql信息
     * @param req
     * @param res
     * 通过arg传递UHostId，先通过ucloud获取数据，
     * 如果为master，通过本地数据找到对应的从数据库进行比对
     * 更新本地数据库，并记录到变更记录表
     */
    mysqlInfoUpdate: (req, res) => co(function *() {
        let result = yield Mysql.mysqlInfoUCloud(req.body.reg, req.body.DBId);     // 获取ucloud主机信息
        result = JSON.parse(result);
        if (result.hasOwnProperty('DataSet') && result.DataSet.length > 0) {
            let upResult = yield Mysql.mysqlInfoUpdate(result.DataSet[0]);
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

    // 删除 mysql数据
    mysqlInfoDelete: (req, res) => co(function *() {
        let result = yield Mysql.mysqlInfoDelete(req.body.hostId);
        if (result.hasOwnProperty('dataValues')) {
            res.createSuccess();
        } else {
            res.createFailure();
        }
    }),

    // 获取删除的主机信息
    hostDropInfo: (req, res) => co(function *() {
        let result = yield Mysql.hostDropInfo();
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
            let result = yield Mysql.cancelDropHost(req.body.UHostId);
            if (result) {
                res.createSuccess();
            } else {
                res.createFailure();
            }
        }
    }),

    // 批量更新
    updateAll: (req, res) => co(function *() {
        let result = yield Mysql.mysqlInfoCopy();    // ucloud数据
        let hostArrLocal = yield Mysql.mysqlInfo(req.body);    // 本地数据
        checkJson(result, hostArrLocal, res);
    }),

    // 变更记录
    history: (req, res) => co(function *() {
        let result = yield Mysql.history(req.query);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    })

};
let type = [];
// 数据比对
function checkJson(arg, localInfo, res) {
    let objArr = [{}];
    localInfo.forEach((data) => {
        Object.keys(data).forEach((f) => {
            if (f == "dataValues") {
                data[f]['DataSet'] = JSON.parse(data[f]['DataSet']);
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
            let tt = 0;
            if (arg && arg.length > 0) {
                arg.forEach((da, i) => {
                    if (da["DBId"] == data["DBId"]) {
                        ty = 1;
                        // DataSet数据比对
                        if (da['DataSet'].length > 0) {
                            da['DataSet'].forEach((em, ii) => {
                               Object.keys(em).forEach((mm) => {
                                   if (mm !== "DiskUsedSize" && mm !== "LogFileSize" && mm !== "SystemFileSize" && mm !== "DataFileSize") {
                                       if (em[mm] !== data['DataSet'][ii][mm]) {
                                           bojBase[item] = da;
                                           return;
                                       }
                                   }
                               })
                            });
                        }
                        
                        // if (uclDataSet != localDataSet) {
                        //     bojBase[item] = da;
                        // }

                        // 其他数据
                        Object.keys(da).forEach((y) => {
                            if (y != "DataSet" && y != "DiskUsedSize" && y != "LogFileSize" && y != "SystemFileSize" && y != "DataFileSize") {
                                if (da[y]) {
                                    if (da[y] != data[y]) {
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
            if (ty == 0) {
                bojDel[item] = data;
            }

        });
    });
    
    let addTy = 0;
    arg.forEach((da, i) => {
        objArr.forEach((data, item) => {
            if (da.DBId === data.DBId) {
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
                if (obj && obj.hasOwnProperty("DBId")) {

                    let result = yield Mysql.hostInfoUpdateAll(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("DBId")) {
                        current++;
                        if (current == count) {
                            type.push("success");
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
                if (obj && obj.hasOwnProperty("DBId")) {

                    let result = yield Mysql.hostInfoDelAll(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("DBId")) {
                        current++;
                        if (current == count) {
                            type.push("success");
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
                if (obj && obj.hasOwnProperty("DBId")) {

                    let result = yield Mysql.mysqlInfoCreate(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("DBId")) {
                        current++;
                        if (current == count) {
                            type.push("success");
                        }
                    }
                }
            }
        });
    }

    if (successCount === 0) {
        res.createFailure({reason: "data not changed"});
    } else if (successCount > 0) {
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