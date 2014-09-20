/**
 * Created with JetBrains WebStorm.
 * To change this template use File | Settings | File Templates.
 * Desc: 该模块只实现如何访问数据库mongodb，并提供函数集合。如果mongodb实现了分库分表，则也在该模块实现相应的访问规则。
 * 注意：_id是每个数据项必备属性，但不关心它的格式是string、int还是ObjectID(string)、ObjectID(int)。
 */

'use strict';

var flow = require('flow');
var db = {
    /**
    * @name: getRecord
    * @desc : 条件搜索数据库，取出相匹配的记录。
    * @param: collName: 数据集的名字
    * @param: cond: 条件对象。若为空则返回全部记录
    * @return : 返回数组，每一个元素是一个record。
    */
    getRecord: function(collName, cond, next) {
        //cond = helper_util.switchObjValueToString(cond);
        flow.exec(
            function() {
                mongo.collection(collName, this);
            },
            function(err, coll) {
                if (err) {
                    return next('INTERNAL_DB_OPT_FAIL');
                }
                coll.find(cond).toArray(this);
            },
            function(err, resp) {
                if (err) {
                    return next('INTERNAL_DB_OPT_FAIL');
                }
                return next(null, resp);
            }

        );
    },

    /**
     *  name:       insertRecord
     *  desc:       接受record存入数据库中，无法覆盖存储_id相同的记录
     *  @param: collName: 数据集的名字
     *  @param: records: 要存入数据库记录，可以是数组。
     *  @return :    返回是否成功。
     */
    insertRecord: function(collName, record, next) {
        var records = [];
        if (record instanceof Array) {
            records = record;
        }
        else {
            records = [record];
        }
        flow.exec(
            function() {
                mongo.collection(collName, this);
            },
            function(err, coll) {
                if (err) {
                    return next('INTERNAL_DB_OPT_FAIL');
                }
                for (var i = 0, length = records.length; i < length; i++) {
                        coll.insert(records[i], {safe: true}, this.MULTI());
                }

            },
            function(resp) {
                var haveErr = false;
                for (var i = 0, length = resp.length; i < length; i++) {
                    if (resp[i][0]) {
                        haveErr = true;
                        break;
                    }
                }
                if (haveErr) {
                    return next('INTERNAL_DB_OPT_FAIL');
                }
                return next(null, true);
            }
        );
    },
    /**
     *  name:       saveRecord
     *  desc:       接受record存入数据库中，如果数据库中有_id相同的record，则覆盖存储。
     *  @param: collName: 数据集的名字
     *  @param: records: 要存入数据库记录，可以是数组。
     *  @return :    返回是否成功。
     */
    saveRecord: function(collName, record, next) {
        var records = [];
        if (record instanceof Array) {
            records = record;
        }
        else {
            records = [record];
        }
        flow.exec(
            function() {
                mongo.collection(collName, this);
            },
            function(err, coll) {
                for (var i = 0, length = records.length; i < length; i++) {
                    if (records[i]._id) {
                        coll.save(records[i], {safe: true}, this.MULTI());
                    }
                }

            },
            function(resp) {
                var haveErr = false;
                for (var i = 0, length = resp.length; i < length; i++) {
                    if (resp[i][0]) {
                        haveErr = true;
                        break;
                    }
                }
                if (haveErr) {
                    return next('INTERNAL_DB_OPT_FAIL');
                }
                return next(null, true);
            }
        );
    },
    /**
    * @name: updateRecord
    * @desc : 修改一个记录的属性的值
    * @param: collName: 数据集的名字
    * @param: _id: 记录的key。
    * @param: key: 要修改的属性名。支持多层的key
    * @param: value: 要修改的属性值。
    * @return : 返回是否成功。
    */
    updateRecord: function(collName, _id, key, value, next) {
        flow.exec(
            function() {
                mongo.collection(collName, this);
            },
            function(err, coll) {
                if (err) {
                    return next('INTERNAL_DB_OPT_FAIL');
                }
                var updateObj = {};
                updateObj['$set'] = {};
                updateObj['$set'][key] = value;
                coll.update({'_id': _id}, updateObj, this);
            },
            function(err, resp) {
                if (err) {
                    return next('INTERNAL_DB_OPT_FAIL', false);
                }
                return next(null, true);
            }
        );
    },
    /**
     * @name: deleteRecord
     * @desc : 删除符合cond条件的记录。
     * @param: collName: 数据集的名字
     * @param: cond: 匹配记录的条件。
     * @return : 返回是否成功。
     */
    deleteRecord: function(collName, cond, next) {
        flow.exec(
            function() {
                mongo.collection(collName, this);
            },
            function(err, coll) {
                if (err) {
                    return next('INTERNAL_DB_OPT_FAIL');
                }
                coll.remove(cond, function() {});
                return next(null, true);
            }
        );
    },
    /**
     * @name: getAllKeys
     * @desc : 获取一个数据集中的所有key名。
     * @param: collName: 数据集的名字
     * @return : 返回是否成功。
     */
    getAllKeys: function(collection, next) {
        if (!collection || collection == '') {
            return next(null, []);
        }
        flow.exec(
            function() {
                mongo.collection(collection, this);
            },
            function(err, coll) {
                if (err) {
                    return next([]);
                }
                var mr = coll.mapReduce(
                    function() {for (var key in this) { emit(key, null); }},
                    function(key, stuff) { return null; },
                    {out: {replace: 'tempCollection'}},
                    this
                );
            },
            function(err, collection) {
                if (err) {
                    return next([]);
                }
                collection.distinct('_id', this);
            },
            function(err, resp) {
                if (err) {
                    return next([]);
                }
                return next(null, resp);
            }
        );
    }
};


exports.getRecord = db.getRecord;
exports.insertRecord = db.insertRecord;
exports.saveRecord = db.saveRecord;
exports.updateRecord = db.updateRecord;
exports.deleteRecord = db.deleteRecord;
exports.getAllKeys = db.getAllKeys;
