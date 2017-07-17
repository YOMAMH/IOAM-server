/**
 * Created by renminghe on 2017/3/9.
 */
const crypto = require('crypto');
const request = require('request');
const ucloudAuthConfig = require('../conf/ty_cmdb_config.json');
let private_key = ucloudAuthConfig.UCloudAuth.private_key;
let obj = {
    "PublicKey": ucloudAuthConfig.UCloudAuth.PublicKey,
    "ProjectId": ucloudAuthConfig.UCloudAuth.ProjectId,
};
let LIMITE_COUNT = ucloudAuthConfig.UCloudAuth.pageSize;

// 参数排序
function sortObj(obj) {
    let array = [];
    let aobTem = {};
    Object.keys(obj).forEach((v, k) => {
        array.push(v);
    });
    array = array.sort();
    array.forEach((v, k) => {
        aobTem[v] = obj[v];
    });
    return aobTem;
}

// 签名加密
function handleObj(obj) {
    let objTem = sortObj(obj);
    let strHash = '';
    Object.keys(objTem).forEach((v) => {
        strHash += v + objTem[v];
    });
    strHash = strHash + private_key;
    let shasum = crypto.createHash('sha1');
    shasum.update(strHash);
    return shasum.digest('hex');

}

// 处理字符串
function handleStr(obj, requestArg) {
    let str = 'https://api.ucloud.cn/?';
    Object.keys(obj).forEach((data) => {
         str += data + "=" +obj[data] + "&";
    });
    str += 'Signature=' + requestArg;
    return str;
}

function resData(str) {
    let promise = new Promise(function (resolve, reject) {
        request(str, (error, response, body) => {

            if (!error && response.statusCode == 200) {
                resolve(body);
            } else {
                reject(error);
            }
        })
    });
    return promise;
}

module.exports = {

    // 获取云主机数据
    getHostInfo: (argReg, argId, limit) => {

        obj["Action"] = "DescribeUHostInstance";
        obj["Region"] = argReg;
        if (argId) obj["UHostIds.0"] = argId;
        if (limit) {
            obj["Limit"] = limit;
        } else {
            obj["Limit"] = LIMITE_COUNT;
        }

        let requestArg = handleObj(obj);
        let str = handleStr(obj, requestArg);
        return resData(str);
    },

    // 获取云物理主机数据
    getUpHostInfo: (argReg, argId, limit) => {

        obj["Action"] = "DescribePHost";
        obj["Region"] = argReg;
        if (argId) obj["PHostId.0"] = argId;
        if (limit) {
            obj["Limit"] = limit;
        } else {
            obj["Limit"] = LIMITE_COUNT;
        }

        let requestArg = handleObj(obj);
        let str = handleStr(obj, requestArg);
        return resData(str);
    },

    // 获取负载均衡信息
    getLoadInfo: (argReg, argId, limit) => {
        argReg = argReg.length > 0 ? argReg : "cn-bj2";
        obj["Action"] = "DescribeULB";
        obj["Region"] = argReg;
        if (argId) obj["ULBId"] = argId;
        if (limit) {
            obj["Limit"] = limit;
        } else {
            obj["Limit"] = LIMITE_COUNT;
        }

        let requestArg = handleObj(obj);
        let str = handleStr(obj, requestArg);
        return resData(str);
    },

    // 获取云数据库数据
    getUdbInfo: (arg) => {
        if (!arg.hasOwnProperty('ClassType') || !arg.hasOwnProperty('Region') || !arg.hasOwnProperty('Offset')) return new Error("argument length error!");
        obj["Action"] = "DescribeUDBInstance";
        obj["ClassType"] = arg.ClassType;
        obj["Region"] = arg.Region;
        obj["Offset"] = arg.Offset;
        if (arg.hasOwnProperty('argId')) obj["DBId"] = arg.argId;
        if (arg.hasOwnProperty('limit')) {
            obj["Limit"] = arg.limit;
        } else {
            obj["Limit"] = LIMITE_COUNT;
        }

        let requestArg = handleObj(obj);
        let str = handleStr(obj, requestArg);
        return resData(str);
    },


    // 获取redis分布式版数据
    getUMemBaseInfo: (arg) => {
        if (!arg.hasOwnProperty('Region'))  return new Error("Region error!");
        obj["Action"] = "DescribeUMemSpace";
        obj["Region"] = arg.Region;
        if (arg.hasOwnProperty('argId')) obj["SpaceId"] = arg.argId;
        if (arg.hasOwnProperty('limit')) {
            obj["Limit"] = arg.limit;
        } else {
            obj["Limit"] = LIMITE_COUNT;
        }

        let requestArg = handleObj(obj);
        let str = handleStr(obj, requestArg);
        return resData(str);
    },

    // 获取redis主备版数据
    getUMemGroupInfo: (arg) => {
        if (!arg.hasOwnProperty('Region'))  return new Error("Region error!");
        obj["Action"] = "DescribeURedisGroup";
        obj["Region"] = arg.Region;
        if (arg.hasOwnProperty('argId')) obj["GroupId"] = arg.argId;
        if (arg.hasOwnProperty('limit')) {
            obj["Limit"] = arg.limit;
        } else {
            obj["Limit"] = LIMITE_COUNT;
        }

        let requestArg = handleObj(obj);
        let str = handleStr(obj, requestArg);
        return resData(str);
    },

    // 获取弹性IP数据
    getUnetIpInfo: (arg) => {
        if (!arg.hasOwnProperty('Region'))  return new Error("Region error!");
        obj["Action"] = "DescribeEIP";
        obj["Region"] = arg.Region;
        if (arg.hasOwnProperty('argId')) obj["EIPIds.0"] = arg.argId;
        if (arg.hasOwnProperty('limit')) {
            obj["Limit"] = arg.limit;
        } else {
            obj["Limit"] = LIMITE_COUNT;
        }

        let requestArg = handleObj(obj);
        let str = handleStr(obj, requestArg);
        return resData(str);
    },
    
    // 获取共享带宽数据
    getUnetBandInfo: (arg) => {
        if (!arg.hasOwnProperty('Region'))  return new Error("Region error!");
        obj["Action"] = "DescribeShareBandwidth";
        obj["Region"] = arg.Region;
        if (arg.hasOwnProperty('argId')) obj["ShareBandwidthIds.0"] = arg.argId;
        if (arg.hasOwnProperty('limit')) {
            obj["Limit"] = arg.limit;
        } else {
            obj["Limit"] = LIMITE_COUNT;
        }
        
        let requestArg = handleObj(obj);
        let str = handleStr(obj, requestArg);
        return resData(str);
    },
};
