'use strict';

require('./global').run(function () {
    console.log('start');

    /**
     * Module dependencies.
     */
    var path = require('path');
    var express = require('express');

    var app = express();

    // all environments
    app.set('port', config.service.port || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.compress());
    app.use(express.urlencoded())
    app.use(express.json())
    app.use(express.methodOverride());
    app.use(express.cookieParser('your secret here'));

    var session = require('express-session')
    var RedisStore = require('connect-redis')(session);

    app.use(session({
        store: new RedisStore({
            host: config.redis.host,
            port: config.redis.port,
            db: config.redis.db.express
        }),
        secret: config.session.secret
    }));

    app.use(function (req, res, next) {
        req.paramlist = req.paramlist || {};
        if (req.body) {
            for (var i in req.body) {
                if (req.paramlist[i] === undefined) {
                    req.paramlist[i] = req.body[i];
                }
            }
        }
        if (req.query) {
            for (var i in req.query) {
                if (req.paramlist[i] === undefined) {
                    req.paramlist[i] = req.query[i];
                }
            }
        }

        next();
    });

    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));

    // development only
    if ('development' == app.get('env')) {
        app.use(express.errorHandler());
    }

    global.app = app;
    require('./routes');

    app.listen(app.get('port'), function () {
        console.log('listening port ' + app.get('port'));
    });

});