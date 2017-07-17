/**
 * Created by renminghe on 2017/3/3.
 */
const express = require('express');
const Router = express.Router();
const hostManner = require('./index.controller');

Router.use(hostManner.ckAuKeyFun);
Router.post('/hostInfo', hostManner.hostInfo);    // 获取本地主机信息
Router.post('/hostCreate', hostManner.hostCreate);    // 创建主机
Router.post('/hostInfoUCloud', hostManner.hostInfoUCloud);    // 获取ucloud主机信息
Router.post('/hostInfoUpdate', hostManner.hostInfoUpdate);    // 更新本地主机信息
Router.post('/hostInfoDelete', hostManner.hostInfoDelete);    // 删除本地主机信息
Router.post('/hostInfoCount', hostManner.hostInfoCount);    // 本地主机信息总数
Router.post('/hostInfoCopy', hostManner.hostInfoCopy);    // 批量导入主机信息
Router.post('/hostDropInfo', hostManner.hostDropInfo);    // 本地主机删除信息
Router.post('/cancelDropHost', hostManner.cancelDropHost);    // 撤销删除
Router.post('/updateAll', hostManner.updateAll);    // 批量更新
Router.get('/history', hostManner.history);    // 变更记录
Router.get('/group', hostManner.group);    // 业务组主机列表
Router.get('/appGroup', hostManner.appGroup);    // 主机部署应用列表
Router.get('/others', hostManner.others);
module.exports = Router;