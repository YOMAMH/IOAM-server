/**
 * Created by renminghe on 2017/4/14.
 */
const co = require('co');
const Order = require('../../model/work_order_model');
const ckAuKey = require('../../global/checkAuthKey');
// const socketio = require('../../socket');

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
    
    // 创建工单
    createOrder: (req, res) => co(function *() {
        let result = yield Order.createOrder(req.body);
        if (result.hasOwnProperty('dataValues')) {
            // socketio.sendCreateOrder({msg:"您有一个新的工单，请及时处理", accept:result.dataValues.accept_user_last});
            res.createSuccess();
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
    
    // 个人未处理工单数据
    workOrderUnHandleInfo: (req, res) => co(function *() {
        let result = yield Order.workOrderUnHandleInfo(req.query);
        if (result) {
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
    
    // 处理个人受理工单
    updateMyAcceptOrder: (req, res) => co(function *() {
        let result = yield Order.updateMyAcceptOrder(req.body);
        if (result) {
            res.createSuccess();
        } else {
            res.createFailure();
        }
    }),
    
    // 确认工单
    manageHandledOrder: (req, res) => co(function *() {
        let result = yield Order.manageHandledOrder(req.body);
        if (result) {
            res.createSuccess();
        } else {
            res.createFailure();
        }
    }),
    
    // 个人受理工单总数
    orderTotalCount: (req, res) => co(function *() {
        let result2 = yield Order.handledAcceptOrderCount(req.query);    // 个人已处理的受理工单数量
        if ((result2.hasOwnProperty("status") && result2.status === 500)) {
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
    
    // 获取指定工单数据
    OrdersInfo: (req, res) => co(function *() {
        let result = yield Order.OrdersInfo(req.params);
       
        let anyObject = [];
        if (result) {
            result.forEach(data => {
                anyObject = data.dataValues["change_content"].split(';');
                anyObject.forEach(item => {
                    if (item.indexOf(req.params.change_instance_name) !== -1) {
                       item = item.substring(item.search(/:/) + 1);
                       data.dataValues["change_content"] = item;
                    }
                });
            });
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
};