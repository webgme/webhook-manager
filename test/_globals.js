/**
 * @author kecso / https://github.com/kecso
 */


var exports = {},
    EventGenerator = function () {
        var pub = redis.createClient('redis://127.0.0.1:6379');

        function stop() {
            pub.quit();
        }

        function send(channel, eventType, eventData) {
            var msg = MSG.encode(['uid', {data: [eventType, eventData]}, {}]);
            pub.publish(channel, msg);
        }

        return {
            send: send,
            stop: stop
        }
    },
    redis = require('redis'),
    Q = require('q'),
    expect = require('chai').expect,
    express = require('express'),
    bodyParser = require('body-parser'),
    mongodb = require('mongodb'),
    MessageSender = require('../src/hookMessenger'),
    MSG = require("msgpack-js"),
    EventHandler = require('../src/redisSocketIoEventHandler');

exports.EventGenerator = EventGenerator;
exports.MessageSender = MessageSender;
exports.EventHandler = EventHandler;
exports.expect = expect;
exports.Q = Q;
exports.express = express;
exports.bodyParser = bodyParser;
exports.mongodb = mongodb;

module.exports = exports;