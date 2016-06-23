/**
 * @author kecso / https://github.com/kecso
 */
var mongodb = require('mongodb'),
    superagent = require('superagent'),
    Q = require('q');

function hookMessager(options) {
    var db = null,
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
        var deferred = Q.defer();
        if (db) {
            deferred.resolve();
        }
        mongodb.MongoClient.connect(options.uri, {}, function (err, db_) {
            if (!err && db_) {
                db = db_;
                deferred.resolve();
            } else {
                deferred.reject(err || new Error('cannot connect to mongoDB'));
            }
        });

        return deferred.promise.nodeify(callback);
    }

    function stop(callback) {
        var deferred = Q.defer();
        db.close(function (err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise.nodeify(callback);
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