'use strict';
var questionModel = require('../models/question').createNew();
var paperModel = require('../models/paper').createNew();
var resultModel = require('../models/result').createNew();

function createQuestionList(req, res, next) {
    var current = 1,
        count = 10000,
        sort = {
            'update_time': -1,
            'create_time': -1
        },
        filter = {};

    questionModel.getItems(filter, sort, current, count, function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        var question = [],
            paper = {};
        for (var i = 0, ilen = doc.length; i < ilen; i++) {
            question.push(doc[i].atcid);
        }

        var length = 3;
        var uid = req.sessionStore.user[req.sessionID];
        var now = new Date();
        req.sessionStore.paper[uid] = uid + '_' + global.common.formatDate(now, 'yyyyMMddhhmmss') + '_' + (String(Math.random()).replace('0.', '') + '0000000000000000').substr(0, 16);
        req.sessionStore.paperContent[uid] = global.common.randomOrder(question).splice(0, length);

        // Test id & question list
        paper.test_id = req.sessionStore.paper[uid];
        paper.question = req.sessionStore.paperContent[uid];
        paper.sessionID = req.sessionID;
        var now = new Date();
        var date = global.common.formatDate(now, 'yyyy-MM-dd hh:mm:ss');
        paper.update_time = date;

        paperModel.insert(paper, function (err, doc) {
            if (err) {
                response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
            }
            next();
        });
    });
}

function getNextQuestion(req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];

    if (!req.sessionStore.paper[uid] || !req.sessionStore.paperContent[uid]) {
        createQuestionList(req, res, function () {
            getNextQuestionCallback(req, res, next);
        });
    }
    else {
        getNextQuestionCallback(req, res, next);
    }
}

function getPaperResult(test_id) {
    var paper,
        answer = {},
        result = {},
        list,
        item,
        fail,
        sum = 0,
        time_start = null,
        time_end = null;
    paperModel.getItem({
        test_id: test_id
    }, function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        paper = doc;
        list = doc.question;
        questionModel.getItems({
            atcid: {
                $in: list
            }
        }, {}, 1, 1000, function (err, doc) {
            if (err) {
                response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
            }
            for (var i = 0, len = doc.length; i < len; i++) {
                item = doc[i];
                answer[item.atcid] = item.options;
            }
            resultModel.getItems({
                atcid: {
                    $in: doc.question
                }
            }, {}, 1, 1000, function (err, doc) {
                if (err) {
                    response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
                }

                for (var i = 0, len = doc.length; i < len; i++) {
                    item = doc[i];
                    result[item.atcid] = item.content;
                    if (!time_start) {
                        time_start = time_end = item.update_time;
                    }
                    if (item.update_time < time_start) {
                        time_start = item.update_time;
                    }
                    if (item.update_time > time_end) {
                        time_end = item.update_time;
                    }
                }

                for (var i = 0, len = list.length; i < len; i++) {
                    item = list[i];
                    fail = false;
                    for (var j in answer[item]) {
                        if (answer[item][j].correct !== result[item][j].correct) {
                            fail = true;
                            break;
                        }
                    }
                    sum += fail ? 0 : 1;
                }
                response.ok(req, res, {
                    amount: list.length,
                    correct: sum,
                    time_start: time_start,
                    time_end: time_end,
                    rank: 1000,
                    amount: 10000
                });
            });
        });
    });

}

function getNextQuestionCallback(req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];
    var test_id = req.sessionStore.paper[uid];
    var paperContent = req.sessionStore.paperContent[uid];
    if (!req.sessionStore.questionIndex[uid]) {
        req.sessionStore.questionIndex[uid] = 1;
    }
    if (req.sessionStore.paperContent[uid] && req.sessionStore.questionIndex[uid] > req.sessionStore.paperContent[uid].length) {
        req.sessionStore.paper[uid] = null;
        req.sessionStore.paperContent[uid] = null;
        req.sessionStore.questionIndex[uid] = 0;

        getPaperResult(test_id);
    }
    else {
        questionModel.getItem({
            atcid: paperContent[req.sessionStore.questionIndex[uid] - 1]
        }, function (err, doc) {
            if (err) {
                return response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
            }
            if (!doc) {
                req.sessionStore.questionIndex[uid] = 1;
                return response.err(req, res, 'INDEX_OUT_RANGE');
            }

            if (req.paramlist.answer != 'yes' && doc && doc.options) {
                var list = doc.options;
                for (var i in list) {
                    delete list[i].correct;
                }
            }

            var data = JSON.parse(JSON.stringify(doc));
            data.index = req.sessionStore.questionIndex[uid];
            data.sessionID = req.sessionID;
            data.sum = paperContent.length;
            data.test_id = test_id;
            response.ok(req, res, data);
        });
    }
}

exports.createQuestionList = createQuestionList;
exports.getNextQuestion = getNextQuestion;

exports.saveNextQuestion = function (req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];
    if (req.sessionStore.questionIndex[uid]) {
        req.sessionStore.questionIndex[uid] = parseInt(req.sessionStore.questionIndex[uid], 10) + 1;
    }
    else {
        req.sessionStore.questionIndex[uid] = 1;
    }

    if (req.paramlist.reset_index !== undefined) {
        var reset_index = parseInt(req.paramlist.reset_index, 10);
        if (reset_index == reset_index) {
            req.sessionStore.questionIndex[uid] = reset_index;
        }
    }

    if (!req.paramlist.atcid || !req.paramlist.test_id || req.paramlist.test_id.indexOf(uid) == -1) {
        //return response.err(req, res, 'INTERNAL_INVALIDE_PARAMETER');
        return response.ok(req, res, [uid, req.paramlist]);
    }

    var id = req.paramlist.atcid,
        question = {},
        callback;

    callback = function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }

        doc[0].index = req.sessionStore.questionIndex[uid];
        doc[0].sessionID = req.sessionID;

        response.ok(req, res, JSON.parse(JSON.stringify(doc)));
    };

    try {
        question.content = req.paramlist.content ? JSON.parse(decodeURIComponent(req.paramlist.content)) : '';
    }
    catch (e) {}

    question.update_time = global.common.formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss');
    question.uid = uid;
    question.atcid = id;
    question.test_id = req.paramlist.test_id;
    question.index = req.paramlist.index;

    if (!req.paramlist.reset_index) {
        resultModel.insert(question, callback);
    }
    else {
        callback(null, [{}]);
    }
};

exports.getPapers = function (req, res, next) {
    // var uid = req.sessionStore.user[req.sessionID];

    var current = 1,
        count = 10000,
        sort = {},
        filter = {};

    paperModel.getItems(filter, sort, current, count, function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }

        response.ok(req, res, doc);
    });

};