var express = require('express');
var http = require('http');
const https = require('https')
const api = require('./api/function.js')
var fs = require('fs');

const superagent = require('superagent')
const iconv = require('iconv-lite')
const cheerio = require('cheerio')

var app = express();

app.use(express.static('./public'))
/*var targetUrl = 'https://www.555x.org/html/xuanhuan/';
// http://www.xbiquge.la/fenlei/1_1.html

app.get('/web', function(req, res) {
	var date1 = new Date().getTime();
	https.get(targetUrl, function(sres) {
	    var chunks = [];

	    sres.on('data', function(chunk) {
	      chunks.push(chunk);
	    });

	    sres.on('end', function() {
	      	// 将二进制数据解码成 gb2312 编码数据
	      var html = iconv.decode(Buffer.concat(chunks), 'utf-8');
	      // console.log(html)
	    	var $ = cheerio.load(html);
				var $ul = $('.xiashu ul');
				var needArr = [];
				$ul.each(function(i, t) {
					var $t = $(t)
					var a = $(t).find('.qq_g a')
					needArr.push({
						url: targetUrl+a.attr('href'),
						name: a.text(),
						desc: $t.find('.qq_j').text(),	// 简介
						author: $t.find('.qq_r').text(),	// 作者
						udpateTime: $t.find('.qq_m').text(),	// 更新时间
						size: $t.find('.qq_l').text(),		// 大小
						hot: $t.find('.qq_a').text(),			// 热度
						cotlog: $t.find('.qq_z a').text(),	// 分类
					})
				})
				res.writeHead(200,{"Content-type":"text/html;charset=utf-8"});
			
	      // res.end(JSON.stringify(needArr));
	      res.end(JSON.stringify((needArr)));
	      	// res.end($('.bd3l .co_content2').eq(1).find('ul').html());
	    });
	 });

})

app.get('/file', (res, res) => {
	fs.readFile("./test/1.txt", function (error, data) {
      if(error){//如果error不为null
          res.setHeader("Content-Type", "text/plain;charset=utf-8");//Content-Type设置为文本格式
          res.end("文件读取失败");
      }else{
          if(req.url === "/index") {//判断url
              res.setHeader("Content-Type", "text/html;charset=utf-8");//Content-Type设置为html格式
              res.end(data);//response.end(msg)的第一个参数可以是二进制字节流
              //res.end(data.toString());//这样写也行
          }
          else{
              res.end();
          }
      }
  })
})*/



// **************
const catlog = {
	'xuanhuan': 1,
	'xiuzhen': 2,
	'dushi': 3,
	'chuanyue': 4,
	'wangyou': 5,
	'kehuan': 6
}

function getList (type, pageIndex, isGetMax) {
	return new Promise((resolve, reject) => {
		let tempArr = [];
		superagent.get('http://www.xbiquge.la/fenlei/'+catlog[type]+`_${pageIndex}.html`)
		.timeout(1000)
		.end(function(err, res) {
			console.log('in....')
			if (err) {
				console.log('err', err.error)
				reject(err)
				return;
			}
			// var html = iconv.decode(res.text, 'utf-8');
	    // console.log(res.text)
	    const $ = cheerio.load(res.text);
			const $content = $('#newscontent');
			/*if (isGetMax) {
				return resolve($content.find('.page_b .last').text())
			}*/
			
			if (isGetMax) {
				resolve($content.find('.page_b .last').text())
			} else {
				const $list = $content.find('ul')

				$list.eq(0).find('li').each((i, t) => {
					const $a1 = $(t).find('.s2 a');
					tempArr.push({
						url: $a1.attr('href'),
						text: $a1.text(),
						max: $content.find('.page_b .last').text()
					})
				})
				resolve(tempArr)
			}
			
		}) 	
	})
}


function g() {
	getList('xiuzhen', 1, true).then(res => {
		// console.log(res)
		/*if (max <= 0) {
			max = res[0].max
		}*/
		let max = res;
		let pageIndex = 1;
		let arr = [];
		
		;(function temp () {
			if (pageIndex <= max) {
				let count = 0, oneEach = 1;
				for (let i = 0; i < oneEach; i++) {

					getList('xiuzhen', pageIndex++).then(res => {
						// console.log(res)
						arr = arr.concat(res)
						if (max <= 0) {
							max = res[0].max
						}
						// 这里是回调 所以pageIndex肯定不对
						console.log(`当前第${pageIndex}页，${arr.length}条数据`)
						if (++count == oneEach) {
							temp();
						}
					}).catch(() => {
						console.log('oooo')
						if (++count == oneEach) {
							temp();
						}
					})
				}
			} else {
				console.log(JSON.stringify(arr.length))
				return 
			}
		})();
		// let max = 1
		/*let count = 0;
		for (let i = 1; i <= max; i++) {
			getList('xiuzhen', i).then(res => {
				arr = arr.concat(res)
				console.log(`当前第${i}页，${arr.length}条数据`)
				if (++count == max) {
					console.log(JSON.stringify(arr.slice(0, 10)))
				}
			}).catch(() => {
				if (++count == max) {
					console.log(JSON.stringify(arr.slice(0, 10)))
				}
			})
		}*/
		// console.log(res[0].max)
		// console.log(`当前第${pageIndex}页，${arr.length}条数据`)


		
	})
}

function getList2 (pageIndex) {
	return new Promise((resolve, reject) => {
		superagent.get(`https://www.555x.org/read/50863_${pageIndex}.html`)
		// .timeout(1000)
		.end(function(err, res) {
			console.log('in....')
			if (err) {
				console.log('err', err)
				reject(err)
				return;
			}
			// var html = iconv.decode(res.text, 'utf-8');
	    // console.log(res.text)
	    const $ = cheerio.load(res.text);
			const $content = $('#view_content_txt');
			$content.find('.view_page').remove()
			
			resolve({
				pageIndex: pageIndex,
				text: $content.text()
			})
			
		}) 	
	})
}

function g2() {
	
	let arr = [];
	let tar = ['1', '2', '3', '4', '5', '6', '7']
	// tar = tar.slice(0, 3)
	let max = 2;
	let count = 0;
	// tar.forEach(t => {
	for (let i = 1; i <= max; i++) {

		getList2(i).then(res => {
			// console.log(res)
			arr = arr.concat(res.split('<div class="view_page">')[0])
			end();
		}).catch(() => {
			console.log('oooo')
			end();
		})
	}

	function end () {
		if (++count == max) {
			arr.sort((a, b) => a.pageIndex - b.pageIndex);
			console.log(arr.length)
			fs.writeFile(__dirname+'/compassedu/50850.txt', arr.reduce((r, tal) => tal+r.text, ''), err => {
	  		if (err) {
	  			return console.error(errs)
	  		}
	  		console.log("数据写入成功！");
	  	})
		}
	}
	// })
}

g2();

app.get('/xiuzhen', function(req, r) {

	// let pageIndex = 1;
	// let max = -1;	// 最大页码
	// let arr = [];
	/*;(function () {
		if ((max > 0 && pageIndex <= max) || max == -1) {
			getList('xiuzhen', pageIndex).then(res => {
				// console.log(res)
				arr = arr.concat(res)
				if (max <= 0) {
					max = res[0].max
				}
				console.log(`当前第${pageIndex}页，${arr.length}条数据`)
			})
			pageIndex ++;
			arguments.callee();
		} else {
			console.log(arr.length)
			console.log('出入')
			return 
		}
	})();*/

	
})

app.listen(8000)
console.log('listen...')