/**
 * Created by renminghe on 2017/3/17.
 */
const express = require('express');
const Router = express.Router();
const load = require('./index.controller');

Router.use(load.ckAuKeyFun);    // 签名校验
Router.post('/loadInfoCount', load.loadInfoCount);    // 获取本地负载均衡数据量
Router.post('/loadInfoCopy', load.loadInfoCopy);    // 批量导入ucloud数据
Router.post('/loadInfo', load.loadInfo);    // 获取本地数据
Router.post('/loadInfoUCloud', load.loadInfoUCloud);    // 获取ucloud数据
Router.post('/loadCreate', load.loadCreate);    // 创建负载均衡数据
Router.post('/loadInfoUpdate', load.loadInfoUpdate);    // 更新负载均衡数据
Router.post('/loadInfoDelete', load.loadInfoDelete);    // 删除负载均衡信息
Router.post('/hostDropInfo', load.hostDropInfo);    // 本地主机删除信息
Router.post('/cancelDropHost', load.cancelDropHost);    // 撤销删除
Router.post('/updateAll', load.updateAll);    // 批量更新
Router.get('/history', load.history);    // 变更记录
module.exports = Router;