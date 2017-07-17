/**
 * Created by renminghe on 2017/3/21.
 */
const express = require('express');
const Router = express.Router();
const mysql = require('./mysql.controller');

Router.use(mysql.ckAuKeyFun);    // 签名校验
Router.post('/mysqlInfoCount', mysql.mysqlInfoCount);    // 获取本地mysql数据量
Router.post('/mysqlInfoCopy', mysql.mysqlInfoCopy);    // 批量导入ucloud数据
Router.post('/mysqlInfo', mysql.mysqlInfo);    // 获取本地数据
Router.post('/mysqlInfoUCloud', mysql.mysqlInfoUCloud);    // 获取ucloud数据
Router.post('/mysqlCreate', mysql.mysqlCreate);    // 创建mysql数据
Router.post('/mysqlInfoUpdate', mysql.mysqlInfoUpdate);    // 创建mysql数据
Router.post('/mysqlInfoDelete', mysql.mysqlInfoDelete);    // 删除mysql数据
Router.post('/hostDropInfo', mysql.hostDropInfo);    // 本地主机删除信息
Router.post('/cancelDropHost', mysql.cancelDropHost);    // 撤销删除
Router.post('/updateAll', mysql.updateAll);    // 批量更新
Router.get('/history', mysql.history);    // 变更记录
module.exports = Router;