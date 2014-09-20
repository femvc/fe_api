'use strict';
var articleModel = require('../models/article').createNew();

exports.saveArticle = function (req, res, next) {
    var id = req.paramlist.atcid, article = {}, callback, date;

    if (!req.paramlist.title) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'title');
    }
    if (!req.paramlist.content) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'content');
    }

    article.title = req.paramlist.title;
    article.content = req.paramlist.content;

    callback = function (err, doc) {
        if (err) {
            response.send(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        response.ok(req, res, doc);
    }
    //date = hui.formatDate(new Date(), "yyyy-MM-dd");
    date = new Date();
    if (id) {
        article.update_time = date;
        articleModel.updateById(id, article, callback);
    }
    else {
        article.create_time = date;
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
        sort = { "update_time": -1, "create_time": -1 },
        filter = {};

    if (params.title)
        filter.title = common.likeWith(params.title);
    if (params.author)
        filter.author = params.author;

    articleModel.getItems(filter, sort, current, count, function (err, doc) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        response.ok(req, res, { items: doc });
    });
}