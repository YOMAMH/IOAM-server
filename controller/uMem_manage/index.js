/**
 * Created by renminghe on 2017/3/23.
 */
const express = require('express');
const Router = express.Router();
const redis = require('./redis.controller');
const memcache = require('./memcache.controller');

Router.use(redis.ckAuKeyFun);    // 签名校验

// redis
Router.post('/redisInfoCount', redis.redisInfoCount);    // 初次获取本地redis数据量
Router.post('/redisTotalCount', redis.redisTotalCount);    // 获取本地redis数据量
Router.post('/redisInfoCopy', redis.redisInfoCopy);    // 批量导入ucloud数据
Router.post('/redisBaseInfo', redis.redisBaseInfo);    // 获取本地redis分布式版数据
Router.post('/redisGroupInfo', redis.redisGroupInfo);    // 获取本地redis主备式版数据
Router.post('/redisBaseInfoUCloud', redis.redisBaseInfoUCloud);    // 获取ucloud数据
Router.post('/redisGroupInfoUCloud', redis.redisGroupInfoUCloud);    // 获取ucloud数据
Router.post('/redisCreate', redis.redisCreate);    // 创建redis数据
Router.post('/redisInfoUpdate', redis.redisInfoUpdate);    // 更新redis数据
Router.post('/redisInfoDelete', redis.redisInfoDelete);    // 删除redis数据
Router.post('/hostDropInfoBase', redis.hostDropInfoBase);    // 本地主机删除信息
Router.post('/hostDropInfoGroup', redis.hostDropInfoGroup);    // 本地主机删除信息
Router.post('/cancelDropHost', redis.cancelDropHost);    // 撤销删除
Router.post('/updateAll', redis.updateAll);    // 批量更新
Router.get('/history', redis.history);    // 变更记录

// memcache
// Router.post('/memcacheInfoCount', memcache.memcacheInfoCount);    // 获取本地memcache数据量
// Router.post('/memcacheInfoCopy', memcache.memcacheInfoCopy);    // 批量导入ucloud数据
// Router.post('/memcacheInfo', memcache.memcacheInfo);    // 获取本地数据
// Router.post('/memcacheInfoUCloud', memcache.memcacheInfoUCloud);    // 获取ucloud数据
// Router.post('/memcacheCreate', memcache.memcacheCreate);    // 创建memcache数据
// Router.post('/memcacheInfoUpdate', memcache.memcacheInfoUpdate);    // 更新memcache数据
module.exports = Router;