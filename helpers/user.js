'use strict';
var flow = require('flow');
var userModel = require('../models/user').createNew();
/*var updatesModel = require('../models/user_updates').createNew();
//var mediaModel = require('../models/media').createNew();

var updates = {
    getLatest: function(uid, next) {
        var update_item = null;
        flow.exec(function() {
            updatesModel.getItems({uid: uid}, {uid: -1}, 1, 1, this);
        }, function(err, resp) {
            if (err)
                return next(err, null);
            else if (!resp || !resp.length)
                return next(null, null);
            else {
                update_item = resp[0];
                if (update_item.media_id) {
                    mediaModel.getById(update_item.media_id, this);
                }
                else
                    this();
            }
        }, function(err, resp) {
            if (err)
                return next(err, null);
            if (resp) {
                update_item.media = resp;
                update_item.media.media_id = update_item.media._id;
                delete update_item.media._id;
            }
            update_item.update_id = update_item._id.toString();
            delete update_item._id;
            delete update_item.media_id;

            return next(null, update_item);
        });
    },
    post: function(uid, text, media_id, next) {
        var doc = {
            uid: uid,
            text: text,
            media_id: media_id,
            create_time: new Date().getTime()
        };
        flow.exec(function() {
            updatesModel.insert(doc, this);
        },function(err, resp) {
            if (err)
                return next(err, null);
            var update = resp[0];
            update.update_id = update._id;
            delete update._id;
            return next(null, update);
        });
    }
};
exports.updates = updates;*/

var output = function(user) {
    if (!user)
        return null;

    user.uid = user._id.toString();
    
    delete user._id;
    delete user.password;
    return user;
};
exports.output = output;

exports.getUser = function(uid, next) {
    userModel.getById(uid, function(err, user) {
        if (err)
            return next(err, null);
        if (!user)
            return next(null, null);

        user = output(user);
        updates.getLatest(user.uid, function(err, latest_update) {
            user.latest_update = (latest_update) ? latest_update : {};
            if (user.latest_update.uid)
                delete user.latest_update.uid;

            return next(null, user);
        });
    });
};

exports.getAccount = function(uid, next) {
    userModel.getById(uid, function(err, resp) {
        if (err)
            return next(err, null);
        var account = {
            uid: resp._id.toString(),
            username: resp.username,
            password: resp.password
        };
        return next(null, account);
    });
};

/*exports.getUserByUsername = function(username, next){
    userModel.getItem({
        username: username
    }, function(err, resp){
        if(err)
            return next(err, null);
        return next(null, output(resp));
    });
};*/
