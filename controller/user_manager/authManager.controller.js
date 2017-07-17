/**
 * Created by renminghe on 2017/2/23.
 */
const co = require('co');
const ldap = require('../../model/ldapAuth');
const ckAuKey = require('../../global/checkAuthKey');
const User = require('../../model/user_manager');

module.exports = {
    
    // 登录
    login: (req, res) => co(function *() {
        if (req.body.userName && req.body.pwd && req.body.base64) {
            // 验证ldap账户
            let auth = yield ldap.check({user: req.body.userName, pwd: req.body.pwd});
            let authObj = JSON.parse(auth);
            let authNumber = 1;
            
            if (!authObj.gecos) {   // 验证失败,返回401
                res.createFailure({content: '401 forbidden'});
                
            } else {   // 验证成功
                let userInfo = yield User.userInfo(authObj);
                if (userInfo.hasOwnProperty('dataValues')) {
                    authNumber = userInfo.dataValues.auth;
                    res.createSuccess({content: authObj.gecos, hashKey: authObj.uidNumber, auth: authNumber});
                } else if (userInfo.hasOwnProperty('status') && userInfo.status === 500) {
                    let obj = {
                        user: authObj.gecos,
                        uidNum: parseInt(authObj.uidNumber)
                    };
                    let createRes = yield User.createUser(obj);
                    if (createRes.hasOwnProperty('dataValues')) {
                        res.createSuccess({content: authObj.gecos, hashKey: authObj.uidNumber, auth: '1.1'});
                    } else {
                        res.createFailure();
                    }
                }
                
            }
            
        } else {
            res.createFailure({content: '401 forbidden'});
        }
    }),
    
    // 验证
    loginAuth: (req, res) => {
        ckAuKey(req, res, (data) => {
            if (data) {
                res.createSuccess({content: 'success'});
            } else {
                res.createFailure();
            }
            
        })
    },
    
    // 头像
    icon: (req, res) => {
        let str = "../assets/images/head" + +".jpg";
        res.createSuccess({content: str});
    },
    
    // 创建用户权限
    authCreateUser: (req, res) => co(function *() {
        if (req.body.hasOwnProperty('user') && req.body.hasOwnProperty('auth')) {
            let result = yield User.createUser(req.body);
            if (result.hasOwnProperty('dataValues')) {
                res.createSuccess();
            } else {
                res.createFailure();
            }
        }
    }),
    
    // 获取用户权限信息
    userInfo: (req, res) => co(function *() {
        let result = yield User.userInfo(req.query);
        if (result.length > 0) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 变更用户权限
    userInfoUpdate: (req, res) => co(function *() {
        let result = yield User.userInfoUpdate(req.body);
        if (result) {
            res.createSuccess();
        } else {
            res.createFailure();
        }
    }),
    
    // 分页查询用户权限
    userInfoPage: (req, res) => co(function *() {
        let result = yield User.userInfoPage(parseInt(req.query.index));
        if (result.length > 0) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    }),
    
    // 获取用户数据量
    userInfoCount: (req, res) => co(function *() {
        let result = yield User.userInfoCount();
        if (result) {
            res.createSuccess({content: result});
        } else {
            res.createFailure();
        }
    })
    
};

