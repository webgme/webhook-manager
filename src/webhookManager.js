var Eventer = require('./redisSocketIoEventHandler'),
    Messager = require('./hookMessager'),
    messager,
    eventer,
    mongoUri,
    redisUri;

// graceful ending of the child process
process.on('SIGINT', function () {
    console.log('The webhook manager stops.');
    if (eventer) {
        eventer.stop();
    }
    if (messager) {
        messager.stop();
    }
    process.exit(0);
});

if (process.argv && process.argv.length > 2) {
    mongoUri = process.argv[2];
} else {
    mongoUri = 'mongodb://127.0.0.1:27017/multi';
}

if (process.argv && process.argv.length > 3) {
    redisUri = process.argv[3];
} else {
    redisUri = 'redis://127.0.0.1:6379';
}

messager = new Messager({uri: mongoUri});
eventer = new Eventer({eventFn: messager.send, uri: redisUri});

messager.start(function (err) {
    if (err) {
        console.error('failed to initiate connection to project metadata:', err);
        process.exit(1);
    } else {
        eventer.start(function () {
            console.log('listening to events - ',mongoUri,' - ',redisUri);
        });

    }
});

