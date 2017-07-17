/**
 * Created by renminghe on 2017/4/10.
 */
const co = require('co');
const uNetBand = require('../../model/unet_model/unet_band');
const crypto = require('crypto');
let successCount = 0;

module.exports = {
    
    // 获取本地信息
    Info: (req, res) => co(function *() {
        if (req.query.hasOwnProperty('EIPId')) {
            
            let result = yield uNetBand.Info(req.query);
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
            
        } else if (req.query.hasOwnProperty('index')) {
            let result = yield uNetBand.Info(parseInt(req.query.index));
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        } else if (req.query.hasOwnProperty('searchId')) {
            let result = yield uNetBand.searchId(req.query);
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
        let result = yield uNetBand.Info(req.body);
        if (result.hasOwnProperty('status') && result.status === 500) {
            let createResult = yield uNetBand.createInfo(req.body);
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
            let result = yield uNetBand.InfoUCloud(req.query.reg, req.query.id);
            result = JSON.parse(result);
            if (result.TotalCount > 0) {
                res.createSuccess({content: result.DataSet});
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
        let result = yield uNetBand.InfoUCloud(req.body.reg, req.body.ShareBandwidthId);     // 获取ucloud主机信息
        result = JSON.parse(result);
        if (result.TotalCount !== 0) {
            let upResult = yield uNetBand.InfoUpdate(result.DataSet[0]);
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
        let result = yield uNetBand.InfoDelete(req.body.hostId);
        if (result.hasOwnProperty('dataValues')) {
            res.createSuccess();
        } else {
            res.createFailure();
        }
    }),
    
    // 获取本地信息总数
    InfoCount: (req, res) => co(function *() {
        let result = yield uNetBand.InfoCount();
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 批量导入信息
    InfoCopy: (req, res) => co(function *() {
        let result = yield uNetBand.InfoCopy();
        if (result.length > 0) {
            let count = 0;
            result.forEach((val) => {
                co(function *() {
                    let resItem = yield uNetBand.createInfo(val);
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
        let result = yield uNetBand.dropInfo();
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
            let result = yield uNetBand.cancelDrop(req.body.UHostId);
            if (result) {
                res.createSuccess();
            } else {
                res.createFailure();
            }
            
        }
    }),
    
    // 批量更新
    updateAll: (req, res) => co(function *() {
        let reslut = yield uNetBand.InfoCopy();
        let hostArrLocal = yield uNetBand.Info(req.body);    // 本地数据
        checkJson(reslut, hostArrLocal, res);
        
    }),
    
    // 变更记录
    history: (req, res) => co(function *() {
        let result = yield uNetBand.history(req.query);
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
                data[f]['EIPSet'] = JSON.parse(data[f]['EIPSet']);
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
                    if (argStr.indexOf('"ShareBandwidthId":"' + da['ShareBandwidthId'] + '"') === -1) {
                        bojAdd[i] = da;
                    }
                    if (da["ShareBandwidthId"] === data["ShareBandwidthId"]) {
                        ty = 1;
                        // EIPSet数据比对
                        let uclEIPAddr = sha(JSON.stringify(da['EIPSet']));
                        let locaEIPAddr = sha(JSON.stringify(data['EIPSet']));
                        if (uclEIPAddr !== locaEIPAddr) {
                            bojBase[item] = da;
                        }
                        
                        // 其他数据
                        Object.keys(da).forEach((y) => {
                            if (y !== "EIPSet") {
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
                if (obj && obj.hasOwnProperty("ShareBandwidthId")) yield uNetBand.InfoUpdateAll(obj);
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
                if (obj && obj.hasOwnProperty("ShareBandwidthId")) yield uNetBand.InfoDelAll(obj);
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
                if (obj && obj.hasOwnProperty("ShareBandwidthId")) yield uNetBand.createInfo(obj);
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