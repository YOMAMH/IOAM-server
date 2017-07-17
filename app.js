const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const _ = require('lodash');
const util = require('util');
const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// 处理响应数据
app.use(function (req, res, next) {
    function send(data) {
        res.type('application/json; charset=utf-8').jsonp(data);
    }
    function getData(args) {
        let data = {};
        if (args) {
            args = JSON.parse(util.format('%j', args));
            for (let i in args) {
                if (args.hasOwnProperty(i)) {
                    _.assign(data, args[i]);
                }
            }
        }
        return data;
    }
    _.assign(res, {
        createSuccess: function () {
            send(_.assign({status: 200}, {result: getData(_.values(arguments))}));
        },
        createFailure: function () {
            send(_.assign({status: 500}, getData(_.values(arguments))));
        },
        createResult: function (err, result) {
            err ? res.createFailure(err) : res.createSuccess(result || {});
        }
    });
    next();
});


//分配路由接口
require('./routes')(app);

module.exports = app;
