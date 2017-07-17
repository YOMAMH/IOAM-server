/**
 * Created by renminghe on 2017/3/20.
 */
const express = require('express');
const Router = express.Router();
const ssl = require('./index.controller');

Router.use(ssl.ckAuKeyFun);    // 签名校验
Router.post('/sslInfoCount', ssl.sslInfoCount);    // 获取本地SSL数据量
Router.post('/sslInfoCopy', ssl.sslInfoCopy);    // 批量导入ucloud数据
Router.post('/sslInfo', ssl.sslInfo);    // 获取本地数据
Router.post('/sslInfoUCloud', ssl.sslInfoUCloud);    // 获取ucloud数据
Router.post('/sslCreate', ssl.sslCreate);    // 创建SSL数据
module.exports = Router;