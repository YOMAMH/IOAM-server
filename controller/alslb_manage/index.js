/**
 * Created by renminghe on 2017/2/14.
 */
const express = require("express");
const Router = express.Router();
let SLB = require("./index.controller");

// 加密校验
Router.use(SLB.ckAuKeyFun);

Router.get('/localInstanceInfo', SLB.localInstanceInfo);    // 获取本地实例
Router.get('/cloudInstanceInfoCopy', SLB.cloudInstanceInfoCopy);    // 批量导入阿里云数据
Router.get('/localInstanceInfoCount', SLB.localInstanceInfoCount);    // 获取本地虚机数据量
Router.get('/instanceInfoALiCloud', SLB.instanceInfoALiCloud);    // 获取阿里云数据
Router.post('/localInstanceCreate', SLB.localInstanceCreate);    // 创建实例
Router.delete('/localInstanceInfoDelete', SLB.localInstanceInfoDelete);    // 删除实例
Router.put('/localInstanceUpdate', SLB.localInstanceUpdate);    // 更新实例
Router.get('/localInstanceUpdateAll', SLB.localInstanceUpdateAll);    // 批量更新实例
Router.get('/localInstanceDropInfo', SLB.localInstanceDropInfo);    // 获取删除的实例数据
Router.put('/cancelDropLocalInstance', SLB.cancelDropLocalInstance);    // 撤销删除
Router.get('/localInstance', SLB.localInstance);    // 变更记录

module.exports = Router;