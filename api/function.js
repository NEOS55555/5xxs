const superagent = require('superagent')
var fs = require('fs');
const path = require('path')
// 读取该目录下所有文件
exports.readAllFiles = function (pathName) {
	return new Promise((resolve, reject) => {
		fs.readdir(pathName, function(err, files){
		  var dirs = [];
		  (function iterator(i){
		    if(i == files.length) {
		      resolve(dirs);
		      return ;
		    }
		    fs.stat(path.join(pathName, files[i]), function(err, data){     
		      if(data.isFile()){               
		          dirs.push(files[i]);
		      }
		      iterator(i+1);
		     });   
		  })(0);
			
		});
	})
}


// 同时执行最多 多少个函数，最多多少次
// 有个函数要执行max次，但是又堵塞问题，所以最多只有10个执行
exports.simuExec = (fn, max, each=10, isgetError) => {
	let startTime = new Date();
	return new Promise((resolve, reject) => {
		let count = 0;
		let ajaxCount = 0;
		let arr = [];
		let errorArr = [];

		for (let i =0; i < each; i++) {
			temp();
		}
		function temp () {
			count ++;
			if (count > max) {
				return;
			}

			fn(count).then((value) => {
				// console.log('s')
				arr.push(value)
				console.log(ajaxCount, 'r')
				if (++ajaxCount >= max) {
					console.log('共耗时' + (new Date() - startTime) + 'ms')
					if (isgetError) {
						resolve({
							over: arr,
							error: errorArr
						})
					} else {
						resolve(arr)
					}
				}
			  temp();
			}).catch(res => {
				errorArr.push(ajaxCount);
				console.log(ajaxCount, 'e')
				if (++ajaxCount >= max) {
					console.log('共耗时' + (new Date() - startTime) + 'ms')
					if (isgetError) {
						resolve({
							over: arr,
							error: errorArr
						})
					} else {
						resolve(arr)
					}
				}
			  temp();
			});
		}
	}) 
}
// 创建文件夹
const dirCache={};
function mkdir(filepath) {
    const arr=filepath.split('/');
    let dir='.';
    let f = false
    for(let i=0;i<arr.length;i++){
        dir += '/'+arr[i];
    		// console.log(dir,i,fs.existsSync(dir), dirCache[dir])
        if(!dirCache[dir]&&!fs.existsSync(dir)){
            dirCache[dir]=true;
            fs.mkdirSync(dir);
            // console.log(dir+'创建成功')
            f = true;
        }
    }
    return f;
}
exports.mkdir = mkdir;
// 将一个数组扁平化
function flatten(arr) {
    return arr.reduce(function(prev, next){
        return prev.concat(Array.isArray(next) ? flatten(next) : next)
    }, [])
}
exports.flatten = flatten;

// 保存文件到本地
exports.saveFile = function (url, dirname) {
	return new Promise((resolve, reject) => {
		superagent.head(url, (err, res, body) => {
			const ntm = url.slice(url.lastIndexOf('/')+1).split('[www.555x.org]')
			const name = decodeURI(ntm[ntm.length - 1])
			const fileUrl = `/static/${dirname}/${name}`;
	    try {
	        let startTime = new Date().getTime();
	        if (err) {
	        	console.log(err)
	        	return;
	        }
	        console.log(url)
	        !err && superagent(url).on('response', () => {
	            resolve(fileUrl)
	        }).pipe(fs.createWriteStream(__dirname+fileUrl));
	        // superagent.get(targetUrl).pipe(fs.createWriteStream(__dirname+'/compassedu/50850.html'));
	        
	    } catch (err) {
	    	console.log(err)
	    }
		});
	})
}