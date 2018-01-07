const cheerio = require('cheerio');
const request = require('request');

var cleanDownloadStr = function(str_ori){
	if(typeof str_ori == 'number'){ return str_ori; }
	else if(typeof str_ori != 'string'){ return false; }
	str_ori = str_ori.toLowerCase();
	var str_clean = str_ori.replace(/(([0-9]*[.])?[0-9]+mb|kb)|(次|下载|安装|:|：)|(\s)/g, "");
	var count = parseFloat(str_clean) | 0;
	
	var m = 1;
	if(str_clean.indexOf('亿') > -1){ m *= 100000000; }
	if(str_clean.indexOf('万') > -1){ m *= 10000; }
	if(str_clean.indexOf('千') > -1){ m *= 1000;	}
	if(str_clean.indexOf('白') > -1){ m *= 100; }

	return count*m;
}

var genDataObj = function(nameTarget, nameFound, strDL){
    if(!nameFound | typeof nameFound != 'string' | typeof nameTarget != 'string'){ return false; }
    nameFound = nameFound.replace(/(\s)/g, "");
    var nameFound_lc = nameFound.toLowerCase();
    var nameTarget_lc = nameTarget.toLowerCase();
    if(nameFound_lc.indexOf(nameTarget_lc) == -1){
        return false;
    }

    return {
        name: nameFound,
        downloads: cleanDownloadStr(strDL),
        exact: nameFound_lc == nameTarget_lc ? true : false,
    }
}


//yes dl count
exports.tencent = function(appName, parentRes){
    var result = [];
    request.post({
        url:'http://sj.qq.com/myapp/searchAjax.htm',
        qs:{
            kw: appName,
        }, 
        json:true
        }, 
    function (error, response, body) {
        console.log('<<<< tencent >>>>');
        console.log(response);
        if(typeof body == 'object' && body.obj){
            var items = body.obj.items;
            for(var i = 0; i < items.length; i++){
                var name = items[i].appDetail.appName;
                console.log(name);
                var downloads = items[i].appDetail.appDownCount;
                var data = genDataObj(appName, name, downloads);
                if(data){ result.push(data); }
            }
        }
        parentRes.send(result);
    });
}

//no dl count
exports.xiaomi = function(appName, parentRes){
    var result = [];
    request.get({
        url:'http://m.app.mi.com/searchapi?keywords='+appName+'&pageIndex=0&pageSize=10',
        headers: {
        'User-Agent': '',
        },
        json: true,
    }, function (error, response, body) {
        console.log('<<<< xiaomi >>>>');
        var items = body.data;
        for(var i = 0; i < items.length; i++){
            var name = items[i].displayName;
            var downloads = 0;
            var data = genDataObj(appName, name, downloads);
            if(data){ result.push(data); }
        }
        parentRes.send(result);
    });
}

//approx dl count
exports.hiapk = function(appName, parentRes){
    var result = [];
    request.get({
            url:'http://apk.hiapk.com/search?key='+appName+'&pid=0',
            followRedirect: false,
        }, 
        function (error, response, body) {
            var $ = cheerio.load(body);
            var items = $('.list_item');
            for(var i = 0; i < items.length; i++){
                var name = $(items[i]).find('.list_title').text();
                var downloads = $(items[i]).find('.s_dnum').text();
                var data = genDataObj(appName, name, downloads);
                if(data){ result.push(data); }
            }
            parentRes.send(result);
        }
    );
}

//approx dl count
exports.baidu = function(appName, parentRes){
    var result = [];
    request.get({
            url:'http://shouji.baidu.com/s?wd='+appName,
        }, 
        function (error, response, body) {
            var $ = cheerio.load(body);
            var items = $('li.app-outer');
            for(var i = 0; i < items.length; i++){
                var name = $(items[i]).find('.app-name').text();
                var downloads = $(items[i]).find('.download-num').text();
                var data = genDataObj(appName, name, downloads);
                if(data){ result.push(data); }
            }
            parentRes.send(result);
        }
    );
}

//no dl count
exports[91] = function(appName, parentRes){
    var result = [];
    request.get({
            url:'http://apk.91.com/soft/android/search/1_5_0_0_'+appName,
            followRedirect: false,
        }, 
        function (error, response, body) {
            console.log('<<< 91 >>>');
            console.log('status  code: '+response.statusCode);
            var $ = cheerio.load(body);
            var items = $('.search-list>li');
            for(var i = 0; i < items.length; i++){
                var name = $(items[i]).find('h4').text();
                var downloads = 0;
                var data = genDataObj(appName, name, downloads);
                if(data){ result.push(data); }
            }
            console.log(result);
            parentRes.send(result);
        }
    );
}

//approx dl count for large dl
exports[360] = function(appName, parentRes){
    var result = [];
    request.get({
            url:'http://zhushou.360.cn/search/index/?kw='+appName,
        }, 
        function (error, response, body) {
            var $ = cheerio.load(body);
            var items = $('.main ul>li');
            for(var i = 0; i < items.length; i++){
                var name = $(items[i]).find('h3').text();
                var downloads = $(items[i]).find('.downNum').text();
                var data = genDataObj(appName, name, downloads);
                if(data){ result.push(data); }
            }
            
            parentRes.send(result);
        }
    );
}

//exact dl count
exports.huawei = function(appName, parentRes){
    var result = [];
    request.get({
            url:'http://appstore.huawei.com/search/'+appName,
        }, 
        function (error, response, body) {
            console.log('<<< huawei >>>');
            var $ = cheerio.load(body);
            var items = $('.list-game-app');
            for(var i = 0; i < items.length; i++){
                var name = $(items[i]).find('.title').text();
                var downloads = $(items[i]).find('.app-btn>span').text();
                var data = genDataObj(appName, name, downloads);
                if(data){ result.push(data); }
            }
            console.log(result);
            parentRes.send(result);
        }
    );
}

//exact dl count
exports.wandoujia = function(appName, parentRes){
    var result = [];
    var options = {
        method: 'post',
        headers: {
            //Origin: 'http://ios.wandoujia.com',
            //Referer: 'http://ios.wandoujia.com/appstore/search/'+appName,
            //'X-Requested-With': 'XMLHttpRequest',
            //'Content-Length': 84,
            'Tunnel-Command': '0xFE306325',
        },
        body: {
            clFlag: 0,
            dcType: 1,
            keyword: appName,
            page: 0,
            pageLimit: 10,
            platform: 2,
            rw: 1
        },
        json: true,
        url: 'https://jsondata.25pp.com/jsondata.html',
    }
    request(options, function (err, response, body) {
        for(var i in body.content){
            var name = body.content[i].title;
            var downloads = body.content[i].down_ac;
            var data = genDataObj(appName, name, downloads);
            if(data){ result.push(data); }
        }
        console.log(result);
        parentRes.send(result);
    });
}

//approx for large, exact for small downloads
exports.pp = function(appName, parentRes){
    var result = [];
    request.get({
            url:'https://wap.pp.cn/s/?key='+appName,
        }, 
        function (error, response, body) {
            console.log('<<< pp >>>');
            var $ = cheerio.load(body);
            var items = $('.app-info');
            for(var i = 0; i < items.length; i++){
                var name = $(items[i]).find('.app-info-name').text();
                var downloads = $(items[i]).find('.app-info-size').text();
                var data = genDataObj(appName, name, downloads);
                if(data){ result.push(data); }
            }
            console.log(result);
            parentRes.send(result);
        }
    );
}

exports.oppo = function(appName, parentRes){
    var result = [];
    request.get({
            url:'http://store.oppomobile.com/search/do.html?keyword='+appName,
        }, 
        function (error, response, body) {
            console.log('<<< oppo >>>');
            var $ = cheerio.load(body);
            var items = $('.list_item');
            for(var i = 0; i < items.length; i++){
                var name = $(items[i]).find('.li_middle_top > a').text();
                var downloads = $(items[i]).find('.li_middle_top > span').text();
                var data = genDataObj(appName, name, downloads);
                if(data){ result.push(data); }
            }
            console.log(result);
            parentRes.send(result);
        }
    );
}


exports.lenovo = function(appName, parentRes){
    var result = [];
    request.get({
            url:'http://www.lenovomm.com/search/index.html?q='+appName,
        }, 
        function (error, response, body) {
            console.log('<<< lenovo >>>');
            var $ = cheerio.load(body);
            if($('.searchNull').length){
                return result;
            }

            var items = $('.appList>li');
            for(var i = 0; i < items.length; i++){
                var name = $(items[i]).find('.appName').text();
                var downloads = $(items[i]).find('.appInfo>p').eq(0).text();
                var data = genDataObj(appName, name, downloads);
                if(data){ result.push(data); }
            }
            console.log(result);
            parentRes.send(result);
        }
    );
}

//exact dls
exports.meizu = function(appName, parentRes){
    var result = [];
    request.get({
            url:'http://app.meizu.com/apps/public/search/page?cat_id=1&keyword='+appName+'&start=0&max=18',
            json: true,
        }, 
        function (error, response, body) {
            console.log('<<< meizu >>>');
            var items = body.value.list;
            for(var i = 0; i < items.length; i++){
                var name = items[i].name;
                var downloads = items[i].download_count;
                var data = genDataObj(appName, name, downloads);
                if(data){ result.push(data); }
            }
            console.log(result);
            parentRes.send(result);
        }
    );
}

exports.anzhi = function(appName, parentRes){
    var result = [];
    request.get({
            url:'http://www.anzhi.com/search.php?keyword='+appName,
        }, 
        function (error, response, body) {
            console.log('<<< anzhi >>>');
            var $ = cheerio.load(body);

            var items = $('.app_list>ul>li');
            for(var i = 0; i < items.length; i++){
                var name = $(items[i]).find('.app_name').eq(0).text();
                var downloads = $(items[i]).find('.app_downnum').eq(0).text();
                var data = genDataObj(appName, name, downloads);
                if(data){ result.push(data); }
            }
            console.log(result);
            parentRes.send(result);
        }
    );
}