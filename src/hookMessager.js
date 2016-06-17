/**
 * @author kecso / https://github.com/kecso
 */
var mongodb = require('mongodb'),
    superagent = require('superagent');

function hookMessager(options) {
    var startCb = [],
        db = null,
        projectMetadataCollectionId = options.collection || '_projects';

    options = options || {};
    options.uri = options.uri || 'mongodb://127.0.0.1:27017/multi';

    function getProjectMetaData(projectId, callback) {
        if (db === null) {
            console.error('No mongoDB connection!!');
            callback({});
            return;
        }

        db.collection(projectMetadataCollectionId, function (err, collection) {
            if (err || !collection) {
                console.error('cannot get metadata: ', err ||
                    new Error('unknown collection: ' + projectMetadataCollectionId));
                callback({});
                return;
            }

            collection.findOne({_id: projectId}, function (err, projectMetaData) {
                if (err || !projectMetaData) {
                    console.error('cannot retrieve project\'s metadata: ', err ||
                        new Error('unknown projectId: ' + projectId));
                    callback({});
                    return;
                }

                callback(projectMetaData);
            });
        });
    }

    function start(callback) {
        if (db) {
            callback(null);
            return;
        }
        startCb.push(callback);
        mongodb.MongoClient.connect(options.uri, {}, function (err, db_) {
            var callbacks, i;
            if (!err && db_) {
                db = db_;
            }

            callbacks = startCb;
            startCb = [];
            for (i = 0; i < callbacks.length; i += 1) {
                if (typeof callbacks[i] === 'function') {
                    callbacks[i](err);
                }
            }
        });
    }

    function stop() {
        // TODO is there any procedure that should be done here?
        db = null;

    }

    function send(eventType, eventData) {
        var hookIds,
            hook,
            payload,
            i;

        if (!eventData.projectId) {
            console.info('not project related event receieved: ', eventType);
            return;
        }

        getProjectMetaData(eventData.projectId, function (metaData) {
            hookIds = Object.keys(metaData.hooks || {});

            for (i = 0; i < hookIds.length; i += 1) {
                hook = metaData.hooks[hookIds[i]];
                if (hook.events === 'all' || (hook.events || []).indexOf(eventType) !== -1) {
                    payload = {
                        event: eventType,
                        projectId: eventData.projectId,
                        owner: metaData.owner,
                        projectName: metaData.name,
                        hookId: hookIds[i],
                        data: eventData
                    };

                    superagent.post(hook.url, payload, function (err, result) {
                        console.log(err, result);
                    });
                }
            }
        });

    }

    return {
        start: start,
        stop: stop,
        send: send
    };
}

module.exports = hookMessager;