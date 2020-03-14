const api = require('./function.js')
var fs = require('fs');

const superagent = require('superagent')
const cheerio = require('cheerio')


var db = require('../model/db.js')

// 
exports.getAllCatlogAllBook = getAllCatlogAllBook;
exports.getBooksTxt = getBooksTxt;

// 获取某个类型的某一页的信息
function getList (type, key, pageIndex, isGetMax) {
	return new Promise((resolve, reject) => {
		superagent.get(`https://www.555x.org/html/${type}/list_${key}_${pageIndex}.html`)
		// .timeout(1000)
		.end(function(err, res) {
			if (err) {
				// console.log('err', err)
				reject({type, key, pageIndex})
				return;
			}
	    // console.log(res.text)
	    const $ = cheerio.load(res.text);
	    if (isGetMax) {
				resolve($('.yemian .pageinfo strong').eq(0).text())
	    } else {

		    // console.log(html)
				var $ul = $('.xiashu ul');
				var needArr = [];
				$ul.each(function(i, t) {
					var $t = $(t)
					var a = $(t).find('.qq_g a')
					let s = a.attr('href');

					let name = a.text();	// '《天赋太高怎么办》TXT下载'
					
					needArr.push({
						// url: s,
						catalog: type,
						id: s.slice(s.lastIndexOf('/')+4, s.length - 5),
						name: name.slice(name.indexOf('《')+1, name.indexOf('》')),
						// desc: $t.find('.qq_j').text(),	// 简介
						author: $t.find('.qq_r').text(),	// 作者
						udpateTime: $t.find('.qq_m').text(),	// 更新时间
						size: $t.find('.qq_l').text(),		// 大小
						hot: $t.find('.qq_a').text(),			// 热度
						class: $t.find('.qq_z a').text(),	// 分类
					})
				})
				resolve(needArr)
	    }
		}) 	
	})
}
// 获取某个类型的所有页的信息
function getListAllBook (type, key, each=20) {
	return new Promise((resolve, reject) => {
		getList(type, key, 1, true).then(max => {
			api.simuExec(count => {
				console.log(count)
				return getList(type, key, count)
			}, max, each).then(res => {
				// 转换为1维数组
				// const tempArr = res.reduce((prev, arr) => arr.concat(prev), [])
				resolve(api.flatten(res))
			}).catch(res => {
				reject(api.flatten(res))
			})
		})
	})
}
// 获取所有类型的所有书籍信息-并插入到数据库
function getAllCatlogAllBook () {
	return new Promise ((resolve, reject) => {
		db.find('catalog', {}, function (err, list) {
			let max = list.length;
			let i = -1;
			;(function tempFn () {
				if (++i >= max) {
					return;
				}
				api.simuExec(count => {
					let t = list[i];
					return getListAllBook(t.name, t.key)
				}, 1, 1).then(res => {
					console.log('已经完成一项:'+i)
					// 因为simuExec 会将结果集加入进一个数组 所以
					let iTemp = 0;
					let fArr = api.flatten(res)
					fArr.forEach(t => {
						iTemp++;
						isExistBookById(t.id).then(f => {
							if (!f) {
								db.insertOne('book', t, function (err, res) {
									if (err) console.log(err)
									if (i == max && iTemp == fArr.length) {
										console.log('update over')
										resolve('over')
									}
								})
							}
						})
					})
					/*db.insertMany('book', api.flatten(res), function (err, res) {
						if (err) console.log(err)
					});*/
					tempFn();
				}).catch(res => {
					console.log(res);
				})
			})()
		})
	})
}

// 拿到书籍详情  大小封面 等信息
function getBookDetail (type, id) {
	return new Promise((resolve, reject) => {
		superagent.get(`https://www.555x.org/html/${type}/txt${id}.html`)
		// .timeout(1000)
		.end(function(err, res) {
			if (err) {
				// console.log('err', err)
				reject(err)
				return;
			}
	    // console.log(res.text)
	    const $ = cheerio.load(res.text);
	    // console.log(html)
			var $content = $('.xiazai');
			const $lis = $content.find('.xinxi .shuji ul li')
			resolve({
				id,
				// downloads: $lis.eq(6).text().split('：')[1],		// 也就是热度
				img: $content.find('.neit .cover').attr('src'),
				desc: $content.find('.zhangjie').text()
			})
		}) 	
	})
}
// 更新所有书籍的信息并保存封面
function updateAllBookDetail () {

	db.find('book', {
		// id: '16767'
	}, function (err, list) {
			// console.log(list)
		api.simuExec(count => {
			const t = list[count-1]
			console.log(count)
			return getBookDetail(t.catalog, t.id).then(res => {
				// 保存图片
				api.saveFile(res.img, 'cover').then(fileUrl => {
					db.updateOne('book', {id: t.id}, {
						$set: {
							desc: res.desc,
							img: fileUrl,
							// downloads: res.downloads
						}
					}, function (a, b) {
						// console.log(b)
					})
				})
				return res;
			})
		}, list.length, 20).then(res => {
			// 因为simuExec 会将结果集加入进一个数组 所以
			console.log('全部完成')
		})
		.catch(res => {
			console.log(res);
		})
	})
}

// downBookTxt('18030', '无上神兵').then(res => console.log('over'))

// 下载一本书
function downBookTxt (id, name) {
	const targetUrl = `http://down.555x.org/txt/${id}/[www.555x.org]${encodeURI(name)}.txt`;
	return api.saveFile(targetUrl, 'txt').then(fileUrl => {
		db.updateOne('book', {id: id}, {
			$set: {
				txt: fileUrl,
			}
		}, function (a, b) {
			// console.log(b)
		})
		return fileUrl
	})
}


// 更新所有书籍的文本文件
function updateAllBookTxt () {

	db.find('book', {
		txt: undefined
	}, function (err, list) {
			// console.log(list)
		api.simuExec(count => {
			const t = list[count-1]
			console.log(count)

			return downBookTxt(t.id, t.name)
		}, list.length, 1).then(res => {
			// 因为simuExec 会将结果集加入进一个数组 所以
			// console.log('完成一组')
		})
		.catch(res => {
			console.log(res);
		})
	})
}


// 429 20 共耗时69686ms
/*api.simuExec(count => {
	console.log(count)
	return getList('xuanhuan', count)
}, 4, 20).then(res => {
	res.reduce((prev, arr) => arr.concat(prev), [])
	.forEach(t => db.insertOne('xuanhuan', t, function (err, res) {
		if (err) console.log(err)
	}))
	
	
})*/

/*getList('xuanhuan', 1).then(res => {
	console.log(res)
})*/

// 一本书最大的页数
function getBookMaxPage (id) {
	// https://www.555x.org/read/50522.html
	console.log('getBookMaxPage')
	return new Promise((resolve, reject) => {
		superagent.get(`https://www.555x.org/read/${id}.html`)
		// .timeout(1000)
		.end(function(err, res) {
			if (err) {
				// console.log('err', err)
				reject(err)
				return;
			}
	    // console.log(res.text)
	    const $ = cheerio.load(res.text);
			const $content = $('.read_list');
			
			resolve($content.find('a').length)
			
		}) 	
	})
}


// 检查遗漏的章节，并重新下载

function checkMissedChapter (id) {
	return new Promise ((resolve, reject) => {
		;(function tempCb (id) {
			db.find('book', {
			   id
			}, function (err, res) {
				const pages = res[0].pages
				api.readAllFiles(`./static/txt/${id}`).then(res => {
					// console.log(res[0])
					let len = res.length
					if (len == parseInt(pages)) {
						console.log('none')
						resolve('over')
						return;
					}
					let tempArr = [];
					let arr = res.map(t => parseInt(t.split('_')[1].split('.')[0]))
					arr.sort((a, b) => a - b)
					for (let i = 0; i < len-1; i++) {
						for (let j = 1, jlen = arr[i+1] - arr[i]; j < jlen; j++) {

							tempArr.push(arr[i] + j)
						}
					}
					const lastOne = arr[len-1]
					for (let i = 0, slen = pages - lastOne; i < slen; i++) {
						tempArr.push(lastOne+i+1)
					}
					console.log(tempArr)

					let mt = 0;
					tempArr.forEach(t => {
						getBookChapter(id, t).then(res => {
							console.log('1')
							if (++mt == tempArr.length) {
								console.log('over')
								resolve('over')
							}
						}).catch(res => {
							if (++mt == tempArr.length) {
								tempCb(id)
							}
						})
					})
				})
			})
		})(id)
	})
}

function isExistBookById (bookId) {
	return new Promise((resolve, reject) => {
		db.find('book', {id: bookId}, (err, res) => {
			resolve(res.length)
		})
	})
}

// 查询该书籍是否存在
function isExistBook (author, bookId) {
	return new Promise((resolve, reject) => {
		db.find('author', {name: author}, (err, res) => {
			resolve(res[0].books.indexOf(bookId) != -1)
		})
	})
}

// 获取所有书籍txt
function getBooksTxt () {
	db.findSort('book', {
        "pages": 0
    }, {id: -1}, function (err, list) {
		api.simuExec(count => {
			const t = list[count-1]
			console.log(`${t.id}开始，当前是第${count}次`)
			return getBookAllChapter(t.id)
		}, list.length, 1).then(res => {
			// 因为simuExec 会将结果集加入进一个数组 所以
			console.log('所有完成')
		})
		.catch(res => {
			console.log(res);
		})
	})
}

// getBooksTxt();
// getBookAllChapter('50865')
// checkMissedChapter('50865')
// 更新书籍的所有章节
function getBookAllChapter (id) {
	return new Promise((resolve, reject) => {
		getBookMaxPage(id).then(pages => {

			
			api.simuExec(count => {
				// console.log(count)
				return getBookChapter(id, count)
			}, pages, 20, true).then(res => {
				// 拿完之后全部更新
				// 有多少页
				db.updateOne('book', {id}, {$set: { pages }}, (err, result) => {})
				console.log(res.error)
				console.log(id+'保存完成')
				resolve(id+'完成')
			})
		})
	})
}


// 得到书籍的1章节 -- 再5x里是5000字
function getBookChapter (id, pageIndex) {
	return new Promise((resolve, reject) => {
		superagent.get(`https://www.555x.org/read/${id}_${pageIndex}.html`)
		.timeout(15000)
		.end(function(err, res) {
			if (err) {
				console.log('err', err, 'getBookChapter')
				reject(err)
				return;
			}
	    // console.log(res.text)
	    const $ = cheerio.load(res.text);
			const $content = $('#view_content_txt');
			$content.find('.view_page').remove()
			let text = $content.text();
			if (text.indexOf('D-') == 3) {
				text = text.slice(0, 3) + text.slice(5)
			}
			// 
			// 一页一页更新
			api.mkdir(`static/txt/${id}`)
			const txtUrl = `/static/txt/${id}/${id+'_'+pageIndex}.txt`
			
			fs.writeFile(__dirname+txtUrl, text, err => {
	  		if (err) {
	  			return console.error(err)
	  		}
	  		
	  	})
			resolve({
				pageIndex: pageIndex,
				text: text
			})
			
		}) 	
	})
}



