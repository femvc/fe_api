'use strict';
module.exports = {
    createNew: function () {
        var collName = 'cloudlabel';
        var dataModel = require('./base').createNew(collName);

        dataModel.remove = function (filter, next) {
            flow.exec(function () {
                    mongo.collection(collName, this);
                },
                function (err, collection) {
                    if (err) {
                        console.log(err);
                        return next(err, null);
                    }
                    collection.remove(filter, this);
                },
                function (err, resp) {
                    if (err) {
                        console.log(err);
                        return next(err, null);
                    }
                    return next(null, resp);
                });
        };

        return dataModel;
    }
};