/*jshint node:true, mocha:true*/
/**
 * @author kecso / https://github.com/kecso
 */

var testFixture = require('./_globals');

describe('Webhook Message sender', function () {
    'use strict';
    var expect = testFixture.expect,
        Q = testFixture.Q,
        mongoUri = 'mongodb://127.0.0.1:27017/hookTestMsg',
        collectionName = 'testHooks',
        db,
        acceptor,
        server,
        messageSender = new testFixture.MessageSender({uri: mongoUri, collection: collectionName});

    before(function (done) {
        //setup hook informations into a collection
        testFixture.mongodb.MongoClient.connect(mongoUri, {}, function (err, db_) {
            if (err || !db_) {
                throw err || new Error('cannot open mongoDB connection');
            }

            db = db_;

            db.dropCollection(collectionName, function (err, result) {
                db.collection(collectionName, function (err, collection) {
                    collection.insertMany([
                        {
                            _id: 'project',
                            hooks: {hookOne: {events: ['needsMatch'], url: 'http://localhost:9000'}}
                        },
                        {
                            _id: 'double',
                            hooks: {
                                hookOne: {events: ['needsMatch'], url: 'http://localhost:9000'},
                                hookTwo: {events: 'all', url: 'http://localhost:9000'}
                            }
                        }
                    ], {}, function (err/*, result*/) {
                        if (err) {
                            throw err;
                        }

                        messageSender.start(done);
                    });
                });

            });

        });
    });
    after(function (done) {
        messageSender.stop()
            .then(function(){
                Q.nfcall(db.dropDatabase)
            })
            .nodeify(done);
        // db.dropDatabase(done);
    });

    beforeEach(function () {
        acceptor = testFixture.express();
        acceptor.use(testFixture.bodyParser.json());
        server = acceptor.listen(9000);
    });
    afterEach(function () {
        server.close();
    });

    it('should send message for matching event', function (done) {
        var eventData = {projectId: 'project', whatever: 'data'};
        //first we need to set the accept for the POSt request
        acceptor.post('/', function (req, res) {
            expect(req.body).not.to.equal(null);
            expect(req.body).not.to.equal(undefined);
            expect(req.body.event).to.equal('needsMatch');
            expect(req.body.hookId).to.equal('hookOne');
            expect(req.body.data).to.eql(eventData);

            done();
        });

        //we send the event to the eventer
        messageSender.send('needsMatch', eventData);
    });

    it('should not send message for non-matching event', function (done) {
        var eventData = {projectId: 'project', whatever: 'data'};
        //first we need to set the accept for the POSt request
        acceptor.post('/', function (req, res) {
            throw new Error('non-matching event was fired');
        });

        //we send the event to the eventer
        messageSender.send('noMatch', eventData);

        setTimeout(function () {
            done();
        }, 100);
    });

    it('should not send message for non-existing project', function (done) {
        var eventData = {projectId: 'unknown', whatever: 'data'};
        //first we need to set the accept for the POSt request
        acceptor.post('/', function (req, res) {
            throw new Error('unknown project fired event');
        });

        //we send the event to the eventer
        messageSender.send('needsMatch', eventData);

        setTimeout(function () {
            done();
        }, 100);
    });

    it('should not send message for invalid event', function (done) {
        var eventData = {whatever: 'data'};
        //first we need to set the accept for the POSt request
        acceptor.post('/', function (req, res) {
            throw new Error('invalid event was fired');
        });

        //we send the event to the eventer
        messageSender.send('needsMatch', eventData);

        setTimeout(function () {
            done();
        }, 100);
    });

    it('should send message for all matching hook', function (done) {
        var eventData = {projectId: 'double', whatever: 'data'},
            counter = 2;
        //first we need to set the accept for the POSt request
        acceptor.post('/', function (req, res) {
            if (counter > 0) {
                expect(req.body.data).to.eql(eventData);
            }

            counter -= 1;
            if (counter < 0) {
                throw new Error('Too message was sent!');
            }

            if (counter === 0) {
                setTimeout(function () {
                    done()
                }, 100);
            }
        });

        //we send the event to the eventer
        messageSender.send('needsMatch', eventData);

    });

    it('should send message for matching hooks only', function (done) {
        var eventData = {projectId: 'double', whatever: 'data'},
            counter = 1;
        //first we need to set the accept for the POSt request
        acceptor.post('/', function (req, res) {
            if (counter > 0) {
                expect(req.body.data).to.eql(eventData);
            }

            counter -= 1;
            if (counter < 0) {
                throw new Error('Too message was sent!');
            }

            if (counter === 0) {
                setTimeout(function () {
                    done()
                }, 100);
            }
        });

        //we send the event to the eventer
        messageSender.send('notAllMatch', eventData);

    });
});
