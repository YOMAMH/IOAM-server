/**
 * Created by renminghe on 2017/3/20.
 */
const co = require('co');
const SSL = require('../../model/load_model');
const ckAuKey = require('../../global/checkAuthKey');
const loadChangeModel = require('../../model/load_model/loadChangeHistory');

module.exports = {

    // 加密校验
    ckAuKeyFun: (req, res, next) => {
        ckAuKey(req, res, () => next());
    },

    // 获取主机信息
    sslInfo: (req, res) => co(function *() {
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
    sslCreate: (req, res) => co(function *() {

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
    sslInfoUCloud: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('id') && req.body.hasOwnProperty('reg')) {
            let result = yield SSL.loadInfoUCloud(req.body.reg, req.body.id);
            result = JSON.parse(result);
            if (result.hasOwnProperty('DataSet')) {
                res.createSuccess({content: result});
            } else {
                res.createFailure();
            }
        }

    }),

    // 获取本地信息总数
    sslInfoCount: (req, res) => co(function *() {
        let result = yield SSL.sslInfoCount();
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),

    // 批量导入主机信息
    sslInfoCopy: (req, res) => co(function *() {
        let result = yield Load.loadInfoCopy();
        if (result) {
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
