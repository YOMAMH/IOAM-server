/**
 * Created by renminghe on 2017/5/25.
 */
'use strict';
const Core = require('@alicloud/pop-core');
const assert = require('assert');
const aliConfig = require('../../conf/ty_cmdb_config.json');
let ecs;

class VPC {
    constructor() {
        if (!ecs) {
            ecs = new Core({
                accessKeyId: aliConfig.aliyunAuth.accessKeyId,
                secretAccessKey: aliConfig.aliyunAuth.secretAccessKey,
                endpoint: 'https://vpc.aliyuncs.com',
                apiVersion: '2016-04-28'
            });
        }
    }
    
    // 获取实例列表
    describeVpcs(argObj)  {
        assert(typeof argObj === "object", "The parameter type must be an object");
        if (!argObj.RegionId) argObj.RegionId='cn-beijing';
        if (!argObj.VpcId) argObj.VpcId='';
        return getInstancesAsync(argObj.RegionId, argObj.VpcId);
    }
    
}

// 获取实例列表
function getInstancesAsync (RegionId, VpcId) {
    let promise = new Promise((resolve, reject) => {
        //设置参数
        let params = {
            "RegionId": RegionId
        };
        if (VpcId) params['VpcId'] = VpcId;
        // 发起请求
        ecs.request('DescribeVpcs', params).then((result) => {
            resolve(result);
        }, (ex) => {
            reject(ex);
        });
    });
    
    return promise;
}

module.exports = new VPC();