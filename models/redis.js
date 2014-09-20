/**
 * Created with JetBrains WebStorm.
 * To change this template use File | Settings | File Templates.
 * Desc: 该模块初始化了redis，并选择并导出redis客户端句柄。
 */

'use strict';
var redis_server = require('redis');

module.exports = {
    createNew: function(dbNum) {
        var redis = redis_server.createClient(config.redis.port, config.redis.host);
        redis.on('error', function(err) {
            console.log('Error :' + err);
        });
        redis.select(dbNum, function(err) {
            if (err) {
                console.log('Error: ' + err);
            }
            else {
                console.log('redis connection ok, db=' + dbNum);
            }
        });
        return redis;
    }
};


