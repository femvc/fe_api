var Db = require('mongodb').Db,
    ObjectID = require('mongodb').ObjectID,
    Server = require('mongodb').Server;

var server = new Server(config.mongo.host, config.mongo.port, config.mongo.host_opts);
var mongo = new Db(config.mongo.dbname, server, config.mongo.opts);
var isReady = false;
mongo.open(function(err, p_client) {
  if (err) {
    console.log(err);
  }
  console.log('mongo ready');
  isReady = true;
});

mongo.onReady = function(callback) {
    var t = setInterval(function() {
        if (isReady) {
            clearInterval(t);
            callback();
        }
    }, 50);
};

module.exports = mongo;
module.exports.ObjectID = ObjectID;
