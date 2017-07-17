/**
 * Created by renminghe on 2017/3/20.
 */
const Sequelize = require("../../global/sequelize");
const sequelize = require("sequelize");
const co = require('co');
const uclouldAuth = require('../../global/ucloudAuth');

// 根选择不同数据表
function selectTable() {
    let SSL = Sequelize.define('ssl_info_base', {
        SSLId: {    // 主机唯一id 主键 string
            type: sequelize.STRING,
            primaryKey: true
        },
        SSLName: sequelize.STRING,   // SSL名称 string
        SSLType: sequelize.STRING,   // SSL类型 string
        CreateTime: sequelize.INTEGER,   //创建时间 int
        SSLContent: sequelize.STRING,   // SSL内容 string
        HashValue: sequelize.STRING,    // 哈希编码 string
        BindedTargetSet: sequelize.STRING,    // SSL证书绑定到的对象 string
    }, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });

    return SSL;
}

// 处理ucloud数据
function handleUcloudData(arg, arr) {
    if (arg instanceof Array) {
        arg.forEach((item) => {
            item = JSON.parse(item);
            if (item.TotalCount > 0) {
                item.PHostSet.forEach((data) => {
                    arr.push(data);
                });
            }
        });
    }
    return arr;
}

// 插入数据库数据方法
function creatData(arg) {
    let UpHost = selectTable();
    if (arg) {
        arg.DiskSet = JSON.stringify(arg.DiskSet);
        arg.IPSet = JSON.stringify(arg.IPSet);
        arg.CPUSet = JSON.stringify(arg.CPUSet);
        return UpHost.create(arg).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            throw err;
        });
    }
}

// 获取本地数据
function selectData(arg) {
    let UpHost = selectTable();
    if (arg.hasOwnProperty('PHostId')) {
        return UpHost.findOne({where: {PHostId: arg.PHostId}}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    } else {
        return UpHost.findAll({where: {}, limit: 10, offset: arg ? arg : 0}).then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    }
}

// 通过id查找ucloud数据
// reg : 区域;
// arg : UHostId;
function getHostInfoById(reg, arg) {
    return uclouldAuth.getUpHostInfo(reg, arg);
}

module.exports = {

    // 批量从ucloud导入主机信息
    upHostInfoCopy: () => co(function *() {
        let hostArr = [];
        let bj2 = yield uclouldAuth.getUpHostInfo("cn-bj2", '', '');
        return handleUcloudData([bj2], hostArr);
    }),

    // 添加主机信息
    upHostCreate: (arg) => creatData(arg),

    // 获取主机信息总数
    upHostInfoCount: () => {
        let SSL = selectTable();
        return SSL.count().then((data) => {
            if (!data) {
                return {status: 500};
            }
            return data;
        }).catch(function (err) {
            console.log(err);
        });
    },

    // 获取本地主机信息
    upHostInfo: (arg) => selectData(arg),

    // 获取ucloud主机数据
    hostInfoUCloud: (reg, arg) => getHostInfoById(reg, arg),
};