'use strict';
var cloudlabelModel = require('../models/cloudlabel').createNew();

exports.saveCloudlabel = function (req, res, next) {
    var label_id = req.paramlist.label_id,
        value = req.paramlist.value,
        opt = req.paramlist.opt,
        cloudlabel = {},
        callback,
        date;

    if (!label_id) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'label_id');
    }
    if (value === undefined && !opt) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'value|opt');
    }

    cloudlabel.label_id = label_id;
    cloudlabel.value = value;

    var opt = req.paramlist.opt;

    callback = function (err, doc) {
        if (err) {
            response.send(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        response.ok(req, res, doc);
    };

    var now = new Date();
    date = global.common.formatDate(now, 'yyyy-MM-dd hh:mm:ss');

    if (opt === 'remove') {
        if (String(label_id).indexOf('-0.') === 0) {
            callback(null, []);
        }
        else {
            cloudlabelModel.remove({
                label_id: label_id
            }, callback);
        }
    }
    else if (String(label_id).indexOf('-0.') === 0) {
        cloudlabel.update_time = date;
        cloudlabel.label_id = global.common.formatDate(now, 'yyyyMMddhhmmss') + '_' + (String(Math.random()).replace('0.', '') + '0000000000000000').substr(0, 16);
        cloudlabelModel.insert(cloudlabel, callback);
    }
    else {
        cloudlabel.update_time = date;
        cloudlabelModel.update({
            label_id: label_id
        }, cloudlabel, false, false, callback);
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