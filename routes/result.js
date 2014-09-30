'use strict';
var questionModel = require('../models/question').createNew();
var paperModel  = require('../models/paper').createNew();
var resultModel = require('../models/result').createNew();
var Util = require('../helpers/common');

exports.getTestResult = function (req, res, next) {

    console.log(common);
    var params = req.paramlist,
        current = params.current || 1,
        count = params.count || 100,
        sort = {
            'update_time': -1,
            'create_time': -1
        },
        filter = {};

    if (params.title)
        filter.title = common.likeWith(params.title);
    if (params.author)
        filter.author = params.author;

    questionModel.getItems(filter, sort, current, count, function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        var subject = doc;
        paperModel.getItems(filter, sort, current, count, function (err, doc) {
            if (err) {
                response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
            }

            response.ok(req, res, [subject, doc]);
        });
    });
}