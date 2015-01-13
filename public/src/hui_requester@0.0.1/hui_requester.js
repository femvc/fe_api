'use strict';
//   __  __   __  __    _____   ______   ______   __  __   _____     
//  /\ \/\ \ /\ \/\ \  /\___ \ /\__  _\ /\  _  \ /\ \/\ \ /\  __`\   
//  \ \ \_\ \\ \ \ \ \ \/__/\ \\/_/\ \/ \ \ \/\ \\ \ `\\ \\ \ \ \_\  
//   \ \  _  \\ \ \ \ \   _\ \ \  \ \ \  \ \  __ \\ \ . ` \\ \ \ =__ 
//    \ \ \ \ \\ \ \_\ \ /\ \_\ \  \_\ \__\ \ \/\ \\ \ \`\ \\ \ \_\ \
//     \ \_\ \_\\ \_____\\ \____/  /\_____\\ \_\ \_\\ \_\ \_\\ \____/
//      \/_/\/_/ \/_____/ \/___/   \/_____/ \/_/\/_/ \/_/\/_/ \/___/ 
//                                                                   
//                                                                   

/**
 * @name Requester请求管理类
 * @public
 * @author haiyang5210
 * @date 2014-11-16 19:01
 */
hui.define('hui_requester', [], function () {

    var Requester = {
        /**
         * @name 全局事件处理接口 注：不支持onsuccess
         * @public
         */
        handler: {},
        /** 
         * @name 预置XMLHttpRequestProxy对象
         * @private
         * @return {XMLHttpRequestProxy} XMLHttpRequestProxy对象
         * @description
         */
        createXHRProxyObject: function () {
            var me = this,
                xhr = {};
            xhr.xhr = window.XMLHttpRequest ? new window.XMLHttpRequest() : new window.ActiveXObject('Microsoft.XMLHTTP');
            xhr.eventHandlers = {};
            xhr.fire = me.creatFireHandler();
            // 标示是否是本地调试
            xhr.online = (/^https?:$/i.test(window.location.protocol));
            // 处理成功返回结果
            xhr.responseCallback = function (handler, data) {
                // 根据返回结果更新用户状态
                window.Requester.updateStatus(data);

                // 当后端验证失败时
                if (data && window.Requester.backendError) {
                    window.Requester.backendError(xhr, data);
                    //return 'finished';
                }

                data = data || [];
                // Todo: 如果返回用户状态表示此次请求非法，该如何处理？// Fixed: 此类情况应该服务器端判断之后再返回一个错误提示结果。
                handler && window.setTimeout(function () {
                    handler(data);
                }, 0);
            };

            return xhr;
        },
        /** 
         * @name 生成新的触发事件方法
         * @private
         * @param {String} type 事件类型
         */
        creatFireHandler: function () {
            return function (type) {
                type = 'on' + type;
                var xhr = this,
                    handler = xhr.eventHandlers[type],
                    globelHandler = window.Requester.handler[type],
                    data;
                /**
                 * 注：在这里使用了setTimeout来断开xhr的链式作用域，如果不使用setTimeout
                 * 会发现在连接池开启的情况下
                 * window.Requester.get('tpl.html', { onsuccess: function() { window.Requester.get('tpl.html', { onsuccess: function(){alert(1)} }); } });
                 * 永远不会执行alert(1);单步跟进会发现xhr的readyState到3就停住了。
                 */
                // 不对事件类型进行验证 
                if (handler) {
                    // 如果action已被销毁则直接忽略本次请求结果.由于默认开启连接池,因此无需销毁xhr的fire方法!
                    if (xhr.eventHandlers.action && !xhr.eventHandlers.action.active) {
                        return;
                    }

                    if (xhr.tick) {
                        clearTimeout(xhr.tick);
                    }

                    if (type != 'onsuccess') {
                        window.setTimeout(function () {
                            handler('failure', xhr);
                        }, 0);
                    }
                    else {
                        if (xhr.eventHandlers['datatype'] == 'XML') {
                            try {
                                xhr.xhr.responseXML;
                                xhr.responseCallback(handler, xhr.xhr.responseXML);
                            }
                            catch (error) {
                                window.setTimeout(function () {
                                    handler('error', xhr);
                                }, 0);
                                return;
                            }
                        }
                        else if (xhr.eventHandlers['datatype'] == 'TEXT') {
                            try {
                                xhr.xhr.responseText;
                                xhr.responseCallback(handler, xhr.xhr.responseText);
                            }
                            catch (error) {
                                window.setTimeout(function () {
                                    handler('error', xhr);
                                }, 0);
                                return;
                            }
                        }
                        else { //if (xhr.eventHandlers['datatype'] == 'JSON')
                            // 处理获取xhr.responseText导致出错的情况,比如请求图片地址. 
                            try {
                                xhr.xhr.responseText;
                            }
                            catch (error) {
                                window.setTimeout(function () {
                                    handler('error', xhr);
                                }, 0);
                                return;
                            }

                            var text = xhr.xhr.responseText.replace(/^\s+/ig, '');
                            if (text.indexOf('[') === 0) {
                                // {success:true,message: 
                                // 插入表单验证错误提示 
                                var JSON_Parser;
                                try {
                                    JSON_Parser = new Function('return ' + text + ';');
                                    data = JSON_Parser();
                                }
                                // 如果json解析出错则尝试移除多于逗号再试 
                                catch (e) {
                                    JSON_Parser = new Function('return ' + window.Requester.removeJSONExtComma(text) + ';');
                                    data = JSON_Parser();
                                }

                                xhr.responseCallback(handler, data);
                            }
                            else if (text.indexOf('{') === 0) {
                                // {success:true,message: 
                                // 插入表单验证错误提示 
                                var JSON_Parser;
                                try {
                                    JSON_Parser = new Function('return ' + text + ';');
                                    data = JSON_Parser();
                                }
                                // 如果json解析出错则尝试移除多于逗号再试 
                                catch (e) {
                                    JSON_Parser = new Function('return ' + window.Requester.removeJSONExtComma(text) + ';');
                                    data = JSON_Parser();
                                }
                                xhr.responseCallback(handler, data);
                            }
                            else {
                                window.setTimeout(function () {
                                    handler(null, text);
                                }, 0);
                            }
                        }

                    }
                }
                // 检查是否配置了全局事件
                else if (globelHandler) {
                    // onsuccess不支持全局事件 
                    if (type == 'onsuccess') {
                        return;
                    }
                    globelHandler(xhr);
                }
            };
        },
        /**
         * @name 检测是否有空闲的XHR或创建新对象
         * @private
         * @after window.Requester
         * @comment 使用Facade外观模式修改window.Requester.request方法
         * 以增加路径权限判断
         */
        getValidXHR: function () {
            var me = this;
            return me.createXHRProxyObject();
        },
        /**
         * @name request发送请求
         * @private
         * @url {String} 请求的URL
         * @options {Map} POST的参数，回调函数，MD5加密等
         */
        request: function (url, opt_options, xhr) {
            xhr = xhr || this.getValidXHR();
            // 权限检测
            var result = this.beforeRequest(url, opt_options);


            // Mockup 返回是JSON数据, 注：Mockup 默认都是成功的，因此无需xhr.fire('success');
            if (result && typeof result != 'string' && xhr) {
                xhr.responseCallback(opt_options['onsuccess'], result);
            }
            // 有可用连接且url是字符串
            else if (result && typeof result == 'string' && xhr) {
                url = result;
                var me = this,
                    options = opt_options || {},
                    data = options.data || '',
                    async = xhr.online && options.async !== false,
                    username = options.username || '',
                    password = options.password || '',
                    method = (options.method || 'GET').toUpperCase(),
                    headers = options.headers || {},

                    timeout = options.timeout || 0,
                    key,
                    str,
                    stateChangeHandler;



                xhr.eventHandlers['on404'] = me.on404;
                xhr.eventHandlers['onsuccess'] = me.onsuccess;
                xhr.eventHandlers['ontimeout'] = me.ontimeout;
                if (!options.onfailure) {
                    xhr.eventHandlers['onfailure'] = window.Requester.fn(me.onfailure, xhr);
                }
                // 将options参数中的事件参数复制到eventHandlers对象中 
                // 这里复制所有options的成员，eventHandlers有冗余 
                // 但是不会产生任何影响，并且代码紧凑
                for (key in options) {
                    if (options.hasOwnProperty(key)) {
                        xhr.eventHandlers[key] = options[key];
                    }
                }
                xhr.url = url;

                headers['X-Requested-With'] = 'XMLHttpRequest';
                headers['Content-Type'] = xhr.eventHandlers['contentType'] || xhr.eventHandlers['Content-Type'] || 'application/x-www-form-urlencoded';
                headers['Accept'] = xhr.eventHandlers['accept'] || xhr.eventHandlers['Accept'] || 'application/x-www-form-urlencoded';
                headers['dataType'] = xhr.eventHandlers['dataType'] = xhr.eventHandlers['datatype'] = (options.dataType || 'JSON').toLowerCase();

                try {
                    // 提交到服务器端的参数是Map则转换为string
                    if (Object.prototype.toString.call(data) === '[object Object]') {
                        str = [];
                        for (key in data) {
                            if (key && data.hasOwnProperty(key)) {
                                str.push(window.Requester.encode(key) + '=' + window.Requester.encode(data[key]));
                            }
                        }
                        data = str.join('&');
                    }
                    // 注：每次请求必须带上的公共参数,如token
                    data = window.Requester.addSysParam(data);

                    // 使用GET方式提交
                    if (method == 'GET') {
                        if (data) {
                            url += (url.indexOf('?') >= 0 ? (data.substr(0, 1) == '&' ? '' : '&') : '?') + data;
                            data = null;
                        }
                    }

                    try {
                        if (username) {
                            xhr.xhr.open(method, url, async, username, password);
                        }
                        else {
                            xhr.xhr.open(method, url, async);
                        }
                    }
                    catch (e) {
                        //debugger;
                        //alert(e.message ? e.message : String(e));
                    }


                    stateChangeHandler = window.Requester.fn(me.createStateChangeHandler, xhr);
                    if (async) {
                        xhr.xhr.onreadystatechange = stateChangeHandler;
                    }

                    // 在open之后再进行http请求头设定 
                    // FIXME 是否需要添加; charset=UTF-8呢 

                    for (key in headers) {
                        if (headers.hasOwnProperty(key)) {
                            xhr.xhr.setRequestHeader(key, headers[key]);
                        }
                    }

                    xhr.fire('beforerequest');

                    if (timeout) {
                        xhr.tick = setTimeout(function () {
                            xhr.xhr.onreadystatechange = window.Requester.blank;
                            xhr.xhr.abort();
                            delete xhr.xhr;
                            xhr.fire('timeout');
                        }, timeout);
                    }
                    xhr.xhr.send(data);

                    if (!async) {
                        stateChangeHandler.call(xhr);
                    }
                }
                catch (ex) {
                    xhr.fire('failure');
                }
            }

        },
        /** 
         * @name readyState发生变更时调用
         * @private
         * @ignore
         */
        createStateChangeHandler: function () {
            var xhr = this,
                stat; // window.console.log(xhr.readyState);
            if (xhr.xhr.readyState == 4) {
                try {
                    stat = xhr.xhr.status;
                }
                catch (ex) {
                    // 在请求时，如果网络中断，Firefox会无法取得status 
                    xhr.fire('failure');
                    return;
                }

                xhr.fire(stat);

                // http://www.never-online.net/blog/question.asp?id=261 
                // case 12002: // Server timeout 
                // case 12029: // dropped connections 
                // case 12030: // dropped connections 
                // case 12031: // dropped connections 
                // case 12152: // closed by server 
                // case 13030: // status and statusText are unavailable 

                // IE error sometimes returns 1223 when it
                // should be 204, so treat it as success 
                if ((stat >= 200 && stat < 300) || stat == 304 || stat == 1223) {
                    // 注：在Chrome下，Request.post(url, {onsuccess: function(){Request.post(url, {onsuccess: function(){alert()}})}}) 
                    // 如上，两次请求会共用同一个XHR对象从而造成status=0的错误，因此需要标识请求是否已成功返回
                    xhr.status = 'finished';
                    xhr.fire('success');
                }
                else {
                    if (stat === 0 && !xhr.online) {
                        xhr.fire('success');
                    }
                    else {
                        if (stat === 0 && window.console && window.console.error) {
                            window.console.error('XHR Error: Cross domain, cannot access: %s.', xhr.url);
                        }
                        xhr.fire('failure');
                    }
                }

                /* 
             * NOTE: Testing discovered that for some bizarre reason, on Mozilla, the 
             * JavaScript <code>XmlHttpRequest.onreadystatechange</code> handler 
             * function maybe still be called after it is deleted. The theory is that the 
             * callback is cached somewhere. Setting it to null or an empty function does 
             * seem to work properly, though. 
             *
             * On IE, there are two problems: Setting onreadystatechange to null (as 
             * opposed to an empty function) sometimes throws an exception. With 
             * particular (rare) versions of jscript.dll, setting onreadystatechange from 
             * within onreadystatechange causes a crash. Setting it from within a timeout 
             * fixes this bug (see issue 1610). 
             *
             * End result: *always* set onreadystatechange to an empty function (never to 
             * null). Never set onreadystatechange from within onreadystatechange (always 
             * in a setTimeout()). 
             *
            window.setTimeout(function() { 
                // 避免内存泄露. 
                // 由new Function改成不含此作用域链的 window.Requester.blank 函数, 
                // 以避免作用域链带来的隐性循环引用导致的IE下内存泄露. By rocy 2011-01-05 . 
                xhr.onreadystatechange = window.Requester.blank; 
                if (xhr.eventHandlers['async']) { 
                    xhr = null; 
                } 
            }, 0); */

                if (window.Requester.checkQue) {
                    window.setTimeout(window.Requester.checkQue, 0);
                }
            }
        },
        /**
         * 对特殊字符和换行符编码// .replace(/%/ig,"%-")
         */
        encode: function (str, decode) {
            str = String(str);
            // encodeURIComponent not encode '
            var fr = '%| |&|;|=|+|<|>|,|"|\'|#|/|\\|\n|\r|\t'.split('|'),
                to = '%25|%20|%26|%3B|%3D|%2B|%3C|%3E|%2C|%22|%27|%23|%2F|%5C|%0A|%0D|%09'.split('|');
            if (decode == 'decode') {
                for (var i = fr.length - 1; i > -1; i--) {
                    str = str.replace(new RegExp('\\' + to[i], 'ig'), fr[i]);
                }
            }
            else {
                for (var i = 0, l = fr.length; i < l; i++) {
                    str = str.replace(new RegExp('\\' + fr[i], 'ig'), to[i]);
                }
            }
            return str;
        },
        decode: function (str) {
            return this.encode(str, 'decode');
        },

        /**
         * @name 处理404错误
         */
        on404: function () {},
        onsuccess: function () {},
        ontimeout: function () {},
        onfailure: function () {
            var me = this;
            if (hui && hui.Pnotice && hui.Pnotice.show) {
                hui.Pnotice.show('Error: url "' + me.url + '" response ' + me.xhr.status, 3000);
            }
            me.fire('success');
        }
    };
    /**
     * 不含任何作用域的空函数
     */
    Requester.blank = function () {};

    /**
     * @name 增加每次请求必须带上的公共参数,如token
     * @public
     * @param {String} str 已有参数
     */
    Requester.addSysParam = function (str) {
        return str;
    };

    /** 
     * @name 为对象绑定方法和作用域
     * @private
     * @param {Function|String} handler 要绑定的函数，或者一个在作用域下可用的函数名
     * @param {Object} obj 执行运行时this，如果不传入则运行时this为函数本身
     * @param {args* 0..n} args 函数执行时附加到执行时函数前面的参数
     * @returns {Function} 封装后的函数
     */
    Requester.fn = function (func, scope) {
        if (Object.prototype.toString.call(func) === '[object String]') {
            func = scope[func];
        }
        if (Object.prototype.toString.call(func) !== '[object Function]') {
            throw 'Error "Requester.fn()": "func" is null';
        }
        var xargs = arguments.length > 2 ? [].slice.call(arguments, 2) : null;
        return function () {
            var fn = '[object String]' == Object.prototype.toString.call(func) ? scope[func] : func,
                args = (xargs) ? xargs.concat([].slice.call(arguments, 0)) : arguments;
            return fn.apply(scope || fn, args);
        };
    };
    Requester.formatDate = function (date, fmt) {
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
    };
    /**
     * @name 移除JSON字符串中多余的逗号如{'a':[',],}',],}
     * @public
     * @param {String} JSON字符串
     * @return {String} 处理后的JSON字符串
     */
    Requester.removeJSONExtComma = function (str) {
        var i,
            j,
            len,
            list,
            c,
            notValue = null,
            preQuot = null,
            lineNum;

        list = String(str).split('');
        for (i = 0, len = list.length; i < len; i++) {
            c = list[i];
            // 单引或双引
            if (/^[\'\"]$/.test(c)) { //'
                if (notValue === null && preQuot === null) {
                    notValue = false;
                    preQuot = i;
                    continue;
                }
                // 值
                if (!notValue) {
                    // 前面反斜杠个数
                    lineNum = 0;
                    for (j = i - 1; j > -1; j--) {
                        if (list[j] === '\\') {
                            lineNum++;
                        }
                        else {
                            j = -1;
                        }
                    }
                    // 个数为偶数且和开始引号相同
                    // 结束引号
                    if (lineNum % 2 === 0) {
                        if (list[preQuot] === c) {
                            notValue = true;
                            preQuot = -1;
                        }
                    }
                }
                // 非值
                else {
                    // 开始引号
                    if (preQuot == -1) {
                        preQuot = i;
                        notValue = false;
                    }
                    // 结束引号
                    else if (list[preQuot] === c) {
                        notValue = true;
                        preQuot = -1;
                    }
                }
            }
            // 逗号
            else if (c === ']' || c === '}') {
                // 非值
                if (notValue) {
                    for (j = i - 1; j > -1; j--) {
                        if (/^[\t\r\n\s ]+$/.test(list[j])) {
                            continue;
                        }
                        else {
                            if (list[j] === ',') list[j] = '';
                            break;
                        }
                    }
                }
            }
        }
        return list.join('').replace(/\n/g, '').replace(/\r/g, '');
    };

    /**
     * @name 发送Requester请求
     * @public
     * @function
     * @grammar Requester.get(url, params)
     * @param {String}     url         发送请求的url地址
     * @param {String}     data         发送的数据
     * @param {Function} [onsuccess] 请求成功之后的回调函数，function(XMLHttpRequest xhr, string responseText)
     * @meta standard
     * @see Requester.request
     * @returns {XMLHttpRequest}     发送请求的XMLHttpRequest对象
     */
    // 'onsuccess': onsuccess,'method': 'POST','data': data,'action': action,'async': async,'usemd5': true
    Requester.get = function (url, params) {
        params.method = 'GET';
        return Requester.request(url, params);
    };
    Requester.head = function (url, params) {
        params.method = 'HEAD';
        return Requester.request(url, params);
    };
    Requester.post = function (url, params) {
        params.method = 'POST';
        return Requester.request(url, params);
    };
    Requester.postMD5 = function (url, params) {
        params.method = 'POST';
        params.usemd5 = true;
        return Requester.request(url, params);
    };
    Requester.put = function (url, params) {
        params.method = 'PUT';
        return Requester.request(url, params);
    };
    Requester['delete'] = function (url, params) {
        params.method = 'DELETE';
        return Requester.request(url, params);
    };

    /*============================================
 * 客户端模拟请求返回结果
 ============================================*/
    /**
     * @name 增加Mockup拦截器
     * @private
     * @return {null|String} null或新url
     */
    Requester.beforeRequest = function (url, opt_options) {
        // 检查请求的资源是否有权限
        var permit,
            Permission = Requester.getExtClass('hui.Permission'),
            Mockup = Requester.getExtClass('hui.Mockup');

        permit = Permission.checkRequest(url, opt_options);
        if (permit && permit[0] == 'notpermit') {
            return null;
        }
        else {
            url = permit ? permit[1] : url;
        }

        var result = url;
        // 检查是否启用了mockup
        if (!Mockup.stop && Mockup.find(url)) {
            if (window.console && window.console.log) {
                window.console.log(url);
            }
            result = hui.Mockup.get(url, opt_options);
        }

        return result;
    };

    /**
     * @name 根据返回结果更新用户状态
     * @private
     */
    Requester.updateStatus = function (data) {
        // 更新用户状态, 注: 每次请求都会返回用户状态 // Todo: 如果有需要用户再次发出请求以确认用户状态的呢？// Fixed: 应该服务器端负责处理
        if (window.hui && hui.Permission && hui.Permission.updateStatus) {
            // hui.Permission.updateStatus(data); 
        }
    };

    /*============================================
 * 请求返回自动校验
 ============================================*/
    /**
     * @name 当后端验证失败时自动调用
     * @private
     * @data {Map} XHR返回的responseText
     * @return {void}
     */
    Requester.backendError = function (xhr, data) {
        var action;
        if (window.hui && hui.Action && hui.Action.get) {
            action = hui.Action.get();
            if (action) {
                action.showErrorByTree(data);
                return 'finished';
            }
        }
    };



    /**============================================
     * @name 发送JSONP请求
     * @public
     * @param {String} url 请求的地址
     * @param {String|Object} data 发送的参数
     * @param {String} onsuccess 回调函数
     * @param {String|Object} action 发送请求的Action
     **============================================*/

    /** 
     * JSONP回调接口MAP
     */
    Requester.jsonproxy = {};
    /**
     * @name 发送JSONP请求
     * @public
     */
    Requester.JSONP = function (url, params) {
        var Mockup = Requester.getExtClass('hui.Mockup'),
            params = params || {},
            onsuccess = params['onsuccess'] || Function('');
        // 检查是否启用了mockup
        if (!Mockup.stop && Mockup.find(url)) {
            if (window.console && window.console.log) {
                window.console.log(url);
            }
            return onsuccess(Mockup.get(url));
        }

        var me = this,
            // 获取可用JSONP对象, 不存在则自动生成
            proxy = me.getValidProxy(params['action']);

        proxy['action'] = params['action'];
        proxy['onsuccess'] = params['onsuccess'];
        proxy['status'] = 'send';

        var args = [];
        if (params['data']) {
            for (var i in params['data']) {
                if (params['data'].hasOwnProperty(i)) {
                    args.push(Requester.encode(i) + '=' + Requester.encode(params['data'][i]));
                }
            }
        }
        args.push('rand=' + Math.random());
        args.push('callback=window.Requester.jsonproxy_callback("' + proxy['id'] + '").callback');

        document.getElementById(proxy['id']).src = url + (~url.indexOf('?') ? '&' : '?') + args.join('&');
    };
    Requester.jsonproxy_callback = function (id) {
        return window.Requester.jsonproxy[id];
    };
    /**
     * @name 返回可用JSONP对象
     * @private
     * @return {Object}
     */
    Requester.getValidProxy = function () {
        var me = this;
        return me.createProxy();
    };
    /**
     * @name 工厂模式创建JSONP对象
     * @private
     * @param {id String} 唯一标识
     * @return {void}
     */
    Requester.createProxy = function (id) {
        // this->window.Requester
        var me = this,
            proxy = {};

        proxy.id = id || Requester.formatDate(new Date(), 'yyyyMMddHHmmss') + '' + String(Math.random()).substr(3, 4);
        proxy.status = 'finished';
        proxy.callback = me.creatProxyCallback();

        var script = document.createElement('script');
        script.id = proxy.id;
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        document.getElementsByTagName('head')[0].appendChild(script);
        script = null;

        window.Requester.jsonproxy[proxy.id] = proxy;

        return proxy;
    };
    /**
     * @name 工厂模式创建JSONP对象回调接口
     * @private
     * @return {void}
     */
    Requester.creatProxyCallback = function () {
        return function (data) {
            // this->JSONP Object
            var proxy = this;
            proxy.status = 'finished';

            // 当后端验证失败时, 调用系统验证接口
            if (proxy.action && data && window.Requester && window.Requester.backendError) {
                window.Requester.backendError(proxy, data);
                //return 'finished';
            }

            // 调用用户传入的回调接口
            if (proxy.onsuccess) {
                proxy.onsuccess(data);
            }
        };
    };

    /*============================================
 * Requester扩展模块 - JSONP请求池
 ============================================*/
    /**
     * @name 返回可用JSONP对象
     * @private
     * @return {String} id 唯一标识
     */
    Requester.getValidProxy = function () {
        var me = this,
            i,
            proxy = null,
            script;

        // 查找可用JSONP对象
        for (i in me.jsonproxy) {
            if (i && me.jsonproxy.hasOwnProperty(i) && me.jsonproxy[i] && me.jsonproxy[i].status == 'finished') {
                script = document.getElementById(i);
                if (script && window.addEventListener) {
                    script.parentNode.removeChild(script);
                    proxy = me.createProxy(i);
                }
                break;
            }
        }

        return (proxy || me.createProxy());
    };

    /**
* @name 测试代码
*
function doit() {
    // 注: test.json -> [null,[]]
    Requester.get('ajax/test.json', {
        data: '',
        onsuccess: function(data){
            alert(data)
        }
    });

    // 注: 跨域会导致请求出错
    Requester.get('http://www.5imemo.com/other/ajax/jsonp.php', {onsuccess: function(data){alert(data.success)}});

    // 注: JSONP跨域不会导致出错
    Requester.JSONP('http://www.5imemo.com/other/ajax/jsonp.php', {onsuccess: function(data){ alert(data.id)}});
}
*/

    Requester.getExtClass = function (clazz) {
        var result = function () {};
        switch (clazz) {
        case 'hui.Permission':
            if (typeof hui !== 'undefined' && hui.Permission) {
                result = hui.Permission;
            }
            else {
                result.checkRequest = new Function();
                result.set = new Function();
            }
            break;
        case 'hui.Mockup':
            if (typeof hui !== 'undefined' && hui.Mockup) {
                result = hui.Mockup;
            }
            else {
                result.find = new Function();
                result.get = new Function();
            }
            break;
        default:
        }
        return result;
    };

    /**
     * @name 前端构造测试数据
     */
    hui.Mockup = {
        find: function (url) {
            var target = hui.Mockup.maps[url];
            // Condition /user?uid=10001#123
            if (target === undefined) {
                url = url.split('#')[0].split('?')[0];
                for (var i in hui.Mockup.maps) {
                    if (i.split('#')[0].split('?')[0] === url) {
                        target = hui.Mockup.maps[i];
                    }
                }
            }
            return target;
        },
        get: function (url, opt_options) {
            var result = null,
                target = hui.Mockup.find(url);

            //mockup是函数
            if (Object.prototype.toString.call(target) === '[object Function]') {
                result = target(url, opt_options);
            }
            //mockup是数组
            else if (Object.prototype.toString.call(target) === '[object Array]') {
                if (Object.prototype.toString.call(target[0]) === '[object Array]') {
                    result = target[(new Date()).getTime() % target.length];
                }
                else {
                    result = target;
                }
            }
            //mockup是对象
            else if (Object.prototype.toString.call(target) === '[object Object]') {
                result = target;
            }
            //mockup不是字符串
            else if (typeof target != 'string') {
                result = target;
            }
            //mockup是字符串(url)的话直接返回
            else {
                result = target;
            }

            return result;
        },
        setRule: function (url, target) {
            hui.Mockup.maps[url] = target;
        },
        remove: function (url) {
            hui.Mockup.maps[url] = undefined;
        },
        clear: function () {
            hui.Mockup.maps = {};
        }
    };
    hui.Mockup.maps = {};

    hui.Mockup.setRule('/hui_helloworld', {
        status: 0,
        message: '',
        data: 'Hello world.'
    });

    // !!! global.hui = ...
    if (typeof window != 'undefined') {
        window.Requester = Requester;
    }

});