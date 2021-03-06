'use strict';
/**
 * Created with JetBrains WebStorm.
 * To change this template use File | Settings | File Templates.
 * Desc: 该模块包含了一系列的函数，每个函数实现一个特定的工具功能。
 */
var flow = require('flow');
var request = require('request');
var Util = {
    /**
     * @name packer
     * @desc 对一个数组分页读取
     * @params items 待处理的数组
     * @params page 第几页，从第0页开始
     * @params count 读取多少元素
     * @return 返回该页的所有元素。
     */
    packer: function (items, page, count, next) {
        page = Number(page);
        count = Number(count);
        if (count === 0) {
            var result = {
                num_items: items.length
            };
            return (next ? next(result) : result);
        }
        var result = {
            has_more: count * page < items.length ? true : false,
            num_items: items.length,
            items: []
        };
        var from = (page - 1) * count;
        from = from < 0 ? 0 : from;
        var to = from + count;
        for (var i = from; i < to && i < items.length; i++) {
            result['items'].push(items[i]);
        }

        return (next ? next(result) : result);
    },


    /**
     * @name switchObjValueToString
     * @desc 把一个js对象中的值都转换成字符串。
     * @params obj 待处理的js对象
     * @return 返回处理过的js对象。
     */
    switchObjValueToString: function (obj) {
        if (obj instanceof Object) {
            for (var key in obj) {
                obj[key] = Util.switchObjValueToString(obj[key]);
            }
            return obj;
        }
        else {
            return String(obj);
        }
    },
    getDatetime: function () {
        var dt = new Date();
        return (dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate() + ' ' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds()).replace(/([\-\: ])(\d{1})(?!\d)/g, '$10$2');
    },
    /**
     * @name sort
     * @desc 对一个数组排序，数组中没一个元素都是一个js对象。该函数目的是根据key来排序数组中的元素。
     * @params key 关键字段名
     * @return 返回排序后的数组。
     */
    sort: function (array, key, sortBy) {
        var sortBy = sortBy || 1;
        if (!key) {
            array.sort();
            return array;
        }

        function compara(a, b) {
            if (!a[key] || !b[key]) {
                return -1;
            }

            if (a[key] < b[key]) {
                return -1 * sortBy;
            }
            else if (a[key] == b[key]) {
                return 0 * sortBy;
            }
            else if (a[key] > b[key]) {
                return 1 * sortBy;
            }
        }
        array.sort(compara);
        return array;
    },
    sortBy: function (list, field, order) {
        if (list && list.sort && list.length) {
            order = String(order).toLowerCase();
            list.sort(function (a, b) {
                var m, n;
                m = String(a[field]).toLowerCase();
                n = String(b[field]).toLowerCase();

                if (String(parseInt('0' + m, 10)) == m && String(parseInt('0' + n, 10)) == n) {
                    m = parseInt(m, 10);
                    n = parseInt(n, 10);
                }
                else {
                    if (m > n) {
                        m = 1;
                        n = -m;
                    }
                    else if (m < n) {
                        m = -1;
                        n = -m;
                    }
                    else {
                        m = 1;
                        n = m;
                    }
                }
                return (order == 'desc' ? n - m : m - n);
            });
        }
        return list;
    },
    parseURLParams: function (paramsString) {
        var params = [];
        var paramObj = {};
        params = paramsString.split('&');
        for (var i = 0, length = params.length; i < length; i++) {
            var searchIndex = params[i].indexOf('=');
            if (searchIndex == -1) {
                continue;
            }
            var key = params[i].substr(0, searchIndex);
            var value = params[i].substr(searchIndex + 1);
            paramObj[key] = value;
        }
        return paramObj;
    },
    /**
     * @name unicodeOnlyChs
     * @desc 对一个str中的所有中文编码成unicode形式的字符串。
     * @return 返回处理后的字符串。
     */
    unicodeOnlyChs: function (str) {
        if (!str instanceof String) {
            return str;
        }
        return str.replace(/([^\u0000-\u00FF])/g, function ($0) {
            var tmp = escape($0);
            return tmp.replace(/(%u)(\w{4})/gi, '\\u$2');
        });
    },
    /**
     * @name httpPOST
     * @desc 发起POST请求。
     * @params obj 待处理的js对象
     * @return 返回处理过的js对象。
     */
    httpPOST: function (url, params, next) {
        flow.exec(
            function () {
                var params_str = '';
                for (var key in params) {
                    params_str += key + '=' + params[key] + '&';
                }
                var options = {
                    'headers': {
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    'url': url,
                    'body': params_str
                };

                request.post(options, this);
            },
            function (err, resp, body) {
                if (err) {
                    return next('INTERNAL_HTTP_NOT_AVAILABLE');
                }
                return next(null, JSON.parse(body));
            }
        );
    },
    regEscape: function (raw) {
        return raw.replace(/([\/()[\]?{}|*+-.$^])/g, '\\$1');
    },
    md5withSalt: function (rawPwd, salt) {
        //return rawPwd + '{'+ salt+'}';
        // todo: add salt, and md5 again!
        return rawPwd;
    },
    likeWith: function (cond) {
        return new RegExp('^.*' + Util.regEscape(cond) + '.*$');
    },
    formatDate: function (date, fmt) {
        if (!date) date = new Date();
        fmt = fmt || 'yyyy-MM-dd HH:mm';
        var o = {
            'M+': date.getMonth() + 1, //月份      
            'd+': date.getDate(), //日      
            'h+': date.getHours() % 12 === 0 ? 12 : date.getHours() % 12, //小时      
            'H+': date.getHours(), //小时      
            'm+': date.getMinutes(), //分      
            's+': date.getSeconds(), //秒      
            'q+': Math.floor((date.getMonth() + 3) / 3), //季度      
            'S': date.getMilliseconds() //毫秒      
        };
        var week = {
            '0': '/u65e5',
            '1': '/u4e00',
            '2': '/u4e8c',
            '3': '/u4e09',
            '4': '/u56db',
            '5': '/u4e94',
            '6': '/u516d'
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
        if (/(E+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? '/u661f/u671f' : '/u5468') : '') + week[date.getDay() + '']);
        }
        for (var k in o) {
            if (o.hasOwnProperty(k) && new RegExp('(' + k + ')').test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
            }
        }
        return fmt;
    },
    parseDate: function (str) {
        str = String(str).replace(/^[\s\xa0]+|[\s\xa0]+$/ig, '');
        var results = null;

        //秒数 #9744242680 
        results = str.match(/^ *(\d{10}) *$/);
        if (results && results.length > 0)
            return new Date(parseInt(str) * 1000);

        //毫秒数 #9744242682765 
        results = str.match(/^ *(\d{13}) *$/);
        if (results && results.length > 0)
            return new Date(parseInt(str));

        //20110608 
        results = str.match(/^ *(\d{4})(\d{2})(\d{2}) *$/);
        if (results && results.length > 3)
            return new Date(parseInt(results[1]), parseInt(results[2]) - 1, parseInt(results[3]));

        //20110608 1010 
        results = str.match(/^ *(\d{4})(\d{2})(\d{2}) +(\d{2})(\d{2}) *$/);
        if (results && results.length > 5)
            return new Date(parseInt(results[1]), parseInt(results[2]) - 1, parseInt(results[3]), parseInt(results[4]), parseInt(results[5]));

        //2011-06-08 
        results = str.match(/^ *(\d{4})[\._\-\/\\](\d{1,2})[\._\-\/\\](\d{1,2}) *$/);
        if (results && results.length > 3)
            return new Date(parseInt(results[1]), parseInt(results[2]) - 1, parseInt(results[3]));

        //2011-06-08 10:10 
        results = str.match(/^ *(\d{4})[\._\-\/\\](\d{1,2})[\._\-\/\\](\d{1,2}) +(\d{1,2}):(\d{1,2}) *$/);
        if (results && results.length > 5)
            return new Date(parseInt(results[1]), parseInt(results[2]) - 1, parseInt(results[3]), parseInt(results[4]), parseInt(results[5]));

        //2011/06\\08 10:10:10 
        results = str.match(/^ *(\d{4})[\._\-\/\\](\d{1,2})[\._\-\/\\](\d{1,2}) +(\d{1,2}):(\d{1,2}):(\d{1,2}) *$/);
        if (results && results.length > 6)
            return new Date(parseInt(results[1]), parseInt(results[2]) - 1, parseInt(results[3]), parseInt(results[4]), parseInt(results[5]), parseInt(results[6]));

        return (new Date(str));
    },
    randomOrder: function (countNum, min, max, seed) {
        //todo
        min = min === undefined ? 0 : Number(min);
        max = max === undefined ? 100000000000000 : Number(max) + 1;
        seed = seed === undefined ? new Date().getTime() + Math.random() * 100000000 : Number(seed);

        var list = [],
            key,
            result = [];

        if (Object.prototype.toString.call(countNum) !== '[object Array]') {
            count = Math.max(Number(countNum), max - min);
            for (var i = 0, len = count; i < len; i++) {
                list.push(min + i % (max - min));
            }
        }
        else {
            list = countNum;
        }
        list.sort(function (m, n) {
            return Math.random() > 0.5;
        });

        var count = list;
        list = [];

        for (var i = 0, len = count.length; i < len; i++) {
            key = Number(String(((i + seed) * 9301 + 49297) % 233280 / 233280.0).replace('0.', '').substring(6, 7));
            list.push({
                index: key,
                value: i
            });
        }

        var field = 'index',
            order = 'desc';
        list = list.sort(function (a, b) {
            var m, n;
            m = String(a[field]).toLowerCase();
            n = String(b[field]).toLowerCase();

            if (String(parseInt('0' + m, 10)) == m && String(parseInt('0' + n, 10)) == n) {
                m = parseInt(m, 10);
                n = parseInt(n, 10);
            }
            else {
                if (m > n) {
                    m = 1;
                    n = -m;
                }
                else if (m < n) {
                    m = -1;
                    n = -m;
                }
                else {
                    m = 1;
                    n = m;
                }
            }
            return (order == 'desc' ? n - m : m - n);
        });

        for (var i = 0, len = list.length; i < len; i++) {
            result.push(count[list[i].value]);
        }

        if (Object.prototype.toString.call(countNum) !== '[object Array]') {
            list = result.splice(0, countNum);
        }
        else {
            list = result;
        }

        return list;
    }
};

exports.packer = Util.packer;
exports.switchObjValueToString = Util.switchObjValueToString;
exports.getDatetime = Util.getDatetime;
exports.sort = Util.sort;
exports.sortBy = Util.sortBy;
exports.parseURLParams = Util.parseURLParams;
exports.unicodeOnlyChs = Util.unicodeOnlyChs;
exports.httpPOST = Util.httpPOST;
exports.regEscape = Util.regEscape;
exports.md5withSalt = Util.md5withSalt;
exports.likeWith = Util.likeWith;
exports.formatDate = Util.formatDate;
exports.parseDate = Util.parseDate;
exports.randomOrder = Util.randomOrder;