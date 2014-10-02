'use strict';
var questionModel = require('../models/question').createNew();
var paperModel = require('../models/paper').createNew();
var resultModel = require('../models/result').createNew();

exports.getResult = function (req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];
    if (!req.paramlist.test_id) {
        return response.err(req, res, 'INTERNAL_INVALIDE_PARAMETER');
    }

    paperModel.getItem({
        test_id: req.paramlist.test_id
    }, function (err, resp) {
        if (err) {
            return response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        if (!resp || !resp.question) {
            return response.err(req, res, 'INTERNAL_INVALIDE_PARAMETER');
        }

        var current = 1;
        var count = 10000;
        var sort = {};
        var filter = {
            atcid: {
                $in: resp.question
            }
        };

        questionModel.getItems(filter, sort, current, count, function (err, question) {
            if (err) {
                response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
            }
            filter = {
                test_id: req.paramlist.test_id
            }
            resultModel.getItems(filter, sort, current, count, function (err, doc) {
                if (err) {
                    response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
                }

                response.ok(req, res, {
                    paper: resp.question,
                    your_answer: doc,
                    reference_answer: question
                });
            });
        });
    });
};

exports.getResults = function (req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];

    var current = 1,
        count = 10000,
        sort = {},
        filter = {};

    resultModel.getItems(filter, sort, current, count, function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }

        response.ok(req, res, doc);
    });

};