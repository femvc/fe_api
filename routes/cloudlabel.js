'use strict';
var cloudlabelModel = require('../models/cloudlabel').createNew();

exports.saveCloudlabel = function (req, res, next) {
    var value = req.paramlist.value,
        label = req.paramlist.label,
        opt = req.paramlist.opt,
        cloudlabel = {},
        callback,
        date;

    if (!value) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'value');
    }
    if (label === undefined && !opt) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'label|opt');
    }

    cloudlabel.value = value;
    cloudlabel.label = label;

    var opt = req.paramlist.opt;

    callback = function (err, doc) {
        if (err) {
            response.send(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        response.ok(req, res, doc);
    };

    var now = new Date();
    date = global.common.formatDate(now, 'yyyy-MM-dd HH:mm:ss');

    if (opt === 'remove') {
        if (String(value).indexOf('-') === 0) {
            callback(null, []);
        }
        else {
            cloudlabelModel.remove({
                value: value
            }, callback);
        }
    }
    else if (String(value).indexOf('-') === 0) {
        cloudlabel.update_time = date;
        cloudlabel.value = global.common.formatDate(now, 'yyyyMMddHHmmss') + '_' + (String(Math.random()).replace('0.', '') + '0000000000000000').substr(0, 16);
        cloudlabelModel.insert(cloudlabel, callback);
    }
    else {
        cloudlabel.update_time = date;
        cloudlabel.value = value;
        cloudlabelModel.update({
            value: value
        }, {
            $set: cloudlabel
        }, {upsert: true, multi: false}, callback);
    }

};

exports.getCloudlabels = function (req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];

    var current = 1,
        count = 10000,
        sort = {},
        filter = {};

    cloudlabelModel.getItems(filter, sort, current, count, function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }

        response.ok(req, res, doc);
    });

};