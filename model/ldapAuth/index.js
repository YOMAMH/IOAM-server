/**
 * Created by renminghe on 2017/2/24.
 */
// 集成LDAP第三方管理

const ldap = require("ldapjs");
const path = require('path');
const ldapConf = require('../../conf/ty_cmdb_config.json');

//创建LDAP client，把服务器url传入
const client = ldap.createClient({
    url: ldapConf.ldap.url
});


module.exports = {
    check: (user) => {
        return bind(user).then((data) => {
            return data;
        }).catch((err) => {
            throw err;
        });
    },
};

// 接入ldap
function bind(user) {
    //创建LDAP查询选项
    //filter的作用就是相当于SQL的条件
    let opts = {
        filter: '(uid='+user.user+')', //查询条件过滤器，查找uid=kxh的用户节点
        scope: 'sub',    //查询范围
        timeLimit: 500    //查询超时
    };
    //将client绑定LDAP Server
    //第一个参数：是用户，必须是从根节点到用户节点的全路径
    //第二个参数：用户密码
    let promise = new Promise(function (resolve, reject) {
        client.bind('uid=' + user.user + ',cn=users,cn=accounts,dc=tingyun,dc=com', user.pwd, function (err, res1) {
            if (err) {
                reject(err);
            }
            //开始查询
            //第一个参数：查询基础路径，代表在查询用户信心将在这个路径下进行，这个路径是由根节开始
            //第二个参数：查询选项
            client.search('DC=tingyun,DC=com', opts, function (err, res2) {

                //查询结果事件响应
                res2.on('searchEntry', function (entry) {

                    //获取查询的对象
                    let user = entry.object;
                    let userText = JSON.stringify(user, null, 2);
                    resolve(userText);


                });

                res2.on('searchReference', function (referral) {
                    console.log('referral: ' + referral.uris.join());
                });

                //查询错误事件
                res2.on('error', function (err) {
                    reject(err);

                });



            });

        });
    });

    return promise;

}
