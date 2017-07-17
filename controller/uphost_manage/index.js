/**
 * Created by renminghe on 2017/3/16.
 */
const express = require('express');
const Router = express.Router();
const upHostManner = require('./index.controller');

Router.use(upHostManner.ckAuKeyFun);
Router.post('/upHostInfo', upHostManner.upHostInfo);    // 获取本地主机信息
Router.post('/addUpHostInfo', upHostManner.addUpHostInfo);    // 批量添加物理主机信息
Router.post('/upHosInfoCount', upHostManner.upHosInfoCount);    // 批量添加物理主机信息数量
Router.post('/hostInfoUCloud', upHostManner.hostInfoUCloud);    // 获取ucloud物理主机信息
Router.post('/hostCreate', upHostManner.hostCreate);    // 获取ucloud物理主机信息
Router.post('/hostInfoUpdate', upHostManner.hostInfoUpdate);    // 更新物理主机信息
Router.post('/hostInfoDelete', upHostManner.hostInfoDelete);    // 删除物理主机信息
Router.post('/hostDropInfo', upHostManner.hostDropInfo);    // 本地主机删除信息
Router.post('/cancelDropHost', upHostManner.cancelDropHost);    // 撤销删除
Router.post('/updateAll', upHostManner.updateAll);    // 批量更新
Router.get('/history', upHostManner.history);    // 变更记录
Router.get('/others', upHostManner.others);
module.exports = Router;