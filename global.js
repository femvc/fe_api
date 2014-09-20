'use strict';

global.flow = require('flow');
global.config = require('./config');
global.mongo = require('./models/mongo');
global.ObjectID = require('mongodb').ObjectID;
global.moment = require('moment');
global.root_path = __dirname;
global.dbopt = require('./models/dbopt');
global.response = require('./helpers/response');
global.common = require('./helpers/common');

exports.run = function(callback) {
    mongo.onReady(function() {
        callback();
    });
};
