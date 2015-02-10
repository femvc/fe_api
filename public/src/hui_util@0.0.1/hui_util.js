hui.define('hui_util', [], function () {

    hui.util = {};
    hui.util.g = function (id, parentNode) {
        if (window.jQuery) {
            return !parentNode ?
                window.jQuery('#' + id).get(0) :
                window.jQuery('#' + id, (Object.prototype.toString.call(parentNode) === '[object String]' ?
                    window.jQuery('#' + parentNode) : window.jQuery(parentNode))).get(0);
        }
        else {
            if (!parentNode) {
                return document.getElementById(id);
            }
            else if (hui.bocument && (parentNode == hui.bocument || parentNode == hui.bocument.body)) {
                return hui.bocument.getElementById(id);
            }
            else {
                var i,
                    len,
                    childNode,
                    elements,
                    list,
                    childlist,
                    node;
                elements = [], list = [parentNode];

                while (list.length) {
                    childNode = list.pop();
                    if (!childNode) continue;
                    if (childNode.id == id) {
                        break;
                    }
                    elements.push(childNode);
                    childlist = childNode.childNodes;
                    if (!childlist || childlist.length < 1) continue;
                    for (i = 0, len = childlist.length; i < len; i++) {
                        node = childlist[i];
                        list.push(node);
                    }
                }
                return (childNode.id == id ? childNode : null);
            }
        }
    };

    hui.util.c = function (searchClass, node) {
        if (window.jQuery) {
            return !node ? window.jQuery('.' + searchClass) : window.jQuery('.' + searchClass, window.jQuery(node));
        }
        else {
            if (document.getElementsByClassName) {
                return (node || document).getElementsByClassName(searchClass);
            }
            else {
                searchClass = searchClass !== null ? String(searchClass).replace(/\s+/g, ' ') : '';
                node = node || document;

                var classes = searchClass.split(' '),
                    elements = node.all,
                    patterns = [],
                    returnElements = [],
                    current,
                    match;

                var i = classes.length;
                while (--i >= 0) {
                    patterns.push(new RegExp('(^|\\s)' + classes[i] + '(\\s|$)'));
                }
                var j = elements.length;
                while (--j >= 0) {
                    current = elements[j];
                    match = false;
                    for (var k = 0, kl = patterns.length; k < kl; k++) {
                        match = patterns[k].test(current.className);
                        if (!match) {
                            break;
                        }
                    }
                    if (match) {
                        returnElements.push(current);
                    } 
                }
                return returnElements;
            }
        }
    };
    hui.util.cc = function (searchClass, node) {
        return hui.util.c(searchClass, node)[0];
    };

    hui.util.t = function (tag, node) {
        node = node || document;
        if (window.jQuery) {
            return !node ? window.jQuery(tag) : window.jQuery(tag, window.jQuery(node));
        }
        else {
            return node.getElementsByTagName(tag);
        }
    };

    /**
     * @name 将innerHTML生成的元素append到elem后面
     * @public
     * @param {HTMLElement} elem 父元素
     * @param {String} html 子元素HTML字符串
     */
    hui.util.appendHTML = function (elem, html) {
        if (window.jQuery) {
            return window.jQuery(elem).append(html);
        }
        else {
            var node = document.createElement('DIV');
            node.innerHTML = html;
            elem.appendChild(node);
            var list = [];
            for (var i = 0, len = node.childNodes.length; i < len; i++) {
                list[i] = node.childNodes[i];
            }
            for (var i = 0, len = list.length; i < len; i++) {
                //for (var i=list.length--; i>-1; i--) {
                elem.appendChild(list[i]);
            }
            elem.removeChild(node);

            return elem;
        }
    };
    /**
     * @name 将innerHTML生成的元素append到elem后面
     * @public
     * @param {HTMLElement} elem 父元素
     * @param {String} html 子元素HTML字符串
     */
    hui.util.getDom = function (str) {
        var list = [],
            wrap = document.createElement('DIV');
        wrap.innerHTML = str;
        for (var i = 0, len = wrap.childNodes.length; i < len; i++) {
            if (wrap.childNodes[i].nodeType == 1) {
                list.push(wrap.childNodes[i]);
            }
        }
        return list;
    };

    /**
     * @name 在当前元素直系祖父节点中查找有className的元素
     * @public
     * @param {Element} parentElement DOM元素
     * @param {String} className
     */
    hui.util.findParentByClassName = function (parentElement, className) {
        var control = null;
        while (parentElement && parentElement.tagName) {
            //label标签自带control属性!!
            if (parentElement && hui.Control.hasClass(parentElement, className)) {
                control = parentElement;
                break;
            }
            // 未找到直接父控件则将control从hui.window.controlMap移动到action.controlMap中
            else if (~',html,body,'.indexOf(',' + String(parentElement.tagName).toLowerCase() + ',')) {
                break;
            }
            parentElement = parentElement.parentNode;
        }
        return control;
    };
    /**
     * @name 在当前元素前后兄弟节点中查找有className的元素
     * @public
     * @param {Element} parentElement DOM元素
     * @param {String} className
     */
    hui.util.findSiblingByClassName = function (cur, className, pre) {
        var control = null,
            element = cur;
        if (!pre || pre == 'next' || pre == 'nxt' || pre == 'last') {
            while (element) {
                if (hui.Control.hasClass(element, className)) {
                    control = element;
                    if (pre !== 'last' && element !== cur) break;
                }
                element = element.nextSibling;
            }
        }
        if (!pre || pre == 'pre' || pre == 'first') {
            while (element) {
                if (hui.Control.hasClass(element, className)) {
                    control = element;
                    if (pre !== 'first' && element !== cur) break;
                }
                element = element.previousSibling;
            }
        }
        return control;
    };

    hui.util.hasClass = function (element, className) {
        if (window.jQuery) {
            return window.jQuery(element).hasClass(className);
        }
        else {
            return~ (' ' + element.className + ' ').indexOf(' ' + className + ' ');
        }
    };
    hui.util.addClass = function (element, className) {
        if (window.jQuery) {
            return window.jQuery(element).addClass(className);
        }
        else {
            if (~'[object Array][object NodeList]'.indexOf(Object.prototype.toString.call(element))) {
                for (var i = 0, len = element.length; i < len; i++) {
                    hui.util.addClass(element[i], className);
                }
            }
            else if (element) {
                hui.util.removeClass(element, className);
                element.className = (element.className + ' ' + className).replace(/(\s)+/ig, ' ');
            }
            return element;
        }
    };
    // Support * and ?, like hui.util.removeClass(elem, 'daneden-*');
    hui.util.removeClass = function (element, className) {
        if (window.jQuery && String(className).indexOf('*') === -1 && String(className).indexOf('?') === -1) {
            return window.jQuery(element).removeClass(className);
        }
        else {
            if (~'[object Array][object NodeList]'.indexOf(Object.prototype.toString.call(element))) {
                for (var i = 0, len = element.length; i < len; i++) {
                    hui.util.removeClass(element[i], className);
                }
            }
            else if (element) {
                var list = className.replace(/\s+/ig, ' ').split(' '),
                    /* Attention: str need two spaces!! */
                    str = (' ' + (element.className || '').replace(/(\s)/ig, '  ') + ' '),
                    name,
                    rex;
                // 用list[i]移除str
                for (var i = 0, len = list.length; i < len; i++) {
                    name = list[i];
                    name = name.replace(/(\*)/g, '\\S*').replace(/(\?)/g, '\\S?');
                    rex = new RegExp(' ' + name + ' ', 'ig');
                    str = str.replace(rex, ' ');
                }
                str = str.replace(/(\s)+/ig, ' ');
                str = str.replace(/^(\s)+/ig, '').replace(/(\s)+$/ig, '');
                element.className = str;
            }
            return element;
        }
    };

    hui.util.getDocumentHead = function (doc) {
        doc = doc || document;
        return doc.head || doc.getElementsByTagName('head')[0] || doc.documentElement;
    };
    hui.util.hasCssString = function hasCssString(id, doc) {
        var sheets,
            c,
            result = false;
        doc = doc || document;
        if (doc.createStyleSheet && (sheets = doc.styleSheets)) {
            for (var i = 0, len = sheets.length; i < len; i++) {
                c = sheets[i];
                if (c && c.owningElement && c.owningElement.id === id) {
                    result = c.owningElement;
                    break;
                }
                else if (c && c.ownerNode && c.ownerNode.id === id) {
                    result = c.ownerNode;
                    break;
                }
            }
        }
        else if ((sheets = doc.getElementsByTagName('style'))) {
            for (var i = 0, len = sheets.length; i < len; i++) {
                c = sheets[i];
                if (c.id === id) {
                    result = c;
                    break;
                }
            }
        }

        return result;
    };
    hui.util.removeCssString = function removeCssString(id, doc) {
        var parent,
            result = hui.util.hasCssString(id, doc);
        if (result) {
            parent = result.parentNode;
            parent.removeChild(result);
        }
    };

    hui.util.importCssString = function importCssString(cssText, id, doc) {
        hui.util.removeCssString(id, doc);
        doc = doc || document;

        var style = document.createElement('style');
        if (id) {
            style.id = id;
        }
        var head = doc.head || doc.body || doc.documentElement;
        head.insertBefore(style, head.lastChild);
        if (head !== doc.documentElement && style.nextSibling) {
            head.insertBefore(style.nextSibling, style);
        }
        style.setAttribute('type', 'text/css');
        // all browsers, except IE before version 9
        if (style.styleSheet) {
            style.styleSheet.cssText = cssText;
        }
        // Internet Explorer before version 9
        else {
            style.appendChild(document.createTextNode(cssText));
        }

        return style;
    };

    hui.util.insertCssRule = function (className, cssText) {
        var list = document.getElementsByTagName('style'),
            style = list && list.length ? list[list.length - 1] : hui.util.importCssString(''),
            sheet = style.sheet ? style.sheet : style.styleSheet,
            rules = sheet.cssRules || sheet.rules,
            index = rules.length,
            pre = className.indexOf('{'),
            nxt;
        if (pre !== -1) {
            nxt = className.indexOf('}', pre + 1);
            cssText = className.substring(pre + 1, nxt === -1 ? className.length : nxt);
            className = className.substring(0, pre);
        }
        cssText = String(cssText).replace(/(^\s+|\s+$)/g, '');
        if (cssText.indexOf('{') === 0) {
            cssText = cssText.substring(1, cssText.length);
        }
        if (cssText.indexOf('}') === cssText.length - 1) {
            cssText = cssText.substring(0, cssText.length - 2);
        }

        // all browsers, except IE before version 9
        if (sheet.insertRule) {
            sheet.insertRule(className + '{' + cssText + '}', index);
        }
        else {
            // Internet Explorer before version 9
            if (sheet.addRule) {
                sheet.addRule(className, cssText, index);
            }
        }
    };
    hui.util.addCssRule = hui.util.insertCssRule;


    hui.util.importCssStylsheet = function importCssStylsheet(uri, doc) {
        doc = doc || document;
        if (doc.createStyleSheet) {
            doc.createStyleSheet(uri);
        }
        else {
            var link = hui.util.createElement('link');
            link.rel = 'stylesheet';
            link.href = uri;

            hui.util.getDocumentHead(doc).appendChild(link);
        }
    };

    /** 
     * @name 对目标字符串进行格式化
     * @public
     * @param {String} source 目标字符串
     * @param {Object|String...} opts 提供相应数据的对象或多个字符串
     * @return {String} 格式化后的字符串
     */
    hui.util.format = function (source, opts) {
        function handler(match, key) {
            var type = String(key).indexOf('!!') === 0 ? 'decode' : String(key).indexOf('!') === 0 ? '' : 'encode',
                parts = key.replace(/^!!?/, '').split('.'),
                part = parts.shift(),
                cur = data,
                variable;
            while (part) {
                if (cur[part] !== undefined) {
                    cur = cur[part];
                }
                else {
                    cur = undefined;
                    break;
                }
                part = parts.shift();
            }
            
            variable = cur;
            if ('[object Function]' === toString.call(variable)) {
                variable = variable(key);
            }
            if (undefined !== variable) {
                variable = String(variable);
                // encodeURIComponent not encode '
                var fr = '&|<|>| |\'|"|\\'.split('|'),
                    to = '&amp;|&lt;|&gt;|&nbsp;|&apos;|&quot;|&#92;'.split('|');
                if (type === 'decode') {
                    for (var i = fr.length - 1; i > -1; i--) {
                        variable = variable.replace(new RegExp('\\' + to[i], 'ig'), fr[i]);
                    }
                }
                else if (type === 'encode') {
                    for (var i = 0, l = fr.length; i < l; i++) {
                        variable = variable.replace(new RegExp('\\' + fr[i], 'ig'), to[i]);
                    }
                }
            }

            return (undefined === variable ? '' : variable);
        }
        
        source = String(source);
        var data = Array.prototype.slice.call(arguments, 1),
            toString = Object.prototype.toString;
        if (data.length) {
            data = (data.length == 1 ?
                /* ie 下 Object.prototype.toString.call(null) == '[object Object]' */
                (opts !== null && (/\[object (Array|Object)\]/.test(toString.call(opts))) ? opts : data) : data);
            
            return source.replace(/#\{(.+?)\}/g, handler).replace(/\{\{(.+?)\}\}/g, handler);
        }
        return source;
    };

    /** 
     * @name 对数组进行排序
     * @public
     * @param {Array} list 目标数组
     * @param {String} field 目标排序字段
     * @param {String} order 升序（默认）或降序
     * @return {array} 排序后的数组
     */
    hui.util.sortBy = function (list, field, order) {
        if (list && list.sort && list.length) {
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
    };

    /** 
     * @name 事件绑定与解绑
     */
    hui.util.on = function (elem, eventName, handler) {
        if (window.jQuery && window.jQuery.prototype.on) {
            return window.jQuery(elem).on(eventName, handler);
        }
        else {
            if (elem.addEventListener) {
                elem.addEventListener(eventName, handler, false);
            }
            else if (elem.attachEvent) {
                elem.attachEvent('on' + eventName, handler);
                // elem.attachEvent('on' + eventName, function(){handler.call(elem)}); 
                //此处使用回调函数call()，让 this指向elem //注释掉原因：无法解绑
            }
        }
    };
    hui.util.off = function (elem, eventName, handler) {
        if (window.jQuery && window.jQuery.prototype.off) {
            return window.jQuery(elem).off(eventName, handler);
        }
        else {
            if (elem.removeEventListener) {
                elem.removeEventListener(eventName, handler, false);
            }
            if (elem.detachEvent) {
                elem.detachEvent('on' + eventName, handler);
            }
        }
    };

    /** 
     * @name 给elem绑定onenter事件
     * @public
     * @param {HTMLElement} elem 目标元素
     * @param {Function} fn 事件处理函数
     */
    hui.util.onenter = function (elem, fn) {
        hui.util.on(elem, 'keyup', function (e) {
            e = e || hui.window.event;
            var keyCode = e.keyCode || e.which;
            if (keyCode == 13) {
                elem.onenter && elem.onenter();
                fn(elem);
            }
        });
    };

    /** 
     * @name 给elem绑定onesc事件
     * @public
     * @param {HTMLElement} elem 目标元素
     * @param {Function} fn 事件处理函数
     */
    hui.util.onesc = function (elem, fn) {
        hui.util.on(elem, 'keyup', function (e) {
            e = e || hui.window.event;
            var keyCode = e.keyCode || e.which;
            if (keyCode == 27) {
                elem.onesc && elem.onesc();
                fn(elem);
            }
        });
    };


    hui.util.getCookie = function (name) {
        var start = document.cookie.indexOf(name + '=');
        var len = start + name.length + 1;
        if ((!start) && (name != document.cookie.substring(0, name.length))) {
            return undefined;
        }
        if (start == -1) return undefined;
        var end = document.cookie.indexOf(';', len);
        if (end == -1) end = document.cookie.length;
        return unescape(document.cookie.substring(len, end));
    };
    hui.util.setCookie = function (name, value, expires, path, domain, secure) {
        expires = expires || 24 * 60 * 60 * 1000;
        var expires_date = new Date((new Date()).getTime() + (expires));
        document.cookie = name + '=' + escape(value) + ((expires) ? ';expires=' + expires_date.toGMTString() : '') + /*expires.toGMTString()*/
            ((path) ? ';path=' + path : '') + ((domain) ? ';domain=' + domain : '') + ((secure) ? ';secure' : '');
    };
    hui.util.removeCookie = function (name, path, domain) {
        if (hui.util.getCookie(name)) document.cookie = name + '=' + ((path) ? ';path=' + path : '') + ((domain) ? ';domain=' + domain : '') + ';expires=Thu, 01-Jan-1970 00:00:01 GMT';
    };

    hui.util.formatDate = function (date, fmt) {
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
    /*  
  将String类型解析为Date类型.  
  parseDate('2006-1-1') return new Date(2006,0,1)  
  parseDate(' 2006-1-1 ') return new Date(2006,0,1)  
  parseDate('2006-1-1 15:14:16') return new Date(2006,0,1,15,14,16)  
  parseDate(' 2006-1-1 15:14:16 ') return new Date(2006,0,1,15,14,16);  
  parseDate('不正确的格式') retrun null  
*/
    hui.util.parseDate = function (str) {
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
    };

    /**
     * 对特殊字符和换行符编码// .replace(/%/ig,"%-")
     */
    hui.util.encode = function (str, decode) {
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
    };
    hui.util.decode = function (str) {
        return this.encode(str, 'decode');
    };
    hui.util.encodehtml = function (str, decode) {
        str = String(str);
        // encodeURIComponent not encode '
        var fr = '&|<|>| |\'|"|\\'.split('|'),
            to = '&amp;|&lt;|&gt;|&nbsp;|&apos;|&quot;|&#92;'.split('|');
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
    };
    hui.util.decodehtml = function (str) {
        return this.encodehtml(str, 'decode');
    };

    //setInnerHTML: function (elem, html){}
    hui.util.setInnerHTML = function (elem, html) {
        elem = elem && elem.getMain ? elem.getMain() : elem;
        if (elem && elem.innerHTML !== undefined) {
            elem.innerHTML = html;
        }
        return elem;
    };
    hui.util.setInnerText = function (elem, text) {
        if (!elem) return;
        if (elem.textContent !== undefined) {
            elem.textContent = text;
        }
        else {
            elem.innerText = text;
        }
    };

    // link from Undercore.js 
    // Internal recursive comparison function for `isEqual`.
    hui.util.isEqual = function (a, b, aStack, bStack) {
        // Identical objects are equal. `0 === -0`, but they aren't identical.
        // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
        if (a === b) {
            return a !== 0 || 1 / a == 1 / b;
        }
        // A strict comparison is necessary because `null == undefined`.
        if (a == null || b == null) {
            return a === b;
        }
        if (aStack == undefined || bStack == undefined) {
            aStack = [];
            bStack = [];
        }
        // Compare `[[Class]]` names.
        var className = Object.prototype.toString.call(a);
        if (className != Object.prototype.toString.call(b)) {
            return false;
        }
        switch (className) {
            // Strings, numbers, dates, and booleans are compared by value.
        case '[object String]':
            // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
            // equivalent to `new String("5")`.
            return a == String(b);
        case '[object Number]':
            // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
            // other numeric values.
            return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
        case '[object Date]':
        case '[object Boolean]':
            // Coerce dates and booleans to numeric primitive values. Dates are compared by their
            // millisecond representations. Note that invalid dates with millisecond representations
            // of `NaN` are not equivalent.
            return +a == +b;
            // RegExps are compared by their source patterns and flags.
        case '[object RegExp]':
            return a.source == b.source &&
                a.global == b.global &&
                a.multiline == b.multiline &&
                a.ignoreCase == b.ignoreCase;
        }
        if (typeof a != 'object' || typeof b != 'object') return false;
        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
        var length = aStack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (aStack[length] == a) return bStack[length] == b;
        }
        // Add the first object to the stack of traversed objects.
        aStack.push(a);
        bStack.push(b);

        var size = 0,
            result = true;
        // Recursively compare objects and arrays.
        if (className == '[object Array]') {
            // Compare array lengths to determine if a deep comparison is necessary.
            size = a.length;
            result = size == b.length;
            if (result) {
                // Deep compare the contents, ignoring non-numeric properties.
                while (size--) {
                    if (!(result = hui.util.isEqual(a[size], b[size], aStack, bStack))) break;
                }
            }
        }
        else {
            // Objects with different constructors are not equivalent, but `Object`s
            // from different frames are.
            var aCtor = a.constructor,
                bCtor = b.constructor;
            if (aCtor !== bCtor && !(Object.prototype.toString.call(aCtor) == '[object Function]' && (aCtor instanceof aCtor) &&
                Object.prototype.toString.call(bCtor) == '[object Function]' && (bCtor instanceof bCtor))) {
                return false;
            }
            // Deep compare objects.
            for (var key in a) {
                if (Object.prototype.hasOwnProperty.call(a, key)) {
                    // Count the expected number of properties.
                    size++;
                    // Deep compare each member.
                    if (!(result = Object.prototype.hasOwnProperty.call(b, key) && hui.util.isEqual(a[key], b[key], aStack, bStack))) break;
                }
            }
            // Ensure that both objects contain the same number of properties.
            if (result) {
                for (key in b) {
                    if (Object.prototype.hasOwnProperty.call(b, key) && !(size--)) break;
                }
                result = !size;
            }
        }
        // Remove the first object from the stack of traversed objects.
        aStack.pop();
        bStack.pop();

        return result;
    };

    hui.g = hui.util.g;
    hui.c = hui.util.c;
    hui.cc = hui.util.cc;
    hui.t = hui.util.t;
    hui.appendHTML = hui.util.appendHTML;
    hui.hasClass = hui.util.hasClass;
    hui.addClass = hui.util.addClass;
    hui.removeClass = hui.util.removeClass;
    // hui.format = hui.util.format;
    hui.sortBy = hui.util.sortBy;
    hui.on = hui.util.on;
    hui.off = hui.util.off;
    hui.onenter = hui.util.onenter;

    hui.getCookie = hui.util.getCookie;
    hui.setCookie = hui.util.setCookie;
    hui.removeCookie = hui.util.removeCookie;
    hui.formatDate = hui.util.formatDate;
    hui.parseDate = hui.util.parseDate;
    hui.setInnerHTML = hui.util.setInnerHTML;
    hui.setInnerText = hui.util.setInnerText;



});

hui.util.importCssString('html {}');