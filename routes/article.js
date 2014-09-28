'use strict';
var articleModel = require('../models/article').createNew();
var quizModel = require('../models/quiz').createNew();
var Util = require('../helpers/common');

exports.saveArticle = function (req, res, next) {
    var id = req.paramlist.atcid,
        article = {},
        callback, date;

    if (!req.paramlist.title) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'title');
    }
    if (!req.paramlist.content) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'content');
    }

    article.title = req.paramlist.title;
    article.content = JSON.parse(req.paramlist.content);

    callback = function (err, doc) {
        if (err) {
            response.send(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        response.ok(req, res, doc);
    }
    //date = hui.formatDate(new Date(), "yyyy-MM-dd");
    date = Util.formatDate(new Date(), "yyyy-MM-dd hh:mm");
    if (id) {
        article.update_time = date;
        articleModel.updateById(id, article, callback);
    }
    else {
        article.update_time = date;
        articleModel.insert(article, callback);
    }
}

exports.getArticle = function (req, res, next) {
    var id = req.paramlist.atcid;
    if (!id) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'id');
    }
    articleModel.getById(id, function (err, doc) {
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

exports.removeArticle = function (req, res, next) {
    var id = req.paramlist.atcid;
    if (!id) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'id');
    }
    articleModel.remove(id, function (err) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        response.ok(req, res, null);
    });
}

exports.getArticles = function (req, res, next) {

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

    articleModel.getItems(filter, sort, current, count, function (err, doc) {
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

function createArticleList(uid, next) {
    var list = [],
        result = [],
        current = 1,
        count = 1000,
        sort = {
            "update_time": -1,
            "create_time": -1
        },
        filter = {};

    articleModel.getItems(filter, sort, current, count, function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }


    });

}

exports.getNextArticle = function (req, res, next) {
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


    articleModel.getItems(filter, sort, current, count, function (err, doc) {
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

exports.saveNextArticle = function (req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];
    req.sessionStore.subject[uid] = req.sessionStore.subject[uid] ? parseInt(req.sessionStore.subject[uid], 10) + 1 : 1;

    var index = parseInt(req.paramlist.reset_index, 10);
    index = index !== index || index < 1 ? 1 : index;
    req.sessionStore.subject[uid] = req.paramlist.reset_index !== undefined ? index : req.sessionStore.subject[uid];

    var id = req.paramlist.atcid,
        article = {},
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
        article.content = req.paramlist.content ? JSON.parse(req.paramlist.content) : '';
    }
    catch (e) {}
    //date = hui.formatDate(new Date(), "yyyy-MM-dd");
    date = Util.formatDate(new Date(), "yyyy-MM-dd hh:mm");
    article.update_time = date;
    article.uid = uid;
    article.atcid = id;
    article.test_sn = req.paramlist.test_sn;
    article.index = req.paramlist.index;

    if (!req.paramlist.reset_index) {
        quizModel.insert(article, callback);
    }
    else {
        callback(null, [{}]);
    }
}

exports.getTestResult = function (req, res, next) {

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

    articleModel.getItems(filter, sort, current, count, function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        var subject = doc;
        quizModel.getItems(filter, sort, current, count, function (err, doc) {
            if (err) {
                response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
            }


            response.ok(req, res, [subject, doc]);
        });
    });
}