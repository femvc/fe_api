'use strict';
var rankModel = require('../models/rank').createNew();

exports.getRank = function (req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];
    if (!req.paramlist.test_id) {
        return response.err(req, res, 'INTERNAL_INVALIDE_PARAMETER');
    }

    rankModel.getItem({
        test_id: req.paramlist.test_id
    }, function (err, resp) {
        if (err) {
            return response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }

        response.ok(req, res, resp);
    });
};

exports.getRanks = function (req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];

    var filter = req.paramlist.filter || {
        update_time: global.common.formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss'),
        score: 101
    };
    if (req.paramlist.filter && !req.paramlist.filter.update_time) {
        filter = JSON.parse(decodeURIComponent(req.paramlist.filter));
    }

    rankModel.getItems({
        update_time: {
            $lt: filter.update_time
        }
    }, {}, 1, 100000, function (err, resp) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }

        var index = 0;
        for (var i = 0, len = resp.length; i < len; i++) {
            if (resp[i].score < filter.score) {
                index++;
            }
        }

        response.ok(req, res, [filter, resp]);
    });

};

exports.saveRank = function (req, res, next) {
    var uid = req.sessionStore.user[req.sessionID];
    if (!req.paramlist.rank) {
        return response.err(req, res, 'INTERNAL_INVALIDE_PARAMETER');
    }
    var rank = req.paramlist.rank;
    if (req.paramlist.rank && !req.paramlist.rank.time_end) {
        rank = JSON.parse(decodeURIComponent(req.paramlist.rank));
    }
    var uid = req.sessionStore.user[req.sessionID];
    rank.uid = uid;
    var update_time = global.common.formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss');
    rank.update_time = update_time;

    rankModel.insert(rank, function (err, resp) {
        if (err) {
            return response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        next = next || response.ok;
        next(req, res, resp);
    });
};