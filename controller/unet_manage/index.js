/**
 * Created by renminghe on 2017/4/6.
 */
const express = require('express');
const Router = express.Router();
const ipManner = require('./net.ip.controller');
const bandManner = require('./net.band.controller');

Router.use(ipManner.ckAuKeyFun);

// 弹性IP
Router.get('/ip/Info', ipManner.Info);    // 获取本地信息
Router.post('/ip/createInfo', ipManner.createInfo);    // 创建信息
Router.get('/ip/InfoUCloud', ipManner.InfoUCloud);    // 获取ucloud信息
Router.post('/ip/InfoUpdate', ipManner.InfoUpdate);    // 更新本地信息
Router.post('/ip/InfoDelete', ipManner.InfoDelete);    // 删除本地信息
Router.get('/ip/InfoCount', ipManner.InfoCount);    // 本地信息总数
Router.get('/ip/InfoCopy', ipManner.InfoCopy);    // 批量导入主机信息
Router.get('/ip/dropInfo', ipManner.dropInfo);    // 本地删除信息
Router.post('/ip/cancelDrop', ipManner.cancelDrop);    // 撤销删除
Router.post('/ip/updateAll', ipManner.updateAll);    // 批量更新
Router.get('/ip/history', ipManner.history);    // 变更记录


// 共享宽带
Router.get('/band/Info', bandManner.Info);    // 获取本地信息
Router.post('/band/createInfo', bandManner.createInfo);    // 创建信息
Router.get('/band/InfoUCloud', bandManner.InfoUCloud);    // 获取ucloud信息
Router.post('/band/InfoUpdate', bandManner.InfoUpdate);    // 更新本地信息
Router.post('/band/InfoDelete', bandManner.InfoDelete);    // 删除本地信息
Router.get('/band/InfoCount', bandManner.InfoCount);    // 本地信息总数
Router.get('/band/InfoCopy', bandManner.InfoCopy);    // 批量导入主机信息
Router.get('/band/dropInfo', bandManner.dropInfo);    // 本地删除信息
Router.post('/band/cancelDrop', bandManner.cancelDrop);    // 撤销删除
Router.post('/band/updateAll', bandManner.updateAll);    // 批量更新
Router.get('/band/history', bandManner.history);    // 变更记录
module.exports = Router;