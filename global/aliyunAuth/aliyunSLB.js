/**
 * Created by renminghe on 2017/5/24.
 */
'use strict';
const Core = require('@alicloud/pop-core');
const assert = require('assert');
const aliConfig = require('../../conf/ty_cmdb_config.json');
let ecs;

class SLB {
    constructor() {
        if (!ecs) {
            ecs = new Core({
                accessKeyId: aliConfig.aliyunAuth.accessKeyId,
                secretAccessKey: aliConfig.aliyunAuth.secretAccessKey,
                endpoint: 'https://slb.aliyuncs.com',
                apiVersion: '2014-05-15'
            });
        }
    }
    
    // 获取实例列表
    describeLoadBalancers(argObj)  {
        assert(typeof argObj === "object", "The parameter type must be an object");
        if (!argObj.RegionId) argObj.RegionId='cn-beijing';
        if (!argObj.LoadBalancerId) argObj.LoadBalancerId='';
        return getInstancesAsync(argObj.RegionId, argObj.LoadBalancerId);
    }
    
}

// 获取实例列表
function getInstancesAsync (RegionId, LoadBalancerId) {
    let promise = new Promise((resolve, reject) => {
        //设置参数
        let params = {
            "RegionId": RegionId,
            "PageSize": aliConfig.aliyunAuth.pageSize
        };
        if (LoadBalancerId) params['LoadBalancerId'] = LoadBalancerId;
        // 发起请求
        ecs.request('DescribeLoadBalancers', params).then((result) => {
            resolve(result);
        }, (ex) => {
            reject(ex);
        });
    });
    
    return promise;
}

module.exports = new SLB();