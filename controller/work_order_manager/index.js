/**
 * Created by renminghe on 2017/4/14.
 */
const express = require('express');
const Router = express.Router();
const WorkOrder = require('./workOrder.controller');
const WorkOrderProd = require('./workOrderProd.controller');
const WorkOrderDB = require('./WorkOrderDB.controller');
const multiparty = require('connect-multiparty');
const multipartMiddleware = multiparty();

Router.get('/donwloadFiles', WorkOrderProd.donwloadFiles);    // 下载附件
Router.get('/donwloadDBFiles', WorkOrderDB.donwloadDBFiles);    // 下载数据库工单sql附件
Router.get('/orderProdMaxRound', WorkOrderProd.orderProdMaxRound);    // 获取应用工单变更最多top5

Router.use(WorkOrder.ckAuKeyFun);    // 接口验证

Router.post('/createOrder', WorkOrder.createOrder);    // 创建工单
Router.get('/workOrderInfo', WorkOrder.workOrderInfo);    // 个人已处理工单
Router.get('/handledOrderInfoCount', WorkOrder.handledOrderInfoCount);    // 个人已处理工单数量
Router.get('/workOrderUnHandleInfo', WorkOrder.workOrderUnHandleInfo);    // 个人未处理工单
Router.get('/unHandleOrderInfoCount', WorkOrder.unHandleOrderInfoCount);    // 个人未处理工单数量
Router.delete('/dropUnHandleOrderInfo', WorkOrder.dropUnHandleOrderInfo);    // 删除个人未处理工单
Router.get('/myAcceptOrder', WorkOrder.myAcceptOrder);    // 个人受理工单
Router.post('/updateMyAcceptOrder', WorkOrder.updateMyAcceptOrder);    // 处理个人受理工单
Router.get('/orderTotalCount', WorkOrder.orderTotalCount);    // 个人受理工单总数
Router.get('/publicAcceptOrder', WorkOrder.publicAcceptOrder);    // 公共受理工单
Router.get('/publicOrderTotalCount', WorkOrder.publicOrderTotalCount);    // 公共受理工单数量
Router.get('/workOrderUnHandleInfoAll', WorkOrder.workOrderUnHandleInfoAll);    // 所有未处理工单
Router.get('/unHandleOrderInfoAllCount', WorkOrder.unHandleOrderInfoAllCount);    // 所有未处理工单数量
Router.get('/workOrderHandledInfoAll', WorkOrder.workOrderHandledInfoAll);    // 所有已处理工单
Router.get('/handledOrderInfoAllCount', WorkOrder.handledOrderInfoAllCount);    // 所有已处理工单数量
Router.post('/manageHandledOrder', WorkOrder.manageHandledOrder);    // 确认工单
Router.get('/ordersInfo/:change_instance_name', WorkOrder.OrdersInfo);    // 获取指定实例id对应工单

Router.post('/createProdOrder', multipartMiddleware, WorkOrderProd.createProdOrder);    // 创建应用工单
Router.get('/workProdOrderInfo', WorkOrderProd.workOrderInfo);    // 个人已处理应用工单
Router.get('/handledProdOrderInfoCount', WorkOrderProd.handledOrderInfoCount);    // 个人已处理应用工单数量
Router.get('/workProdOrderUnHandleInfo', WorkOrderProd.workOrderUnHandleInfo);    // 个人未处理应用工单
Router.get('/unHandleProdOrderInfoCount', WorkOrderProd.unHandleOrderInfoCount);    // 个人未处理应用工单数量
Router.delete('/dropUnHandleProdOrderInfo', WorkOrderProd.dropUnHandleOrderInfo);    // 删除个人未处理应用工单
Router.get('/myAcceptProdOrder', WorkOrderProd.myAcceptOrder);    // 个人受理应用工单
Router.put('/updateMyAcceptProdOrder', WorkOrderProd.updateMyAcceptOrder);    // 处理个人受理应用工单
Router.get('/orderProdTotalCount', WorkOrderProd.orderTotalCount);    // 个人受理应用工单总数
Router.get('/publicAcceptProdOrder', WorkOrderProd.publicAcceptOrder);    // 公共受理应用工单
Router.get('/publicProdOrderTotalCount', WorkOrderProd.publicOrderTotalCount);    // 公共受理应用工单数量
Router.get('/workProdOrderUnHandleInfoAll', WorkOrderProd.workOrderUnHandleInfoAll);    // 所有未处理应用工单
Router.get('/unHandleProdOrderInfoAllCount', WorkOrderProd.unHandleOrderInfoAllCount);    // 所有未处理应用工单数量
Router.get('/workProdOrderHandledInfoAll', WorkOrderProd.workOrderHandledInfoAll);    // 所有已处理应用工单
Router.get('/handledProdOrderInfoAllCount', WorkOrderProd.handledOrderInfoAllCount);    // 所有已处理应用工单数量
Router.put('/manageHandledProdOrder', multipartMiddleware, WorkOrderProd.manageHandledOrder);    // 确认应用工单
Router.get('/ordersProdInfo/:id', WorkOrderProd.OrdersInfo);    // 获取指定实例id对应应用工单
Router.get('/orderProdsByName/:instanceName', WorkOrderProd.orderProdsByName);


Router.get('/orderDbListInfo', WorkOrderDB.orderDbListInfo);    // 数据库信息列表
Router.post('/createDbOrder', multipartMiddleware, WorkOrderDB.createDbOrder);    // 创建数据库工单
Router.get('/workOrderDBInfo', WorkOrderDB.workOrderDBInfo);    // 获取数据库工单
Router.get('/workOrderDBInfoCount', WorkOrderDB.workOrderDBInfoCount);    // 获取数据库工单数量
Router.put('/updateDbOrder', WorkOrderDB.updateDbOrder);    // 处理数据库工单
Router.put('/manageHandledDbOrder', multipartMiddleware, WorkOrderDB.manageHandledDbOrder);    // 关单


module.exports = Router;