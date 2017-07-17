/**
 * Created by renminghe on 2017/2/14.
 */
const co = require("co");
let apm = require("../../model/apm_model/");
const ckAuKey = require('../../global/checkAuthKey');
const assert = require('assert');

/**
 * 返回json数据公有函数
 * @param req  请求参数
 * @param res  相应参数
 * @param apmInfo  apm_model返回的数据
 */
function responseData(req, res, apmInfo) {
    let apmItem = '';
    let apmInfoArr = [];
    if (apmInfo) {
        if (apmInfo instanceof Array) {  // 如果是数组，说明是获取全部数据
            for (apmItem in apmInfo) {
                if (apmInfo[apmItem].hasOwnProperty("dataValues")) {  // 如果有dataValues属性说明获取数据成功
                    apmInfoArr.push(apmInfo[apmItem]["dataValues"]);
                }
            }
            res.json({status: 200, content: apmInfoArr});
        } else {  // 如果不是数组，说明是获取符合特定条件的数据
            // 如果有dataValues属性说明获取数据成功,返回状态码加数据
            if (apmInfo.hasOwnProperty("dataValues")) res.createSuccess(apmInfo);
            if (apmInfo.toString() === '1') res.createSuccess(apmInfo.toString());
        }
    } else {
        res.createFailure();
    }
}


module.exports = {
    
    // 加密校验
    ckAuKeyFun: (req, res, next) => {
        ckAuKey(req, res, (data) => {
            if (data) {
                next();
            } else {
                res.createFailure();
            }
            
        })
    },
    
    test: (req, res) => { // 测试
        res.send('success');
    },
    app: (req, res) => co(function*() { //  听云app配置信息
        let apmInfo = yield apm.app(req.query);
        responseData(req, res, apmInfo);
        
    }),
    browser: (req, res) => co(function*() { //  听云browser配置信息
        
        let apmInfo = yield apm.browser(req.query);
        responseData(req, res, apmInfo);
    }),
    common: (req, res) => co(function*() { //  听云common配置信息
        
        let apmInfo = yield apm.common(req.query);
        responseData(req, res, apmInfo);
    }),
    network: (req, res) => co(function*() { //  听云network配置信息
        
        let apmInfo = yield apm.network(req.query);
        responseData(req, res, apmInfo);
    }),
    saas: (req, res) => co(function*() { //  听云saas配置信息
        
        let apmInfo = yield apm.saas(req.query);
        responseData(req, res, apmInfo);
    }),
    server: (req, res) => co(function*() { //  听云server配置信息
        
        let apmInfo = yield apm.server(req.query);
        responseData(req, res, apmInfo);
    }),
    netop: (req, res) => co(function*() { //  听云netop配置信息
        
        let apmInfo = yield apm.netop(req.query);
        responseData(req, res, apmInfo);
    }),
    controller: (req, res) => co(function*() { //  听云netop配置信息
        
        let apmInfo = yield apm.controller(req.query);
        responseData(req, res, apmInfo);
    }),
    alarm: (req, res) => co(function*() { //  听云alarm配置信息
        
        let apmInfo = yield apm.alarm(req.query);
        responseData(req, res, apmInfo);
    }),
    base: (req, res) => co(function*() { //  听云base配置信息
        
        let apmInfo = yield apm.base(req.query);
        responseData(req, res, apmInfo);
    }),
    
    creatApp: (req, res) => co(function*() { // 添加听云app配置信息
        let apmInfo = yield apm.creatApp(req.body);
        responseData(req, res, apmInfo);
    }),
    creatBrowser: (req, res) => co(function*() { // 添加听云browser配置信息
        
        let apmInfo = yield apm.creatBrowser(req.body);
        responseData(req, res, apmInfo);
    }),
    creatCommon: (req, res) => co(function*() { // 添加听云common配置信息
        
        let apmInfo = yield apm.creatCommon(req.body);
        responseData(req, res, apmInfo);
    }),
    creatNetwork: (req, res) => co(function*() { // 添加听云network配置信息
        
        let apmInfo = yield apm.creatNetwork(req.body);
        responseData(req, res, apmInfo);
    }),
    creatSaas: (req, res) => co(function*() { // 添加听云saas配置信息
        
        let apmInfo = yield apm.creatSaas(req.body);
        responseData(req, res, apmInfo);
    }),
    creatServer: (req, res) => co(function*() { // 添加听云server配置信息
        
        let apmInfo = yield apm.creatServer(req.body);
        responseData(req, res, apmInfo);
    }),
    creatNetop: (req, res) => co(function*() { // 添加听云server配置信息
        
        let apmInfo = yield apm.creatNetop(req.body);
        responseData(req, res, apmInfo);
    }),
    creatController: (req, res) => co(function*() { // 添加听云server配置信息
        
        let apmInfo = yield apm.creatController(req.body);
        responseData(req, res, apmInfo);
    }),
    creatAlarm: (req, res) => co(function*() { // 添加听云alarm配置信息
        
        let apmInfo = yield apm.creatAlarm(req.body);
        responseData(req, res, apmInfo);
    }),
    creatBase: (req, res) => co(function*() { // 添加听云alarm配置信息
        
        let apmInfo = yield apm.creatBase(req.body);
        responseData(req, res, apmInfo);
    }),
    
    
    updateApp: (req, res) => co(function*() { // 修改听云server配置信息
        let apmInfo = yield apm.updateApp(req.body);
        responseData(req, res, apmInfo);
    }),
    updateBrowser: (req, res) => co(function*() { // 修改听云browser配置信息
        
        let apmInfo = yield apm.updateBrowser(req.body);
        responseData(req, res, apmInfo);
    }),
    updateCommon: (req, res) => co(function*() { // 修改听云common配置信息
        
        let apmInfo = yield apm.updateCommon(req.body);
        responseData(req, res, apmInfo);
    }),
    updateNetwork: (req, res) => co(function*() { // 修改听云network配置信息
        
        let apmInfo = yield apm.updateNetwork(req.body);
        responseData(req, res, apmInfo);
    }),
    updateSaas: (req, res) => co(function*() { // 修改听云saas配置信息
        
        let apmInfo = yield apm.updateSaas(req.body);
        responseData(req, res, apmInfo);
    }),
    updateServer: (req, res) => co(function*() { // 修改听云server配置信息
        
        let apmInfo = yield apm.updateServer(req.body);
        responseData(req, res, apmInfo);
    }),
    updateNetop: (req, res) => co(function*() { // 修改听云netop配置信息
        
        let apmInfo = yield apm.updateNetop(req.body);
        responseData(req, res, apmInfo);
    }),
    updateController: (req, res) => co(function*() { // 修改听云controller配置信息
        
        let apmInfo = yield apm.updateController(req.body);
        responseData(req, res, apmInfo);
    }),
    updateAlarm: (req, res) => co(function*() { // 修改听云alarm配置信息
        
        let apmInfo = yield apm.updateAlarm(req.body);
        responseData(req, res, apmInfo);
    }),
    updateBase: (req, res) => co(function*() { // 修改听云base配置信息
        
        let apmInfo = yield apm.updateBase(req.body);
        responseData(req, res, apmInfo);
    }),
    
    
    dropApp: (req, res) => co(function*() { // 删除听云server配置信息
        let apmInfo = yield apm.dropApp(req.body);
        console.log(apmInfo);
        responseData(req, res, apmInfo);
    }),
    dropBrowser: (req, res) => co(function*() { // 删除听云browser配置信息
        
        let apmInfo = yield apm.dropBrowser(req.body);
        responseData(req, res, apmInfo);
    }),
    dropCommon: (req, res) => co(function*() { // 删除听云common配置信息
        
        let apmInfo = yield apm.dropCommon(req.body);
        responseData(req, res, apmInfo);
    }),
    dropNetwork: (req, res) => co(function*() { // 删除听云network配置信息
        
        let apmInfo = yield apm.dropNetwork(req.body);
        responseData(req, res, apmInfo);
    }),
    dropSaas: (req, res) => co(function*() { // 删除听云saas配置信息
        
        let apmInfo = yield apm.dropSaas(req.body);
        responseData(req, res, apmInfo);
    }),
    dropServer: (req, res) => co(function*() { // 删除听云server配置信息
        
        let apmInfo = yield apm.dropServer(req.body);
        responseData(req, res, apmInfo);
    }),
    dropNetop: (req, res) => co(function*() { // 删除听云netop配置信息
        
        let apmInfo = yield apm.dropNetop(req.body);
        responseData(req, res, apmInfo);
    }),
    dropController: (req, res) => co(function*() { // 删除听云controller配置信息
        
        let apmInfo = yield apm.dropController(req.body);
        responseData(req, res, apmInfo);
    }),
    dropAlarm: (req, res) => co(function*() { // 删除听云alarm配置信息
        
        let apmInfo = yield apm.dropAlarm(req.body);
        responseData(req, res, apmInfo);
    }),
    dropBase: (req, res) => co(function*() { // 删除听云base配置信息
        
        let apmInfo = yield apm.dropBase(req.body);
        responseData(req, res, apmInfo);
    }),
    
    
    apmCount: (req, res) => co(function *() {
        let count = yield apm.count(req.query.type);
        if (count) {
            res.createSuccess({content: count});
        } else {
            res.createFailure();
        }
    }),
    all: (req, res) => co(function *() {
        let resultArrr = [];
        let result = {};
        let app = yield apm.app({all: "all"});
        let browser = yield apm.browser({all: "all"});
        let common = yield apm.common({all: "all"});
        let network = yield apm.network({all: "all"});
        let saas = yield apm.saas({all: "all"});
        let server = yield apm.server({all: "all"});
        let netop = yield apm.netop({all: "all"});
        let controller = yield apm.controller({all: "all"});
        let alarm = yield apm.alarm({all: "all"});
        let base = yield apm.base({all: "all"});
        if (!app instanceof Array && !browser instanceof Array && !common instanceof Array && !network instanceof Array && !saas instanceof Array && !server instanceof Array && !netop instanceof Array && !controller instanceof Array && !alarm instanceof Array && !base instanceof Array) {
            res.createFailure();
        } else {
            result = resultHandle([app, browser, common, network, saas, server, netop, controller, alarm, base], result);
            res.createSuccess({content: result});
        }
    }),
    
};

// 处理返回的结果
function resultHandle(argArr, result) {
    assert(argArr instanceof Array, "The first argument must be an array");
    let resultArr = [];
    let products = [
        "tingyun_app", "tingyun_browser", "tingyun_common",
        "tingyun_network", "tingyun_saas", "tingyun_server",
        "tingyun_netop", "tingyun_controller", "tingyun_alarm",
        "听云架构组",
    ];
    argArr.forEach((data, i) => {
        data.forEach(dataItem => {
            resultArr.push(dataItem.dataValues);
        });
        result[products[i]] = resultArr;
        resultArr = [];
    });
    return result;
}