/**
 * Created by renminghe on 2017/3/23.
 */
const co = require('co');
const Load = require('../../model/load_model');
const ckAuKey = require('../../global/checkAuthKey');
const loadChangeModel = require('../../model/load_model/loadChangeHistory');

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
                res.createSuccess({content:result});
            } else {
                res.createFailure();
            }

        } else if (req.body.hasOwnProperty('index')) {
            let result = yield Load.loadInfo(parseInt(req.body.index));
            if (result) {
                res.createSuccess({content:result});
            } else {
                res.createFailure();
            }
        } else if (req.body.hasOwnProperty('searchId')) {
            let result = yield Load.searchId(req.body);
            if (result) {
                res.createSuccess({content:result});
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

                    // 增加变更历史记录
                    let changeInfo = JSON.stringify(createResult.dataValues).toString();
                    let createChangeInfo = yield loadChangeModel.createChangeInfo(createResult.dataValues, changeInfo, "create");
                    if (createChangeInfo.hasOwnProperty('dataValues')) {
                        res.createSuccess();
                    } else {
                        res.createFailure({reason: createChangeInfo});
                    }
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
                        count ++;
                        if (count == result.length - 1) {
                            res.createSuccess();
                        }
                    }
                });
            });
        } else {
            res.createFailure();
        }
    })
};
