/**
 * Created by renminghe on 2017/2/23.
 */
const express = require('express');
const Router = express.Router();
const authManner = require('./authManager.controller');

Router.post('/login', authManner.login);  // 用户登录验证
Router.get('/loginAuth', authManner.loginAuth);
Router.get('/icon', authManner.icon);
Router.post('/auth/createUser', authManner.authCreateUser);    // 添加用户权限
Router.get('/auth/userInfo', authManner.userInfo);    //  获取用户权限
Router.get('/auth/userInfoPage', authManner.userInfoPage);    //  分页获取用户权限
Router.get('/auth/userInfoCount', authManner.userInfoCount);    //  页获取用户权限数据量
Router.post('/auth/userInfoUpdate', authManner.userInfoUpdate);    //  变更用户权限
module.exports = Router;
