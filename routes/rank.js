'use strict';
var rankModel = require('../models/rank').createNew();

// exports.getRank = function (req, res, next) {
//     //var uid = req.sessionStore.user[req.sessionID];
//     if (!req.paramlist.test_id) {
//         return response.err(req, res, 'INTERNAL_INVALIDE_PARAMETER');
//     }

//     rankModel.getItem({
//         test_id: req.paramlist.test_id
//     }, function (err, resp) {
//         if (err) {
//             return response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
//         }
//         req.paramlist.filter = resp;
//         getRanks(req, res, next);
//     });
// };

function getRanks(req, res, next) {
    //var uid = req.sessionStore.user[req.sessionID];

    var filter = req.paramlist.filter || {
        update_time: global.common.formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        score: 101
    };
    if (req.paramlist.filter && !req.paramlist.filter.update_time) {
        filter = JSON.parse(decodeURIComponent(req.paramlist.filter));
    }

    rankModel.getItems({
        update_time: {
            $lt: filter.update_time
        }
    }, {}, 1, 1000000, function (err, resp) {
        if (err) {
            response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        filter.rankList = [];
        var item;
        for (var i = 0, len = resp.length; i < len; i++) {
            item = {
                test_id: resp[i].test_id,
                score: resp[i].score,
                correct: resp[i].correct,
                time_start: resp[i].time_start,
                time_end: resp[i].time_end,
                uid: resp[i].uid,
                update_time: resp[i].update_time,
                annual: resp[i].annual,
                career: resp[i].career
            };

            filter.rankList.push(item);
        }
        filter.sum = resp.length;
        // response.ok(req, res, [filter, resp]); // Data 'resp' is HUGE！!
        response.ok(req, res, filter);
    });

}

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
    var update_time = global.common.formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss');
    rank.update_time = update_time;

    rankModel.insert(rank, function (err, resp) {
        if (err) {
            return response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }

        // req.sessionStore.paper[uid] = null;
        // req.sessionStore.paperContent[uid] = null;
        // req.sessionStore.questionIndex[uid] = 0;

        next = req.paramlist.internal ? next : response.ok;
        next(req, res, resp);
    });
};

exports.updateRank = function (req, res, next) {
    //var uid = req.sessionStore.user[req.sessionID];
    if (!req.paramlist.test_id || !req.paramlist.annual || !req.paramlist.career) {
        return response.err(req, res, 'INTERNAL_INVALIDE_PARAMETER');
    }

    var update_time = global.common.formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss');
    rankModel.update({
        test_id: req.paramlist.test_id
    }, {
        $set: {
            annual: req.paramlist.annual,
            career: req.paramlist.career,
            update_time: update_time
        }
    }, {
        upsert: true,
        multi: false
    }, function (err, resp) {
        if (err) {
            return response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }

        next = req.paramlist.internal ? next : response.ok;
        next(req, res, resp);
    });
};


exports.getRanks = getRanks;