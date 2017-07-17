/**
 * Created by renminghe on 2017/2/14.
 */
const express = require("express");
const Router = express.Router();
let EIP = require("./index.controller");

// 加密校验
Router.use(EIP.ckAuKeyFun);

Router.get('/localInstanceInfo', EIP.localInstanceInfo);    // 获取本地实例
Router.get('/cloudInstanceInfoCopy', EIP.cloudInstanceInfoCopy);    // 批量导入阿里云数据
Router.get('/localInstanceInfoCount', EIP.localInstanceInfoCount);    // 获取本地实例数据量
Router.get('/instanceInfoALiCloud', EIP.instanceInfoALiCloud);    // 获取阿里云数据
Router.post('/localInstanceCreate', EIP.localInstanceCreate);    // 创建实例
Router.delete('/localInstanceInfoDelete', EIP.localInstanceInfoDelete);    // 删除实例
Router.put('/localInstanceUpdate', EIP.localInstanceUpdate);    // 更新实例
Router.get('/localInstanceUpdateAll', EIP.localInstanceUpdateAll);    // 批量更新实例
Router.get('/localInstanceDropInfo', EIP.localInstanceDropInfo);    // 获取删除的实例数据
Router.put('/cancelDropLocalInstance', EIP.cancelDropLocalInstance);    // 撤销删除
Router.get('/localInstance', EIP.localInstance);    // 变更记录

module.exports = Router;