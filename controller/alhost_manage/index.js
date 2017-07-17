/**
 * Created by renminghe on 2017/2/14.
 */
const express = require("express");
const Router = express.Router();
let Host = require("./index.controller");

// 加密校验
Router.use(Host.ckAuKeyFun);

Router.get('/hostInfo', Host.hostInfo);    // 获取本地虚机数据
Router.get('/hostInfoCopy', Host.hostInfoCopy);    // 批量导入阿里云数据
Router.get('/hostInfoCount', Host.hostInfoCount);    // 获取本地虚机数据量
Router.get('/alCloudInfo', Host.alCloudInfo);    // 获取阿里云数据
Router.post('/hostCreate', Host.hostCreate);    // 创建主机
Router.delete('/hostInfoDelete', Host.hostInfoDelete);    // 删除主机
Router.put('/hostInfoUpdate', Host.hostInfoUpdate);    // 更新主机
Router.get('/updateAll', Host.updateAll);    // 批量更新主机
Router.get('/hostDropInfo', Host.hostDropInfo);    // 删除的主机数据
Router.post('/cancelDropHost', Host.cancelDropHost);    // 撤销删除
Router.get('/history', Host.history);    // 变更记录
Router.get('/others', Host.others);

module.exports = Router;