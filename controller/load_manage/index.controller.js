/**
 * Created by renminghe on 2017/3/3.
 */
const co = require('co');
const Load = require('../../model/load_model');
const ckAuKey = require('../../global/checkAuthKey');
const uclouldAuth = require('../../global/ucloudAuth');
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

    // 获取主机信息
    loadInfo: (req, res) => co(function *() {

        if (req.body.hasOwnProperty('ULBId')) {

            let result = yield Load.loadInfo(req.body);
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }

        } else if (req.body.hasOwnProperty('index')) {
            let result = yield Load.loadInfo(parseInt(req.body.index));
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        } else if (req.body.hasOwnProperty('searchId')) {
            let result = yield Load.searchId(req.body);
            if (result) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        }
    }),

    // 添加主机信息
    loadCreate: (req, res) => co(function *() {

        // 本地查重
        let result = yield Load.loadInfo(req.body);
        if (result.hasOwnProperty('status') && result.status == 500) {
            let createResult = yield Load.loadCreate(req.body);
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
    loadInfoUCloud: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('id') && req.body.hasOwnProperty('reg')) {
            let result = yield Load.loadInfoUCloud(req.body.reg, req.body.id);
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
    loadInfoUpdate: (req, res) => co(function *() {
        let result = yield Load.loadInfoUCloud(req.body.reg, req.body.ULBId);     // 获取ucloud主机信息
        result = JSON.parse(result);
        if (result.TotalCount != 0) {
            let upResult = yield Load.loadInfoUpdate(result.DataSet[0]);
            if (upResult.hasOwnProperty('status') && upResult.status == 500) {
                console.log(upResult);
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

    // 获取本地信息总数
    loadInfoCount: (req, res) => co(function *() {
        let result = yield Load.loadInfoCount();
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),

    // 批量导入主机信息
    loadInfoCopy: (req, res) => co(function *() {
        let result = yield Load.loadInfoCopy();
        if (result.length > 0) {
            let count = 0;
            result.forEach((val) => {
                co(function *() {
                    let resItem = yield Load.loadCreate(val);
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

    // 删除负载均衡信息
    loadInfoDelete: (req, res) => co(function *() {
        let result = yield Load.loadInfoDelete(req.body.hostId);
        if (result.hasOwnProperty('dataValues')) {
            res.createSuccess();
        } else {
            res.createFailure();
        }
    }),

    // 获取删除的主机信息
    hostDropInfo: (req, res) => co(function *() {
        let result = yield Load.hostDropInfo();
        if (result.length > 0) {
            let resArr = [];
            result.forEach((data) => {
                if (data.hasOwnProperty('dataValues')) {
                    resArr.push(JSON.parse(data['dataValues']['ChangeInfo']));
                }
            });
            resArr.forEach((data) => {
                Object.keys(data).forEach((da) => {
                    if (da === 'VServerSet' && typeof data['VServerSet'] === 'string') {
                        data['VServerSet'] = JSON.parse(data['VServerSet']);
                    }
                    if (da == 'IPSet' && typeof data['IPSet'] === 'string') {
                        data['IPSet'] = JSON.parse(data['IPSet']);
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
        if (req.body.hasOwnProperty('UHostId')) {
            let result = yield Load.cancelDropHost(req.body.UHostId);
            if (result) {
                res.createSuccess();
            } else {
                res.createFailure();
            }
        }
    }),

    // 批量更新
    updateAll: (req, res) => co(function *() {
        let hostArr = [];
        let bj2 = yield uclouldAuth.getLoadInfo("cn-bj2", '', '');
        let hk = yield uclouldAuth.getLoadInfo("hk", '', '');
        hostArr = handleUcloudData([bj2, hk], hostArr);    // ucloud数据
        let hostArrLocal = yield Load.loadInfo(req.body);    // 本地数据
        checkJson(hostArr, hostArrLocal, res);
    }),

    // 变更记录
    history: (req, res) => co(function *() {
        let result = yield Load.history(req.query);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    })
};

// 数据比对
function checkJson(arg, localInfo, res) {
    let objArr = [{}];
    localInfo.forEach((data) => {
        Object.keys(data).forEach((f) => {
            if (f == "dataValues") {
                data[f]['IPSet'] = JSON.parse(data[f]['IPSet']);
                data[f]['VServerSet'] = JSON.parse(data[f]['VServerSet']);
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
                    if (da["ULBId"] == data["ULBId"]) {

                        ty = 1;
                        // IPSet数据比对
                        let uclIPSet = sha(JSON.stringify(da['IPSet']));
                        let localIPSet = sha(JSON.stringify(data['IPSet']));
                        if (uclIPSet != localIPSet) {
                            bojBase[item] = da;
                        }
                        
    
                        // VServerSet
                        da['VServerSet'].forEach((dav, index) => {
                            Object.keys(dav).forEach((dx) => {
                                if (dav[dx] instanceof Array) {
                                    dav[dx].forEach((dex, rt) => {
                                        
                                        Object.keys(dex).forEach((ttu) => {
                                            if (ttu !== 'BackendId' && ttu !== 'ResourceType' && ttu !== 'ResourceId' &&
                                                ttu !== 'ResourceName' && ttu !== 'PrivateIP' && ttu !== 'SubnetId') {
                                               
                                                if (typeof dex[ttu] == "string") {
                                                    if (dex[ttu] != data['VServerSet'][index][dx][rt][ttu]) {
                                                        bojBase[item] = da;
                                                    }
                                                } else if (typeof dex[ttu] == 'object') {
                                                    if (sha(JSON.stringify(dex[ttu]))
                                                        != sha(JSON.stringify(data['VServerSet'][index][dx][rt][ttu]))) {
                                                        bojBase[item] = da;
                                                    }
                                                }
                                            }
                                           
                                        });
                                    });
                                } else {
                                    if (dav[dx]) {
                                        if (dav[dx] !== data['VServerSet'][index][dx]) {
                                            bojBase[item] = da;
                                        }
                                    }
                                }
                            });
                        });
    
                       
    
                        // 其他数据
                        Object.keys(da).forEach((y) => {
                            if (y !== "IPSet" && y !== "VServerSet" && y !== "BandwidthType" && y !== "Bandwidth") {
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
            if (da.ULBId === data.ULBId) {
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
            while (arr.length !== 0) {
                let obj = arr.pop();
                if (obj && obj.hasOwnProperty("ULBId")) {

                    let result = yield Load.hostInfoUpdateAll(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("ULBId")) {
                        current ++;
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
            while (arr.length !== 0) {
                let obj = arr.pop();
                if (obj && obj.hasOwnProperty("ULBId")) {

                    let result = yield Load.hostInfoDelAll(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("ULBId")) {
                        current++;
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
            while (arr.length !== 0) {
                let obj = arr.pop();
                if (obj && obj.hasOwnProperty("ULBId")) {

                    let result = yield Load.loadCreate(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("ULBId")) {
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
    let shasum = crypto.createHash('sha1');
    shasum.update(strHash);
    return shasum.digest('hex');
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