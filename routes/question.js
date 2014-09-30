'use strict';
var questionModel = require('../models/question').createNew();
var paperModel = require('../models/paper').createNew();
var resultModel = require('../models/result').createNew();
var Util = require('../helpers/common');

exports.getQuestion = function (req, res, next) {
    var id = req.paramlist.atcid;
    if (!id) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'id');
    }
    questionModel.getById(id, function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        if (req.paramlist.answer != 'yes' && doc && doc.content) {
            var list = doc.content;
            for (var i in list) {
                delete list[i].correct;
            }
        }
        response.ok(req, res, doc);
    });
}

exports.saveQuestion = function (req, res, next) {
    var id = req.paramlist.atcid,
        question = {},
        callback, date;

    if (!req.paramlist.title) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'title');
    }
    if (!req.paramlist.content) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'content');
    }

    question.title = req.paramlist.title;
    question.content = JSON.parse(req.paramlist.content);

    callback = function (err, doc) {
        if (err) {
            response.send(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        response.ok(req, res, doc);
    }
    //date = hui.formatDate(new Date(), 'yyyy-MM-dd');
    date = Util.formatDate(new Date(), 'yyyy-MM-dd hh:mm');
    if (id) {
        question.update_time = date;
        questionModel.updateById(id, question, callback);
    }
    else {
        question.update_time = date;
        questionModel.insert(question, callback);
    }
}

exports.removeQuestion = function (req, res, next) {
    var id = req.paramlist.atcid;
    if (!id) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'id');
    }
    questionModel.remove(id, function (err) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        response.ok(req, res, null);
    });
}

exports.getQuestions = function (req, res, next) {

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

