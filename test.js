/**
 * Created by renminghe on 2017/3/7.
 */
// const crypto = require('crypto');
// const private_key = '1fdc7710e735cdf39d4a807e24a19345b5d8ac69';
// let obj = {
//     "Action"     :  "DescribeUDBInstance",
//     "Region"     :  "cn-bj2",
//     "PublicKey"  :  "yAObJLeum7i4oCIRAptwBgma7D9OmylIgYjhThNSHiVdFnXt",
//     "ProjectId"  :  "org-3932",
//     "ClassType"  :  "SQL",
//     "Offset"  :  0,
//     "Limit"  :  500,
// };
// function sortObj(obj) {
//     let array = [];
//     let aobTem = {};
//     Object.keys(obj).forEach((v, k) => {
//         array.push(v);
//     });
//     array = array.sort();
//     array.forEach((v, k) => {
//         aobTem[v] = obj[v];
//     });
//     return aobTem;
// }
// function handleObj(obj) {
//     let objTem = sortObj(obj);
//     let strHash = '';
//     Object.keys(objTem).forEach((v) => {
//         strHash += v + objTem[v];
//     });
//     strHash =  strHash + private_key;
//     let shasum = crypto.createHash('sha1');
//     shasum.update(strHash);
//     return shasum.digest('hex');
//
// }
// console.log(handleObj(obj));

// 'use strict';
//
// const assert = require('assert');
// const crypto = require('crypto');
// const httpx = require('httpx');
//
// function firstLetterUpper(str) {
//     return str.slice(0, 1).toUpperCase() + str.slice(1);
// }
//
// function formatParams(params) {
//     var keys = Object.keys(params);
//     var newParams = {};
//     for (var i = 0; i < keys.length; i++) {
//         var key = keys[i];
//         newParams[firstLetterUpper(key)] = params[key];
//     }
//     return newParams;
// }
//
// function pad(value) {
//     return (value < 10) ? '0' + value : '' + value;
// }
//
// function timestamp() {
//     var date = new Date();
//     var YYYY = '' + date.getUTCFullYear();
//     var MM = pad(date.getUTCMonth() + 1);
//     var DD = pad(date.getUTCDate());
//     var HH = pad(date.getUTCHours());
//     var mm = pad(date.getUTCMinutes());
//     var ss = pad(date.getUTCSeconds());
//     // 删除掉毫秒部分
//     return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}Z`;
// }
//
// function sha1(str, key) {
//     return crypto.createHmac('sha1', key).update(str).digest('base64');
// }
//
// function encode(str) {
//     var result = encodeURIComponent(str);
//
//     return result.replace(/\!/g, '%21')
//         .replace(/\'/g, '%27')
//         .replace(/\(/g, '%28')
//         .replace(/\)/g, '%29')
//         .replace(/\*/g, '%2A');
// }
//
// function normalize(params) {
//     var list = [];
//     var keys = Object.keys(params).sort();
//     for (let i = 0; i < keys.length; i++) {
//         var key = keys[i];
//         list.push([encode(key), encode(params[key])]); //push []
//     }
//
//     return list;
// }
//
// function canonicalize(normalized) {
//     var fields = [];
//     for (var i = 0; i < normalized.length; i++) {
//         var [key, value] = normalized[i];
//         fields.push(key + '=' + value);
//     }
//     return fields.join('&');
// }
//
// class Core {
//     constructor(config, verbose) {
//         assert(config, 'must pass "config"');
//         assert(config.endpoint, 'must pass "config.endpoint"');
//         assert(config.apiVersion, 'must pass "config.apiVersion"');
//         assert(config.accessKeyId, 'must pass "config.accessKeyId"');
//         assert(config.secretAccessKey, 'must pass "config.secretAccessKey"');
//
//         if (config.endpoint.endsWith('/')) {
//             config.endpoint = config.endpoint.slice(0, -1);
//         }
//
//         this.endpoint = config.endpoint;
//         this.apiVersion = config.apiVersion;
//         this.accessKeyId = config.accessKeyId;
//         this.secretAccessKey = config.secretAccessKey;
//         this.verbose = verbose === true;
//
//         var httpModule = this.endpoint.startsWith('https://') ? require('https') : require('http');
//         this.keepAliveAgent = new httpModule.Agent({
//             keepAlive: true,
//             keepAliveMsecs: 3000
//         });
//
//     }
//
//     request(action, params = {}, opts = {}) {
//         // 1. compose params
//         action = firstLetterUpper(action);
//         // format params until formatParams is false
//         if (opts.formatParams !== false) {
//             params = formatParams(params);
//         }
//         var defaults = this._buildParams();
//         params = Object.assign({Action: action}, defaults, params);
//
//         // 2. caculate signature
//         var normalized = normalize(params);
//         var canonicalized = canonicalize(normalized);
//         // 2.1 get string to sign
//         var stringToSign = `GET&${encode('/')}&${encode(canonicalized)}`;
//         // 2.2 get signature
//         var signature = sha1(stringToSign, this.secretAccessKey + '&');
//         // add signature
//         normalized.push(['Signature', encode(signature)]);
//         // 3. generate final url
//         const url = `${this.endpoint}/?${canonicalize(normalized)}`;
//         // 4. send request
//         var entry = {
//             url: url,
//             request: null,
//             response: null
//         };
//
//         if (opts && !opts.agent) {
//             opts.agent = this.keepAliveAgent;
//         }
//
//         return httpx.request(url, opts).then((response) => {
//             entry.request = response.req;
//             entry.response = response;
//
//             return httpx.read(response);
//         }).then((buffer) => {
//             var json = JSON.parse(buffer);
//             if (json.Code && json.Code !== '200') {
//                 var err = new Error(json.Message);
//                 err.name = json.Code + 'Error';
//                 err.data = json;
//                 err.code = json.Code;
//                 err.url = url;
//                 err.entry = entry;
//                 return Promise.reject(err);
//             }
//
//             if (this.verbose) {
//                 return [json, entry];
//             }
//
//             return json;
//         });
//     }
//
//     _buildParams() {
//         return {
//             Format: 'JSON',
//             SignatureMethod: 'HMAC-SHA1',
//             SignatureNonce: Math.round(Math.random() * 1000000),
//             SignatureVersion: '1.0',
//             Timestamp: timestamp(),
//             AccessKeyId: this.accessKeyId,
//             Version: this.apiVersion,
//         };
//     }
// }
//
// // // 初始化
// // var client = new Core({
// //     accessKeyId: 'LTAIzRDn4nFUxOKo',
// //     secretAccessKey: 'cqiXnM8caxWzNoEEuN8e4e3vAfxODr',
// //     endpoint: 'https://ecs.aliyuncs.com',
// //     apiVersion: '2014-05-26'
// // });
//
//
// // 初始化
// var client = new Core({
//     accessKeyId: 'LTAIzRDn4nFUxOKo',
//     secretAccessKey: 'cqiXnM8caxWzNoEEuN8e4e3vAfxODr',
//     endpoint: 'https://vpc.aliyuncs.com',
//     apiVersion: '2016-04-28'
// });
//
// //设置参数
// var params = {
//     "RegionId": "cn-beijing",
// };
//
//
// // // 发起请求
// // client.request('DescribeEipAddresses', params).then((result) => {
// //     console.log(result.EipAddresses.EipAddress);
// // }, (ex) => {
// //     console.log(ex);
// // });
//
// // 发起请求
// client.request('DescribeVpcs', params).then((result) => {
//     console.log(result.Vpcs.Vpc);
// }, (ex) => {
//     console.log(ex);
// });

console.log(typeof (new Date().getTime() + ''));