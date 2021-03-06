/*jshint node:true, mocha:true*/
/**
 * @author kecso / https://github.com/kecso
 */

var testFixture = require('./_globals');

describe('Redis Socket.IO event handler', function () {
    'use strict';
    var expect = testFixture.expect,
        eventGenerator = new testFixture.EventGenerator();

    after(function () {
        eventGenerator.stop();
    });

    it('should handle a proper WebGME like event with default parameters', function (done) {
        var eventFn = function (eType, eData) {
                expect(eType).to.equal(testEType);
                expect(eData).to.eql(testEData);
                eventHandler.stop();
                done();
            },
            eventHandler = new testFixture.EventHandler({eventFn: eventFn}),
            testEType = 'TEST_EVENT',
            testEData = {one: 1, two: 'two'};

        eventHandler.start(function () {
            eventGenerator.send('socket.io#/#anything', testEType, testEData);
        });
    });

    it('should not handle WebGME like event from the exclude list', function (done) {
        var eventFn = function (eType, eData) {
                throw new Error('excluded event was posted!');
            },
            eventHandler = new testFixture.EventHandler({eventFn: eventFn}),
            testEType = 'BRANCH_UPDATED',
            testEData = {one: 1, two: 'two'};

        eventHandler.start(function () {
            eventGenerator.send('socket.io#/#anything', testEType, testEData);
            setTimeout(function () {
                eventHandler.stop();
                done();
            }, 100);
        });
    });

    it('should not handle WebGME like event from the exclude list', function (done) {
        var eventFn = function (eType, eData) {
                throw new Error('non-matching channel event was posted!');
            },
            eventHandler = new testFixture.EventHandler({eventFn: eventFn}),
            testEType = 'TEST_EVENT',
            testEData = {one: 1, two: 'two'};

        eventHandler.start(function () {
            eventGenerator.send('anythingButNot_socket.io#/#', testEType, testEData);
            setTimeout(function () {
                eventHandler.stop();
                done();
            }, 100);
        });
    });
});
