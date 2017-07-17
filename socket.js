/**
 * Created by renminghe on 2017/4/20.
 */
// let socketio = {};
// const socket_io = require('socket.io');
// let SocketGlobel = '';
//
// //获取io
// socketio.getSocketio = function (server) {
//     let io = socket_io.listen(server);
//     SocketGlobel = io.sockets;
//     io.sockets.on('connection', function (socket) {
//         socket.on('loginIn', function (msg) {
//             console.log(msg + '连接成功!');
//         })
//     });
//
// };
//
// // 发送工单提醒
// socketio.sendCreateOrder = function (arg) {
//     SocketGlobel.emit('OrderMsg', arg);
// };
//
// module.exports = socketio;