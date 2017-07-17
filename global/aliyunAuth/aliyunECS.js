/**
 * Created by renminghe on 2017/5/15.
 */
'use strict';
const Core = require('@alicloud/pop-core');
const aliConfig = require('../../conf/ty_cmdb_config.json');
const assert = require('assert');
let ecs;

class ECS {
    constructor() {
        if (!ecs) {
            ecs = new Core({
                accessKeyId: aliConfig.aliyunAuth.accessKeyId,
                secretAccessKey: aliConfig.aliyunAuth.secretAccessKey,
                endpoint: 'http://ecs.aliyuncs.com',
                apiVersion: '2014-05-26'
            });
        }
    }
   
    // 获取实例列表
    describeInstances(argObj)  {
        assert(typeof argObj === 'object', 'The parameter type must be an object');
        if (!argObj.hasOwnProperty('RegionId')) argObj.RegionId='cn-beijing';
        if (!argObj.hasOwnProperty('InstanceIds')) argObj.InstanceIds='';
        return getInstancesAsync({
            RegionId: argObj.RegionId,
            InstanceIds: argObj.InstanceIds,
            action: 'DescribeInstances'
        });
    }
    
    // 获取弹性公网IP列表
    describeEipAddresses(argObj)  {
        assert(typeof argObj === 'object', 'The parameter type must be an object');
        if (!argObj.RegionId) argObj.RegionId='cn-beijing';
        if (!argObj.AllocationId) argObj.AllocationId='';
        return getInstancesAsync({
            RegionId: argObj.RegionId,
            AllocationId: argObj.AllocationId,
            action: 'DescribeEipAddresses'
        });
    }
    
}

// 获取实例列表
function getInstancesAsync (arg) {
    let promise = new Promise((resolve, reject) => {
        //设置参数
        let params = {
            "RegionId": arg.RegionId,
            "PageSize": aliConfig.aliyunAuth.pageSize
        };
        if (arg.InstanceIds) params['InstanceIds'] = arg.InstanceIds;
        else if (arg.AllocationId) params['AllocationId'] = arg.AllocationId;
        // 发起请求
        ecs.request(arg.action, params).then((result) => {
            resolve(result);
        }, (ex) => {
            reject(ex);
        });
    });
    
    return promise;
}

module.exports = new ECS();