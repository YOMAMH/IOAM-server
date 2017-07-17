/**
 * Created by renminghe on 2017/2/14.
 */
const co = require("co");
const ckAuKey = require('../../global/checkAuthKey');
const AliHost = require('../../model/alicloud_host_model');    // 阿里云主机
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
    
    // 云虚机信息
    hostInfo: (req, res) => co(function *() {
        let result = yield AliHost.hostInfo(req.query);    // 获取实例
        if (req.query.hasOwnProperty("index") || req.query.hasOwnProperty('hostName')) {
            if (result.length > 0) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        } else if (result.hasOwnProperty('dataValues')) {
                res.createSuccess({content: result});
        }
    
    }),
    
    // 获取本地主机信息总数
    hostInfoCount: (req, res) => co(function *() {
        let result = yield AliHost.hostInfoCount();
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 批量导入主机信息
    hostInfoCopy: (req, res) => co(function *() {
        let result = yield AliHost.hostInfoCopy();
        if (result.length > 0) {
            let count = 0;
            result.forEach((val) => {
                co(function *() {
                    let resItem = yield AliHost.hostCreate(val);
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
    alCloudInfo: (req, res) => co(function *() {
        let result = yield AliHost.alCloudInfo(req.query);
        if (result.TotalCount > 0) {
            res.createSuccess({content:result.Instances.Instance});
        } else {
            res.createFailure();
        }
    }),
    
    // 添加主机信息
    hostCreate: (req, res) => co(function *() {
        
        // 本地查重
        let result = yield AliHost.hostInfo(req.body);
        if (result.hasOwnProperty('status') && result.status === 500) {
            let createResult = yield AliHost.hostCreate(req.body);
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
    hostInfoDelete: (req, res) => co(function *() {
        let result = yield AliHost.hostInfoDelete(req.query.InstanceId);
        if (result.hasOwnProperty('dataValues')) {
            res.createSuccess();
        } else {
            res.createFailure();
        }
    }),
    
    // 更新主机
    hostInfoUpdate: (req, res) => co(function *() {
        let InstanceIdStr = req.body.id;
        let result = yield AliHost.alCloudInfo(req.body);     // 获取阿里云主机信息
    
        // 数据比对
        if (result.TotalCount !== 0) {
            let upResult = yield AliHost.hostInfoUpdate(result.Instances.Instance[0]);
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
    updateAll: (req, res) => co(function *() {
        let hostArrLocal = yield AliHost.hostInfo({type:"all"});    // 本地数据
        let result = yield AliHost.hostInfoCopy();    // aliCloud数据
        checkJson(result, hostArrLocal, res);
        
    }),
    
    // 获取删除的主机信息
    hostDropInfo: (req, res) => co(function *() {
        let result = yield AliHost.hostDropInfo();
        if (result.length > 0) {
            let resArr = [];
            result.forEach((data) => {
                if (data.hasOwnProperty('dataValues')) {
                    resArr.push(JSON.parse(data['dataValues']['ChangeInfo']));
                }
            });
            resArr.forEach((data) => {
                Object.keys(data).forEach((da) => {
                    if (da === 'InnerIpAddress' && typeof data['InnerIpAddress'] === 'string') {
                        data['InnerIpAddress'] = JSON.parse(data['InnerIpAddress']);
                    }
                    if (da === 'EipAddress' && typeof data['EipAddress'] === 'string') {
                        data['EipAddress'] = JSON.parse(data['EipAddress']);
                    }
                    if (da === 'VpcAttributes' && typeof data['VpcAttributes'] === 'string') {
                        data['VpcAttributes'] = JSON.parse(data['VpcAttributes']);
                    }
                    if (da === 'SecurityGroupIds' && typeof data['SecurityGroupIds'] === 'string') {
                        data['SecurityGroupIds'] = JSON.parse(data['SecurityGroupIds']);
                    }
                    if (da === 'PublicIpAddress' && typeof data['PublicIpAddress'] === 'string') {
                        data['PublicIpAddress'] = JSON.parse(data['PublicIpAddress']);
                    }
                    if (da === 'OperationLocks' && typeof data['OperationLocks'] === 'string') {
                        data['OperationLocks'] = JSON.parse(data['OperationLocks']);
                    }
                });
            });
            res.createSuccess({content: resArr});
        } else {
            res.createFailure();
        }
    }),
    
    // 撤销删除
    cancelDropHost: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('InstanceId')) {
            let result = yield AliHost.cancelDropHost(req.body.InstanceId);
            if (result) {
                res.createSuccess();
            } else {
                res.createFailure();
            }
            
        }
    }),
    
    // 变更记录
    history: (req, res) => co(function *() {
        let result = yield AliHost.history(req.query);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // others
    others: (req, res) => co(function *() {
        let result = yield AliHost.others(req.query);
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
                data[f]['InnerIpAddress'] = JSON.parse(data[f]['InnerIpAddress']);
                data[f]['EipAddress'] = JSON.parse(data[f]['EipAddress']);
                data[f]['VpcAttributes'] = JSON.parse(data[f]['VpcAttributes']);
                data[f]['SecurityGroupIds'] = JSON.parse(data[f]['SecurityGroupIds']);
                data[f]['PublicIpAddress'] = JSON.parse(data[f]['PublicIpAddress']);
                data[f]['OperationLocks'] = JSON.parse(data[f]['OperationLocks']);
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
                    if (da["InstanceId"] === data["InstanceId"]) {
                        ty = 1;
                    
                        // InnerIpAddress数据比对
                        let InnerIpAddresscl = sha(da['InnerIpAddress']);
                        let InnerIpAddressLoc = sha(data['InnerIpAddress']);
                        if (InnerIpAddresscl !== InnerIpAddressLoc) {
                            bojBase[item] = da;
                        }
                        // EipAddress
                        let EipAddresscl = sha(da['EipAddress']);
                        let EipAddressLoc = sha(data['EipAddress']);
                        if (EipAddresscl !== EipAddressLoc) {
                            bojBase[item] = da;
                        }
                        // VpcAttributes
                        let VpcAttributescl = sha(da['VpcAttributes']);
                        let VpcAttributesLoc = sha(data['VpcAttributes']);
                        if (VpcAttributescl !== VpcAttributesLoc) {
                            bojBase[item] = da;
                        }
                        // SecurityGroupIds
                        let SecurityGroupIdscl = sha(da['SecurityGroupIds']);
                        let SecurityGroupIdsLoc = sha(data['SecurityGroupIds']);
                        if (SecurityGroupIdscl !== SecurityGroupIdsLoc) {
                            bojBase[item] = da;
                        }
                        // PublicIpAddress
                        let PublicIpAddresscl = sha(da['PublicIpAddress']);
                        let PublicIpAddressLoc = sha(data['PublicIpAddress']);
                        if (PublicIpAddresscl !== PublicIpAddressLoc) {
                            bojBase[item] = da;
                        }
                        // OperationLocks
                        let OperationLockscl = sha(da['OperationLocks']);
                        let OperationLocksLoc = sha(data['OperationLocks']);
                        if (OperationLockscl !== OperationLocksLoc) {
                            bojBase[item] = da;
                        }
                        // 其他数据
                        Object.keys(da).forEach((y) => {
                            if (y !== "InnerIpAddress" && y !== "EipAddress" && y !== "VpcAttributes" &&
                                y !== "SecurityGroupIds" && y !== "PublicIpAddress" && y !== "OperationLocks"
                                && y !== "DeviceAvailable" && y !== "IoOptimized") {
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
            if (da.InstanceId === data.InstanceId) {
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
            while (arr.length !== 0) {
                let obj = arr.pop();
                if (obj && obj.hasOwnProperty("InstanceId")) {

                    let objStr = JSON.stringify(obj);
                    let result = yield AliHost.hostInfoUpdateAll(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("InstanceId")) {
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
                if (obj && obj.hasOwnProperty("InstanceId")) {
                    
                    let result = yield AliHost.hostInfoDelete(obj.InstanceId);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("InstanceId")) {
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
                if (obj && obj.hasOwnProperty("InstanceId")) {
                    
                    let result = yield AliHost.hostCreate(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("InstanceId")) {
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

