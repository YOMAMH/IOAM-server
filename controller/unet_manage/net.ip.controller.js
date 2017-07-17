/**
 * Created by renminghe on 2017/4/6.
 */
const co = require('co');
const uNetIp = require('../../model/unet_model/unet_ip');
const ckAuKey = require('../../global/checkAuthKey');
const crypto = require('crypto');
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
    
    // 获取本地信息
    Info: (req, res) => co(function *() {
        if (req.query.hasOwnProperty('EIPId')) {
            
            let result = yield uNetIp.Info(req.query);
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
            
        } else if (req.query.hasOwnProperty('index')) {
            let result = yield uNetIp.Info(parseInt(req.query.index));
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        } else if (req.query.hasOwnProperty('searchId')) {
            let result = yield uNetIp.searchId(req.query);
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        }
    }),
    
    // 添加信息
    createInfo: (req, res) => co(function *() {
        
        // 本地查重
        let result = yield uNetIp.Info(req.body);
        if (result.hasOwnProperty('status') && result.status === 500) {
            let createResult = yield uNetIp.createInfo(req.body);
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
    
    // ucloud主机数据
    InfoUCloud: (req, res) => co(function *() {
        if (req.query.hasOwnProperty('id') && req.query.hasOwnProperty('reg')) {
            let result = yield uNetIp.InfoUCloud(req.query.reg, req.query.id);
            result = JSON.parse(result);
            if (result.TotalCount > 0) {
                res.createSuccess({content: result.EIPSet});
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
    InfoUpdate: (req, res) => co(function *() {
        let result = yield uNetIp.InfoUCloud(req.body.reg, req.body.EIPId);     // 获取ucloud主机信息
        result = JSON.parse(result);
        if (result.TotalCount !== 0) {
            let upResult = yield uNetIp.InfoUpdate(result.EIPSet[0]);
            if (upResult.hasOwnProperty('status') && upResult.status === 500) {
                res.createFailure({reason: upResult});
                
            } else if (upResult.hasOwnProperty('status') && upResult.status === 201) {
                res.createFailure({reason: "data not changed"});
            } else if (upResult.hasOwnProperty('dataValues')) {
                res.createSuccess();
            }
            
        } else {
            res.createFailure({reason: "network error"});
        }
    }),
    
    // 删除本地主机信息
    InfoDelete: (req, res) => co(function *() {
        let result = yield uNetIp.InfoDelete(req.body.hostId);
        if (result.hasOwnProperty('dataValues')) {
            res.createSuccess();
        } else {
            res.createFailure();
        }
    }),
    
    // 获取本地信息总数
    InfoCount: (req, res) => co(function *() {
        let result = yield uNetIp.InfoCount();
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 批量导入信息
    InfoCopy: (req, res) => co(function *() {
        let result = yield uNetIp.InfoCopy();
        if (result.length > 0) {
            let count = 0;
            result.forEach((val) => {
                co(function *() {
                    let resItem = yield uNetIp.createInfo(val);
                    if (resItem.hasOwnProperty('dataValues')) {
                        count++;
                        if (count === result.length - 1) {
                            res.createSuccess();
                        }
                    }
                });
            });
        } else {
            res.createFailure();
        }
    }),
    
    // 获取删除的主机信息
    dropInfo: (req, res) => co(function *() {
        let result = yield uNetIp.dropInfo();
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
    cancelDrop: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('UHostId')) {
            let result = yield uNetIp.cancelDrop(req.body.UHostId);
            if (result) {
                res.createSuccess();
            } else {
                res.createFailure();
            }
            
        }
    }),
    
    // 批量更新
    updateAll: (req, res) => co(function *() {
        let reslut = yield uNetIp.InfoCopy();
        let hostArrLocal = yield uNetIp.Info(req.body);    // 本地数据
        checkJson(reslut, hostArrLocal, res);
        
    }),
    
    // 变更记录
    history: (req, res) => co(function *() {
        let result = yield uNetIp.history(req.query);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    })
};

// 数据比对
function checkJson(arg, localInfo, res) {
    let objArr = [];
    localInfo.forEach((data) => {
        Object.keys(data).forEach((f) => {
            if (f === "dataValues") {
                data[f]['EIPAddr'] = JSON.parse(data[f]['EIPAddr']);
                data[f]['Resource'] = JSON.parse(data[f]['Resource']);
                data[f]['ShareBandwidthSet'] = JSON.parse(data[f]['ShareBandwidthSet']);
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
                    if (argStr.indexOf('"EIPId":"' + da['EIPId'] + '"') === -1) {
                        bojAdd[i] = da;
                    }
                    if (da["EIPId"] === data["EIPId"]) {
                        ty = 1;
                        // EIPAddr数据比对
                        let uclEIPAddr = sha(JSON.stringify(da['EIPAddr']));
                        let locaEIPAddr = sha(JSON.stringify(data['EIPAddr']));
                        if (uclEIPAddr !== locaEIPAddr) {
                            bojBase[item] = da;
                        }
                        
                        // Resource数据比对
                        let uclResource = sha(JSON.stringify(da['Resource']));
                        let locaResource = sha(JSON.stringify(data['Resource']));
                        if (uclResource !== locaResource) {
                            bojBase[item] = da;
                        }
                        
                        // ShareBandwidthSet数据比对
                        let uclShareBandwidthSet = sha(JSON.stringify(da['ShareBandwidthSet']));
                        let locaShareBandwidthSet = sha(JSON.stringify(data['ShareBandwidthSet']));
                        if (uclShareBandwidthSet !== locaShareBandwidthSet) {
                            bojBase[item] = da;
                        }
                        
                        // 其他数据
                        Object.keys(da).forEach((y) => {
                            if (y !== "EIPAddr" && y !== "Resource" && y !== "ShareBandwidthSet") {
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
    
    // 如果有更新的内容
    if (bojBase.length > 0) {
        successCount++;
        let arr = [];
        bojBase.forEach((data) => {
            if (data) arr.push(data);
        });
        co(function *() {
            while (arr.length !== 0) {
                let obj = arr.pop();
                if (obj && obj.hasOwnProperty("EIPId")) yield uNetIp.InfoUpdateAll(obj);
            }
        });
    }
    
    if (bojDel.length > 0) {    // 如果本地有远程删除的内容
        successCount++;
        let arr = [];
        bojDel.forEach((data) => {
            if (data) arr.push(data);
        });
        co(function *() {
            while (arr.length !== 0) {
                let obj = arr.pop();
                if (obj && obj.hasOwnProperty("EIPId")) yield uNetIp.InfoDelAll(obj);
            }
        });
        
    }
    
    if (bojAdd.length > 0) {
        successCount++;
        let arr = [];
        bojAdd.forEach((data) => {
            if (data) arr.push(data);
        });
        co(function *() {
            while (arr.length !== 0) {
                let obj = arr.pop();
                if (obj && obj.hasOwnProperty("EIPId")) yield uNetIp.createInfo(obj);
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
    let shasum = crypto.createHash('sha1');
    shasum.update(strHash);
    return shasum.digest('hex');
}
