/**
 * @author kecso / https://github.com/kecso
 */


var exports = {},
    EventGenerator = function () {
        var pub = redis.createClient('redis://127.0.0.1:6379');

        console.log('fuck');
        function stop() {
            pub.quit();
        }

        function send(channel, eventType, eventData) {
            console.log('fuck',channel,eventType);
            var msg = MSG.encode(['uid', {data: [eventType, eventData]}, {}]);
            pub.publish(channel, msg);
        }

        return {
            send: send,
            stop: stop
        }
    },
    redis = require('redis'),
    expect = require('chai').expect,
    express = require('express'),
    bodyParser = require('body-parser'),
    mongodb = require('mongodb'),
    MessageSender = require('../src/hookMessager'),
    MSG = require("msgpack-js"),
    EventHandler = require('../src/redisSocketIoEventHandler');

exports.EventGenerator = EventGenerator;
exports.MessageSender = MessageSender;
exports.EventHandler = EventHandler;
exports.expect = expect;
exports.express = express;
exports.bodyParser = bodyParser;
exports.mongodb = mongodb;

module.exports = exports;