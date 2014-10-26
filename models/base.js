'use strict';
var flow = require('flow');
module.exports = {
	createNew: function (collection_name) {
		var model = {};
		model.collection_name = collection_name;

		model.getCollection = function (err, next) {
			mongo.collection(collection_name, function (err, collection) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				return next(err, collection);
			});
		};
		model.getById = function (_id, next) {
			var objId = (typeof _id == 'string') ? ObjectID(_id) : _id;
			flow.exec(function () {
				mongo.collection(collection_name, this);
			},
			function (err, collection) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				collection.findOne({ _id: objId }, this);
			},
			function (err, resp) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				return next(null, resp);
			});
		};
		model.getAll = function (sort, next) {
			flow.exec(function () {
				mongo.collection(collection_name, this);
			},
			function (err, collection) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				if (sort) {
					collection.find().sort(sort).toArray(this);
				}
				else {
					collection.find().toArray(this);
				}
			},
			function (err, resp) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				return next(null, resp);
			});
		};
		model.getItem = function (condition, next) {
			if (!condition) {
				return next('condition is null', null);
			}

			flow.exec(function () {
				mongo.collection(collection_name, this);
			},
			function (err, collection) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				collection.findOne(condition, this);
			},
			function (err, resp) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				return next(null, resp);
			});
		};
		// page: 1, 2, 3, ..., n
		model.getItems = function (condition, sortby, page, count, next) {
			flow.exec(function () {
				mongo.collection(collection_name, this);
			},
			function (err, collection) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				collection.find(condition).sort(sortby).limit(count).skip(count * (page - 1)).toArray(this);
			},
			function (err, resp) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				return next(null, resp);
			});
		};
		model.getCount = function (condition, next) {
			flow.exec(function () {
				mongo.collection(collection_name, this);
			},
			function (err, collection) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				collection.find(condition).count(this);
			},
			function (err, resp) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				return next(null, resp);
			});
		};
		model.insert = function (doc, next) {
			if (!doc) {
				return next('doc is null', null);
			}
			flow.exec(function () {
				mongo.collection(collection_name, this);
			},
			function (err, collection) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				collection.insert(doc, this);
			},
			function (err, resp) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				return next(null, resp);
			});
		};
		// replace one document with specific _id
		/*model.save = function(doc, next){
		if(!doc){
		return next('doc is null', null);
		}
		flow.exec(function(){
		mongo.collection(collection_name, this);
		},
		function(err, collection){
		if(err){
		console.log(err);
		return next(err, null);
		}
		collection.save(doc, this);
		},
		function(err, resp){
		if(err){
		console.log(err);
		return next(err, null);
		}
		return next(null, resp);
		});
		};*/
		//http://docs.mongodb.org/manual/reference/method/db.collection.update/#update-parameter
		model.update = function (query, update, opt, next) {
			flow.exec(function () {
				mongo.collection(collection_name, this);
			},
			function (err, collection) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				collection.update(query, update, opt, this);
			},
			function (err, resp) {
				if (err) {
					console.log(err);
					return next(err, null);
				}
				return next(null, resp);
			});
		};
		model.updateById = function (_id, update, next) {
			var objId = (typeof _id == 'string') ? ObjectID(_id) : _id;
			this.update({ _id: objId }, update, {upsert: false, multi: false}, next);
		};


		return model;
	}
};
