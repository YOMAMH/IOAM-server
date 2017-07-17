/**
 * Created by renminghe on 2017/3/3.
 */
const co = require('co');
const uhost = require('../../model/uhost_model');
const uphost = require('../../model/uphost_model');
const apm = require('../../model/apm_model');
const ckAuKey = require('../../global/checkAuthKey');
const uclouldAuth = require('../../global/ucloudAuth');
const crypto = require('crypto');
let successCount = 0;

function responseData(req, res, apmInfo) {
    let apmItem = '';
    let apmInfoArr = [];
    if (apmInfo) {
        if (apmInfo instanceof Array) {  // 如果是数组，说明是获取全部数据
            for (apmItem in apmInfo) {
                if (apmInfo[apmItem].hasOwnProperty("dataValues")) {  // 如果有dataValues属性说明获取数据成功
                    apmInfoArr.push(apmInfo[apmItem]["dataValues"]);
                }
            }
            apmInfoArr.forEach((data) => {
                if (data.hasOwnProperty('DiskSet')) {
                    data['DiskSet'] = JSON.parse(data['DiskSet']);
                }
                if (data.hasOwnProperty('IPSet')) {
                    data['IPSet'] = JSON.parse(data['IPSet']);
                }
            });
            res.createSuccess({content: apmInfoArr});
        } else {  // 如果不是数组，说明是获取符合特定条件的数据
            // 如果有dataValues属性说明获取数据成功,返回状态码加数据
            if (apmInfo.hasOwnProperty("dataValues")) {
                res.createSuccess({content: apmInfo.dataValues});
            }
            if (apmInfo.toString() == '1') {
                res.createSuccess({content: apmInfo.toString()});
            }
        }
    } else {
        res.createFailure();
    }
}

function handleUcloudData(arg, arr) {
    if (arg instanceof Array) {
        arg.forEach((item) => {
            item = JSON.parse(item);
            if (item.TotalCount > 0) {
                item.UHostSet.forEach((data) => {
                    arr.push(data);
                });
            }
        });
    }
    return arr;
}

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
    hostInfo: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('UHostId')) {
            
            let result = yield uhost.hostInfo(req.body);
            if (result) {
                responseData(req, res, result);
            } else {
                res.createFailure();
            }
            
        } else if (req.body.hasOwnProperty('index')) {
            let result = yield uhost.hostInfo(parseInt(req.body.index));
            if (result) {
                responseData(req, res, result);
            } else {
                res.createFailure();
            }
        } else if (req.body.hasOwnProperty('searchId')) {
            let result = yield uhost.searchId(req.body);
            if (result) {
                responseData(req, res, result);
            } else {
                res.createFailure();
            }
        }
    }),
    
    // 添加主机信息
    hostCreate: (req, res) => co(function *() {
        
        // 本地查重
        let result = yield uhost.hostInfo(req.body);
        if (result.hasOwnProperty('status') && result.status == 500) {
            let createResult = yield uhost.hostCreate(req.body);
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
    hostInfoUCloud: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('id') && req.body.hasOwnProperty('reg')) {
            let result = yield uhost.hostInfoUCloud(req.body.reg, req.body.id);
            result = JSON.parse(result);
            if (result.hasOwnProperty('UHostSet')) {
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
    hostInfoUpdate: (req, res) => co(function *() {
        let result = yield uhost.hostInfoUCloud(req.body.reg, req.body.UHostId);     // 获取ucloud主机信息
        result = JSON.parse(result);
        if (result.TotalCount != 0) {
            let upResult = yield uhost.hostInfoUpdate(result.UHostSet[0]);
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
        let result = yield uhost.hostInfoDelete(req.body.hostId);
        if (result.hasOwnProperty('dataValues')) {
            res.createSuccess();
        } else {
            res.createFailure();
        }
    }),
    
    // 获取本地主机信息总数
    hostInfoCount: (req, res) => co(function *() {
        let result = yield uhost.hostInfoCount();
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 批量导入主机信息
    hostInfoCopy: (req, res) => co(function *() {
        let result = yield uhost.hostInfoCopy();
        if (result.length > 0) {
            let count = 0;
            result.forEach((val) => {
                co(function *() {
                    let resItem = yield uhost.hostCreate(val);
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
    
    // 获取删除的主机信息
    hostDropInfo: (req, res) => co(function *() {
        let result = yield uhost.hostDropInfo();
        if (result.length > 0) {
            let resArr = [];
            result.forEach((data) => {
                if (data.hasOwnProperty('dataValues')) {
                    resArr.push(JSON.parse(data['dataValues']['ChangeInfo']));
                }
            });
            resArr.forEach((data) => {
                Object.keys(data).forEach((da) => {
                    if (da === 'DiskSet' && typeof data['DiskSet'] === 'string') {
                        data['DiskSet'] = JSON.parse(data['DiskSet']);
                    }
                    if (da === 'IPSet' && typeof data['DiskSet'] === 'string') {
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
            let result = yield uhost.cancelDropHost(req.body.UHostId);
            if (result) {
                res.createSuccess();
            } else {
                res.createFailure();
            }
            
        }
    }),
    
    // 批量更新
    updateAll: (req, res) => co(function *() {
        let hostArrLocal = yield uhost.hostInfo(req.body);    // 本地数据
        console.log("======加载本地数据======");
        let hostArr = [];
        let bj1 = yield uclouldAuth.getHostInfo("cn-bj1", '', '');
        let bj2 = yield uclouldAuth.getHostInfo("cn-bj2", '', '');
        let hk = yield uclouldAuth.getHostInfo("hk", '', '');
        hostArr = handleUcloudData([bj1, bj2, hk], hostArr);    // ucloud数据
        console.log("======加载远程数据======");
        checkJson(hostArr, hostArrLocal, res);
        
    }),
    
    // 变更记录
    history: (req, res) => co(function *() {
        let result = yield uhost.history(req.query);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // others
    others: (req, res) => co(function *() {
        let result = yield uhost.others(req.query);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 业务组主机列表
    group: (req, res) => co(function *() {
        let result = yield uhost.group(req.query);
        let appHostSet = handleAppMap(result, req.query.appName);
        if (appHostSet.size > 0) {
            let resultLast = [];
            for (let item of appHostSet.values()) {
                let uhostRes = yield uhost.searchName(item);
                let uphostRes = yield uphost.searchName(item);
                if (uhostRes.hasOwnProperty("dataValues")) {
                    resultLast.push(uhostRes.dataValues);
                } else if (uphostRes.hasOwnProperty("dataValues")) {
                    resultLast.push(uphostRes.dataValues);
                }
            }
            res.createSuccess({content: resultLast});
        } else {
            res.createFailure();
        }
    }),
    
    // 主机部署应用列表
    appGroup: (req, res) => co(function *() {
        let result = yield uhost.group();
        let appHostSet = handleAppHostMap(result, req.query.hostName);
        console.log(appHostSet);
        if (appHostSet.size > 0) {
            let resultLast = [];
            for (let item of appHostSet.values()) {
                let appresult1 = yield apm.app({appName: item}, "apm_app");
                let appresult2 = yield apm.browser({appName: item}, "apm_browser");
                let appresult3 = yield apm.common({appName: item}, "apm_common");
                let appresult4 = yield apm.network({appName: item}, "apm_network");
                let appresult5 = yield apm.saas({appName: item}, "apm_saas");
                let appresult6 = yield apm.server({appName: item}, "apm_server");
                let appresult7 = yield apm.netop({appName: item}, "apm_netop");
                let appresult8 = yield apm.controller({appName: item}, "apm_controller");
                let appresult9 = yield apm.alarm({appName: item}, "apm_alarm");
                let appresult10 = yield apm.base({appName: item}, "apm_base");
                if (appresult1.hasOwnProperty("dataValues")) {
                    resultLast.push(appresult1.dataValues);
                } else if (appresult2.hasOwnProperty("dataValues")) {
                    resultLast.push(appresult2.dataValues);
                } else if (appresult3.hasOwnProperty("dataValues")) {
                    resultLast.push(appresult3.dataValues);
                } else if (appresult4.hasOwnProperty("dataValues")) {
                    resultLast.push(appresult4.dataValues);
                } else if (appresult5.hasOwnProperty("dataValues")) {
                    resultLast.push(appresult5.dataValues);
                } else if (appresult6.hasOwnProperty("dataValues")) {
                    resultLast.push(appresult6.dataValues);
                } else if (appresult7.hasOwnProperty("dataValues")) {
                    resultLast.push(appresult7.dataValues);
                } else if (appresult8.hasOwnProperty("dataValues")) {
                    resultLast.push(appresult8.dataValues);
                } else if (appresult9.hasOwnProperty("dataValues")) {
                    resultLast.push(appresult9.dataValues);
                } else if (appresult10.hasOwnProperty("dataValues")) {
                    resultLast.push(appresult10.dataValues);
                }
            }
            res.createSuccess({content: resultLast});
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
                    if (da["UHostId"] == data["UHostId"]) {
                        ty = 1;
                        // IPSet数据比对
                        let IPSetUcl = sha(da['IPSet']);
                        let IPSetLoc = sha(data['IPSet']);
                        if (IPSetUcl !== IPSetLoc) {
                            bojBase[item] = da;
                        }
                        
                        // DiskSet
                        let DiskSetUcl = sha(da['DiskSet']);
                        let DiskSetLoc = sha(data['DiskSet']);
                        if (DiskSetUcl !== DiskSetLoc) {
                            bojBase[item] = da;
                        }
                        
                        // 其他数据
                        Object.keys(da).forEach((y) => {
                            if (y != "IPSet" && y != "DiskSet" && y != "HostType") {
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
            if (ty === 0) {
                bojDel[item] = data;
            }
        });
    });
    
    let addTy = 0;
    arg.forEach((da, i) => {
        objArr.forEach((data, item) => {
            if (da.UHostId === data.UHostId) {
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
    
    // 如果有更新的内容
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
                if (obj && obj.hasOwnProperty("UHostId")) {
                    
                    let objStr = JSON.stringify(obj);
                    let result = yield uhost.hostInfoUpdateAll(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("UHostId")) {
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
                if (obj && obj.hasOwnProperty("UHostId")) {
                    
                    let result = yield uhost.hostInfoDelAll(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("UHostId")) {
                        current++;
                        if (current == count) {
                        
                        }
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
            while (arr.length != 0) {
                let obj = arr.pop();
                if (obj && obj.hasOwnProperty("UHostId")) {
                    
                    let result = yield uhost.hostCreate(obj);
                    if (result.hasOwnProperty("dataValues") && result.dataValues.hasOwnProperty("UHostId")) {
                        current++;
                        if (current == count) {
                        
                        }
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

// 处理应用部署虚机数据
function handleAppMap(data, appName) {
    let appMap = {};
    let appHostSet = new Set();
    if (data) {
        data.body = JSON.parse(data.body);
        let dataSet = data.body.items;
        dataSet.forEach(obj => {
            if (obj.metadata.labels) {
                Object.keys(obj.metadata.labels).forEach(loabItem => {
                    if (loabItem !== "kubernetes.io/hostname") {
                        if (!appMap[obj.metadata.labels[loabItem]]) appMap[obj.metadata.labels[loabItem]] = new Set();
                        appMap[obj.metadata.labels[loabItem]].add(obj.metadata.name);
                    }
                });
            }
        })
    }
    
    Object.keys(appMap).forEach(dataItem => {
        if (dataItem === appName) appHostSet = appMap[appName];
    });
    
    return appHostSet;
}

// 处理虚机部署应用数据
function handleAppHostMap(data, hostName) {
    let appMap = {};
    let appHostSet = new Set();
    if (data) {
        data.body = JSON.parse(data.body);
        let dataSet = data.body.items;
        dataSet.forEach(obj => {
            if (obj.metadata.labels) {
                Object.keys(obj.metadata.labels).forEach(loabItem => {
                    if (loabItem !== "kubernetes.io/hostname") {
                        if (!appMap[obj.metadata.name]) appMap[obj.metadata.name] = new Set();
                        appMap[obj.metadata.name].add(obj.metadata.labels[loabItem]);
                    }
                });
            }
        })
    }
    
    Object.keys(appMap).forEach(dataItem => {
        if (dataItem === hostName) appHostSet = appMap[hostName];
    });
    
    return appHostSet;
}

// 处理相应数据
function responseInfo(data) {
    let arrTemp = [];
    data.forEach(info => {
        arrTemp.push(info.dataValues);
    });
    return arrTemp;
}
