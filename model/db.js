var MongoClient = require('mongodb').MongoClient;

function _connect(callback) {
	MongoClient.connect('mongodb://127.0.0.1:27017/', {
		useUnifiedTopology: true     //这个即是报的警告
	}, function(err, db) {
		var dbo = db.db('xiaoshuo');
		callback(err, db, dbo);
	})

}

exports.findSort = function (collectionName, condition, sortArgs, callback) {
	_connect(function(err, db, dbo) {
		if (err) {
			throw err;
		}
		dbo.collection(collectionName).find(condition).sort(sortArgs).toArray(function(err, result) {
			callback && callback(err, result);
			db.close()
		});
	})

}

exports.insertOne = function(collectionName, data, callback) {
	_connect(function(err, db, dbo) {
		if (err) {
			throw err;
		}
		dbo.collection(collectionName).insertOne(data, function(err, result) {
			callback && callback(err, result);
			db.close();
		})
	})
}
exports.insertMany = function(collectionName, data, callback) {
	_connect(function(err, db, dbo) {
		if (err) {
			throw err;
		}
		dbo.collection(collectionName).insertMany(data, function(err, result) {
			callback && callback(err, result);
			db.close();
		})
	})
}

exports.deleteMany = function(collectionName, condition, callback) {
	_connect(function(err, db, dbo) {
		dbo.collection(collectionName).deleteMany(condition, function(err, result) {
			if (err) throw err;
			callback && callback(err, result)
			db.close();
		})
	});
}

// 修改
exports.updateMany = function(collectionName, josn1, josn2, callback) {
	_connect(function(err, db, dbo) {
		if (err) {
			throw err;
		}
		dbo.collection(collectionName).updateMany(josn1, josn2, function(err, result) {
			callback && callback(err, result);
			db.close()
		})
	})
}
// 修改
exports.updateOne = function(collectionName, josn1, josn2, callback) {
	_connect(function(err, db, dbo) {
		if (err) {
			throw err;
		}
		dbo.collection(collectionName).updateOne(josn1, josn2, function(err, result) {
			callback && callback(err, result);
			db.close()
		})
	})
}
// 查询 分页
exports.find = function(collectionName, condition, args, callback) {
	var result = [];
	// console.log(args, callback)
	_connect(function(err, db, dbo) {
		if (err) {
			throw err;
		}
		if (!callback) {
			callback = args
			args = {};
		}
		var pageNum = parseInt(args.pageNum) || 0;
		var pageIndex = parseInt(args.pageIndex || 1);
		var skipnumber = pageNum * (pageIndex - 1);
		var limitnumber = pageNum

		dbo.collection(collectionName).find(condition).skip(skipnumber).limit(limitnumber).toArray(function(err, result) {
			callback && callback(err, result);
			db.close()
		});
		// each 已被放弃
		/*var cursor = dbo.collection(collectionName).find(condition).skip(skipnumber).limit(limitnumber);
		cursor.each(function(err, doc) {
			if (err) {
				callback(err);
				return;
			}
			if (doc != null) {
				result.push(doc);
			} else {
				callback(err, result);
			}
		})*/
	});
}

/*exports.find = function(collectionName, condition, callback) {
	_connect(function(err, db, dbo) {
		if (err) {
			throw err;
		}
		dbo.collection(collectionName).find(condition).toArray(function(err, result) {
			callback(err, result);
			db.close()
		})
	});
}*/

exports.getAllCount = function(collectionName, callback) {
	_connect(function(err, db, dbo) {
		if (err) {
			throw err;
		}
		dbo.collection(collectionName).find().count(function(err, result) {
			callback(err, result);
			db.close()
		})
	});
}
