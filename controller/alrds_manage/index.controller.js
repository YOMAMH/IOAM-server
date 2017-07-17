/**
 * Created by renminghe on 2017/2/14.
 */
const co = require("co");
const ckAuKey = require('../../global/checkAuthKey');
const AliRDS = require('../../model/alicloud_rds_model');    // 阿里云数据库
const crypto = require('crypto');
let successCount = 0;

/**
 * 返回json数据公有函数
 * @param req  请求参数
 * @param res  相应参数
 * @param apmInfo  apm_model返回的数据
 */


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
    
    // 云数据库信息
    localInfo: (req, res) => co(function *() {
        let result = yield AliRDS.localInfo(req.query);    // 获取实例
        if (req.query.hasOwnProperty("index") || req.query.hasOwnProperty('instanceName')) {
            if (result.length > 0) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        } else {
            if (result.hasOwnProperty('dataValues')) {
                res.createSuccess({content: result});
            }
        }
    
    }),
    
    // 获取本地主机信息总数
    localInfoCount: (req, res) => co(function *() {
        let result = yield AliRDS.localInfoCount();
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 批量导入主机信息
    InfoCopy: (req, res) => co(function *() {
        let result = yield AliRDS.InfoCopy();
        if (result.length > 0) {
            let count = 0;
            result.forEach((val) => {
                co(function *() {
                    let resItem = yield AliRDS.hostCreate(val);
                    if (resItem.hasOwnProperty('dataValues')) {
                        count++;
                        if (count === result.length) {
                            res.createSuccess();
                        }
                    }
                });
            });
        } else {
            res.createFailure();
        }
    }),
    
    // 阿里云虚机数据
    instanceInfoALiCloud: (req, res) => co(function *() {
        let result = yield AliRDS.instanceInfoALiCloud(req.query);
        if (result.TotalRecordCount > 0) {
            res.createSuccess({content:result.Items.DBInstance});
        } else {
            res.createFailure();
        }
    }),
    
    // 添加主机信息
    localInstanceCreate: (req, res) => co(function *() {
        
        // 本地查重
        let result = yield AliRDS.localInfo(req.body);
        if (result.hasOwnProperty('status') && result.status === 500) {
            let createResult = yield AliRDS.hostCreate(req.body);
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
    
    // 删除主机信息
    instanceInfoDelete: (req, res) => co(function *() {
        let result = yield AliRDS.instanceInfoDelete(req.query.DBInstanceId);
        if (result.hasOwnProperty('dataValues')) {
            res.createSuccess();
        } else {
            res.createFailure();
        }
    }),
    
    // 更新主机
    localInstanceUpdate: (req, res) => co(function *() {
        let result = yield AliRDS.instanceInfoALiCloud(req.body);     // 获取阿里云主机信息
        
        // 数据比对
        if (result.TotalRecordCount !== 0) {
            let upResult = yield AliRDS.localInstanceInfoUpdate(result.Items.DBInstance[0]);
            if (upResult.hasOwnProperty('status') && upResult.status === 500) {
                res.createFailure({reason: upResult});

            } else if (upResult.hasOwnProperty('status') && upResult.status === 201) {
                res.createFailure({reason: "data not changed"});
            } else if (upResult.hasOwnProperty('status') && upResult.status === 404) {
                res.createFailure({reason: "data not extend"});
            }else {
                res.createSuccess();
            }

        } else {
            res.createFailure({reason: "network error"});
        }
    }),
    
    // 批量更新
    localInstanceUpdateAll: (req, res) => co(function *() {
        let hostArrLocal = yield AliRDS.localInfo({type:"all"});    // 本地数据
        let result = yield AliRDS.instanceInfoALiCloud({});    // aliCloud数据
        checkJson(result['Items']['DBInstance'], hostArrLocal, res);
        
    }),
    
    // 获取删除的主机信息
    localInstanceDropInfo: (req, res) => co(function *() {
        let result = yield AliRDS.localInstanceDropInfo();
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
    cancelDropLocalInstance: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('DBInstanceId')) {
            let result = yield AliRDS.cancelDropLocalInstance(req.body.DBInstanceId);
            if (result) {
                res.createSuccess();
            } else {
                res.createFailure();
            }
            
        }
    }),
    
    // 变更记录
    localInstance: (req, res) => co(function *() {
        let result = yield AliRDS.localInstance(req.query);
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
            if (f === "dataValues") {
                data[f]['ReadOnlyDBInstanceIds'] = JSON.parse(data[f]['ReadOnlyDBInstanceIds']);
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
                    if (da["DBInstanceId"] === data["DBInstanceId"]) {
                        ty = 1;
                    
                        // ReadOnlyDBInstanceIds数据比对
                        let ReadOnlyDBInstanceIdscl = sha(da['ReadOnlyDBInstanceIds']);
                        let ReadOnlyDBInstanceIdsLoc = sha(data['ReadOnlyDBInstanceIds']);
                        if (ReadOnlyDBInstanceIdscl !== ReadOnlyDBInstanceIdsLoc) {
                            bojBase[item] = da;
                        }
                      
                        // 其他数据
                        Object.keys(da).forEach((y) => {
                            if (y !== "ReadOnlyDBInstanceIds" && y !== "MutriORsignle") {
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
            if (da.DBInstanceId === data.DBInstanceId) {
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
        let current = 0;
        co(function *() {
            while (arr.length !== 0) {
                let obj = arr.pop();
                if (obj && obj.hasOwnProperty("DBInstanceId")) {
                    
                    let result = yield AliRDS.localInstanceInfoUpdateAll(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("DBInstanceId")) {
                        current++;
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
            while (arr.length !== 0) {
                let obj = arr.pop();
                if (obj && obj.hasOwnProperty("DBInstanceId")) {
                    
                    let result = yield AliRDS.instanceInfoDelete(obj.DBInstanceId);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("DBInstanceId")) {
                        current++;
                    }
                }
            }
        });
        
    }
    
    // 如果远程新增内容
    if (bojAdd.length > 0) {
        successCount++;
        let arr = [];
        bojAdd.forEach((data) => {
            if (data) arr.push(data);
        });
        const count = arr.length;
        let current = 0;
        co(function *() {
            while (arr.length !== 0) {
                let obj = arr.pop();
                if (obj && obj.hasOwnProperty("DBInstanceId")) {
                    
                    let result = yield AliRDS.hostCreate(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("DBInstanceId")) {
                        current++;
                    }
                }
            }
        });
    }
    if (successCount === 0) {
        res.createFailure({reason: "data not changed"});
    } else {
        successCount = 0
        res.createSuccess();
    }
}

// SHA
function sha(strHash) {
    strHash = JSON.stringify(strHash);
    let shasum = crypto.createHash('sha1');
    shasum.update(strHash);
    return shasum.digest('hex');
}
