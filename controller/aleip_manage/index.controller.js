/**
 * Created by renminghe on 2017/2/14.
 */
"use strict";
const co = require("co");
const ckAuKey = require('../../global/checkAuthKey');
const AliEIP = require('../../model/alicloud_eip_model');    // 阿里云数据库
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
    ckAuKeyFun: (req, res, next) => ckAuKey(req, res, (data) => {
        if (data) {
            next();
        } else {
            res.createFailure();
        }
        
    }),
    
    // 云数据库信息
    localInstanceInfo: (req, res) => co(function *() {
        let result = yield AliEIP.localInstanceInfo(req.query);    // 获取实例
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
    
    // 获取本地信息总数
    localInstanceInfoCount: (req, res) => co(function *() {
        let result = yield AliEIP.localInstanceInfoCount();
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 批量导入主机信息
    cloudInstanceInfoCopy: (req, res) => co(function *() {
        let result = yield AliEIP.cloudInstanceInfoCopy();
        if (result.length > 0) {
            let count = 0;
            result.forEach((val) => {
                co(function *() {
                    let resItem = yield AliEIP.localInstanceCreate(val);
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
        let result = yield AliEIP.instanceInfoALiCloud(req.query);
        if (result.hasOwnProperty('EipAddresses') && result.EipAddresses.hasOwnProperty('EipAddress') &&
            result.EipAddresses.EipAddress.length > 0) {
            res.createSuccess({content: result.EipAddresses.EipAddress});
        } else {
            res.createFailure();
        }
    }),
    
    // 添加主机信息
    localInstanceCreate: (req, res) => co(function *() {
        
        // 本地查重
        let result = yield AliEIP.localInstanceInfo(req.body);
        if (result.hasOwnProperty('status') && result.status === 500) {
            let createResult = yield AliEIP.localInstanceCreate(req.body);
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
    localInstanceInfoDelete: (req, res) => co(function *() {
        let result = yield AliEIP.localInstanceInfoDelete(req.query.AllocationId);
        if (result.hasOwnProperty('dataValues')) {
            res.createSuccess();
        } else {
            res.createFailure();
        }
    }),
    
    // 更新主机
    localInstanceUpdate: (req, res) => co(function *() {
        let result = yield AliEIP.instanceInfoALiCloud(req.body);     // 获取阿里云主机信息
    
        // 数据比对
        if (result.hasOwnProperty('EipAddresses') && result.EipAddresses.hasOwnProperty('EipAddress')
            && result.EipAddresses.EipAddress.length > 0) {
            let upResult = yield AliEIP.localInstanceInfoUpdate(result.EipAddresses.EipAddress[0]);
            if (upResult.hasOwnProperty('status') && upResult.status === 500) {
                res.createFailure({reason: upResult});
                
            } else if (upResult.hasOwnProperty('status') && upResult.status === 201) {
                res.createFailure({reason: "data not changed"});
            } else if (upResult.hasOwnProperty('status') && upResult.status === 404) {
                res.createFailure({reason: "data not extend"});
            } else {
                res.createSuccess();
            }
            
        } else {
            res.createFailure({reason: "network error"});
        }
    }),
    
    // 批量更新
    localInstanceUpdateAll: (req, res) => co(function *() {
        let hostArrLocal = yield AliEIP.localInstanceInfo({type: "all"});    // 本地数据
        let result = yield AliEIP.instanceInfoALiCloud({});    // aliCloud数据
        checkJson(result['EipAddresses']['EipAddress'], hostArrLocal, res);
        
    }),
    
    // 获取删除的主机信息
    localInstanceDropInfo: (req, res) => co(function *() {
        let result = yield AliEIP.localInstanceDropInfo();
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
        if (req.body.hasOwnProperty('AllocationId')) {
            let result = yield AliEIP.cancelDropLocalInstance(req.body.AllocationId);
            if (result) {
                res.createSuccess();
            } else {
                res.createFailure();
            }
            
        }
    }),
    
    // 变更记录
    localInstance: (req, res) => co(function *() {
        let result = yield AliEIP.localInstance(req.query);
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
                    if (da["AllocationId"] === data["AllocationId"]) {
                        ty = 1;
    
                        // OperationLocks数据比对
                        let OperationLockscl = sha(JSON.stringify(da['OperationLocks']));
                        let OperationLocksLoc = sha(data['OperationLocks']);
                        if (OperationLockscl !== OperationLocksLoc) {
                            bojBase[item] = da;
                        }
                        
                        // 其他数据
                        Object.keys(da).forEach((y) => {
                            if (y !== "OperationLocks") {
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
            if (da.AllocationId === data.AllocationId) {
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
                if (obj && obj.hasOwnProperty("AllocationId")) {
                    
                    let result = yield AliEIP.localInstanceInfoUpdateAll(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("AllocationId")) {
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
                if (obj && obj.hasOwnProperty("AllocationId")) {
                    
                    let result = yield AliEIP.localInstanceInfoDelete(obj.AllocationId);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("AllocationId")) {
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
                if (obj && obj.hasOwnProperty("AllocationId")) {
                    
                    let result = yield AliEIP.localInstanceCreate(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("AllocationId")) {
                        current++;
                    }
                }
            }
        });
    }
    if (successCount === 0) {
        res.createFailure({reason: "data not changed"});
    } else {
        successCount = 0;
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

