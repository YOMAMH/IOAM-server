/**
 * Created by renminghe on 2017/5/22.
 */
'use strict';
const Core = require('@alicloud/pop-core');
const aliConfig = require('../../conf/ty_cmdb_config.json');
let ecs;

class RDS {
    constructor() {
        if (!ecs) {
            ecs = new Core({
                accessKeyId: aliConfig.aliyunAuth.accessKeyId,
                secretAccessKey: aliConfig.aliyunAuth.secretAccessKey,
                endpoint: 'http://rds.aliyuncs.com',
                apiVersion: '2014-08-15'
            });
        }
    }
    
    // 获取实例列表
    describeDBInstances(argObj)  {
        if (typeof argObj !== 'object') {
            return {info: new Error('The parameter type must be an object')};
        }
        
        if (!argObj.hasOwnProperty('RegionId')) argObj.RegionId='cn-beijing';
        if (!argObj.hasOwnProperty('DBInstanceId')) argObj.DBInstanceId='';
        return getInstancesAsync(argObj.RegionId, argObj.DBInstanceId);
    }
    
}

// 获取实例列表
function getInstancesAsync (RegionId, DBInstanceId) {
    let promise = new Promise((resolve, reject) => {
        //设置参数
        let params = {
            "RegionId": RegionId,
            "PageSize": aliConfig.aliyunAuth.pageSize
        };
        if (DBInstanceId) params['DBInstanceId'] = DBInstanceId;
        // 发起请求
        ecs.request('DescribeDBInstances', params).then((result) => {
            resolve(result);
        }, (ex) => {
            reject(ex);
        });
    });
    
    return promise;
}

module.exports = new RDS();