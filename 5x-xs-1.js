const express = require('express');
const app = express();
const fs = require('fs');

const superagent = require('superagent')
const bodyParse = require('body-parser');

const db = require('./model/db.js')
const api = require('./api/5x.js')

app.use(bodyParse.json());
app.use(bodyParse.urlencoded({extended: false}));
// 拿到封面图
app.use('/static/cover', express.static('./static/cover'));

// 获取未更新的列表
app.post('/getNotUpdateList', (req, res) => {
	// var name = req.body.id;
	const param = req.body
	db.find('book', {
    "pages": 0
  }, {
  	pageIndex: param.pageIndex,
  	pageNum: param.pageNum
  }, function (err, list) {
  	if (err) {
  		res.json({
  			code: 100
  		})
  		return;
  	}
  	if (param.isTotal == '1') {
  		db.find('book', {
		    "pages": 0
		  }, function (err, rls) {
				if (err) {
		  		res.json({
		  			code: 100
		  		})
		  		return;
		  	}
				res.json({
					code: 200,
					result: {
						list,
						total: rls.length
					}
				})
			})
  	} else {
  		res.json({
				code: 200,
				result: {
					list
				}
			})
  	}
		
	})
})


app.get('/bookDetail/:id', (req, res, next) => {
	const id = req.params.id;
	db.find('book', {id}, (err, result) => {
		if (err) {
			res.json({
				code: 100
			})
		}else {
			res.json({
				code: 200,
				result: result[0]
			})
		}
	})
})

// 
app.get('/book/:id/:pageIndex', (req, res, next) => {
	if (!req.params.pageIndex) {
		next();
		return;
	}
	console.log('1')
	res.end(req.params.pageIndex)
})
app.get('/book/:id', (req, res, next) => {
	console.log('2')
	res.end(req.params.id)
})

// 更新所有书籍
app.get('/updatebook', (req, res) => {
	api.getAllCatlogAllBook().then(result => {
		res.end('ok')
	});
})

app.listen(8223)
console.log('listen...')