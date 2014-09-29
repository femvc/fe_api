'use strict';
var questionModel = require('../models/question').createNew();
var paperModel = require('../models/paper').createNew();
var Util = require('../helpers/common');

exports.getQuestions = function (req, res, next) {

    console.log(common);
    var params = req.paramlist,
        current = params.current || 1,
        count = params.count || 100,
        sort = {
            "update_time": -1,
            "create_time": -1
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

        if (req.paramlist.answer != 'yes') {
            for (var j in doc) {
                var list = doc[j].content;
                for (var i in list) {
                    delete list[i].correct;
                }
            }
        }

        response.ok(req, res, {
            items: doc
        });
    });
}

function createQuestionList(uid, next) {
    var list = [],
        result = [],
        current = 1,
        count = 1000,
        sort = {
            "update_time": -1,
            "create_time": -1
        },
        filter = {};

    questionModel.getItems(filter, sort, current, count, function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }


    });

}

exports.getNextQuestion = function (req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];
    req.sessionStore.subject[uid] = req.sessionStore.subject[uid] ? req.sessionStore.subject[uid] : 1;

    var params = req.paramlist,
        current = params.current || 1,
        count = params.count || 100,
        sort = {
            "update_time": -1,
            "create_time": -1
        },
        filter = {};


    //{_id: {$in: [20,22,24,26]}}


    questionModel.getItems(filter, sort, current, count, function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }

        if (req.paramlist.answer != 'yes') {
            for (var j in doc) {
                var list = doc[j].content;
                for (var i in list) {
                    delete list[i].correct;
                }
            }
        }

        var data = doc[req.sessionStore.subject[uid] - 1];
        if (!data) {
            req.sessionStore.subject[uid] = 1;
            response.err(req, res, 'INDEX_OUT_RANGE');
        }
        else {
            data.index = req.sessionStore.subject[uid];
            data.sessionID = req.sessionID;
            data.sum = doc.length < 100 ? doc.length : 100;
            if (data.index === 1) {
                data.test_sn = uid + Util.formatDate(new Date(), 'yyyyMMddhhmm') + String(Math.random()).replace('0.', '');
            }

            response.ok(req, res, data);
        }
    });

}

exports.saveNextQuestion = function (req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];
    req.sessionStore.subject[uid] = req.sessionStore.subject[uid] ? parseInt(req.sessionStore.subject[uid], 10) + 1 : 1;

    var index = parseInt(req.paramlist.reset_index, 10);
    index = index !== index || index < 1 ? 1 : index;
    req.sessionStore.subject[uid] = req.paramlist.reset_index !== undefined ? index : req.sessionStore.subject[uid];

    var id = req.paramlist.atcid,
        question = {},
        callback, date;

    if (!id || !req.paramlist.test_sn || req.paramlist.test_sn.indexOf(uid) !== 0) {
        return response.err(req, res, 'INTERNAL_INVALIDE_PARAMETER');
    }

    callback = function (err, doc) {
        if (err) {
            response.send(req, res, 'INTERNAL_DB_OPT_FAIL');
        }

        doc[0].index = req.sessionStore.subject[uid];
        doc[0].sessionID = req.sessionID;
        console.log(doc);

        response.ok(req, res, JSON.parse(JSON.stringify(doc)));
    }

    try {
        question.content = req.paramlist.content ? JSON.parse(req.paramlist.content) : '';
    }
    catch (e) {}
    //date = hui.formatDate(new Date(), "yyyy-MM-dd");
    date = Util.formatDate(new Date(), "yyyy-MM-dd hh:mm");
    question.update_time = date;
    question.uid = uid;
    question.atcid = id;
    question.test_sn = req.paramlist.test_sn;
    question.index = req.paramlist.index;

    if (!req.paramlist.reset_index) {
        paperModel.insert(question, callback);
    }
    else {
        callback(null, [{}]);
    }
}

