/**
 * Created by renminghe on 2017/3/9.
 */
const User = require('../model/user_manager');
const co = require('co');
let userAuthInfo = [];
module.exports = (req, res, cb) => co(function *() {
    let result = yield User.userInfo("all");
    result.forEach((data) => {
        if (data['dataValues']) {
            userAuthInfo.push(data['dataValues']);
        }
    });
    handleHeader(req, res, userAuthInfo, cb);
});

function handleHeader(req, res, authInfo, cb) {
    if (req.header("authorization")) {
        let auth = req.header("authorization");
        let uidNumber = auth.split(':')[0];
        let authNum = auth.split(':')[1];
        let type = 0;
        authInfo.forEach((data) => {
            if (data.uidNumber == uidNumber) {
                if (data.auth == authNum) {
                    type = 1;
                } else {
                    type = 0;
                }
                
            }
        });
        cb(type);
    } else {
        cb(0);
    }
}
