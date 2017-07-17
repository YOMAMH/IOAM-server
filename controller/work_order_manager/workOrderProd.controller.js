/**
 * Created by renminghe on 2017/6/12.
 */
const co = require('co');
const Order = require('../../model/work_order_production_model');
const ckAuKey = require('../../global/checkAuthKey');
const fs = require('fs');
const path = require('path');
const User = require('../../model/user_manager');

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
    
    // 创建应用工单
    createProdOrder: (req, res) => co(function *() {
        let arg = req;
        let orderType = arg.body.order_type;
        let accept_user_last = "";
        let accept_user = "";
        if (orderType === "测试审核中") {
            accept_user_last = yield User.userInfo({group: req.body.pro_type, auth: '1.2'});
            if (accept_user_last.hasOwnProperty('dataValues')) {
                accept_user_last = accept_user_last.dataValues.name + ":" + accept_user_last.dataValues.uidNumber;
                accept_user = accept_user_last;
            } else {
                res.createFailure({msg: "未找到测试人员"});
            }
        }
        
        arg.body.accept_user_last = accept_user_last;
        arg.body.accept_user = accept_user;
        let result = yield Order.createProdOrder(arg);
        if (result.hasOwnProperty('dataValues')) {
            // socketio.sendCreateOrder({msg:"您有一个新的工单，请及时处理", accept:result.dataValues.accept_user_last});
            res.createSuccess();
        } else {
            res.createFailure({msg: result});
        }
    }),
    
    // 下载附件
    donwloadFiles: (req, res) => co(function *() {
        
        let result = yield Order.searchDonwloadFiles(req.query.id);
        if (result.hasOwnProperty('dataValues')) {
            let type = req.query.type;
            let downloadPath = result.dataValues[type];
            download(res, downloadPath);
        } else {
            res.createFailure();
        }
    }),
    
    // 个人未处理工单数据
    workOrderUnHandleInfo: (req, res) => co(function *() {
        let result = yield Order.workOrderUnHandleInfo(req.query);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 删除个人未处理工单
    dropUnHandleOrderInfo: (req, res) => co(function *() {
        let result = yield Order.dropUnHandleOrderInfo(req.query);
        if (result) {
            res.createSuccess();
        } else if (result.hasOwnProperty("status") && result.status === 500){
            res.createFailure();
        } else {
            res.createFailure({msg: result});
        }
    }),
    
    // 个人受理工单
    myAcceptOrder: (req, res) => co(function *() {
        let result = yield Order.myAcceptOrder(req.query);
        if (result.length > 0) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 获取个人未处理的工单数量
    unHandleOrderInfoCount: (req, res) => co(function *() {
        let result = yield Order.unHandleOrderInfoCount(req.query);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 处理个人受理工单
    updateMyAcceptOrder: (req, res) => co(function *() {
        let body = req.body;
        let accept_user_last = "";
        let accept_user = "";
        if (body.active === "运维审核执行中") {
            accept_user_last = yield User.userInfo({group: body.group, auth: ',2'});
            if (accept_user_last.hasOwnProperty("dataValues")) {
                accept_user = accept_user_last.dataValues.name + ":" + accept_user_last.dataValues.uidNumber;
                body.accept_user_last = accept_user;
                body.accept_user = accept_user;
            } else {
                res.createFailure({msg: "未找到相关运维人员"})
            }
            
        } else if (body.active === "运维审核通过，已实施") {
            accept_user = body.user;
            body.accept_user_last = accept_user;
            body.accept_user = accept_user;
        } else if (body.active === "产品审核中") {
            accept_user_last = yield User.userInfo({group: body.group, auth: '1.3'});
            if (accept_user_last.hasOwnProperty("dataValues")) {
                accept_user = accept_user_last.dataValues.name + ":" + accept_user_last.dataValues.uidNumber;
                body.accept_user_last = accept_user;
                body.accept_user = accept_user;
            } else {
                res.createFailure({msg: "未找到相关产品经理人员"})
            }
        }
        let result = yield Order.updateMyAcceptOrder(body);
        if (result) {
            res.createSuccess();
        } else {
            res.createFailure();
        }
    }),
    
    // 个人受理工单总数
    orderTotalCount: (req, res) => co(function *() {
        let result2 = yield Order.handledAcceptOrderCount(req.query);    // 个人已处理的受理工单数量
        if (result2.hasOwnProperty("status") && result2.status === 500) {
            res.createFailure();
        } else {
            res.createSuccess({content: result2});
        }
    }),
    
    // 公共受理工单
    publicAcceptOrder: (req, res) => co(function *() {
        let result = yield Order.publicAcceptOrder(req.query);    // 个人未处理的受理工单数量
        if (result.length > 0) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 公共受理工单数量
    publicOrderTotalCount: (req, res) => co(function *() {
        let result1 = yield Order.unHandlePublicAcceptOrderCount();    // 未处理的公共受理工单数量
        let result2 = yield Order.handledPublicAcceptOrderCount();    // 已处理的公共受理工单数量
        if (result1.status === 500 && result2.status === 500) {
            res.createFailure();
        } else {
            if (result1.status === 500) {
                res.createSuccess({content: result2});
            } else if (result2.status === 500) {
                res.createSuccess({content: result1});
            } else {
                res.createSuccess({content: result1 > result2 ? result1 : result2});
            }
        }
    }),
    
    // 所有未处理工单
    workOrderUnHandleInfoAll: (req, res) => co(function *() {
        let result = yield Order.workOrderUnHandleInfoAll(req.query);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 所有未处理工单数量
    unHandleOrderInfoAllCount: (req, res) => co(function *() {
        let result = yield Order.unHandleOrderInfoAllCount();
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 所有已处理工单
    workOrderHandledInfoAll: (req, res) => co(function *() {
        let result = yield Order.workOrderHandledInfoAll(req.query);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 所有已处理工单数量
    handledOrderInfoAllCount: (req, res) => co(function *() {
        let result = yield Order.handledOrderInfoAllCount();
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 确认工单
    manageHandledOrder: (req, res) => co(function *() {
        let accept_user_last = '';
        let accept_user = '';
        let arg = req.body;
        if (arg.order_type === "再次提交，测试审核中") {
            accept_user_last = yield User.userInfo({group: arg.pro_type, auth: '1.2'});
            if (accept_user_last.hasOwnProperty('dataValues')) {
                accept_user_last = accept_user_last.dataValues.name + ":" + accept_user_last.dataValues.uidNumber;
                accept_user = accept_user_last;
                arg.accept_user = accept_user;
                arg.accept_user_last = accept_user_last;
                let result = yield Order.manageHandledOrder(req);
                if (result) {
                    res.createSuccess();
                } else {
                    res.createFailure();
                }
            } else {
                res.createFailure({msg: "未找到测试人员"});
            }
        } else {
            let result = yield Order.manageHandledOrder(arg);
            if (result) {
                res.createSuccess();
            } else {
                res.createFailure();
            }
        }
       
        
    }),
    
    // 获取指定工单数据
    OrdersInfo: (req, res) => co(function *() {
        let result = yield Order.OrdersInfo(req.params);
        
        let anyObject = [];
        if (result) {
            result.forEach(data => {
                anyObject = data.dataValues["change_content"].split(';');
                anyObject.forEach(item => {
                    
                    if (item.indexOf(req.params.change_instance_name) !== -1) {
                        item = item.substring(item.search(/{/) + 1, item.search(/}/));
                        data.dataValues["change_content"] = item;
                    }
                });
            });
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 获取已解决的工单
    workOrderInfo: (req, res) => co(function *() {
        let result = yield Order.workOrderInfo(req.query);
        if (result.length > 0) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 获取已解决的工单数量
    handledOrderInfoCount: (req, res) => co(function *() {
        let result = yield Order.handledOrderInfoCount(req.query);
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 获取应用工单变更最多top5
    orderProdMaxRound: (req, res) => co(function *() {
        let result = yield Order.orderProdMaxRound(req.query);
        if (result.length > 0) res.createSuccess({content: result});
        else {
            res.createFailure()
        }
    }),
    
    // 获取特定应用工单记录
    orderProdsByName: (req, res) => co(function *() {
        let result = yield Order.orderProdsByName(req.params.instanceName);
        if (result.length > 0) res.createSuccess({content: result});
        else {
            res.createFailure()
        }
    }),
    
    
};


// 下载附件方法
function download(res, path) {
    let file_path = fs.existsSync(path);
    if (file_path) {
        let source = fs.readFileSync(path, "utf-8");
        let file_name = path.substring(path.lastIndexOf("%^") + 2);
        let file_path_name = path.substring(0, path.lastIndexOf("/"));
        let file_path_temp = `${file_path_name}/${file_name}`;
        fs.writeFileSync(file_path_temp, source);
        res.download(file_path_temp, (err => {
            fs.unlinkSync(file_path_temp);
            if (err) throw err;
        }));
    } else {
        res.createFailure();
    }
}