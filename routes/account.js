'use strict';
var userLogic = require('../helpers/user');
var userModel = require('../models/user').createNew();
var request = require('request');

exports.login = function (req, res, next) {
    if (!req.paramlist.username) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'username');
    }
    if (!req.paramlist.password) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'password');
    }
    userModel.getItem({
        username: req.paramlist.username,
        password: req.paramlist.password
    }, function (err, resp) {
        if (err || !resp || !resp._id)
            return response.err(req, res, 'USER_LOGIN_FAIL');

        var user = userLogic.output(resp);
        req.sessionStore.user = req.sessionStore.user || {};
        req.sessionStore.user[req.sessionID] = user.uid;

        return response.ok(req, res, user);
    });
};

exports.logout = function (req, res, next) {
    req.session.destroy();
    return response.ok(req, res, 'ok');
};

exports.register = function (req, res, next) {
    if (!req.paramlist.username) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'username');
    }
    if (!req.paramlist.password) {
        return response.err(req, res, 'MISSING_PARAMETERS', 'password');
    }

    userModel.getItem({
        username: req.paramlist.username
    }, function (err, resp) {
        if (err) {
            return response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        }
        if (resp) {
            return response.err(req, res, 'USER_ALREADY_EXIST');
        }

        userModel.insert({
            username: req.paramlist.username,
            password: req.paramlist.password
        }, function (err, resp) {
            if (err)
                return response.err(req, res, 'INTERNAL_DB_OPT_FAIL');

            var user = userLogic.output(resp[0]);
            return response.ok(req, res, user);
        });
    });
};

exports.auth = function (req, res, next) {
    console.log('============' + req.sessionID + '===============');
    req.sessionStore.user = req.sessionStore.user || {};
    req.sessionStore.question = req.sessionStore.question || {};
    req.sessionStore.questionIndex = req.sessionStore.questionIndex || {};
    req.sessionStore.paper = req.sessionStore.paper || {};
    req.sessionStore.paperContent = req.sessionStore.paperContent || {};

    if (req.sessionStore.user[req.sessionID]) {
        next();
    }
    else {
        //response.err(req, res, 'USER_TOKEN_EXPIRE');
        req.sessionStore.user[req.sessionID] = req.sessionID;
        next();
    }
};

exports.getUid = function (req, res, next) {
    req.sessionStore.user = req.sessionStore.user || {};
    var uid = req.sessionStore.user[req.sessionID];
    response.ok(req, res, uid);
};

exports.getDetail = function (req, res, next) {
    req.sessionStore.user = req.sessionStore.user || {};
    var uid = req.sessionStore.user[req.sessionID];
    userLogic.getAccount(uid, function (err, account) {
        if (err)
            return response.err(req, res, 'INTERNAL_DB_OPT_FAIL');
        account.password = undefined;
        delete account.password;
        return response.ok(req, res, account);
    });
};

exports.foo = function (req, res, next) {
    userLogic.getUser('52dcd3a08d91708d08febbc2', function (err, resp) {
        console.dir(resp);
    });
    userLogic.getAccount('52dcd3a08d91708d08febbc2', function (err, resp) {
        console.dir(resp);
    });
    return response.ok(req, res, 'ok');
};

exports.sendSMS = function (req, res, next) {
    if (req.paramlist.mobile !== '18918126428') {
        //return response.err(req, res, 'INTERNAL_INVALIDE_PARAMETER', 'mobile');
        req.paramlist.mobile = '13248001636';
    }
    req.paramlist.randcode = req.paramlist.randcode || '2095';

    var mobile = req.paramlist.mobile;
    var sms = '推立方手机验证码服务:您本次的验证码为'+req.paramlist.randcode+'，有效期为1分钟';
    var url ='http://www.tui3.com/api/send/?k=81e7349f76fe06b83f42051aa6738883&r=json&p=3&t=' + mobile + '&c=' + sms;
    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
        }
    })
};