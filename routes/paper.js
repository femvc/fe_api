/* global global,response,exports */

'use strict';
var questionModel = require('../models/question').createNew();
var paperModel = require('../models/paper').createNew();
var resultModel = require('../models/result').createNew();
var rankRoute = require('./rank');

function createQuestionList(req, res, next) {
    req.sessionStore.questionIndex[req.sessionStore.user[req.sessionID]] = undefined;
    var current = 1,
        count = 10000,
        sort = {
            'update_time': -1,
            'create_time': -1
        },
        filter = {},
        amount = String(req.paramlist.amount),
        questionRate = [
            'Javascript', 1.8,
            'HTML', 1,
            'CSS', 1,
            'jQuery', 1,
            'PS', 0.8,
            'DOM', 0.8,
            'HTML5CSS3', 1,
            'Server', 0.6
        ];
    
    // amount = amount === '5' || amount === '20' || amount === '50' ? Number(amount) : 5;
    amount = amount === String(Number(amount)) && Number(amount) > 0 && Number(amount) < 101  ? Number(amount) : 5;

    questionModel.getItems(filter, sort, current, count, function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        var question = [],
            questionMap = {},
            paper = {};
        for (var i = 0, ilen = doc.length; i < ilen; i++) {
            question.push(doc[i].atcid);
            questionMap[doc[i].atcid] = doc[i];
        }

        question = global.common.randomOrder(global.common.randomOrder(question));

        var sum = 0;
        for (var i=0,len=questionRate.length; i<len; i+=2) {
            sum += questionRate[i+1];
        }
            
        var left = amount;
        var questionCount = {};
        for (var i=0,len=questionRate.length; i<len; i+=2) {
            var k = questionRate[i];
            var v = questionRate[i+1];
            questionCount[k] = Math.round(v*amount/sum);
            
            console.log('>>>>>>>>>>>left>>>>>>>>>>>');
            console.log('left=' + left + '&k=' + k + '&v=' + v + '&count=' + questionCount[k]);
            
            left = left - questionCount[k];
        }
        questionCount['Javascript'] += left;

        var questionList = {
            'HTML': [],
            'CSS': [],
            'PS': [],
            'Server': [],
            'HTML5CSS3': [],
            'DOM': [],
            'jQuery': [],
            'Javascript': []
        };

        for (var i = 0, len = question.length; i < len; i++) {
            if (questionMap[question[i]].label.indexOf('HTML') !== -1 && questionCount['HTML'] > 0) {
                questionList['HTML'].push(questionMap[question[i]].atcid);
                questionCount['HTML'] --;
            }
            else if (questionMap[question[i]].label.indexOf('CSS') !== -1 && questionCount['CSS'] > 0) {
                questionList['CSS'].push(questionMap[question[i]].atcid);
                questionCount['CSS'] --;
            }
            else if (questionMap[question[i]].label.indexOf('PS') !== -1 && questionCount['PS'] > 0) {
                questionList['PS'].push(questionMap[question[i]].atcid);
                questionCount['PS'] --;
            }
            else if (questionMap[question[i]].label.indexOf('Server') !== -1 && questionCount['Server'] > 0) {
                questionList['Server'].push(questionMap[question[i]].atcid);
                questionCount['Server'] --;
            }
            else if (questionMap[question[i]].label.indexOf('HTML5CSS3') !== -1 && questionCount['HTML5CSS3'] > 0) {
                questionList['HTML5CSS3'].push(questionMap[question[i]].atcid);
                questionCount['HTML5CSS3'] --;
            }
            else if (questionMap[question[i]].label.indexOf('DOM') !== -1 && questionCount['DOM'] > 0) {
                questionList['DOM'].push(questionMap[question[i]].atcid);
                questionCount['DOM'] --;
            }
            else if (questionMap[question[i]].label.indexOf('jQuery') !== -1 && questionCount['jQuery'] > 0) {
                questionList['jQuery'].push(questionMap[question[i]].atcid);
                questionCount['jQuery'] --;
            }
            else if (questionMap[question[i]].label.indexOf('Javascript') !== -1 && questionCount['Javascript'] > 0) {
                questionList['Javascript'].push(questionMap[question[i]].atcid);
                questionCount['Javascript'] --;
            }
        }

        // var length = 5;
        var uid = req.sessionStore.user[req.sessionID];
        var now = new Date();
        var test_id = uid + '_' + global.common.formatDate(now, 'yyyyMMddHHmmss') + '_' + (String(Math.random()).replace('0.', '') + '0000000000000000').substr(0, 16);
        req.sessionStore.paper[uid] = test_id;
        req.sessionStore.paperContent[uid] = questionList['HTML'].concat(
            questionList['CSS'],
            questionList['DOM'],
            questionList['PS'],
            questionList['jQuery'],
            questionList['Server'],
            questionList['HTML5CSS3'],
            questionList['Javascript']
        );

        // Test id & question list
        paper.test_id = test_id;
        paper.question = req.sessionStore.paperContent[uid];
        paper.sessionID = req.sessionID;
        var now = new Date();
        var date = global.common.formatDate(now, 'yyyy-MM-dd HH:mm:ss');
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

    if (!req.sessionStore.paper[uid] || !req.sessionStore.paperContent[uid] || req.paramlist.newstart) {
        console.log('>>>>>>>>>>>>> createQuestionList newstart <<<<<<<<<<<<<<');
        createQuestionList(req, res, function () {
            getNextQuestionCallback(req, res, next);
        });
    }
    else {
        getNextQuestionCallback(req, res, next);
    }
}

function getPaperResult(req, res, next) {
    if (!req.paramlist.test_id) {
        return response.err(req, res, 'INTERNAL_INVALIDE_PARAMETER');
    }
    var test_id = req.paramlist.test_id,
        paper,
        answer = {},
        result = {},
        question,
        item,
        sum = 0,
        time_start = null,
        time_end = null;

    paperModel.getItem({
        test_id: test_id
    }, function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        if (!doc || !doc.question) {
            return response.err(req, res, 'INTERNAL_DB_RECORD_NOT_EXIST');
        }
        paper = doc;
        question = doc.question;

        questionModel.getItems({
            atcid: {
                $in: question
            }
        }, {}, 1, 1000, function (err, doc) {
            if (err) {
                response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
            }
            for (var i = 0, len = doc.length; i < len; i++) {
                item = doc[i];
                answer[item.atcid] = item;
            }

            resultModel.getItems({
                test_id: test_id,
                atcid: {
                    $in: question
                }
            }, {
                update_time: 1
            }, 1, 1000, function (err, doc) {
                if (err) {
                    response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
                }

                for (var i = 0, len = doc.length; i < len; i++) {
                    item = doc[i];
                    result[item.atcid] = item.content;
                    if (!time_start) {
                        time_start = item.update_time;
                        time_end = global.common.formatDate(global.common.parseDate(global.common.parseDate(item.update_time).getTime() + 1000), 'yyyy-MM-dd HH:mm:ss');
                    }
                    if (item.update_time < time_start) {
                        time_start = item.update_time;
                    }
                    if (item.update_time > time_end) {
                        time_end = item.update_time;
                    }
                }

                for (var i = 0, len = question.length; i < len; i++) {
                    item = question[i];
                    answer[item].correct = true;
                    answer[item].result = result[item];
                    for (var j in answer[item].options) {
                        if (result[item]) {
                            if (result[item][j] && result[item][j].correct !== answer[item].options[j].correct) {
                                answer[item].correct = false;
                                break;
                            }
                        }
                    }
                    sum += answer[item].correct ? 1 : 0;
                }

                // var uid = req.sessionStore.user[req.sessionID];
                var score = Math.round(100 * sum / question.length);
                var rank = {};
                rank.test_id = test_id;
                rank.score = score;
                rank.correct = sum;
                rank.question = question;
                rank.detail = answer;
                rank.time_start = time_start;
                rank.time_end = time_end;

                req.paramlist.rank = rank;

                next = req.paramlist.internal ? next : response.ok;
                next(req, res, rank);
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
        var single = 0;
        if (req.paramlist.answer != 'yes' && doc && doc.options) {
            var list = doc.options;
            for (var i in list) {
                single += (list[i].correct ? 1 : 0);
                delete list[i].correct;
            }
        }

        var data = JSON.parse(JSON.stringify(doc));
        data.index = req.sessionStore.questionIndex[uid];
        data.sessionID = req.sessionID;
        data.sum = paperContent.length;
        data.test_id = test_id;
        data.single = single === 1;
        response.ok(req, res, data);
    });
}

exports.getNextQuestion = getNextQuestion;
exports.getPaperResult = getPaperResult;

exports.saveNextQuestion = function (req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];
    if (req.sessionStore.questionIndex[uid]) {
        req.sessionStore.questionIndex[uid] = parseInt(req.sessionStore.questionIndex[uid], 10) + 1;
    }
    else {
        req.sessionStore.questionIndex[uid] = 1;
    }

    if (!req.paramlist.atcid || !req.paramlist.test_id || req.paramlist.test_id.indexOf(uid) == -1) {
        //return response.err(req, res, 'INTERNAL_INVALIDE_PARAMETER');
        return response.ok(req, res, [uid, req.paramlist]);
    }

    var callback = function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }

        doc[0].index = req.sessionStore.questionIndex[uid];
        doc[0].sessionID = req.sessionID;

        // test finished
        if (req.sessionStore.paperContent[uid] && req.sessionStore.questionIndex[uid] > req.sessionStore.paperContent[uid].length) {
            console.log('~~~~~~~~~~~ test finished ~~~~~~~~~~');
            req.paramlist.internal = true;
            getPaperResult(req, res, function (req, res, rank) {
                rankRoute.saveRank(req, res, function (err, resp) {
                    response.ok(req, res, {
                        finish: true
                    });
                });
            });
        }
        else {
            response.ok(req, res, JSON.parse(JSON.stringify(doc)));
        }
    };

    var question = {};
    question.update_time = global.common.formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss');
    question.uid = uid;
    question.atcid = req.paramlist.atcid;
    question.test_id = req.paramlist.test_id;
    question.title = req.paramlist.title;
    question.index = req.paramlist.index;

    try {
        question.content = req.paramlist.content ? JSON.parse(decodeURIComponent(req.paramlist.content)) : '';
    }
    catch (e) {}

    resultModel.insert(question, callback);
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

exports.resetQuestionIndex = function (req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];

    var question_index = req.paramlist.question_index;
    if (question_index !== undefined && question_index > 0 && question_index < 21) {
        req.sessionStore.questionIndex[uid] = question_index;
        response.ok(req, res, {
            question_index: question_index
        });
    }
    else {
        return response.err(req, res, 'INTERNAL_INVALIDE_PARAMETER', 'question_index');
    }
};

exports.createQuestionList = function (req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];

    createQuestionList(req, res, function () {
        response.ok(req, res, {
            paper_id: req.sessionStore.paper[uid]
        });
    });
};