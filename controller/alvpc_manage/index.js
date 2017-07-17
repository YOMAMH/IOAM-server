/**
 * Created by renminghe on 2017/2/14.
 */
const express = require("express");
const Router = express.Router();
let VPC = require("./index.controller");

// 加密校验
Router.use(VPC.ckAuKeyFun);

Router.get('/localInstanceInfo', VPC.localInstanceInfo);    // 获取本地实例
Router.get('/cloudInstanceInfoCopy', VPC.cloudInstanceInfoCopy);    // 批量导入阿里云数据
Router.get('/localInstanceInfoCount', VPC.localInstanceInfoCount);    // 获取本地实例数据量
Router.get('/instanceInfoALiCloud', VPC.instanceInfoALiCloud);    // 获取阿里云数据
Router.post('/localInstanceCreate', VPC.localInstanceCreate);    // 创建实例
Router.delete('/localInstanceInfoDelete', VPC.localInstanceInfoDelete);    // 删除实例
Router.put('/localInstanceUpdate', VPC.localInstanceUpdate);    // 更新实例
Router.get('/localInstanceUpdateAll', VPC.localInstanceUpdateAll);    // 批量更新实例
Router.get('/localInstanceDropInfo', VPC.localInstanceDropInfo);    // 获取删除的实例数据
Router.put('/cancelDropLocalInstance', VPC.cancelDropLocalInstance);    // 撤销删除
Router.get('/localInstance', VPC.localInstance);    // 变更记录

module.exports = Router;