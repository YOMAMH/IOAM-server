/**
 * Created by renminghe on 2017/7/7.
 */
const co = require('co');
const DbModel = require('../../model/work_db_model');
const ckAuKey = require('../../global/checkAuthKey');
const fileFormate = require('../../global/fileFormate');

module.exports = {
    // 加密校验
    ckAuKeyFun: (req, res, next) => {
        ckAuKey(req, res, (data) => {
            if (data) {
                next();
            } else {
                res.createFailure();
            }
            
        });
    },
    
    // 获取数据库列表
    orderDbListInfo: (req, res) => co(function *() {
        let result = yield DbModel.orderDbListInfo();
        if (result instanceof Array) {
            res.createSuccess({content: result});
        } else if (result.hasOwnProperty('status') && result.status === 500) {
            res.createFailure();
        } else {
            res.createFailure({msg: result});
        }
    }),
    
    // 创建数据库
    createDbOrder: (req, res) => co(function *() {
        let result = yield DbModel.createDbOrder(req);
        if (result.hasOwnProperty('dataValues')) {
            res.createSuccess();
        } else {
            res.createFailure({msg: result});
        }
    }),
    
    // 个人数据库工单
    workOrderDBInfo: (req, res) => co(function *() {
        let result = yield DbModel.workOrderDBInfo(req.query);
        if (result.length > 0) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 下载数据库工单sql附件
    donwloadDBFiles: (req, res) => co(function *() {
        let result = yield DbModel.searchDonwloadFiles(req.query.id);
        if (result.hasOwnProperty('dataValues')) {
            let type = req.query.type;
            let downloadPath = result.dataValues[type];
            fileFormate.download(res, downloadPath);
        } else {
            res.createFailure();
        }
    }),
    
    // 获取已解决的工单数量
    workOrderDBInfoCount: (req, res) => co(function *() {
        let result = yield DbModel.workOrderDBInfoCount(req.query);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 处理数据库工单
    updateDbOrder: (req, res) => co(function *() {
        let result = yield DbModel.updateDbOrder(req.body);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 关单
    manageHandledDbOrder: (req, res) => co(function *() {
        let result = yield DbModel.manageHandledDbOrder(req);
        if (result) {
            if (result.hasOwnProperty('status') && result.status === 500) {
                res.createFailure();
            } else {
                res.createSuccess();
            }
            
        } else {
            res.createFailure();
        }
    }),
};
