/**
 * Created by renminghe on 2017/2/14.
 */

const path = require('path');

module.exports = function(app) {
    //设置跨域访问
    app.all('*', function(req, res, next) {
        res.header({
            "Access-Control-Allow-Origin":"*",
            "Access-Control-Allow-Headers":["content-type","set-cookie", "Authorization", "user", "enctype"],
            "Access-Control-Allow-Methods":"GET, POST, PUT, DELETE, OPTIONS, PATCH"
        });
        next();
    });
    // Insert routes below
    app.get('/', function (req, res, next) {
        res.send('respond with a resource');
    });
    app.use('/api/apm', require("./controller/apm"));    // 应用管理
    app.use('/api/user', require('./controller/user_manager'));    // 用户管理
    
    app.use('/api/host/uhost', require('./controller/host_manage'));    // 主机管理
    app.use('/api/host/upHost', require('./controller/uphost_manage'));    // 物理主机管理
    app.use('/api/host/load', require('./controller/load_manage'));    // 负载均衡
    app.use('/api/host/ssl', require('./controller/ssl_manage'));    // 安全证书
    app.use('/api/host/udb', require('./controller/udb_manage'));    // 云数据库
    app.use('/api/host/uMem', require('./controller/uMem_manage'));    // 云内存数据库
    app.use('/api/host/uNet', require('./controller/unet_manage'));    // 基础网络
    app.use('/api/work', require('./controller/work_order_manager'));    // 基础网络
    
    app.use('/api/alCloud/host', require('./controller/alhost_manage'));    // 阿里云主机
    app.use('/api/alCloud/rds', require('./controller/alrds_manage'));    // 阿里云数据库rds
    app.use('/api/alCloud/slb', require('./controller/alslb_manage'));    // 阿里云负载均衡slb
    app.use('/api/alCloud/eip', require('./controller/aleip_manage'));    // 阿里云弹性公网IP
    app.use('/api/alCloud/vpc', require('./controller/alvpc_manage'));    // vpc

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        let err = new Error('Not Found');
        err.status = 404;
        res.send('<h1> 404 bad request! </h1>');
    });

    // error handler
    app.use(function(err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.send('<h1>  ERROR </h1>');
    });

};
