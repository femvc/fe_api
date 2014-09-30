'use strict';
var questionModel = require('../models/question').createNew();
var paperModel = require('../models/paper').createNew();
var resultModel = require('../models/result').createNew();
var Util = require('../helpers/common');


function createQuestionList(next) {
    var list = [],
        result = [],
        current = 1,
        count = count : 10000,
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
        for (var i=0,ilen=doc.length; i<ilen; i++) {
            var list = doc[i].content;
            question.push(doc[i]._id);
        }
        
        var uid = req.sessionStore.user[req.sessionID];
        req.sessionStore.paper[uid] = uid + Util.formatDate(new Date(), 'yyyyMMddhhmm') + String(Math.random()).replace('0.', '');
        paper.test_sn = req.sessionStore.paper[uid];
        
        question = Util.randomOrder(question);
        var length = 20;
        paper.question = question.splice(0, length);

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
    req.sessionStore.questionIndex[uid] = req.sessionStore.questionIndex[uid] ? req.sessionStore.questionIndex[uid] : 1;
    if (!req.sessionStore.paper[uid]) {
        createQuestionList(function(){getNextQuestionCallback(next);})
    }
    else {
        getNextQuestionCallback(next);
    }
}

function getNextQuestionCallback(next) {
    paperModel.getItem({
        test_sn: req.sessionStore.paper[uid]
    }, function (err, resp) {
        if (err || !resp || !resp._id)
            return response.err(req, res, 'INTERNAL_UNKNOWN_ERROR');
        
        var params = req.paramlist,
            current = params.current || 1,
            count = params.count || 100,
            sort = {
                'update_time': -1,
                'create_time': -1
            },
            filter = {_id: {$in: resp.question}};
        
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

            var data = doc[req.sessionStore.questionIndex[uid] - 1];
            if (!data) {
                req.sessionStore.questionIndex[uid] = 1;
                response.err(req, res, 'INDEX_OUT_RANGE');
            }
            else {
                data.index = req.sessionStore.questionIndex[uid];
                data.sessionID = req.sessionID;
                data.sum = doc.length < 100 ? doc.length : 100;
                if (data.index === 1) {
                    data.test_sn = uid + Util.formatDate(new Date(), 'yyyyMMddhhmm') + String(Math.random()).replace('0.', '');
                }

                response.ok(req, res, data);
            }
        });
    

        return response.ok(req, res, user);
    });
}

exports.createQuestionList = createQuestionList;
exports.getNextQuestion = getNextQuestion;

exports.saveNextQuestion = function (req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];
    req.sessionStore.questionIndex[uid] = req.sessionStore.questionIndex[uid] ? parseInt(req.sessionStore.questionIndex[uid], 10) + 1 : 1;

    var index = parseInt(req.paramlist.reset_index, 10);
    index = index !== index || index < 1 ? 1 : index;
    req.sessionStore.questionIndex[uid] = req.paramlist.reset_index !== undefined ? index : req.sessionStore.questionIndex[uid];

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

        doc[0].index = req.sessionStore.questionIndex[uid];
        doc[0].sessionID = req.sessionID;
        console.log(doc);

        response.ok(req, res, JSON.parse(JSON.stringify(doc)));
    }

    try {
        question.content = req.paramlist.content ? JSON.parse(req.paramlist.content) : '';
    }
    catch (e) {}
    //date = hui.formatDate(new Date(), 'yyyy-MM-dd');
    date = Util.formatDate(new Date(), 'yyyy-MM-dd hh:mm');
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

