'use strict';
module.exports = {
    createNew: function () {
        var collName = 'paper';
        var dataModel = require('./base').createNew(collName);

        dataModel.remove = function (_id, next) {
            var objId = (typeof _id == 'string') ? ObjectID(_id) : _id;

            flow.exec(function () {
                    mongo.collection(collName, this);
                },
                function (err, collection) {
                    if (err) {
                        console.log(err);
                        return next(err, null);
                    }
                    collection.remove({
                        _id: objId
                    }, this);
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