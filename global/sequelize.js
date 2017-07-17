/**
 * Created by renminghe on 2017/2/14.
 */
/******** 连接mysql ********/
const Sequelize = require('sequelize');
const nconf = require('../conf/ty_cmdb_config.json');

let database = nconf.mysql.database;
let username = nconf.mysql.username;
let password = nconf.mysql.password;
let options = {
    host: nconf.mysql.host,
    dialect: nconf.mysql.dialect,
};
let sequelize = new Sequelize(database, username, password, options);

module.exports = sequelize;