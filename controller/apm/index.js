/**
 * Created by renminghe on 2017/2/14.
 */
const express = require("express");
const Router = express.Router();
let user = require("./index.controller");



//接口测试
Router.get("/", user.test);

// 听云app产品线配置信息
Router.get("/app", user.app);

Router.use(user.ckAuKeyFun);

// 听云browser产品线配置信息
Router.get("/browser", user.browser);

// 听云common产品线配置信息
Router.get("/common", user.common);

// 听云network产品线配置信息
Router.get("/network", user.network);

// 听云saas产品线配置信息
Router.get("/saas", user.saas);

// 听云server产品线配置信息
Router.get("/server", user.server);

// 听云netop产品线配置信息
Router.get("/netop", user.netop);

// 听云controller产品线配置信息
Router.get("/controller", user.controller);

// 听云alarm产品线配置信息
Router.get("/alarm", user.alarm);

// 听云base产品线配置信息
Router.get("/base", user.base);



// 听云app数据量
Router.get("/appCount", user.apmCount);

// 听云browser产品线配置信息数据量
Router.get("/browserCount", user.apmCount);

// 听云全部产品
Router.get("/all", user.all);

// 听云common产品线配置信息数据量
Router.get("/commonCount", user.apmCount);

// 听云network产品线配置信息数据量
Router.get("/networkCount", user.apmCount);

// 听云saas产品线配置信息数据量
Router.get("/saasCount", user.apmCount);

// 听云server产品线配置信息数据量
Router.get("/serverCount", user.apmCount);

// 听云netop产品线配置信息数据量
Router.get("/netopCount", user.apmCount);

// 听云controller产品线配置信息数据量
Router.get("/controllerCount", user.apmCount);

// 听云alarm产品线配置信息数据量
Router.get("/alarmCount", user.apmCount);

// 听云base产品线配置信息数据量
Router.get("/baseCount", user.apmCount);





// 添加听云app产品线配置信息
Router.post("/creatApp", user.creatApp);

// 添加听云browser产品线配置信息
Router.post("/creatBrowser", user.creatBrowser);

// 添加听云common产品线配置信息
Router.post("/creatCommon", user.creatCommon);

// 添加听云network产品线配置信息
Router.post("/creatNetwork", user.creatNetwork);

// 添加听云saas产品线配置信息
Router.post("/creatSaas", user.creatSaas);

// 添加听云server产品线配置信息
Router.post("/creatServer", user.creatServer);

// 添加听云netop产品线配置信息
Router.post("/creatNetop", user.creatNetop);

// 添加听云controller产品线配置信息
Router.post("/creatController", user.creatController);

// 添加听云alarm产品线配置信息
Router.post("/creatAlarm", user.creatAlarm);

// 添加听云base产品线配置信息
Router.post("/creatBase", user.creatBase);




// 更新听云app产品线配置信息
Router.post("/updateApp", user.updateApp);

// 更新听云browser产品线配置信息
Router.post("/updateBrowser", user.updateBrowser);

// 更新听云common产品线配置信息
Router.post("/updateCommon", user.updateCommon);

// 更新听云network产品线配置信息
Router.post("/updateNetwork", user.updateNetwork);

// 更新听云saas产品线配置信息
Router.post("/updateSaas", user.updateSaas);

// 更新听云server产品线配置信息
Router.post("/updateServer", user.updateServer);

// 更新听云netop产品线配置信息
Router.post("/updateNetop", user.updateNetop);

// 更新听云controller产品线配置信息
Router.post("/updateController", user.updateController);

// 更新听云alarm产品线配置信息
Router.post("/updateAlarm", user.updateAlarm);

// 更新听云base产品线配置信息
Router.post("/updateBase", user.updateBase);





// 删除听云app产品线配置信息
Router.post("/dropApp", user.dropApp);

// 删除听云browser产品线配置信息
Router.post("/dropBrowser", user.dropBrowser);

// 删除听云common产品线配置信息
Router.post("/dropCommon", user.dropCommon);

// 删除听云network产品线配置信息
Router.post("/dropNetwork", user.dropNetwork);

// 删除听云saas产品线配置信息
Router.post("/dropSaas", user.dropSaas);

// 删除听云server产品线配置信息
Router.post("/dropServer", user.dropServer);

// 删除听云netop产品线配置信息
Router.post("/dropNetop", user.dropNetop);

// 删除听云controller产品线配置信息
Router.post("/dropController", user.dropController);

// 删除听云alarm产品线配置信息
Router.post("/dropAlarm", user.dropAlarm);

// 删除听云base产品线配置信息
Router.post("/dropBase", user.dropBase);


module.exports = Router;