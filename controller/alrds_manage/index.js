/**
 * Created by renminghe on 2017/2/14.
 */
const express = require("express");
const Router = express.Router();
let RDS = require("./index.controller");

// 加密校验
Router.use(RDS.ckAuKeyFun);

Router.get('/localInfo', RDS.localInfo);    // 获取本实例
Router.get('/InfoCopy', RDS.InfoCopy);    // 批量导入阿里云数据
Router.get('/localInfoCount', RDS.localInfoCount);    // 获取本地虚机数据量
Router.get('/instanceInfoALiCloud', RDS.instanceInfoALiCloud);    // 获取阿里云数据
Router.post('/localInstanceCreate', RDS.localInstanceCreate);    // 创建实例
Router.delete('/instanceInfoDelete', RDS.instanceInfoDelete);    // 删除实例
Router.put('/localInstanceUpdate', RDS.localInstanceUpdate);    // 更新实例
Router.get('/localInstanceUpdateAll', RDS.localInstanceUpdateAll);    // 批量更新实例
Router.get('/localInstanceDropInfo', RDS.localInstanceDropInfo);    // 获取删除的实例数据
Router.put('/cancelDropLocalInstance', RDS.cancelDropLocalInstance);    // 撤销删除
Router.get('/localInstance', RDS.localInstance);    // 变更记录

module.exports = Router;