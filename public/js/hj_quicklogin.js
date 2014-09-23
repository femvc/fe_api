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
 * @name HUI是一个富客户端应用的前端MVC框架
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 */

// 使用window.hui定义可能会导致速度下降约7倍
var hui = {};
hui.runWithoutStrict = function (key, data) {
    return (new Function('data', 'with(data){return ' + key + ';}'))(data);
};
'use strict';

// hui.require('./module')
hui.require = function (n, conf) {
    // conf is {source:'hjfile.com'} or callback function
    if (!n || typeof n != 'string') return;
    if (typeof conf == 'function') {
        conf = {
            callback: conf
        };
    }
    if (!hui.require.checkLoaded(n, conf)) {
        hui.require.loaded.push(n);
        var src = hui.require.parseModuleUrl(n, conf, 'js');
        var script = document.createElement('script');
        script.src = src + (~src.indexOf('?') ? '&' : '?') + 'random=' + String(Math.random()).substr(5, 4);
        document.getElementsByTagName('head')[0].appendChild(script);
    }
    if (conf && conf.callback) {
        hui.define('', [n], conf.callback);
    }
};
hui.require.loaded = [];
hui.require.checkLoaded = function (n, conf) {
    var loaded = false;
    n = n.split('@')[0].replace('./', '');
    if (hui.define && hui.define.modules) {
        for (var i = 0, len = hui.define.modules.length; i < len; i++) {
            if (hui.define.modules[i] && hui.define.modules[i].name === n) {
                loaded = true;
                break;
            }
        }
    }
    if (!loaded) {
        for (var i = 0, len = hui.require.loaded.length; i < len; i++) {
            if (hui.require.loaded[i].split('@')[0].replace('./', '') === n) {
                loaded = true;
                break;
            }
        }
    }
    return loaded;
};
hui.require.parseModuleUrl = function (n, conf, type) {
    var url,
        m = n.replace('./', ''),
        fname = n.split('@')[0].replace('./', '') + '.' + type;

    if (n.indexOf('./') === 0) {
        url = (conf && conf.source ? conf.source : './') + 'hui_modules/' + m + '/' +
            (conf && conf.fileName ? conf.fileName : fname);
    } else {
        url = window.location.protocol + '//' + window.location.host + '/hui_modules/' + m + '/' +
            (conf && conf.fileName ? conf.fileName : fname);
    }

    return url;
};

// Nodejs support 'require' and does not support 'define', browser does not supported both. 

//define('lib_module',['lib@0.0.1','json@0.0.1'], function(exports){exports.todo='...';});
hui.define = function (name, deps, fun) {
    //Name missing. Allow for anonymous modules
    name = typeof name !== 'string' ? '' : String(name).toLowerCase();
    deps = deps && deps.splice && deps.length ? deps : [];
    var left = [];
    for (var i = 0, len = deps.length; i < len; i++) {
        left.push(String(deps[i]).toLowerCase());
    }
    hui.define.modules = hui.define.modules || [];
    var conf = {
        name: name,
        depend: deps,
        left: left,
        todo: fun,
        loaded: false,
        exports: {}
    };
    hui.define.modules.push(conf);

    hui.define.checkDepend();

    if (hui.define.autoload !== false) {
        for (var i = 0, len = conf.left.length; i < len; i++) {
            //'#/biz' need handle load.
            if (conf.left[i].indexOf('#/') == -1) {
                hui.require(conf.left[i]);
            }
        }
    }

};
hui.define.autoload = false;
hui.define.loaded = [];
hui.define.checkDepend = function () {
    hui.define.modules = hui.define.modules || [];
    // 注: 只能用倒序, 否则会碰到依赖项未定义的错误
    for (var i = hui.define.modules.length - 1; i > -1; i--) {
        var m = hui.define.modules[i];

        for (var j = 0, len2 = hui.define.loaded.length; j < len2; j++) {
            var n = hui.define.loaded[j];
            for (var k = m.left.length - 1; k > -1; k--) {
                if (m.left[k].replace('./', '').split('@')[0] == n) {
                    m.left.splice(k, 1);
                }
            }
        }

        if (!m.loaded && m.left.length < 1) {
            m.loaded = true;
            // 放在前面未执行todo就放到loaded中了，会误触其他函数的todo，只能放在后面
            // [注: push放在这里则后面检测依赖只能用倒序，放在后面不好实现][有误]
            m.todo(m.exports);
            // 放在todo前面有问题，依赖项刚加载还没来得及执行就触发了其他依赖此项的todo，会报依赖项未定义的错误
            m.name && hui.define.loaded.push(m.name);

            i = hui.define.modules.length;
        }
    }
};

// 注：查看漏加载的模块!!
hui.define.left = function () {
    var left = [];
    for (var i = 0, len = hui.define.modules.length; i < len; i++) {
        left = left.concat(hui.define.modules[i].left);
    }
    return left;
};

hui.define.loadLeft = function () {
    var list = hui.define.left();
    for (var i = 0, len = list.length; i < len; i++) {
        hui.require(list[i]);
    }
};

// 注：加载并解析完本文件内后面的模块后需恢复define.autoload = true;
hui.define.autoload = false;

hui.define('hui', [], function () {
    // !!! global.hui = ...
    if (typeof window != 'undefined' && !window.hui) {
        window.hui = {};
    }
    if (window.hui) {
        window.hui.window = window; /*hui.bocument = document;//注：hui.bocument与document不相同!!*/
    }

});

hui.define('hui_util', ['hui'], function () {

    hui.util = {};
    hui.util.g = function (id, parentNode) {
        if (!parentNode) {
            return document.getElementById(id);
        } else if (hui.bocument && (parentNode == hui.bocument || parentNode == hui.bocument.body)) {
            return hui.bocument.getElementById(id);
        } else {
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
    };

    hui.util.c = function (searchClass, node, tag) {
        if (document.getElementsByClassName) {
            var nodes = (node || document).getElementsByClassName(searchClass),
                result = nodes;
            if (tag !== undefined) {
                result = [];
                for (var i = 0, len = nodes.length; i < len; i++) {
                    if (tag === '*' || nodes[i].tagName.toUpperCase() === tag.toUpperCase()) {
                        result.push(nodes[i]);
                    }
                }
            }
            return result;
        } else {
            searchClass = searchClass !== null ? String(searchClass).replace(/\s+/g, ' ') : '';
            node = node || document;
            tag = tag || '*';

            var classes = searchClass.split(' '),
                elements = (tag === '*' && node.all) ? node.all : node.getElementsByTagName(tag),
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
    };
    hui.util.cc = function (searchClass, node, tag) {
        return hui.util.c(searchClass, node, tag)[0];
    };

    hui.util.t = function (tag, node) {
        node = node || document;
        return node.getElementsByTagName(tag);
    };

    /**
     * @name 将innerHTML生成的元素append到elem后面
     * @public
     * @param {HTMLElement} elem 父元素
     * @param {String} html 子元素HTML字符串
     */
    hui.util.appendHTML = function (elem, html) {
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
            else if (~'html,body'.indexOf(String(parentElement.tagName).toLowerCase())) {
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
        if (!pre || pre == 'next' || pre == 'last') {
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
        return~ (' ' + element.className + ' ').indexOf(' ' + className + ' ');
    };
    hui.util.addClass = function (element, className) {
        if (~'[object Array][object NodeList]'.indexOf(Object.prototype.toString.call(element))) {
            for (var i = 0, len = element.length; i < len; i++) {
                hui.util.addClass(element[i], className);
            }
        } else if (element) {
            hui.util.removeClass(element, className);
            element.className = (element.className + ' ' + className).replace(/(\s)+/ig, ' ');
        }
        return element;
    };
    // Support * and ?, like hui.util.removeClass(elem, 'daneden-*');
    hui.util.removeClass = function (element, className) {
        if (~'[object Array][object NodeList]'.indexOf(Object.prototype.toString.call(element))) {
            for (var i = 0, len = element.length; i < len; i++) {
                hui.util.removeClass(element[i], className);
            }
        } else if (element) {
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
                } else if (c && c.ownerNode && c.ownerNode.id === id) {
                    result = c.ownerNode;
                    break;
                }
            }
        } else if ((sheets = doc.getElementsByTagName('style'))) {
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
        var head = doc.body || doc.head || doc.documentElement;
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
        } else {
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
        } else {
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
        source = String(source);
        var data = Array.prototype.slice.call(arguments, 1),
            toString = Object.prototype.toString;
        if (data.length) {
            data = (data.length == 1 ?
                /* ie 下 Object.prototype.toString.call(null) == '[object Object]' */
                (opts !== null && (/\[object (Array|Object)\]/.test(toString.call(opts))) ? opts : data) : data);
            return source.replace(/#\{(.+?)\}/g, function (match, key) {
                var parts = key.split('.'),
                    part = parts.shift(),
                    cur = data,
                    variable;
                while (part) {
                    if (cur[part] !== undefined) {
                        cur = cur[part];
                    } else {
                        cur = undefined;
                        break;
                    }
                    part = parts.shift();
                }
                variable = cur;

                if ('[object Function]' === toString.call(variable)) {
                    variable = variable(key);
                }
                return (undefined === variable ? '' : variable);
            });
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
                } else {
                    if (m > n) {
                        m = 1;
                        n = -m;
                    } else if (m < n) {
                        m = -1;
                        n = -m;
                    } else {
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
        if (elem.addEventListener) {
            elem.addEventListener(eventName, handler, false);
        } else if (elem.attachEvent) {
            elem.attachEvent('on' + eventName, handler);
            // elem.attachEvent('on' + eventName, function(){handler.call(elem)}); 
            //此处使用回调函数call()，让 this指向elem //注释掉原因：无法解绑
        }
    };
    hui.util.off = function (elem, eventName, handler) {
        if (elem.removeEventListener) {
            elem.removeEventListener(eventName, handler, false);
        }
        if (elem.detachEvent) {
            elem.detachEvent('on' + eventName, handler);
        }
    };

    /** 
     * @name 给elem绑定onenter事件
     * @public
     * @param {HTMLElement} elem 目标元素
     * @param {Function} fn 事件处理函数
     */
    hui.util.onenter = function (elem, fn) {
        hui.util.on(elem, 'keypress', function (e) {
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
        hui.util.on(elem, 'keypress', function (e) {
            e = e || hui.window.event;
            var keyCode = e.keyCode || e.which;
            if (keyCode == 27) {
                elem.onesc && elem.onesc();
                fn(elem);
            }
        });
    };

    /** 
     * @name 为对象绑定方法和作用域
     * @param {Function|String} handler 要绑定的函数，或者一个在作用域下可用的函数名
     * @param {Object} obj 执行运行时this，如果不传入则运行时this为函数本身
     * @param {args* 0..n} args 函数执行时附加到执行时函数前面的参数
     * @returns {Function} 封装后的函数
     */
    hui.util.fn = function (func, scope) {
        if (Object.prototype.toString.call(func) === '[object String]') {
            func = scope[func];
        }
        if (Object.prototype.toString.call(func) !== '[object Function]') {
            throw 'Error "hui.util.fn()": "func" is null';
        }
        var xargs = arguments.length > 2 ? [].slice.call(arguments, 2) : null;
        return function () {
            var fn = '[object String]' == Object.prototype.toString.call(func) ? scope[func] : func,
                args = (xargs) ? xargs.concat([].slice.call(arguments, 0)) : arguments;
            return fn.apply(scope || fn, args);
        };
    };

    /**
 * @name 原型继承
 * @public
 * @param {Class} child 子类
 * @param {Class} parent 父类
 * @example 
    hui.ChildControl = function (options, pending) {
        //如果使用this.constructor.superClass.call将无法继续继承此子类,否则会造成死循环!!
        hui.ChildControl.superClass.call(this, options, 'pending');
        this.type = 'childcontrol';
        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };
    hui.Form.prototype = {
        render: function () {
            hui.Form.superClass.prototype.render.call(this);
            //Todo...
        }
    };
    hui.inherits(hui.Form, hui.Control);
 */
    hui.util.inherits = function (child, parent) {
        var clazz = new Function();
        clazz.prototype = parent.prototype;

        var childProperty = child.prototype;
        child.prototype = new clazz();

        for (var key in childProperty) {
            if (childProperty.hasOwnProperty(key)) {
                child.prototype[key] = childProperty[key];
            }
        }

        child.prototype.constructor = child;

        //child是一个function
        //使用super在IE下会报错!!!
        child.superClass = parent;
    };

    /**
     * @name 对象扩展
     * @param {Class} child 子类
     * @param {Class} parent 父类
     * @public
     */
    hui.util.extend = function (child, parent) {
        for (var key in parent) {
            if (parent.hasOwnProperty(key)) {
                child[key] = parent[key];
            }
        }
    };
    /** 
     * @name 对象派生(不推荐!!!)
     * @param {Object} obj 派生对象
     * @param {Class} clazz 派生父类
     * @public
     */
    hui.util.derive = function (obj, clazz) {
        var me = new clazz();

        for (var i in me) {
            if (me.hasOwnProperty(i)) {
                if (obj[i] === undefined) obj[i] = me[i];
            }
        }
    };

    /** 
     * @name 根据字符串查找对象
     * @param {String} name 对象对应的字符串
     * @param {Object} opt_obj 父对象
     * @public
     */
    hui.util.getObjectByName = function (name, opt_obj) {
        var parts = name.split('.'),
            part,
            cur = opt_obj || hui.window;
        while (cur && (part = parts.shift())) {
            cur = cur[part];
        }
        return cur;
    };

    /** 
     * @name对一个object进行深度拷贝
     * @param {Any} source 需要进行拷贝的对象.
     * @param {Array} oldArr 源对象树索引.
     * @param {Array} newArr 目标对象树索引.
     * @return {Any} 拷贝后的新对象.
     */
    hui.util.clone = function (source, oldArr, newArr) {
        if (typeof source === 'undefined') {
            return undefined;
        }
        if (typeof JSON !== 'undefined') {
            return JSON.parse(JSON.stringify(source));
        }

        var result = source,
            i,
            len,
            j,
            len2,
            exist = -1;
        oldArr = oldArr || [];
        newArr = newArr || [];

        if (source instanceof Date) {
            result = new Date(source.getTime());
        } else if ((source instanceof Array) || (Object.prototype.toString.call(source) == '[object Object]')) {
            for (j = 0, len2 = oldArr.length; j < len2; j++) {
                if (oldArr[j] == source) {
                    exist = j;
                    break;
                }
            }
            if (exist != -1) {
                result = newArr[exist];
                exist = -1;
            } else {
                if (source instanceof Array) {
                    result = [];
                    oldArr.push(source);
                    newArr.push(result);
                    var resultLen = 0;
                    for (i = 0, len = source.length; i < len; i++) {
                        result[resultLen++] = hui.util.clone(source[i], oldArr, newArr);
                    }
                } else if (!!source && Object.prototype.toString.call(source) == '[object Object]') {
                    result = {};
                    oldArr.push(source);
                    newArr.push(result);
                    for (i in source) {
                        if (source.hasOwnProperty(i)) {
                            result[i] = hui.util.clone(source[i], oldArr, newArr);
                        }
                    }
                }
            }
        }

        return result;
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
        if (results && results.length > 6)
            return new Date(parseInt(results[1]), parseInt(results[2]) - 1, parseInt(results[3]), parseInt(results[4]), parseInt(results[5]));

        //2011-06-08 
        results = str.match(/^ *(\d{4})[\._\-\/\\](\d{1,2})[\._\-\/\\](\d{1,2}) *$/);
        if (results && results.length > 3)
            return new Date(parseInt(results[1]), parseInt(results[2]) - 1, parseInt(results[3]));

        //2011-06-08 10:10 
        results = str.match(/^ *(\d{4})[\._\-\/\\](\d{1,2})[\._\-\/\\](\d{1,2}) +(\d{1,2}):(\d{1,2}) *$/);
        if (results && results.length > 6)
            return new Date(parseInt(results[1]), parseInt(results[2]) - 1, parseInt(results[3]), parseInt(results[4]), parseInt(results[5]));

        //2011-06-08 10:10:10 
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
        } else {
            for (var i = 0, l = fr.length; i < l; i++) {
                str = str.replace(new RegExp('\\' + fr[i], 'ig'), to[i]);
            }
        }
        return str;
    };
    hui.util.decode = function (str) {
        return this.encode(str, 'decode');
    };

    //setInnerHTML: function (elem, html){}
    hui.util.setInnerHTML = function (elem, html) {
        elem = elem && elem.getMain ? elem.getMain() : elem;
        if (elem && elem.innerHTML !== undefined) {
            elem.innerHTML = html;
        }
    };
    hui.util.setInnerText = function (elem, text) {
        if (!elem) return;
        if (elem.textContent !== undefined) {
            elem.textContent = text;
        } else {
            elem.innerText = text;
        }
    };

    hui.g = hui.util.g;
    hui.c = hui.util.c;
    hui.cc = hui.util.cc;
    hui.t = hui.util.t;
    hui.appendHTML = hui.util.appendHTML;
    hui.hasClass = hui.util.hasClass;
    hui.addClass = hui.util.addClass;
    hui.removeClass = hui.util.removeClass;
    hui.format = hui.util.format;
    hui.sortBy = hui.util.sortBy;
    hui.on = hui.util.on;
    hui.off = hui.util.off;
    hui.onenter = hui.util.onenter;
    hui.fn = hui.util.fn;
    hui.inherits = hui.util.inherits;
    hui.extend = hui.util.extend;
    hui.derive = hui.util.derive;
    hui.getObjectByName = hui.util.getObjectByName;
    hui.clone = hui.util.clone;
    hui.getCookie = hui.util.getCookie;
    hui.setCookie = hui.util.setCookie;
    hui.removeCookie = hui.util.removeCookie;
    hui.formatDate = hui.util.formatDate;
    hui.parseDate = hui.util.parseDate;
    hui.setInnerHTML = hui.util.setInnerHTML;
    hui.setInnerText = hui.util.setInnerText;



});

/**
 * @name 事件派发基类
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 */
hui.define('hui_eventdispatcher', ['hui@0.0.1'], function () {

    hui.EventDispatcher = function () {
        this._listeners = {};
    };
    hui.EventDispatcher.prototype = {
        /**
         * @name 添加监听器
         * @public
         * @param {String} eventType 事件类型.
         * @param {Function} listener 监听器.
         */
        on: function (eventType, listener) {
            if (!this._listeners[eventType]) {
                this._listeners[eventType] = [];
            }
            var list = this._listeners[eventType],
                exist = false,
                index;

            for (var i = 0, len = list.length; i < len; i++) {
                if (list[i] === listener) {
                    exist = true;
                    index = i;
                    break;
                }
            }
            if (!exist) {
                this._listeners[eventType].push(listener);
                index = this._listeners[eventType].length - 1;
            }
            return index;
        },

        /**
         * @name 移除监听器
         * @public
         * @param {String} eventType 事件类型.
         * @param {Function} listener 监听器.
         */
        off: function (eventType, listener) {
            if (!this._listeners[eventType]) {
                return;
            }
            var list = this._listeners[eventType];

            for (var i = 0, len = list.length; i < len; i++) {
                if (list[i] === listener || i === listener) {
                    this._listeners[eventType][i] = undefined;
                    break;
                }
            }
            if (listener === undefined) {
                this._listeners[eventType] = [];
            }
        },
        /**
         * @name 清除所有监听器
         * @public
         */
        clear: function (eventType) {
            // 清除全部
            if (!eventType) {
                this._listeners = [];
            }
            // 只清除指定类型
            else if (this._listeners[eventType]) {
                this._listeners[eventType] = [];
            } else if (Object.prototype.toString.call(eventType) === '[object Array]') {
                for (var i = 0, len = eventType.length; i < len; i++) {
                    this.clear(eventType[i]);
                }
            }
        },
        /**
         * @name 触发事件
         * @public
         * @param {String} eventType 事件类型.
         */
        trigger: function (eventType) {
            if (!this._listeners[eventType]) {
                return;
            }
            var args = [];
            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            var list = this._listeners[eventType];
            for (var i = 0, len = list.length; i < len; i++) {
                if (list[i]) {
                    list[i].apply(this, args);
                }
            }
        }
    };
    hui.EventDispatcher.prototype.constructor = hui.EventDispatcher;
});

/**
 * @name 控件基础类
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 */
hui.define('hui_control', ['hui@0.0.1', 'hui_eventdispatcher@0.0.1'], function () {

    hui.Control = function (options, pending) {
        hui.EventDispatcher.call(this);

        // 状态列表
        options = options || {};
        // 初始化参数
        this.initOptions(options);
        // 生成控件id
        if (!this.id) {
            this.id = hui.Control.makeGUID(this.formName);
        }

        hui.Control.appendControl(options.parentControl, this);

        // 子类调用此构造函数不可以立即执行!!只能放在子类的构造函数中执行!否则实例化时找不到子类中定义的属性!
        // 进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.Control.prototype = {
        /**
         * @name 初始化参数
         * @protected
         * @param {Object} options 参数集合
         */
        initOptions: function (options) {
            for (var k in options) {
                if (options.hasOwnProperty(k)) {
                    this[k] = options[k];
                }
            }
        },
        // 注: controlMap不能放在这里,放在这里会导致"原型继承属性只是用一个副本的坑"!!
        // controlMap: {},
        /**
         * @name 获取dom子部件的css class
         * @protected
         * @return {String}
         */
        getClass: function (opt_key) {
            if (!this.type) {
                return '';
            }

            var me = this,
                type = String(me.type).toLowerCase(),
                className = 'hui_' + type,
                skinName = 'skin_' + type + '_' + me.skin;

            if (opt_key) {
                className += '_' + opt_key;
                skinName += '_' + opt_key;
            }

            if (me.skin) {
                className = skinName + ' ' + className;
            }

            return className;
        },

        /**
         * @name 获取dom子部件的id
         * @public
         * @return {String}
         */
        getId: function (key) {
            var me = this,
                // uiAttr = hui.Control.UI_ATTRIBUTE || 'ui';
                // idPrefix = 'ctrl' + this.type + this.id;
                idPrefix = me.id;

            if (key) {
                idPrefix = idPrefix + key;
            }
            return idPrefix;
        },
        /**
         * @name 获取控件的elem(nodejs). 注:控件即使不需要显示任何内容也必须有一个挂载的elem(可以是隐藏的),
         * 通过模板解析控件时会用到 [nodejs&browser]
         * @public
         * @return {String}
         */
        getMain: function () {
            var me = this,
                elem;
            elem = me.main ? me.getDocument().getElementById(me.main) : null;
            return elem;
        },
        getDocument: function () {
            var bocument = this.bocument == 'bocument' ? hui.bocument : document;
            return bocument;
        },
        mainFocus: function () {
            // Fix IE8 bug: hidden elem focus() cause error
            var main = this.getMain();
            try {
                main.focus();
            } catch (e) {}
        },
        /**
         * @name 获取控件的innerHTML
         * @public
         * @param {HTMLElement} elem 默认为控件主DOM[可选]
         * @return {String}
         */
        getInnerHTML: function (elem) {
            var me = this,
                elem = elem || me.getMain(),
                html = '';
            if (elem.getInnerHTML) {
                html = elem.getInnerHTML();
            } else if (elem.innerHTML !== undefined) {
                html = elem.innerHTML;
            }
            return html;
        },
        /**
         * @name 设定控件的innerHTML[nodejs&browser]
         * @public
         * @param {String} html innerHTML
         * @param {HTMLElement} elem 默认为控件主DOM[可选]
         * @return {String}
         */
        setInnerHTML: function (elem, html) {
            elem = elem && elem.getMain ? elem.getMain() : elem;
            if (elem && elem.innerHTML !== undefined) {
                elem.innerHTML = html;
            }
        },
        /**
         * @name 渲染控件
         * @public
         */
        render: function () {
            var me = this,
                elem = me.getMain();
            if (elem && elem.getAttribute('_initView') != 'true') {
                hui.Control.addClass(elem, me.getClass());
                me.initView();
                elem.setAttribute('_initView', 'true');
            }
        },
        /**
         * @name 生成HTML
         * @public
         */
        initView: function (callback) {
            callback && callback();
        },
        /**
         * @name 绑定事件
         * @public
         */
        initBehavior: function () {
            //var me = this;
        },
        initBehaviorByTree: function () {
            var me = this,
                main = me.getMain();
            if (me.controlMap) {
                for (var i in me.controlMap) {
                    if (me.controlMap.hasOwnProperty(i)) {
                        me.controlMap[i].initBehaviorByTree();
                    }
                }
            }
            if (main.getAttribute('_initBehavior') != 'true') {
                main.setAttribute('_initBehavior', 'true');
                me.initBehavior();
            }
        },
        /**
         * @name 验证控件的值
         * @public
         */
        validate: function (show_error) {
            var me = this,
                result = true,
                controlMap = me.controlMap,
                Validator = hui.Control.getExtClass('hui.Validator'),
                c,
                list,
                m,
                n;

            if (me.rule && !me.isDisabled()) {
                result = false;
                list = String(me.rule).split('||');
                for (var i = 0, len = list.length; i < len && !result; i++) {
                    c = true;
                    m = list[i].split('&&');
                    for (var j = 0, len2 = m.length; j < len2; j++) {
                        n = m[j];
                        c = c && Validator.applyRule(me, n, show_error);
                    }
                    result = result || c;
                }
            }
            // result ===  null
            if (!me.rule && controlMap && !me.isDisabled()) {
                result = true;
                m = null;
                for (var i in controlMap) {
                    if (i && controlMap.hasOwnProperty(i) && controlMap[i]) {
                        n = controlMap[i].validate(show_error);
                        result = n && result;
                        m = m === null && !n ? controlMap[i] : m;
                    }
                }
                //m && m.getInput && m.getInput() && m.getInput().focus();
            }

            return result;
        },
        hideError: function () {
            var me = this,
                Validator = hui.Control.getExtClass('hui.Validator');
            Validator.cancelNotice(me.getMain());
            if (me.controlMap) {
                for (var i in me.controlMap) {
                    if (i && me.controlMap.hasOwnProperty(i) && me.controlMap[i]) {
                        me.controlMap[i].hideError();
                    }
                }
            }
        },
        showError: function (errorMsg, code) {
            var me = this,
                Validator = hui.Control.getExtClass('hui.Validator'),
                rule = Validator.getRule(me.rule);
            if (rule && code === 'by_code') {
                errorMsg = rule.noticeText[errorMsg];
            }

            Validator.showError(me.getMain(), errorMsg);
        },
        showErrorByTree: function (paramMap, code) {
            var me = this,
                ctr;
            if (me.controlMap && paramMap) {
                for (var formName in paramMap) {
                    if (formName && paramMap.hasOwnProperty(formName)) {
                        ctr = me.controlMap[formName] || me.getByFormName(formName);
                        if (!ctr) {
                            continue;
                        }
                        if (Object.prototype.toString.call(paramMap[formName]) === '[object Object]' && ctr.controlMap) {
                            ctr.showErrorByTree(paramMap[formName], code);
                        } else if (ctr.showError) {
                            ctr.showError(paramMap[formName], code);
                        }
                        ctr = null;
                    }
                }
            }
        },
        showOK: function () {
            var me = this,
                Validator = hui.Control.getExtClass('hui.Validator');
            Validator.showOK(me);
        },
        showWaiting: function () {
            var me = this,
                Validator = hui.Control.getExtClass('hui.Validator');
            Validator.showWaiting(me);
        },
        /**
         * @name 返回控件的值
         * @public
         */
        //getValue:   new Function(), // 注: 控件直接返回值(对象/数组/字符串)时才能使用getValue! 获取所有子控件的值,应该用getParamMap
        setValue: function (paramMap) {
            var me = this;
            if (me.controlMap) {
                me.setValueByTree(this.value);
            } else {
                me.getMain().value = paramMap;
            }
        },
        /**
         * @name 给控件树一次性赋值
         * @param {Object} v 值
         */
        setValueByTree: function (paramMap) {
            var me = this,
                ctr,
                main;
            if (me.controlMap && paramMap) {
                for (var formName in paramMap) {
                    if (formName && paramMap.hasOwnProperty(formName)) {
                        ctr = me.controlMap[formName] || me.getByFormName(formName);
                        if (!ctr) {
                            continue;
                        }
                        if (ctr.constructor &&
                            ctr.constructor.prototype &&
                            ctr.constructor.prototype.hasOwnProperty &&
                            ctr.constructor.prototype.hasOwnProperty('setValue')) {

                            ctr.setValue(paramMap[formName]);
                        } else if (ctr.controlMap) {
                            ctr.setValueByTree(paramMap[formName]);
                        } else if (ctr.getMain || ctr.main) {
                            main = (ctr.getMain ? ctr.getMain() : me.getDocument().getElementById(ctr.main)) || {};
                            main.value = paramMap[formName];
                        }

                        ctr = null;
                    }
                }
            }
        },
        /**
         * @name 获取子控件的值，返回一个map
         * @public
         */
        getParamMap: function () {
            var me = this,
                paramMap = {},
                ctr,
                formName,
                value;
            // 如果有子控件建议递归调用子控件的getValue!!
            if (me.controlMap) {
                for (var i in me.controlMap) {
                    if (i && me.controlMap.hasOwnProperty(i) && me.controlMap[i]) {

                        ctr = me.controlMap[i];
                        formName = hui.Control.prototype.getFormName.call(ctr);
                        if (String(ctr.isFormItem) !== 'false') {
                            paramMap[formName] = paramMap[formName] ? paramMap[formName] : [];
                            if (ctr.getValue) {
                                value = ctr.getValue();
                                paramMap[formName].push(value);
                            } else if (ctr.getMain || ctr.main) {
                                value = (ctr.getMain ? ctr.getMain() : me.getDocument().getElementById(ctr.main)).value;
                                paramMap[formName].push(value);
                            } else if (ctr.controlMap) {
                                value = ctr.getParamMap();
                                paramMap[formName].push(value);
                            }
                        }
                    }
                }
                for (var i in paramMap) {
                    if (paramMap[i] && paramMap[i].length < 2) {
                        paramMap[i] = paramMap[i][0] !== undefined ? paramMap[i][0] : '';
                    }
                }
            }

            return paramMap;
        },
        /**
         * @name 通过formName访问子控件
         * @public
         * @param {String} formName 子控件的formName
         */
        getByFormName: function (formName) {
            var me = this;
            return hui.Control.getByFormName(formName, me);
        },
        getById: function (id) {
            var me = this;
            return hui.Control.getById(id, me);
        },
        getValue: function () {
            var me = this,
                main = me.getMain ? me.getMain() : me.getDocument().getElementById(me.main),
                value = me.value || main.value;
            return value;
        },
        /**
         * @name 显示控件
         * @public
         */
        show: function () {
            this.getMain().style.display = 'block';
            hui.Control.removeClass(this.getMain(), 'hide');
            return this;
        },

        /**
         * @name 隐藏控件
         * @public
         */
        hide: function () {
            hui.Control.addClass(this.getMain(), 'hide');
            this.getMain().style.display = 'none';
            return this;
        },
        /**
         * @name 设置控件不可用状态
         * @public
         * @param {Boolean} disabled
         */
        setDisabled: function (disabled) {
            var me = this,
                main = me.getMain();
            main.disabled = typeof disabled === 'undefined' ? disabled = true : disabled;

            if (main.disabled) {
                hui.addClass(main, me.getClass('disabled'));
            } else {
                hui.removeClass(main, me.getClass('disabled'));
            }
            return me;
        },
        /**
         * @name 设置控件不可用状态
         * @public
         * @param {Boolean} disabled
         */
        setReadonly: function (readOnly) {
            if (typeof readOnly === 'undefined') {
                readOnly = true;
            }
            this.getMain().readOnly = readOnly;
            return this;
        },
        /**
         * @name 判断控件不可用状态
         * @public
         * @return {boolean}
         */
        isDisabled: function () {
            return this.getMain().disabled;
        },
        isReadonly: function () {
            return this.getMain().readOnly;
        },
        /**
         * @name 设置控件width和height
         * @public
         */
        setSize: function (size) {
            var me = this,
                main = me.getMain();
            me.size = size ? size : me.size;

            if (me.size && me.size.width) {
                main.style.width = me.size.width + (typeof me.size.width !== 'string' ? 'px' : '');
            }
            if (me.size && me.size.height) {
                main.style.height = me.size.height + (typeof me.size.height !== 'string' ? 'px' : '');
            }

            if (me.size && me.size.top) {
                main.style.top = me.size.top + (typeof me.size.top !== 'string' ? 'px' : '');
            }
            if (me.size && me.size.bottom) {
                main.style.bottom = me.size.bottom + (typeof me.size.bottom !== 'string' ? 'px' : '');
            }
            if (me.size && me.size.left) {
                main.style.left = me.size.left + (typeof me.size.left !== 'string' ? 'px' : '');
            }
            if (me.size && me.size.right) {
                main.style.right = me.size.right + (typeof me.size.right !== 'string' ? 'px' : '');
            }
        },
        /**
         * @name 获取表单控件的表单名
         * @public
         * @param {Object} control
         */
        getFormName: function () {
            var me = this,
                main = me.getMain ? me.getMain() : me.getDocument().getElementById(me.main);
            var itemName = me.formName || me['name'] || (main ? main.getAttribute('name') : null) || (me.getId ? me.getId() : me.id);
            return itemName;
        },
        /**
         * @name 释放控件
         * @protected
         */
        dispose: function () {
            var me = this,
                controlMap,
                main = me.getMain ? me.getMain() : me.getDocument().getElementById(me.main),
                k,
                list;
            // 从父控件的controlMap中删除引用
            if (me.parentControl) {
                controlMap = me.parentControl.controlMap;
                k = me.getId ? me.getId() : me.id;
                controlMap[k] = undefined;
                delete controlMap[k];
            }

            me.disposeChild && me.disposeChild();

            if (main) {
                // 释放控件主区域的常用事件
                list = [
                    'onmouseover',
                    'onmouseout',
                    'onmousedown',
                    'onmouseup',
                    'onkeyup',
                    'onkeydown',
                    'onkeypress',
                    'onchange',
                    'onpropertychange',
                    'onfocus',
                    'onblur',
                    'onclick',
                    'ondblclick',
                    'ontouchstart',
                    'ontouchmove',
                    'ontouchend',
                    'ondragover',
                    'ondrop',
                    'ondragstart'
                ];
                for (var i = 0, len = list.length; i < len; i++) {
                    try {
                        main[list[i]] = Function('');
                    } catch (e) {}
                }

                // 清空HTML内容
                if (main.setInnerHTML) {
                    main.setInnerHTML(main, '');
                } else if (main.innerHTML) {
                    main.innerHTML = '';
                }
                main.parentNode.removeChild(main);
                /*// 释放掉引用 注释掉原因：控件和dom都改成了间接引用而非直接引用，因此无需此操作
            for (var i in me.main) {
                if (i) {
                    try {
                        if (Object.hasOwnProperty.call(me.main, i) && 'function,object'.indexOf(typeof (me.main[i]))>-1) {
                            me.main[i] = undefined;
                            delete me.main[i];
                        }
                    }
                    catch (e) {
                        // 移除一些自有属性如"valueAsNumber"时可能会出错!
                        //console.log(e)
                    }
                }
            }*/
                //me.main = undefined;
            }

            me.rendered = undefined;

            // 因为使用的属性而非闭包实现的EventDispatcher，因此无需担心内存回收的问题。
        },
        disposeChild: function () {
            var me = this,
                controlMap = me.controlMap;
            // dispose子控件
            if (controlMap) {
                for (var k in controlMap) {
                    if (k && controlMap.hasOwnProperty(k)) {
                        controlMap[k].dispose();
                        delete controlMap[k];
                    }
                }
                me.controlMap = {};
            }
        },
        /**
         * @name Control的主要处理流程
         * @protected
         * @param {Object} argMap arg表.
         */
        enterControl: function () {
            var uiObj = this,
                elem,
                parentElement,
                control,
                parentControl = uiObj.parentControl;

            // 注：默认增加一个空元素作为控件主元素!
            elem = (uiObj.getMain ? uiObj.getMain() : null) || (uiObj.createMain ? uiObj.createMain() : hui.Control.prototype.createMain.call(uiObj));
            if (!elem) {
                return hui.Control.error('Control\'s main element is invalid');
            }

            // 便于通过elem.control找到control
            elem.control = uiObj.getId ? uiObj.getId() : uiObj.id;
            // 动态生成control需手动维护me.parentControl
            // 回溯找到父控件,若要移动控件,则需手动维护parentControl属性!!
            parentElement = elem;
            while (parentElement && parentElement.tagName && parentElement.parentNode) {
                parentElement = parentElement.parentNode;
                //label标签自带control属性!!
                if (parentElement && hui.Control.isControlMain(parentElement)) {
                    control = hui.Control.getById(parentElement.control, parentControl);
                    hui.Control.appendControl(control, uiObj);
                    break;
                }
                // 未找到直接父控件则将control从hui.window.controlMap移动到action.controlMap中
                else if (~'html,body'.indexOf(String(parentElement.tagName).toLowerCase())) {
                    hui.Control.appendControl(null, uiObj);
                    break;
                }
            }

            // hui.Control.elemList.push(uiObj);
            // 设计用来集中缓存索引,最后发现不能建,建了垃圾回收会有问题!!

            // 每个控件渲染开始的时间。
            uiObj.startRenderTime = new Date();
            // 1. initView()会在render调用父类的render时自动调用，
            // 2. 不管是批量hui.Control.init()还是hui.Control.create(), 都会通过enterControl来执行render
            // 3. initBehavior()会在后面执行
            if (elem && elem.getAttribute && elem.getAttribute('_initView') != 'true' && uiObj.render) {
                uiObj.render();
                uiObj.rendered = 'true';
            }

            /*注: 如果isRendered为false则默认调用父类的渲染函数,子类的render中有异步情况需特殊处理!
        if (!uiObj.isRendered){
            uiObj.constructor.superClass.prototype.render.call(uiObj);
        }
        //注释掉的原因：调用父类的render应该由子类自己决定!
        */

            // 解除obj对DOM的引用!
            // uiObj.main = elem.getAttribute('id'); // elem.getAttribute('id')无法取到id的

            //注释掉原因,导出到browser的html中不能还原! 
            //var uiAttr = hui.Control.UI_ATTRIBUTE || 'ui';
            //elem.setAttribute('_' + uiAttr, elem.getAttribute(uiAttr));
            //elem.removeAttribute(uiAttr);

            uiObj.endRenderTime = new Date();

            if (uiObj.initBehaviorByTree) {
                uiObj.initBehaviorByTree();
            } else if (uiObj.initBehavior) {
                uiObj.initBehavior();
            }

            uiObj.endInitBehaviorTime = new Date();
            /*
        // 注释掉原因：getParamMap时会自动根据isFormItem判断
        if (uiObj.isFormItem === false) {
            uiObj.getValue = null;
        }*/

        },
        /**
         * @name 生成DOM
         * @protected
         */
        createMain: function () {
            var me = this,
                tagName = this.tagName || 'DIV',
                elem = me.getDocument().createElement(String(tagName).toUpperCase()),
                control = me.parentControl,
                wrap = null;

            if (!wrap && control && control.getMain) {
                wrap = control.getMain();
            }
            if (!wrap && control && control.main) {
                wrap = me.getDocument().getElementById(control.main);
            }
            if (!wrap) {
                wrap = me.getDocument().body || me.getDocument().documentElement;
            }

            wrap.appendChild(elem);

            elem.id = hui.Control.makeElemGUID(me.id);
            me.main = elem.id;

            return elem;
        },
        /**
         * @name 父控件添加子控件. 注: 将子控件加到父控件下面的容器中也可以调用appendSelfTo
         * @public
         * @param {Control} uiObj 子控件.
         */
        appendControl: function (uiObj) {
            return hui.Control.appendControl(this, uiObj);
        }
    };

    hui.inherits(hui.Control, hui.EventDispatcher);

    /**
     * @name 获取唯一id
     * @public
     * @return {String}
     */
    hui.Control.makeGUID = (function () {
        var guid = 1;
        return function (formName) {
            return (formName ? formName : 'inner') + '_' + hui.Control.getHashCode('inner') + (guid++);
        };
    })();

    hui.Control.getHashCode = function (str) {
        var hash = 0;
        if (str.length === 0) return hash;
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + c;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    };

    /**
     * @name 获取唯一id
     * @public
     * @return {String}
     */
    hui.Control.makeElemGUID = (function () {
        var guid = 1;
        return function (id) {
            return (id !== undefined ? id + hui.Control.getHashCode(id) : ('_' + hui.Control.formatDate(new Date(), 'yyyy_MM_dd_HH_mm') + '_' + (guid++)));
        };
    })();
    /**
     * @name 解析自定义ui属性
     * @public
     * @param {String} attrStr ui属性
     * @param {Hashmap} opt_propMap 数据model
     * @return {Hashmap}
     */
    hui.Control.parseCustomAttribute = function (attrStr, opt_propMap) {
        var attrStr = '{' + attrStr + '}',
            attrs,
            attrValue,
            attrName;

        // 解析ui属性
        attrs = (new Function('return ' + attrStr))();

        for (var j in attrs) {
            if (attrs.hasOwnProperty(j)) {
                // 通过@定义的需要到传入的model中找
                attrValue = attrs[j];
                if (attrValue && typeof attrValue == 'string' && attrValue.indexOf('@') === 0) {
                    attrName = attrValue.substr(1);

                    attrValue = opt_propMap && opt_propMap.get ? opt_propMap.get(attrName) : opt_propMap[attrName];
                    // 默认读取opt_propMap中的,没有再到全局context中取,防止强耦合.
                    if (attrValue === undefined) {
                        attrValue = hui.Control.getExtClass('hui.context').get(attrName);
                    }
                    attrs[j] = attrValue;
                }
            }
        }

        return attrs;
    };

    /**
     * @name 判断一个解析前DOM元素是否是子控件，是则跳过非父控件的hui.Control.init()
     * @public
     * @param {String} elem DOM元素
     */
    hui.Control.isChildControl = function (elem, list) {
        var result = false;
        // 回溯找到父控件,若要移动控件,则需手动维护parentControl属性!!
        while (elem && elem.tagName && elem.parentNode) {
            elem = elem.parentNode;
            // 未找到直接父控件则将control从hui.window.controlMap移动到action.controlMap中
            if (~'html,body'.indexOf(String(elem.tagName).toLowerCase()) == -1) break;
            for (var i = 0, len = list.length; i < len; i++) {
                if (list[i] == elem) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    };

    /**
     * @name 判断一个解析前DOM元素是否已解析控件
     * @public
     * @param {String} elem DOM元素
     */
    hui.Control.isControlMain = function (elem) {
        var result = false;
        if (elem && elem.getAttribute && elem.control && Object.prototype.toString.call(elem.control) === '[object String]') {
            result = true;
        }
        return result;
    };

    /**
     * @name 批量生成控件
     * @public
     * @param {HTMLElement} opt_wrap 渲染的区域容器元素
     * @param {Object}      opt_propMap 控件需要用到的数据Model{@key}
     * @param {Object}      parentControl 渲染的action,不传则默认为window对象
     * @return {Object} 控件集合
     */
    //hui.Control.init('<div ui="type:"></div>');//暂时禁止此方法生成控件树
    //hui.Control.init(hui.bocument.getElementById('content'));
    hui.Control.init = function (opt_wrap, opt_propMap, parentControl) {
        if (!opt_wrap || opt_wrap.getAttribute('rendered') === 'true') {
            return false;
        }

        /*Step 1: 转换string到DOM
    // 容器为空的判断
    if (typeof (opt_wrap) == 'string') {
        hui.bocument.documentElement.setInnerHTML(elem, opt_wrap);
        opt_wrap = hui.bocument.documentElement;
    }*/

        /*Step 2: 转换DOM到control*/
        opt_propMap = opt_propMap || {}; // 这里并不会缓存BaseModel，因此销毁空间时无须担心BaseModel
        // parentControl不传默认为window对象
        parentControl = parentControl || (opt_wrap.getDocument && opt_wrap.getDocument() == hui.bocument ? hui.window : window);
        parentControl.controlMap = parentControl.controlMap || {};


        var uiAttr = hui.Control.UI_ATTRIBUTE || 'ui';
        var realEls = [],
            uiEls = [];
        var elem, control;

        // 把dom元素存储到临时数组中
        // 控件渲染的过程会导致elements的改变
        realEls = hui.Control.findAllNodes(opt_wrap);

        // 循环解析自定义的ui属性并渲染控件
        // <div ui="type:'UIType',id:'uiId',..."></div>
        for (var i = 0, len = realEls.length; i < len; i++) {
            elem = realEls[i];
            if (elem && elem.getAttribute && elem.getAttribute(uiAttr)) {
                uiEls.push(elem);
            }
        }
        for (var i = 0, len = uiEls.length; i < len; i++) {
            elem = uiEls[i];
            if (!hui.Control.isChildControl(elem, uiEls) && elem.getAttribute('rendered') !== 'true') {

                control = hui.Control.create(elem, {
                    parentControl: parentControl
                });

                /*var attrStr = elem.getAttribute(uiAttr);
            
            var attrs = hui.Control.parseCustomAttribute(attrStr, opt_propMap);
            
            // 主元素参数初始化
            if(attrs.main          == undefined && elem)          {attrs.main = elem.id ? elem.id : hui.Control.makeElemGUID(); elem.id = attrs.main;}
            if(attrs.parentControl == undefined && parentControl) {attrs.parentControl = parentControl;}
            // 生成控件 //这里的parentControl, elem不能去掉!!否则在后面的enterControl理会重复生成elem!!! 
            //control = hui.Control.create( options[ 'type' ], options, parentControl, elem);
            //放在了上上一行,故去掉了parentControl, elem
             
            control = hui.Control.create( attrs[ 'type' ], attrs);
            /**
             * 保留ui属性便于调试与学习
             */
                // elem.setAttribute( uiAttr, '' );
            }
        }

        return parentControl.controlMap;
    };

    /**
     * @name 创建一个控件对象
     * @public
     * @param {String} type 控件类型
     * @param {Object} options 控件初始化参数
     * @return {hui.Control} 创建的控件对象
     */
    hui.Control.create = function (type, options) {
        // 注：扩展一下，直接支持hui.Control.create(Element);
        if (type && Object.prototype.toString.call(type) != '[object String]' && type.getAttribute) {
            options = options || {};
            if (hui.Control.isControlMain(type)) {
                var control = hui.Control.getById(type.control);
                if (control) {
                    hui.Control.appendControl(options.parentControl, control);
                }
            }
            var str, attrs;
            try {
                str = type.getAttribute(hui.Control.UI_ATTRIBUTE || 'ui');
                try {
                    attrs = hui.Control.parseCustomAttribute(str);
                } catch (e) {
                    attrs = hui.Control.parseCustomAttribute(str.replace(/\\\'/g, '\'').replace(/\\\"/g, '\"'));
                }
            } catch (e) {
                window.JSON && window.JSON.stringify && window.console && window.console.log({
                    type: type,
                    options: options
                });
                return;
            }

            for (var i in attrs) {
                var text = attrs[i];
                if (text && Object.prototype.toString.call(text) === '[object String]') {
                    if (text.indexOf('&') === 0) {
                        attrs[i] = window[text.replace('&', '')];
                    }
                }
            }

            for (var i in options) {
                if (i && options.hasOwnProperty(i)) {
                    attrs[i] = attrs[i] !== undefined ? attrs[i] : options[i];
                }
            }
            // 注：每个控件必须有id
            attrs.id = attrs.id ? attrs.id : hui.Control.makeGUID(attrs['formName']);

            type.id = type.id || hui.Control.makeElemGUID(attrs.id);
            attrs.main = type.id;
            attrs.bocument = type.bocument;

            return hui.Control.create(attrs['type'], attrs);
        }

        options = options || {};

        // 注：创建并渲染控件，每个控件必须有id
        var objId = options.id;
        if (!objId) {
            objId = hui.Control.makeGUID(options['formName']);
            options.id = objId;
        }
        var existControl = hui.Control.getById(objId);
        if (existControl) {
            existControl.dispose();
        }

        var uiClazz = hui[type];
        if (!uiClazz) {
            hui.Control.error('Not use require(\'' + String(type).toLowerCase() + '\') or "' + String(type).toLowerCase() + '.js" is not loaded successfully.');
        }

        // 1. 模版批量生成控件时，options里一般没有m ain，m ain指向元素自身! //注:已改成默认有m ain
        // 2. new的方式创建控件时，options里一般有m ain!
        // 在这里设置m ain属性注意不能覆盖new uiClazz(options)的设置,也便于后面render时重新设置
        //if(options.m ain == undefined && m ain) {options.m ain = m ain;}//注:已移动到hui.Control.init中了

        // 设置临时parentControl放置子控件//注释掉原因:创建控件默认放在hui.window下//放到hui.Control.init中了
        //if(options.parentControl == undefined && parentControl) {options.parentControl = parentControl;}
        // 创建控件对象

        var uiObj = new uiClazz(options);
        uiObj.id = uiObj.id || objId;

        /*Hack方式不利于理解程序，所以去掉!!*/
        // 调用父类的构造函数
        //hui.Control.call( uiObj, options );
        /**
         * @name 再次调用子类的构造函数
         * @comment 这里为什么不直接放到new uiClazz(options)里呢? 因为调用父类的构造函数会被覆盖掉.
        uiClazz.call( uiObj, options );/*已废弃*
        /**/
        /*uiObj.clazz = uiClazz;// 已经使用this.constructor代替*/
        /*
    // 加到父控件的controlMap中
    if (!((uiObj.parentControl && uiObj.parentControl.controlMap && uiObj.parentControl.controlMap[objId] == uiObj) &&
        (uiObj.getId && uiObj.getId() !== objId) || (uiObj.id !== objId))) {
        
        if (uiObj.parentControl && uiObj.parentControl.controlMap && uiObj.parentControl.controlMap[objId] !== uiObj) {
            hui.Control.appendControl(uiObj.parentControl, uiObj);
            //uiObj.parentControl.controlMap[objId] = uiObj;
        }
        else if (options.parentControl && options.parentControl.controlMap && options.parentControl.controlMap[objId] !== uiObj) {
            hui.Control.appendControl(options.parentControl, uiObj);
            //options.parentControl.controlMap[objId] = uiObj;
        }
    }
    */
        // 检查是否有 enterControl 方法
        if (!uiObj.enterControl) {
            hui.extend(uiObj, hui.Control.prototype);
            uiObj.enterControl();
        }


        return uiObj;
    };

    /**
     * @name 父控件添加子控件. 注: 将子控件加到父控件下面的容器中也可以调用appendSelfTo
     * @public
     * @param {Control} uiObj 子控件.
     */
    hui.Control.appendControl = function (parent, uiObj) {
        // parentControl父控件不传则默认为window对象
        // parentControl父控件默认为window对象, 不是的话后面会再改回来. 
        // var parentControl = hui.window;
        // Add: 上面这样做静态没问题，动态生成appendSelfTo就会出问题，因此需要加上options.parentControl
        // Fixme: 第二次执行到这里hui.Action.get()居然是前一个action？
        parent = parent || hui.window;
        parent.controlMap = parent.controlMap || {};

        var ctrId = uiObj.getId ? uiObj.getId() : uiObj.id;
        // 注：从原来的父控件controlMap中移除
        if (uiObj.parentControl && uiObj.parentControl.controlMap) {
            uiObj.parentControl.controlMap[ctrId] = undefined;
            delete uiObj.parentControl.controlMap[ctrId];
        }

        // !!!悲催的案例,如果将controlMap放在prototype里, 这里parent.controlMap===uiObj.controlMap!!!
        parent.controlMap[ctrId] = uiObj;
        // 重置parentControl标识
        uiObj.parentControl = parent;
    };

    /**
     * @name 获取所有子节点element
     * @public
     * @param {HTMLElement} main
     * @param {String} stopAttr 如果元素存在该属性,如'ui',则不遍历其下面的子元素
     */
    hui.Control.findAllNodes = function (main, stopAttr) {
        var i,
            len,
            childNode,
            elements,
            list,
            childlist,
            node;
        elements = [];
        list = [main];

        while (list.length) {
            childNode = list.pop();
            if (!childNode) continue;
            // Not set 'stopAttr', get all nodeds.
            if (stopAttr === undefined || (childNode.getAttribute && childNode.getAttribute(stopAttr))) {
                elements.push(childNode);
            }
            childlist = childNode.childNodes;
            if (!childlist || childlist.length < 1) continue;
            if (childNode != main && stopAttr !== undefined && childNode.getAttribute(stopAttr)) {
                continue;
            }
            for (i = 0, len = childlist.length; i < len; i++) {
                node = childlist[i];
                list.push(node);
            }
        }
        // 去掉顶层main,如不去掉处理复合控件时会导致死循环!!
        if (elements[0] === main) elements.shift();

        return elements.reverse();
    };
    /**
     * @name 获取父控件或Action下所有控件
     * @public
     * @param {Object} control
     */
    hui.Control.findAllControl = function (parentControl) {
        var i,
            childNode,
            elements,
            list,
            childlist,
            node;
        elements = [];
        list = [parentControl];

        while (list.length) {
            childNode = list.pop();
            if (!childNode) continue;
            elements.push(childNode);
            childlist = childNode.controlMap;
            if (!childlist) continue;
            for (i in childlist) {
                if (childlist.hasOwnProperty(i)) {
                    node = childlist[i];
                    list.push(node);
                }
            }
        }
        // 去掉顶层父控件或Action,如不去掉处理复合控件时会导致死循环!!
        if (elements.length > 0) elements.shift();
        return elements;
    };
    // 所有控件实例的索引. 注释掉原因: 建了索引会造成无法GC内存暴涨!
    // hui.Control.elemList = [];
    /**
     * @name 回溯找到当前元素所在的控件
     * @public
     * @param {Element} parentElement DOM元素
     */
    hui.Control.findElemControl = function (parentElement) {
        var control = null;
        while (parentElement && parentElement.tagName && parentElement.parentNode) {
            parentElement = parentElement.parentNode;
            //label标签自带control属性!!
            if (parentElement && hui.Control.isControlMain(parentElement)) {
                control = hui.Control.getById(parentElement.control);
                break;
            }
            // 未找到直接父控件则将control从hui.window.controlMap移动到action.controlMap中
            else if (~'html,body'.indexOf(String(parentElement.tagName).toLowerCase())) {
                break;
            }
        }
        return control;
    };

    /**
     * @name 根据控件id找到对应控件
     * @public
     * @param {Control} parentControl 可不传, 默认从当前Action开始找, 如果未使用action则直接从hui.window.controlMap开始找
     * @id 控件ID
     * @param {String} 控件id
     */
    hui.Control.getById = function (id, parentControl) {
        var list,
            result = null;
        // parentControl || hui.Control.getById(parentControl) || hui.Action.get(parentControl) || hui.Action.get() || window
        if (typeof parentControl == 'string') {
            parentControl = hui.Control.getById(parentControl);
        }
        // 如果传入的parentControl是DOM元素，视为未传入值处理
        parentControl = parentControl && parentControl.getId ? parentControl :
            (hui.Action && hui.Action.get ? (hui.Action.get(parentControl) || hui.Action.get()) :
            (parentControl && parentControl === hui.bocument ? hui.window : window));

        if (id === undefined || (parentControl && parentControl.getId && id === parentControl.getId())) {
            result = parentControl;
        } else if (parentControl) {
            list = hui.Control.findAllControl(parentControl);
            for (var i = 0, len = list.length; i < len; i++) {
                if (list[i].id == id) {
                    result = list[i];
                }
            }
        }

        // If not found then find in 'window.controlMap'
        if (!result) {
            list = hui.Control.findAllControl(window);
            for (var i = 0, len = list.length; i < len; i++) {
                if (list[i].id == id) {
                    result = list[i];
                }
            }
        }

        return result;
    };
    /**
     * @name 根据控件formName找到对应控件
     * @static
     * @param {String} 控件formName
     */
    hui.Control.getByFormNameAll = function (formName, parentNode) {
        var list = [],
            childNodes,
            /* 强制确认parentControl: 如果传入是parentControl的id，则找出其对应的Control */
            parentControl = hui.Control.getById(undefined, parentNode) || window;

        if (formName) {
            formName = String(formName);

            // 先查找自身
            childNodes = parentControl && parentControl.controlMap ? parentControl.controlMap : {};
            //childNodes.unshift(parentControl);
            if (parentControl.getFormName && parentControl.getFormName() === formName) {
                list.push(parentControl);
            }

            // 再遍历控件树
            childNodes = parentControl && parentControl.controlMap ? hui.Control.findAllControl(parentControl) : {};
            for (var i in childNodes) {
                if (childNodes.hasOwnProperty(i) && childNodes[i].getFormName() === formName) {
                    list.push(childNodes[i]);
                }
            }
        }

        return list;
    };
    /**
     * @name 根据控件formName找到对应控件
     * @static
     * @param {String} 控件formName
     */
    hui.Control.getByFormName = function (formName, parentNode) {
        var result = null,
            list;
        if (typeof parentNode == 'string') {
            parentNode = hui.Control.getById(parentNode) || hui.Control.getByFormName(parentNode);
        }
        list = hui.Control.getByFormNameAll(formName, parentNode);
        if (parentNode && parentNode.parentNode && parentNode.childNodes) {
            for (var i = 0, len = list.length; i < len; i++) {
                if (hui.Control.checkParentNode(list[i], parentNode)) {
                    result = list[i];
                    break;
                }
            }
        } else {
            result = list[0];
        }

        return result;
    };

    /**
     * @name 判断控件是否在某父元素下
     * @static
     * @param {Control} control 控件
     * @param {HTMLElement} parentNode DOM元素
     */
    hui.Control.checkParentNode = function (control, parentNode) {
        var main,
            result = false;
        // 判断控件是否在parentNode元素下
        if (parentNode && result.getMain) {
            main = result.getMain();
            while (main) {
                if (main.parentNode === parentNode) {
                    result = true;
                    main = null;
                } else {
                    main = main.parentNode;
                }
            }
        }
        return result;
    };

    /**
     * @name 为目标元素添加className
     * @public
     * @param {HTMLElement|string} element 目标元素或目标元素的id
     * @param {String} className 要添加的className，允许同时添加多个class，中间使用空白符分隔
     * @remark
     * 使用者应保证提供的className合法性，不应包含不合法字符，className合法字符参考：http://www.w3.org/TR/CSS2/syndata.html。
     * @returns {HTMLElement} 目标元素
     */
    hui.Control.addClass = hui.util.addClass;
    hui.Control.removeClass = hui.util.removeClass;
    hui.Control.hasClass = hui.util.hasClass;
    hui.Control.format = hui.util.format;
    hui.Control.formatDate = hui.util.formatDate;
    hui.Control.parseDate = hui.util.parseDate;

    hui.Control.error = function (str) {
        if (hui.window && hui.window.console && hui.window.console.error) {
            hui.window.console.error(str);
        } else if (typeof (window) !== 'undefined' && window.console && window.console.error) {
            window.console.error(str);
        }
    };
    hui.Control.log = function (str) {
        if (hui.window && hui.window.console && hui.window.console.log) {
            hui.window.console.log(str);
        } else if (typeof (window) !== 'undefined' && window.console && window.console.log) {
            window.console.log(str);
        }
    };
    hui.Control.getExtClass = function (clazz) {
        var result = function () {};
        switch (clazz) {
        case 'hui.BaseModel':
            if (typeof hui !== 'undefined' && hui.BaseModel) {
                result = hui.BaseModel;
            } else {
                result.get = new Function();
                result.set = new Function();
            }
            break;
        case 'hui.Validator':
            if (typeof hui !== 'undefined' && hui.Validator) {
                result = hui.Validator;
            } else {
                result.cancelNotice = new Function();
                result.set = new Function();
            }
            break;
        case 'hui.Action':
            if (typeof hui !== 'undefined' && hui.Validator) {
                result = hui.Validator;
            } else {
                result.get = new Function();
            }
            break;
        case 'hui.context':
            if (typeof hui !== 'undefined' && hui.context) {
                result = hui.context;
            } else {
                result = {};
                result.get = new Function();
            }
            break;
        default:
        }
        return result;
    };
});


/**
 * @name 表单数据验证类
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 */
hui.define('hui_validator', ['hui@0.0.1'], function () {

    hui.Validator = {
        /**
         * @name 通用错误提示
         */
        errorMsg: {
            'SUCCESS': '',
            'ERROR_EMPTY': '不能为空',
            'ERROR_REGEX': '格式错误',
            'ERROR_INT': '格式错误，请输入整数',
            'ERROR_NUMBER': '格式错误，请输入数字',
            'ERROR_MIN': '不能小于#{0}',
            'ERROR_MIN_DATE': '不能早于#{0}',
            'ERROR_MAX': '不能多于#{0}',
            'ERROR_MAX_DATE': '不能晚于#{0}',
            'ERROR_GT': '必须大于#{0}',
            'ERROR_GT_DATE': '必须晚于#{0}',
            'ERROR_LT': '必须少于#{0}',
            'ERROR_LT_DATE': '必须早于#{0}',
            'ERROR_RANGE': '范围须在#{0}与#{1}',
            'ERROR_LENGTH': '长度不等于#{0}',
            'ERROR_MIN_LENGTH': '长度不能小于#{0}',
            'ERROR_MAX_LENGTH': '长度不能大于#{0}',
            'ERROR_LENGTH_RANGE': '长度不能超出范围(#{0}, #{1})',
            'ERROR_CALENDAR': '日历格式错误，正确格式2010-01-01',
            'ERROR_EXT': '扩展名不合法，只允许#{0}',
            'ERROR_BACKEND': ' #{0}'
        },
        /**
         * @name Id后缀及错误样式名
         */
        config: {
            waitingClass: 'validate_waiting',
            okClass: 'validate_ok',
            errorClass: 'validate_error',
            validClass: 'validate',
            iconClass: 'validate_icon',
            textClass: 'validate_text',
            suffix: 'validate',
            iconSuffix: 'validateIcon',
            textSuffix: 'validateText'
        },
        /**
         * @name 待验证的对象获取值解析器
         */
        parse: function (text, type) {
            if (type === 'int') {
                return parseInt(text, 10);
            } else if (type === 'float') {
                return parseFloat(text);
            } else if (type === 'date') {
                return hui.Validator.parseDate(text);
            } else {
                return text;
            }
        },

        /**
         * @name 设定控件的innerHTML[nodejs&browser]
         * @public
         * @param {String} html innerHTML
         * @param {HTMLElement} elem 默认为控件主DOM[可选]
         * @return {String}
         */
        setInnerHTML: function (elem, html) {
            elem = elem && elem.getMain ? elem.getMain() : elem;
            if (elem && elem.innerHTML !== undefined) {
                elem.innerHTML = html;
            }
        },
        /**
         * @name 在父元素的末尾提示信息
         * @private
         * @param {String} noticeText 错误信息.
         * @param {HTMLElement} input 控件元素.
         */
        getControl: function (control) {
            var ctr = control && control.getMain ?
                control.getMain() :
                (control && control.main ? hui.Validator.getDocument().getElementById(control.main) : control);
            return ctr;
        },
        showError: function (control, noticeText) {
            var me = hui.Validator;
            me.showNoticeDom(control, noticeText, 'errorClass');
        },
        showOK: function (control, noticeText) {
            var me = hui.Validator;
            me.showNoticeDom(control, noticeText, 'okClass');
        },
        showWaiting: function (control, noticeText) {
            var me = hui.Validator;
            me.showNoticeDom(control, noticeText, 'waitingClass');
        },
        showNoticeDom: function (control, noticeText, className) {
            var me = hui.Validator,
                input = me.getControl(control),
                father = input.parentNode;
            if (!me.getValidateElem(input)) {
                me.createNoticeElement(input, father);
            }
            if (me.getTextEl(input)) {
                me.createNoticeTextElem(input);
            }

            hui.Validator.removeClass(father, me.config['okClass'] + ' ' + me.config['errorClass'] + ' ' + me.config['waitingClass']);
            hui.Validator.addClass(father, me.config[className]);
            noticeText = noticeText === undefined ? '' : noticeText;

            me.setInnerHTML(me.getTextEl(control), noticeText);
        },
        /**
         * @name 创建notice元素
         * @private
         * @param {HTMLElement} input 对应的input元素.
         * @return {HTMLElement}
         */
        createNoticeElement: function (input, father) {
            var me = hui.Validator,
                inputId = input.id,
                el = me.getValidateElem(input),
                text = me.getTextEl(input);

            if (!el) {
                el = hui.Validator.getDocument().createElement('div');
                el.id = inputId + '_' + me.config['suffix'];
                el.className = me.config['validClass'];
                father.appendChild(el);
            }

            if (!text) {
                me.createNoticeTextElem(input);
            }

            return el;
        },
        createNoticeTextElem: function (input) {
            var me = hui.Validator,
                inputId = input.id,
                el = me.getValidateElem(input),
                text = me.getTextEl(input),
                icon;

            if (el && !text) {
                icon = hui.Validator.getDocument().createElement('div');
                icon.id = inputId + '_' + me.config['iconSuffix'];
                icon.className = me.config['iconClass'];
                el.appendChild(icon);

                text = hui.Validator.getDocument().createElement('div');
                text.id = inputId + '_' + me.config['textSuffix'];
                text.className = me.config['textClass'];
                el.appendChild(text);
            }
        },

        /**
         * @name 在父元素的末尾取消提示信息
         * @private
         * @param {HTMLElement} input 控件元素.
         */
        cancelNotice: function (control) {
            var me = hui.Validator,
                input = me.getControl(control),
                father = input.parentNode;

            hui.Validator.removeClass(father, me.config['errorClass'] + ' ' + me.config['okClass'] + ' ' + me.config['waitingClass']);

            if (father.lastChild.className && father.lastChild.className.replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === 'validate') {
                father.removeChild(father.lastChild);
            }
        },
        hideError: function (control) {
            this.cancelNotice(control);
        },
        /**
         * @name 获取info区域的元素
         * @private
         * @param {HTMLElement} input 对应的input元素.
         * @return {HTMLElement}
         */
        getTextEl: function (input) {
            var me = this,
                elem,
                control = input,
                input = me.getControl(control);
            elem = hui.Validator.getDocument().getElementById(input.id + '_' + me.config['textSuffix']);

            return elem;
        },

        /**
         * @name 获取提示元素
         * @private
         * @param {HTMLElement} input 对应的input元素.
         * @return {HTMLElement}
         */
        getValidateElem: function (input) {
            var me = this,
                elem,
                control = input,
                input = me.getControl(control);
            elem = hui.Validator.getDocument().getElementById(input.id + '_' + me.config['suffix']);
            return elem;
        },
        /**
         * @name 获取提示元素
         * @private
         * @param {HTMLElement} input 对应的input元素.
         * @return {HTMLElement}
         */
        getSegElement: function (control, segId) {
            var elem = hui.Validator.getDocument().getElementById(segId);
            return elem;
        },
        /**
         * @name 验证规则
         * @private
         * @param {ui.Control} control 需要验证的控件.
         * @param {String} ruleName 验证规则的名称,格式rule:not_empty,preControl,nextControl.
         * 后面会根据preserveArgument是否为true决定是否及preControl,nextControl是否
         */
        applyRule: function (control, ruleName, show_error) {
            // 判断控件是否具有获取value的方法
            if (!control || (!control.getValue && control.value === null) || !ruleName) {
                return true;
            }

            var me = this,
                args = ruleName.split(','),
                rule = me.ruleMap[args[0]],
                error,
                errorText = '';

            var text = (control.getValue ? control.getValue(true) : control.value);
            text = text === undefined ? control.getMain().value : text;
            args[0] = text;

            // CheckBox
            if (control.type == 'checkbox') {
                text = control.getChecked() || control.checked;
                args[0] = text;
            }

            error = rule.validate.apply(control, args);

            // return 0 or 'SUCCESS'
            if (error === 0 || error === 'SUCCESS') { /*ok*/ }
            // return 'ERROR_NUMBER'
            else if (Object.prototype.toString.call(error) == '[object String]' && error !== '') {
                errorText = me.errorMsg[error];
            }
            // return ['ERROR_LENGTH_RANGE', min_length, max_length]
            else if (Object.prototype.toString.call(error) === '[object Array]') {
                errorText = hui.Validator.format(me.errorMsg[error[0]], error.splice(1, error.length));
            } else if (error !== 0) { //TODO:这种形式是要被历史遗弃的
                if ('object' == typeof rule.noticeText) {
                    errorText = rule.noticeText[error];
                } else {
                    errorText = rule.noticeText;
                }
            }

            // Force not show error.
            if (show_error !== 'not_show') {
                // return 0 or 'SUCCESS'
                if (error === 0 || error === 'SUCCESS') {
                    var showOK = rule.showOK || me.showOK;
                    showOK(control, errorText);
                } else {
                    var showError = rule.showError || me.showError;
                    showError(control, errorText);
                }
            }

            return !errorText;
        }
    };

    hui.Validator.getDocument = function (control) {
        var bocument = null;
        if (control && control.getDocument) {
            bocument = control.getDocument();
        }
        bocument = bocument || document;
        return bocument;
    };

    /**
     * @name 通用方法
     */
    hui.Validator.format = hui.util.format;
    hui.Validator.addClass = hui.util.addClass;
    hui.Validator.removeClass = hui.util.removeClass;
    hui.Validator.parseDate = hui.util.parseDate;

    /**
     * @name 验证规则集合
     * @private
     */
    hui.Validator.ruleMap = {
        'required': {
            validate: function (text) {
                if (!text || (Object.prototype.toString.call(text) == '[object String]' && String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '')) {
                    return 'ERROR_EMPTY';
                }
                return 'SUCCESS';
            }
        },

        'ext': {
            /**
             * @param {String} text 需要检查的文本内容.
             * @param {...*} var_args 合法的后缀名.
             */
            validate: function (text, var_args) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'ERROR_EMPTY';
                }

                var allowedExt = Array.prototype.slice.call(arguments, 1);
                var dotIndex = text.lastIndexOf('.');
                if (dotIndex == -1) {
                    return ['ERROR_EXT', allowedExt.join(',')];
                }

                var ext = text.substring(dotIndex + 1).toLowerCase();
                for (var i = 0, j = allowedExt.length; i < j; i++) {
                    if (allowedExt[i].toLowerCase() == ext) {
                        return 'SUCCESS';
                    }
                }

                return ['ERROR_EXT', allowedExt.join(',')];
            }
        },

        'regex': {
            validate: function (text, pattern, modifiers) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (!new RegExp(pattern, modifiers).test(text)) {
                    return 'ERROR_REGEX';
                }
                return 'SUCCESS';
            }
        },

        'int': {
            validate: function (text) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (isNaN(text - 0) || text.indexOf('.') >= 0) {
                    return 'ERROR_INT';
                }
                return 'SUCCESS';
            }
        },

        'number': {
            validate: function (text) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (isNaN(text - 0)) {
                    return 'ERROR_NUMBER';
                }
                return 'SUCCESS';
            }
        },

        'min': {
            validate: function (text, minValue, type) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (hui.Validator.parse(text, type) < hui.Validator.parse(minValue, type)) {
                    return [type === 'date' ? 'ERROR_MIN_DATE' : 'ERROR_MIN', minValue];
                }
                return 'SUCCESS';
            }
        },

        'gt': {
            validate: function (text, minValue, type) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (hui.Validator.parse(text, type) <= hui.Validator.parse(minValue, type)) {
                    return [type === 'date' ? 'ERROR_GT_DATE' : 'ERROR_GT', minValue];
                }
                return 'SUCCESS';
            }
        },

        'max': {
            validate: function (text, maxValue, type) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (hui.Validator.parse(text, type) > hui.Validator.parse(maxValue, type)) {
                    return [type === 'date' ? 'ERROR_MAX_DATE' : 'ERROR_MAX', maxValue];
                }
                return 'SUCCESS';
            }
        },

        'lt': {
            validate: function (text, maxValue, type) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (hui.Validator.parse(text, type) >= hui.Validator.parse(maxValue, type)) {
                    return [type === 'date' ? 'ERROR_LT_DATE' : 'ERROR_LT', maxValue];
                }
                return 'SUCCESS';
            }
        },

        'range': {
            validate: function (text, minValue, maxValue, type) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (hui.Validator.parse(text, type) - hui.Validator.parse(maxValue, type) > 0 ||
                    hui.Validator.parse(text, type) - hui.Validator.parse(minValue, type) < 0) {
                    return ['ERROR_RANGE', minValue, maxValue];
                }
                return 'SUCCESS';
            }
        },

        'length': {
            validate: function (text, length) {
                if (text.length !== length) {
                    return ['ERROR_LENGTH', length];
                }
                return 'SUCCESS';
            }
        },

        'min_length': {
            validate: function (text, min_length) {
                if (text.length < min_length) {
                    return ['ERROR_MIN_LENGTH', min_length];
                }
                return 'SUCCESS';
            }
        },

        'max_length': {
            validate: function (text, max_length) {
                if (text.length > max_length) {
                    return ['ERROR_MAX_LENGTH', max_length];
                }
                return 'SUCCESS';
            }
        },

        'length_range': {
            validate: function (text, min_length, max_length) {
                if (text.length < min_length || text.length > max_length) {
                    return ['ERROR_LENGTH_RANGE', min_length, max_length];
                }
                return 'SUCCESS';
            }
        },

        'not_empty': {
            'validate': function (text) {
                if (text === null || text === undefined || text === '') {
                    return 1;
                }

                return 0;
            },
            'noticeText': {
                1: '不能为空'
            }
        },
        'backend_error': {
            validate: function (text, control) {
                return ['ERROR_BACKEND', control.errorMessage];
            }
        }
        /****************************以上是通用验证规则************************/
    };

    /**
     * @name 验证规则集合
     * @public
     * @param {String} ruleName 规则名称
     * @param {Map} rule 规则内容
     */
    hui.Validator.setRule = function (ruleName, ruleContent, force) {
        if (!force && hui.Validator.ruleMap[ruleName]) {
            throw {
                title: 'hui.Validator.setRule() Error: ',
                name: 'rule "' + ruleName + '" exist.'
            };
        } else {
            hui.Validator.ruleMap[ruleName] = ruleContent;
        }
    };
    hui.Validator.getRule = function (ruleName) {
        return hui.Validator.ruleMap[ruleName];
    };

});

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
 * @author wanghaiyang
 * @date 2014/05/05
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
                    } else {
                        if (xhr.eventHandlers['datatype'] == 'XML') {
                            try {
                                xhr.xhr.responseXML;
                                xhr.responseCallback(handler, xhr.xhr.responseXML);
                            } catch (error) {
                                window.setTimeout(function () {
                                    handler('error', xhr);
                                }, 0);
                                return;
                            }
                        } else if (xhr.eventHandlers['datatype'] == 'TEXT') {
                            try {
                                xhr.xhr.responseText;
                                xhr.responseCallback(handler, xhr.xhr.responseText);
                            } catch (error) {
                                window.setTimeout(function () {
                                    handler('error', xhr);
                                }, 0);
                                return;
                            }
                        } else { //if (xhr.eventHandlers['datatype'] == 'JSON')
                            // 处理获取xhr.responseText导致出错的情况,比如请求图片地址. 
                            try {
                                xhr.xhr.responseText;
                            } catch (error) {
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
                            } else if (text.indexOf('{') === 0) {
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
                            } else {
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
                        } else {
                            xhr.xhr.open(method, url, async);
                        }
                    } catch (e) {
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
                } catch (ex) {
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
                } catch (ex) {
                    // 在请求时，如果网络中断，Firefox会无法取得status 
                    xhr.fire('failure');
                    return;
                }

                xhr.fire(stat);

                // http://www.never-online.net/blog/article.asp?id=261 
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
                } else {
                    if (stat === 0 && !xhr.online) {
                        xhr.fire('success');
                    } else {
                        if (stat === 0 && window.console && window.console.log) {
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
            } else {
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
            if (/^[\'\"]$/.test(c)) {
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
                        } else {
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
                        } else {
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
        } else {
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

        proxy.id = id || hui.util.formatDate(new Date(), 'yyyyMMddHHmmss') + '' + String(Math.random()).substr(3, 4);
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

    // 注: 跨域会导致请求出错
    Requester.JSONP('http://www.5imemo.com/other/ajax/jsonp.php', {onsuccess: function(data){ alert(data.id)}});
}
*/

    Requester.getExtClass = function (clazz) {
        var result = function () {};
        switch (clazz) {
        case 'hui.Permission':
            if (typeof hui !== 'undefined' && hui.Permission) {
                result = hui.Permission;
            } else {
                result.checkRequest = new Function();
                result.set = new Function();
            }
            break;
        case 'hui.Mockup':
            if (typeof hui !== 'undefined' && hui.Mockup) {
                result = hui.Mockup;
            } else {
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
                } else {
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

    hui.Mockup.setRule('/hui_mockup_helloworld', {
        status: 0,
        message: '',
        data: 'Hello world.'
    });

    // !!! global.hui = ...
    if (typeof window != 'undefined') {
        window.Requester = Requester;
    }

});


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
 * @name Template模板管理类
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 */
hui.define('hui_template', ['hui'], function () {
    hui.Template = {
        /**
         * @name 解析前 originTargetContainer, 解析后 parsedTargetContainer
         */
        originTargetContainer: {},
        parsedTargetContainer: {},
        targetRule: /<!--\s*target:\s*([a-zA-Z0-9\.\-_]+)\s*-->/g,
        importRule: /<!--\s*import:\s*([a-zA-Z0-9\.\-_]+)\s*-->/g,
        /**
         * @name 解析模板字符串流[增加target]
         * @public
         * @param {String} tplStr 模板字符串流tpl:<!-- target:mergeTest -->hello #{myName}!
         * @param {Object|string...} opts 提供相应数据的对象或多个字符串
         * @returns {String} 格式化后的字符串
         */
        parseTemplate: function (tplStr, lazyParse) {
            var me = this,
                k,
                targetNameList,
                targetContentList,
                targetList,
                sep;

            //基本思路: 使用正则提取targetName与targetContent分别放入两个数组
            tplStr = !tplStr ? '' : String(tplStr);

            //坑爹的String.split(RegExp)有兼容性问题!!!
            //找到一个不重复的字符串做分隔符
            sep = String(Math.random()).replace('.', '');
            for (var i = 0; tplStr.indexOf(sep) > -1 && i < 1000; i++) {
                sep = String(Math.random()).replace('.', '');
            }
            if (tplStr.indexOf(sep) > -1) {
                throw new Error({
                    title: 'HUI Template Error: ',
                    name: 'Math.random()'
                });
            }

            targetList = {};
            targetNameList = tplStr.match(me.targetRule) || [],
            targetContentList = tplStr.replace(me.targetRule, sep).split(sep);

            //抛弃掉第一个<!-- target: XXX -->之前的内容
            if (targetContentList.length - targetNameList.length == 1) {
                targetContentList.shift();
            }
            if (targetContentList.length != targetNameList.length) {
                throw new Error({
                    title: 'HUI Template Error: ',
                    name: 'Methond "parseTemplate()" error.'
                });
            }

            for (var i = 0, len = targetNameList.length; i < len; i++) {
                k = targetNameList[i].replace(me.targetRule, '$1');
                targetList[k] = targetContentList[i];

                //存入全局target容器(parsedTargetContainer中的后面将会替换)
                me.originTargetContainer[k] = targetContentList[i];
            }

            if (lazyParse !== true) {
                me.parseAllTarget();
            }

            return targetList;
        },
        /**
         * @name 获取Target
         * @public
         * @param {String} targetName Target名字
         * @returns {String} 未解析的target
         */
        getTarget: function (targetName) {
            var me = this;
            if (targetName === null || targetName === '') return '';

            if (me.parsedTargetContainer[targetName] === undefined) {
                throw new Error('Target "' + targetName + '" not exist.');
            }

            return me.parsedTargetContainer[targetName];
        },
        /**
         * @name 依赖于me.originTargetContainer循环解析targetList中的target
         * @public
         * @param {String} tplStr 模板字符串流tpl:<!-- target:mergeTest -->hello #{myName}!
         * @param {Object|String...} opts 提供相应数据的对象或多个字符串
         * @returns {String} 格式化后的字符串
         */
        parseAllTarget: function () {
            var me = this,
                targetList = {};
            /**
             * 解析所有target
             */
            for (var i in me.originTargetContainer) {
                if (!i) continue;
                targetList[i] = me.originTargetContainer[i];
            }

            for (var i in me.originTargetContainer) {
                if (!i) continue;
                var v = me.originTargetContainer[i];
                for (var j in targetList) {
                    if (!j || i == j) continue;
                    //importRule
                    targetList[j] = targetList[j].replace(new RegExp('<!--\\s*import\\s*:\\s*(' + i + ')\\s*-->', 'g'), v);
                }
            }

            me.parsedTargetContainer = targetList;

            return targetList;
        },
        /**
         * @name 合并模板与数据
         * @public
         * @param {HTMLElement} targetContent  原始模板内容.
         * @param {Object}      model    数据模型
         * @return {String} 替换掉#{varName}变量后的模板内容.
         */
        merge: function (targetContent, model) {
            return hui.Template.parse(targetContent, model);
        },
        format: function (source, opts) {
            source = String(source);
            var data = Array.prototype.slice.call(arguments, 1),
                toString = Object.prototype.toString;
            if (data.length) {
                data = (data.length == 1 ?
                    /* IE 下 Object.prototype.toString.call(null) == '[object Object]' */
                    (opts !== null && (/\[object (Array|Object)\]/.test(toString.call(opts))) ? opts : data) : data);
                return source.replace(/#\{(.+?)\}/g, function (match, key) {
                    key = String(key).replace(/(^\s+|\s+$)/g, '');
                    var parts,
                        part,
                        cur,
                        replacer;

                    if (key.indexOf('(') !== -1) {
                        // #{Math.floor(user.age, user.birth)}
                        replacer = hui.runWithoutStrict(key, data);
                    } else {
                        parts = hui.Template.overloadOperator(key).split('.');
                        cur = data;
                        part = parts.shift();
                        while (part && cur) {
                            cur = cur[part] !== undefined ? cur[part] : cur = undefined;
                            part = parts.shift();
                        }
                        replacer = cur;
                    }

                    if ('[object Function]' === toString.call(replacer)) {
                        replacer = replacer(key);
                    }
                    return (undefined === replacer ? '' : replacer);
                });
            }
            return source;
        },
        error: function (msg) {
            msg = 'Template: ' + msg;
            if (hui.window.console) {
                hui.window.console.log(msg);
            } else throw Error(msg);
        },
        varConvert: function (token, model, strMap, str) {
            var s2,
                value,
                c,
                m;
            model = model || {};

            for (var i = 0, ilen = token.length; i < ilen; i++) {
                s2 = token[i];
                if (s2 === ',') continue;

                value = s2[s2.length - 1];
                if (s2.length === 2 || value === '') {
                    throw new Error('Template syntax error: ' + s2 + ' in ' + str);
                }
                value = hui.Template.getExpValue(value, model, strMap);
                // Deal with a=b=, attention: won't want break s2, so use length-1 instead pop()
                for (var j = 0, jlen = s2.length; j < jlen - 1; j++) {
                    if (s2[j] !== '=') {
                        if (s2[j].length > 1 && s2[j].indexOf('.') !== -1) {
                            m = s2[j];
                            m = m.split('.').join('=.=').split('=');

                            c = hui.Template.expCalculate(m, model, strMap, 'keep_var');
                            c.parent[c.child] = value;
                        } else {
                            model[s2[j]] = value;
                        }
                    }
                }
            }
            return model;
        },
        varTokenization: function (str) {
            var list,
                c,
                m,
                notValue = true,
                preQuot = -1,
                isJSON = false,
                preBracket = [],
                lineNum,
                s1 = [],
                s2 = [],
                s3 = [],
                t1 = [],
                t2 = [],
                s4;

            list = String(str).split('');
            for (var i = 0, ilen = list.length; i < ilen; i++) {
                c = list[i];

                // 单引或双引
                if (/^[\'\"]$/.test(c)) {
                    if (notValue === true && preQuot === -1) {
                        notValue = false;
                        preQuot = i;
                        t1.push(c);
                        continue;
                    }
                    // 值 !notValue == isValue
                    if (!notValue) {
                        // 前面反斜杠个数
                        lineNum = 0;
                        for (var j = i - 1; j > -1; j--) {
                            if (list[j] === '\\') {
                                lineNum++;
                            } else {
                                j = -1;
                            }
                        }
                        // 个数为偶数且和开始引号相同
                        // 结束引号
                        if (lineNum % 2 === 0) {
                            if (list[preQuot] === c) {
                                t1.push(c);
                                s1.push('#{' + t2.length + '}');
                                t2.push(t1);
                                t1 = [];

                                notValue = true;
                                preQuot = -1;
                            }
                        } else {
                            t1.push(c);
                        }
                    }
                    // 非值 notValue = true;
                    else {
                        // 开始引号
                        if (preQuot === -1) {
                            notValue = false;
                            preQuot = i;

                            t1.push(c);
                        }
                        // 结束引号
                        else if (list[preQuot] === c) {
                            notValue = true;
                            preQuot = -1;
                        }
                    }
                } else {
                    // is String value
                    if (!notValue) {
                        t1.push(c);
                    }
                    // 非值 notValue = true
                    else {
                        if (c === '{' || c === '[') {
                            isJSON = true;
                            preBracket.push(c);

                            s1.push(c);
                        } else if (c === '}' || c === ']') {
                            if (preBracket[preBracket.length - 1] === (c === '}' ? '{' : '[')) {
                                preBracket.pop();
                            }
                            if (preBracket.length === 0) {
                                isJSON = false;

                                s1.push(c);
                            }
                        }
                        // 逗号
                        else if (!isJSON && c === ',') {
                            s2.push(s1);
                            s3.push(s2);
                            s3.push(',');
                            s1 = [];
                            s2 = [];
                        }
                        // 等号, 且不是 != , >= , <= , ==
                        else if ((c === '=' || c === '是') && list[i - 1] !== '不' && list[i - 1] !== '!' && list[i - 1] !== '>' &&
                            list[i - 1] !== '<' && list[i - 1] !== '=' && list[i + 1] !== '=') {
                            s2.push(s1);
                            s2.push('=');
                            s1 = [];
                        } else if (c === '#' && list[i + 1] === '{') {
                            s1.push(' ');
                            for (var j = i + 2; j < ilen; j++) {
                                if (list[j] === '}') {
                                    i = j;
                                    break;
                                }
                                s1.push(list[j]);
                            }
                            s1.push(' ');
                        } else {
                            s1.push(c);
                        }
                    }


                }
            }

            if (t1.join('')) {
                s1.push('#{' + t2.length + '}');
                t2.push(t1);
            }

            s2.push(s1);
            s3.push(s2);


            for (var i = 0, ilen = s3.length; i < ilen; i++) {
                s4 = s3[i];
                if (Object.prototype.toString.call(s4) === '[object Array]') {
                    for (var j = 0, jlen = s4.length; j < jlen; j++) {
                        if (Object.prototype.toString.call(s4[j]) === '[object Array]') {
                            s4[j] = s4[j].join('');
                        }
                        s4[j] = String(s4[j]).replace(/(^\s+|\s+$)/g, '');
                    }
                }
            }

            for (var i = 0, ilen = t2.length; i < ilen; i++) {
                c = t2[i];
                if (c[c.length - 1] === '"' || c[c.length - 1] === '\'') {
                    c.pop();
                }
                if (c[0] === '"' || c[0] === '\'') {
                    c.shift();
                }
                t2[i] = c.join('');
            }

            for (var i = 0, ilen = s3.length; i < ilen; i++) {
                c = s3[i];
                if (Object.prototype.toString.call(c) === '[object Array]') {
                    for (var j = 0, jlen = c.length; j < jlen; j++) {
                        m = c[j];
                        c[j] = hui.Template.overloadOperator(m);
                    }
                } else {
                    s3[i] = hui.Template.overloadOperator(c);
                }
            }

            return {
                token: s3,
                strMap: t2
            };
        },
        overloadOperator: function (str) {
            var opList = [
                '有', '.',
                '的', '.',
                '自加加', '++',
                '自减减', '--',
                '非', '!',
                '正', '+',
                '负', '-',
                '乘以', '*',
                '除以', '/',
                '求余', '%',
                '加上', '+',
                '减去', '-',
                '不大于', '<=',
                '不小于', '>=',
                '不等于', '!=',
                '不是', '!==',
                '恒等于', '===',
                '真的是', '===',
                '不恒等于', '!==',
                '大于', '>',
                '小于', '<',
                '等于', '==',
                '且', '&&',
                '或', '||',
                '实体', '{}',
                '数组', '[]'
            ];
            for (var i = 0, ilen = opList.length; i < ilen;) {
                str = str.split(opList[i++]).join(opList[i++]);
            }
            return str;
        },
        getExpValue: function (v1, model, strMap) {
            v1 = String(v1);
            strMap = strMap || [];
            var keyword = {
                'null': {
                    v: null
                },
                'undefined': {
                    v: undefined
                },
                'true': {
                    v: true
                },
                'false': {
                    v: false
                }
            };
            var value = v1,
                v = v1;
            // Number
            if (v.replace(/^[+\-]?(\d+\.)?\d+/g, '') === '' || ~'"\''.indexOf(v.substr(0, 1)) || ~'{['.indexOf(v.substr(0, 1)) ||
                keyword[v] ||
                v.replace(/^[a-zA-Z_]+[a-zA-Z0-9_]*/g, '') === '') {
                value = hui.Template.getKeyValue(v);
            }
            // Exp
            else {
                // != , >= , <= , ==
                var token1 = hui.Template.expTokenization(v, model);
                var token2 = hui.Template.expConvertBracket(token1, model, strMap);
                var token3 = hui.Template.expConvertTree(token2, model, strMap);
                value = hui.Template.expCalculate(token3, model, strMap);
            }
            // console.log(value);
            return value;
        },
        // <!-- if: a = 123 -->  =>  <!-- var: a = 123 --> <!-- if: a -->
        //hui.Template.expBuildTree(['w.a','&&','w.a','/','w.a'])
        expCalculate: function (list, model, strMap, keep_var) {
            if (!list.opr) {
                if (list.length === 1) {
                    if (Object.prototype.toString.call(list[0]) === '[object Array]') {
                        result = hui.Template.expCalculate(list[0], model, strMap, keep_var);
                    }
                    // a[aa]
                    else {
                        result = hui.Template.getKeyValue(list[0], model, strMap);
                    }
                    return result;
                }

                for (var i = 0, ilen = list.length; i < ilen; i++) {
                    if (hui.Template.expIsOperator(list[i])) {
                        list.opr = list[i];
                        break;
                    }
                }
            }

            var c, m, result, data;
            // var degree = {
            //     '.': 11,  '的': 11,'[': 11,']': 11,'(': 10,')': 10,'++': 9,'自加加': 9,'--': 9,'自减减': 9,'^!': 8,'非': 8,
            //     '^+': 8,'正': 8,'^-': 8,'负': 8,'*': 7,'乘以': 7,'/': 7,'除以': 7,'%': 7,'求余': 7,'+': 6,'加上': 6,'-': 6,
            //     '减去': 6,'<': 5,'小于': 5,'<=': 5,'不大于': 5,'>': 5,'大于': 5,'>=': 5,'不小于': 5,'==': 4,'等于': 4,'!=': 4,
            //     '不等于': 4,'===': 4,'恒等于': 4,'!==': 4,'不恒等于': 4,'&&': 3,'且': 3,'||': 2,'或': 2
            // };

            if (list.opr === '++' || list.opr === '--') {
                c = list[0] === '++' || list[0] === '--' ? list[1] : list[0];
                if (Object.prototype.toString.call(c) !== '[object Array]' && (!c || c.replace(/^[a-zA-Z_]+[a-zA-Z0-9_]*/g, '') !== '')) {
                    throw new Error('Syntax error: "++","--" in ' + hui.Template.format(list.join(' '), strMap));
                }
                c = c.join ? hui.Template.expCalculate(c, model, strMap, 'keep_var') : {
                    parent: model,
                    child: c
                };

                result = c.parent[c.child];
                c.parent[c.child] = result + (list.opr === '++' ? 1 : -1);
                result = list[0] === '++' || list[0] === '--' ? c.parent[c.child] : result;

            } else if (list.opr === '.') {
                for (var i = 0, ilen = list.length; i < ilen; i++) {
                    c = list[i];
                    if (Object.prototype.toString.call(c) === '[object Array]') {
                        c = hui.Template.expCalculate(c, model, strMap);
                    }
                    if (c && String(c).indexOf('#') === 0) {
                        c = strMap[c.replace(/(^#{|}$)/g, '')];
                    }
                    list[i] = c;
                }

                data = model;
                var ilen = list.length + (keep_var === 'keep_var' ? -1 : 0);

                for (var i = 0; i < ilen; i++) {
                    c = list[i];
                    if (!data) {
                        break;
                    }
                    data = data[c];
                    i++;
                }
                result = keep_var === 'keep_var' ? {
                    parent: data || {},
                    child: list[list.length - 1]
                } : data;
            } else {
                for (var i = 0, ilen = list.length; i < ilen; i++) {
                    c = list[i];
                    if (Object.prototype.toString.call(c) === '[object Array]') {
                        c = hui.Template.expCalculate(c, model, strMap);
                        list[i] = c;
                    } else {
                        list[i] = hui.Template.expIsOperator(c) ? list[i] : hui.Template.getKeyValue(c, model, strMap);
                    }

                }

                if (list.opr === '!') {
                    result = list.pop();
                    for (var i = list.length - 1; i > -1; i--) {
                        result = !m;
                    }
                } else if (list.opr === '?') {
                    c = list[0];
                    if (c) {
                        result = list[2];
                    } else {
                        result = list[4];
                    }
                } else if (list.opr === '||') {
                    result = false || list[0];
                    for (var i = 1, ilen = list.length; i < ilen && !result; i++) {
                        c = list[i];
                        if (c === '||' && !result) {
                            m = list[i + 1];
                            result = result || m;
                        }
                        i++;
                    }
                } else if (list.opr === '&&') {
                    result = true && list[0];
                    for (var i = 1, ilen = list.length; i < ilen && result; i++) {
                        c = list[i];
                        if (c === '&&' && result) {
                            m = list[i + 1];
                            result = result && m;
                        }
                        i++;
                    }
                } else if (list.opr === '!==' || list.opr === '===' || list.opr === '!=' || list.opr === '==') {
                    result = list[0];
                    for (var i = 1, ilen = list.length; i < ilen; i++) {
                        c = list[i];
                        m = list[i + 1];
                        if (c === '!==' || c === '!=') {
                            result = String(result) !== String(m);
                        } else if (c === '===' || c === '==') {
                            result = String(result) === String(m);
                        }
                        i++;
                    }
                } else if (list.opr === '>' || list.opr === '>=' || list.opr === '<' || list.opr === '<=') {
                    result = list[0];
                    for (var i = 1, ilen = list.length; i < ilen; i++) {
                        c = list[i];
                        m = list[i + 1];
                        if (c === '>') {
                            result = result > m;
                        } else if (c === '>=') {
                            result = result >= m;
                        } else if (c === '<') {
                            result = result < m;
                        } else if (c === '<=') {
                            result = result <= m;
                        }
                        i++;
                    }
                } else if (list.opr === '+' || list.opr === '-') {
                    if (list[0] === '+' || list[0] === '-') {
                        result = list.pop();
                        for (var i = list.length - 1; i > -1; i--) {
                            result = list[i] === '-' ? 0 - result : result;
                        }
                    } else {
                        result = list[0];
                        for (var i = 1, ilen = list.length; i < ilen; i++) {
                            c = list[i];
                            m = list[i + 1];
                            if (c === '+') {
                                result = result + m;
                            } else if (c === '-') {
                                result = result - m;
                            }
                            i++;
                        }
                    }
                } else if (list.opr === '*' || list.opr === '/' || list.opr === '%') {
                    result = list[0];
                    for (var i = 1, ilen = list.length; i < ilen; i++) {
                        c = list[i];
                        m = list[i + 1];
                        if (c === '*') {
                            result = result * m;
                        } else if (c === '/') {
                            result = result / m;
                        } else if (c === '%') {
                            result = result % m;
                        }
                        i++;
                    }
                }
            }

            return result;
        },
        getKeyValue: function (v1, model, strMap, keep_str) {
            v1 = String(v1);
            strMap = strMap || [];
            var keyword = {
                'null': {
                    v: null
                },
                'undefined': {
                    v: undefined
                },
                'true': {
                    v: true
                },
                'false': {
                    v: false
                }
            };
            var value = v1,
                v = v1;

            // Number
            if (v.replace(/^[+\-]?(\d+\.)?\d+/g, '') === '') {
                value = Number(v);
            }
            // String
            else if (~'"\''.indexOf(v.substr(0, 1))) {
                value = v.replace(/(^[\"\']|[\"\']$)/g, '');
            }
            // JSON
            else if (~'{['.indexOf(v.substr(0, 1))) {
                v = v1.replace(/#{(\d+)}/g, function (match, key) {
                    return strMap[key];
                });
                v = v.replace(/@@/g, '#').replace(/@_/g, '@');

                value = (new Function('return ' + v))();
                value = value;
            }
            // null, undefined, true, false
            else if (keyword[v]) {
                value = keyword[v].v;
            }
            // #{0}
            else if (v.indexOf('#') > -1) {
                value = hui.Template.format(strMap[v.replace(/(^#{|}$)/g, '')], model);
                //value = v;
            }
            // model[v]
            else {
                //else if (v.replace(/^[a-zA-Z_]+[a-zA-Z0-9_]*/g, '') === '') {
                value = model[v];
            }

            return value;
        },
        // b.a !== #{0}, b[#{1}] !== #{2}, a+b
        expTokenization: function (str) {
            var list,
                pre,
                next,
                c,
                isOperator = false,
                s1 = [],
                s2 = [];

            list = String(str).split('');
            for (var i = 0, ilen = list.length; i < ilen; i++) {
                c = list[i];
                pre = ',' + String(list[i - 1]) + c + ',';
                next = String(list[i - 1]) + c + String(list[i + 1]);
                if ('[]()+-!*/%<=>&|?:,.'.indexOf(c) !== -1) {
                    isOperator = true;
                    if (',++,--,==,!=,>=,<=,&&,||,'.indexOf(pre) !== -1 || /\d\.\d/.test(next)) {
                        s1.push(c);
                    } else {
                        if (s1.length) {
                            s2.push(s1);
                        }
                        s1 = [];
                        s1.push(c);
                    }
                } else if (c === '#') {
                    if (s1.length) {
                        s2.push(s1);
                    }
                    s1 = [];
                    for (var j = i; j < ilen; j++) {
                        s1.push(list[j]);
                        if (list[j] === '}') {
                            i = j;
                            break;
                        }
                    }
                    s2.push(s1);
                    s1 = [];
                } else if (c === ' ' || c === '\t') {
                    continue;
                } else if (list[i - 1] === '.' && '0123456789'.indexOf(c) !== -1) {
                    s1.push(c);
                } else {
                    if (isOperator) {
                        isOperator = false;
                        if (s1.length) {
                            s2.push(s1);
                        }
                        s1 = [];
                    }
                    s1.push(c);
                }
            }

            if (s1.length) {
                s2.push(s1);
            }

            for (var i = 0, ilen = s2.length; i < ilen; i++) {
                if (s2[i] && s2[i].join) {
                    s2[i] = s2[i].join('');
                }
            }

            return s2;
        },
        expConvertBracket: function (token, model, strMap) {
            //
            token = token || [];
            var root = [],
                parent = null,
                cur = root,
                list = [root],
                c;
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '(' || c === '[') {
                    parent = cur;
                    if (c === '[') {
                        cur.push('.');
                    }
                    cur = [];

                    parent.push(cur);
                    list.push(cur);

                } else if (list.length > 1 && c === ')' || c === ']') {
                    list.pop();
                    cur = parent || cur;
                    if (c === ']') {
                        //cur.push(c);
                    }
                    parent = list[list.length - 2];
                } else {
                    cur.push(c);
                }

            }

            return root;
        },
        expConvertTree: function (token, model, strMap) {
            for (var i = 0, ilen = token.length; i < ilen; i++) {
                if (Object.prototype.toString.call(token[i]) === '[object Array]') {
                    token[i] = hui.Template.expConvertTree(token[i]);
                    i = i;
                }
            }
            return hui.Template.expBuildTree(token);
        },
        expBuildTree: function (token) {
            token = token && token.length && token.join ? token : [];

            var degree = {
                '.': 11,
                '的': 11,
                '[': 11,
                ']': 11,
                '(': 10,
                ')': 10,
                '++': 9,
                '自加加': 9,
                '--': 9,
                '自减减': 9,
                '^!': 8,
                '非': 8,
                '^+': 8,
                '正': 8,
                '^-': 8,
                '负': 8,
                '*': 7,
                '乘以': 7,
                '/': 7,
                '除以': 7,
                '%': 7,
                '求余': 7,
                '+': 6,
                '加上': 6,
                '-': 6,
                '减去': 6,
                '<': 5,
                '小于': 5,
                '<=': 5,
                '不大于': 5,
                '>': 5,
                '大于': 5,
                '>=': 5,
                '不小于': 5,
                '==': 4,
                '等于': 4,
                '!=': 4,
                '不等于': 4,
                '===': 4,
                '恒等于': 4,
                '!==': 4,
                '不恒等于': 4,
                '&&': 3,
                '且': 3,
                '||': 2,
                '或': 2
            };
            var c,
                pre,
                nxt,
                cd,
                newtoken,
                n;
            // .
            token = token;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '.') {
                    cd = degree[c];
                    pre = newtoken[newtoken.length - 1];
                    // a.b
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(token[i + 1])) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                        } else {
                            pre = [];
                            pre.push(newtoken.pop());
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.push(pre);
                        }
                    } else {
                        throw new Error('SyntaxError: invalid Dot(.) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                } else {
                    newtoken.push(c);
                }
            }
            // ++, --
            token = newtoken;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '++' || c === '--') {
                    // i++
                    if (hui.Template.expIsOperand(token[i - 1]) && !hui.Template.expIsOperand(token[i + 1])) {
                        n = [];
                        n.push(newtoken.pop());
                        n.push(c);
                        n.lev = degree[c];
                        n.opr = c;
                        newtoken.push(n);
                    }
                    // ++i
                    else if (!hui.Template.expIsOperand(token[i - 1]) && hui.Template.expIsOperand(token[i + 1])) {
                        n = [];
                        n.push(c);
                        n.push(token[i + 1]);
                        n.lev = degree[c];
                        n.opr = c;
                        newtoken.push(n);
                        i++;
                    } else {
                        throw new Error('SyntaxError: invalid Increment(++),Decrement(--) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                } else {
                    newtoken.push(c);
                }
            }
            // ! + -
            token = newtoken;
            newtoken = [token.pop()];
            for (var i = token.length - 1; i > -1; i--) {
                c = token[i];
                if ((c === '+' || c === '-' || c === '!') && (hui.Template.expIsOperator(token[i - 1]) || i === 0)) {
                    // ! ! ! + - - - + a
                    cd = degree['^' + c];
                    pre = newtoken[0];
                    if (hui.Template.expIsOperand(pre)) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.unshift(c);
                        } else {
                            pre = [];
                            pre.unshift(newtoken.shift());
                            pre.unshift(c);
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.unshift(pre);
                        }
                    } else {
                        throw new Error('SyntaxError: invalid Negative(+),Positive(-) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                } else {
                    newtoken.unshift(c);
                }
            }
            // * / %
            token = newtoken;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '*' || c === '/' || c === '%') {
                    cd = degree[c];
                    pre = newtoken[newtoken.length - 1];
                    // a.b
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(token[i + 1])) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                        } else {
                            pre = [];
                            pre.push(newtoken.pop());
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.push(pre);
                        }
                    } else {
                        throw new Error('SyntaxError: invalid MUL(*),DIV(/),(MOD)% operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                } else {
                    newtoken.push(c);
                }
            }
            // a + b
            token = newtoken;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '+' || c === '-') {
                    cd = degree[c];
                    pre = newtoken[newtoken.length - 1];
                    // a.b
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(token[i + 1])) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                        } else {
                            pre = [];
                            pre.push(newtoken.pop());
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.push(pre);
                        }
                    } else {
                        throw new Error('SyntaxError: invalid ADD(+) or SUB(-) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                } else {
                    newtoken.push(c);
                }
            }
            // a >= b
            token = newtoken;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '>' || c === '>=' || c === '<' || c === '<=') {
                    cd = degree[c];
                    pre = newtoken[newtoken.length - 1];
                    // a.b
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(token[i + 1])) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                        } else {
                            pre = [];
                            pre.push(newtoken.pop());
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.push(pre);
                        }
                    } else {
                        throw new Error('SyntaxError: invalid Morethan(>,>=),Lessthan(<=,<) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                } else {
                    newtoken.push(c);
                }
            }
            // a === b
            token = newtoken;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '==' || c === '!=' || c === '===' || c === '!==') {
                    cd = degree[c];
                    pre = newtoken[newtoken.length - 1];
                    // a.b
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(token[i + 1])) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                        } else {
                            pre = [];
                            pre.push(newtoken.pop());
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.push(pre);
                        }
                    } else {
                        throw new Error('SyntaxError: invalid Equal(==,!==) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                } else {
                    newtoken.push(c);
                }
            }
            // a && b
            token = newtoken;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '&&') {
                    cd = degree[c];
                    pre = newtoken[newtoken.length - 1];
                    // a.b
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(token[i + 1])) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                        } else {
                            pre = [];
                            pre.push(newtoken.pop());
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.push(pre);
                        }
                    } else {
                        throw new Error('SyntaxError: invalid AND(&&) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                } else {
                    newtoken.push(c);
                }
            }
            // a || b
            token = newtoken;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '||') {
                    cd = degree[c];
                    pre = newtoken[newtoken.length - 1];
                    // a.b
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(token[i + 1])) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                        } else {
                            pre = [];
                            pre.push(newtoken.pop());
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.push(pre);
                        }
                    } else {
                        throw new Error('SyntaxError: invalid OR(||) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                } else {
                    newtoken.push(c);
                }
            }
            // a ? b : c
            token = newtoken;
            newtoken = [];
            for (var i = token.length - 1; i > -1; i--) {
                c = token[i];
                if (c === '?') {
                    // a ? b : c
                    cd = degree[c];
                    pre = token[i - 1];
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(newtoken[0]) && newtoken[1] === ':' && hui.Template.expIsOperand(newtoken[2])) {
                        nxt = [];
                        nxt.push(pre);
                        nxt.push(c);
                        nxt.push(newtoken.shift());
                        nxt.push(newtoken.shift());
                        nxt.push(newtoken.shift());
                        i--;

                        nxt.lev = cd;
                        nxt.opr = c;
                        newtoken.unshift(nxt);
                    } else {
                        throw new Error('SyntaxError: invalid "A ? B : C"  operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                } else {
                    newtoken.unshift(c);
                }
            }

            return newtoken;
        },
        expIsOperator: function (key) {
            key = key === null || key === undefined ? '' : key;
            if (Object.prototype.toString.call(key) === '[object Array]') {
                key = '';
            }

            key = String(key).replace(/(^\s+|\s+$)/g, '');
            var result = key.length < 4 && ',+,-,*,/,%,&&,||,!,==,===,!=,!==,>,<,>=,<=,.,[,],(,),'.indexOf(',' + key + ',') != -1;
            return result;
        },
        expIsOperand: function (v) {
            return v !== null && v !== undefined && !hui.Template.expIsOperator(v);
        },

        // Regular Expressions for parsing tags and attributes
        startTag: /^<!--\s*([A-Za-z0-9\u4e00-\u9fa5]+):(.*?)-->/,
        endTag: /^<!--\s*\/([A-Za-z0-9\u4e00-\u9fa5]+)\s*-->/,

        // Block Elements
        typeBlock: {
            'if': 1,
            'elif': 1,
            'else': 1,
            'for': 1
        },

        // Elements that you can':1,' intentionally':1,' leave open
        // (and which close themselves)
        typeCloseSelf: {
            'var': 1,
            'use': 1
        },
        typeEndAndStart: {
            'elif': 1,
            'else': 1
        },
        typeScope: {
            'for': 1,
            'use': 1,
            'html': 1
        },
        // Strict xml model!!
        parse: function (html, model, root) {
            var me = this;
            var stack = me.tokenization(html);
            if (root === undefined) {
                // 根节点 
                root = hui.Template.createElement('html', {
                    childNodes: [],
                    nodeType: 'startTag',
                    labelValue: ''
                });
                hui.Template.rootNode = root;
            }
            if (model) {
                root.scopeChain = root.scopeChain || {};
                for (var i in model) {
                    if (model.hasOwnProperty(i)) {
                        root.scopeChain[i] = model[i];
                    }
                }
            }
            me.treeConstruction(stack, root);

            var c = root;
            var result = '';
            var tplList = [];
            for (var j = 0, jlen = c.childNodes.length; j < jlen; j++) {
                tplList.push(me.mergeModel(c.childNodes[j]));
            }
            result = tplList.join('');

            return result;
            //me.domtree;
        },
        overloadTagName: function (node) {
            var tagNameList = [
                '安排', 'var',
                '定义', 'var',
                '设定', 'var',
                '如果', 'if',
                '如果结束', 'if',
                '假如', 'if',
                '假设', 'if',
                '假设结束', 'if',
                '又假设', 'elif',
                '又假如', 'elif',
                '否则', 'else',
                '循环', 'for',
                '循环结束', 'for'
            ];
            if (node) {
                for (var i = 0, ilen = tagNameList.length; i < ilen; i++) {
                    if (node.tagName === tagNameList[i++]) {
                        node.tagName = tagNameList[i];

                    }
                }
            }
            return node;
        },

        // Token serial
        tokenization: function (html) {
            var me = this,
                tokenserial = [],
                index,
                m, n,
                token,
                nodeValue,
                match,
                html = String(html);


            // <!--comment--> <html>1234</html>
            while (html) {
                // start tag
                if (html.indexOf('<!--') === 0 && me.startTag.test(html)) {
                    match = html.match(me.startTag);

                    token = {
                        tagName: match[1],
                        nodeValue: match[2],
                        labelValue: match[0],
                        nodeType: 'startTag'
                    };
                    token = hui.Template.overloadTagName(token);
                    token.nodeType = me.typeCloseSelf[token.tagName] ? 'selfClose' : (me.typeEndAndStart[token.tagName] ? 'typeEndAndStart' : token.nodeType);
                    tokenserial.push(token);

                    html = html.substring(match[0].length);
                }
                // end tag
                else if (html.indexOf('<!--') === 0 && me.endTag.test(html)) {
                    match = html.match(me.endTag);

                    token = {
                        tagName: match[1],
                        nodeType: 'endTag'
                    };
                    tokenserial.push(hui.Template.overloadTagName(token));

                    html = html.substring(match[0].length);
                }
                // Comment
                else if (html.indexOf('<!--') === 0) {
                    m = html.indexOf('<!--');
                    n = html.indexOf('-->', m + 4);
                    n = n == -1 ? html.length : n;
                    nodeValue = html.substring(m + 4, n);
                    token = {
                        tagName: 'comment',
                        nodeValue: nodeValue,
                        labelValue: nodeValue,
                        nodeType: 'selfClose'
                    };
                    tokenserial.push(hui.Template.overloadTagName(token));

                    html = html.substring(0, m) + html.substring(n + 3, html.length);
                }
                // text
                else {
                    m = html.indexOf('<!--', 1);
                    index = m == -1 ? html.length : m;
                    nodeValue = html.substring(0, index);

                    token = {
                        tagName: 'nodetext',
                        nodeValue: nodeValue,
                        labelValue: nodeValue,
                        nodeType: 'selfClose'
                    };
                    tokenserial.push(hui.Template.overloadTagName(token));
                    html = html.substring(index, html.length);
                }
            }

            return tokenserial;
        },
        treeConstruction: function (tokens, parentNode) {
            var me = this,
                domtree = parentNode || hui.Template.rootNode,
                curentParent = domtree,
                token,
                elem,
                parentElem;
            for (var i = 0, len = tokens.length; i < len; i++) {
                token = tokens[i];

                if (token.nodeType == 'selfClose') {
                    elem = me.createElement(token.tagName, token);
                    curentParent.childNodes.push(elem);
                    // elem.parentNode = curentParent.getGUID();
                    elem.parentNode = curentParent;
                } else if (token.nodeType == 'startTag') {
                    // 'if,elif,else' is special.
                    if (token.tagName == 'if') {
                        elem = me.createElement('ifif', {});
                        curentParent.childNodes.push(elem);
                        // elem.parentNode = curentParent.getGUID();
                        elem.parentNode = curentParent;
                        elem.childNodes = [];
                        curentParent = elem;
                    }

                    elem = me.createElement(token.tagName, token);
                    curentParent.childNodes.push(elem);
                    // elem.parentNode = curentParent.getGUID();
                    elem.parentNode = curentParent;

                    // Not empty tag
                    if (!me.typeCloseSelf[token.tagName]) {
                        elem.childNodes = [];
                        curentParent = elem;
                    }
                } else if (token.nodeType == 'endTag') {
                    if (!me.typeCloseSelf[token.tagName]) {

                        if (token.tagName == curentParent.tagName) {
                            curentParent = curentParent.parentNode;
                        } else if (token.tagName == 'if' && ~',if,elif,else,'.indexOf(',' + curentParent.tagName)) {
                            parentElem = curentParent.parentNode;
                            if (parentElem.tagName == 'ifif') {
                                curentParent = parentElem.parentNode;
                            }
                        }
                        // Only deal with typeBlock!
                        else if (me.typeBlock[token.tagName]) {
                            parentElem = curentParent;
                            while (parentElem) {
                                if (parentElem.tagName == token.tagName) {
                                    curentParent = parentElem.parentNode;
                                } else {
                                    parentElem = parentElem.parentNode;
                                }
                            }
                        }
                    }
                } else if (token.nodeType == 'typeEndAndStart') {
                    if (me.typeEndAndStart[token.tagName]) {
                        if (~',if,elif,'.indexOf(',' + curentParent.tagName + ',') && ~',elif,else,'.indexOf(',' + token.tagName)) {
                            curentParent = curentParent.parentNode;
                        }

                        elem = me.createElement(token.tagName, token);
                        curentParent.childNodes.push(elem);
                        // elem.parentNode = curentParent.getGUID();
                        elem.parentNode = curentParent;

                        // Not empty tag
                        if (!me.typeCloseSelf[token.tagName]) {
                            elem.childNodes = [];
                            curentParent = elem;
                        }
                    }
                }
            }
            return domtree;

        },
        createElement: function (tagName, options) {
            var me = this,
                clazz = hui.Template.NodeElement,
                elem = new clazz();

            options = options || {};
            options.tagName = tagName;

            for (var i in options) {
                elem[i] = options[i];
            }
            if (me.typeScope[String(tagName).toLowerCase()]) {
                elem.scopeChain = elem.scopeChain || {};
            }
            return elem;
        },
        mergeModel: function (nodeItem) {
            var me = this,
                str,
                k,
                v,
                c,
                list,
                tplList,
                model,
                result;
            if (nodeItem && nodeItem.tagName) {
                var tagName = String(nodeItem.tagName).toLowerCase();

                if (tagName === 'var') {
                    str = nodeItem.nodeValue;
                    list = hui.Template.varTokenization(str);
                    result = '';
                    model = nodeItem.getScopeChainModel();
                    hui.Template.varConvert(list.token, model, list.strMap, str);
                    nodeItem.updateScopeChainModel(model);
                } else if (tagName === 'ifif') {
                    model = nodeItem.getScopeChainModel();
                    result = '';
                    for (var i = 0, ilen = nodeItem.childNodes.length; i < ilen; i++) {
                        c = nodeItem.childNodes[i];
                        if (c.tagName === 'else') {
                            tplList = [];
                            for (var j = 0, jlen = c.childNodes.length; j < jlen; j++) {
                                tplList.push(me.mergeModel(c.childNodes[j]));
                            }
                            result = tplList.join('');
                            break;
                        } else {
                            k = hui.Template.varTokenization(c.nodeValue);
                            var k2 = hui.Template.getExpValue(k.token[0][0], model, k.strMap);
                            if (k2) {
                                tplList = [];
                                for (var j = 0, jlen = c.childNodes.length; j < jlen; j++) {
                                    tplList.push(me.mergeModel(c.childNodes[j]));
                                }
                                result = tplList.join('');
                                break;
                            }
                        }
                    }
                } else if (tagName === 'for') {
                    str = nodeItem.nodeValue;
                    var scopeChain = nodeItem.scopeChain;
                    model = nodeItem.getScopeChainModel();

                    v = str.split(' in ');
                    k = v[0].replace(/(^\s+|\s+$)/g, '').replace(/(^#{|}$)/g, '');
                    list = model[v[1].replace(/(^\s+|\s+$)/g, '').replace(/(^#{|}$)/g, '')];

                    if (Object.prototype.toString.call(list) !== '[object Array]') {
                        throw new Error('SyntaxError: invalid "list" operand in "' + str + '"');
                    }

                    c = nodeItem;
                    result = '';
                    tplList = [];
                    for (var i in list) {
                        if (list.hasOwnProperty(i)) {
                            scopeChain[k] = model[k] = list[i];
                        }
                        for (var j = 0, jlen = c.childNodes.length; j < jlen; j++) {
                            tplList.push(me.mergeModel(c.childNodes[j]));
                        }
                    }
                    result = tplList.join('');
                    return result;
                }
                /**
                '<!-- use: item(main=${p.name}, sub=${p.email}) -->',
                '<!-- target: item --><li>${main}[${sub}]</li>'
                */
                else if (tagName === 'use') {
                    str = nodeItem.nodeValue.replace(/(^\s+|\s+$)/g, '');
                    model = nodeItem.getScopeChainModel();
                    nodeItem.childNodes = [];

                    var varStr = str.substring(str.indexOf('(') + 1, str.lastIndexOf(')')),
                        targetName = str.substring(0, str.indexOf('(')),
                        targetContent = hui.Template.getTarget(targetName);
                    //varStr = hui.Template.format(varStr, model);
                    me.parse('<!--var:' + varStr + '-->', null, nodeItem);
                    result = me.parse(targetContent, null, nodeItem);
                } else if (tagName === 'nodetext') {
                    str = nodeItem.nodeValue;
                    model = nodeItem.getScopeChainModel();
                    result = hui.Template.format(str, model);
                } else {
                    result = nodeItem.labelValue;
                }
            }
            return result;
        }

    };

    hui.Template.NodeElement = function (options) {
        this.nodeValue = '';
        this.guid = hui.Template.NodeElement.makeGUID();
    };
    hui.Template.NodeElement.prototype = {
        getGUID: function () {
            var me = this;
            return me.guid;
        },
        getScopeChain: function () {
            var me = this,
                parent = me,
                result = [],
                typeScope = hui.Template.typeScope;
            while (parent) {
                if (typeScope[String(parent.tagName).toLowerCase()]) {
                    result.unshift(parent.scopeChain);
                }
                parent = parent.parentNode;
            }
            return result;
        },
        getScopeChainModel: function () {
            var me = this,
                list = me.getScopeChain(),
                model = {};
            for (var j = list.length - 1; j > -1; j--) {
                for (var i in list[j]) {
                    if (!model.hasOwnProperty(i)) {
                        model[i] = list[j][i];
                    }
                }
            }
            return model;
        },
        updateScopeChainModel: function (model) {
            var me = this,
                list = me.getScopeChain();
            for (var i in model) {
                if (model.hasOwnProperty(i)) {
                    for (var j = list.length - 1; j > -1; j--) {
                        if (list[j].hasOwnProperty(i)) {
                            list[j][i] = model[i];
                            j = -1;
                            i = undefined;
                        }
                    }
                    if (i !== undefined) {
                        list[list.length - 1][i] = model[i];
                    }
                }
            }

        }
    };
    /**
     * @name 获取唯一id
     * @public
     * @return {String}
     */
    hui.Template.NodeElement.makeGUID = (function () {
        var guid = 1000; // 0 -> root
        return function () {
            return String('tpl_' + guid++);
        };
    })();
});

'use strict';
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
hui.define('hui_md5', ['hui@0.0.1'], function () {

    hui.MD5 = (function () {
        /*
         * Perform a simple self-test to see if the VM is working
         */
        //function md5_vm_test()
        //{
        //  return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72";
        //}
        /*
         * Configurable variables. You may need to tweak these to be compatible with
         * the server-side, but the defaults work in most cases.
         */
        var hexcase = 0; /* hex output format. 0 - lowercase; 1 - uppercase        */
        var chrsz = 8; /* bits per input character. 8 - ASCII; 16 - Unicode      */

        /*
         * These are the functions you'll usually want to call
         * They take string arguments and return either hex or base-64 encoded strings
         */
        function hex_md5(s) {
            return binl2hex(core_md5(str2binl(s), s.length * chrsz));
        }
        /*
         * Calculate the MD5 of an array of little-endian words, and a bit length
         */
        function core_md5(x, len) {
            /* append padding */
            x[len >> 5] |= 0x80 << ((len) % 32);
            x[(((len + 64) >>> 9) << 4) + 14] = len;

            var a = 1732584193;
            var b = -271733879;
            var c = -1732584194;
            var d = 271733878;

            for (var i = 0; i < x.length; i += 16) {
                var olda = a;
                var oldb = b;
                var oldc = c;
                var oldd = d;

                a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
                d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
                c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
                b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
                a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
                d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
                c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
                b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
                a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
                d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
                c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
                b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
                a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
                d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
                c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
                b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

                a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
                d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
                c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
                b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
                a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
                d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
                c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
                b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
                a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
                d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
                c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
                b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
                a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
                d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
                c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
                b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

                a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
                d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
                c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
                b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
                a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
                d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
                c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
                b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
                a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
                d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
                c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
                b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
                a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
                d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
                c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
                b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

                a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
                d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
                c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
                b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
                a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
                d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
                c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
                b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
                a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
                d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
                c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
                b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
                a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
                d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
                c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
                b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

                a = safe_add(a, olda);
                b = safe_add(b, oldb);
                c = safe_add(c, oldc);
                d = safe_add(d, oldd);
            }
            return Array(a, b, c, d);

        }

        /*
         * These functions implement the four basic operations the algorithm uses.
         */
        function md5_cmn(q, a, b, x, s, t) {
            return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
        }

        function md5_ff(a, b, c, d, x, s, t) {
            return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
        }

        function md5_gg(a, b, c, d, x, s, t) {
            return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
        }

        function md5_hh(a, b, c, d, x, s, t) {
            return md5_cmn(b ^ c ^ d, a, b, x, s, t);
        }

        function md5_ii(a, b, c, d, x, s, t) {
            return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
        }



        /*
         * Add integers, wrapping at 2^32. This uses 16-bit operations internally
         * to work around bugs in some JS interpreters.
         */
        function safe_add(x, y) {
            var lsw = (x & 0xFFFF) + (y & 0xFFFF);
            var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
        }

        /*
         * Bitwise rotate a 32-bit number to the left.
         */
        function bit_rol(num, cnt) {
            return (num << cnt) | (num >>> (32 - cnt));
        }

        /*
         * Convert a string to an array of little-endian words
         * If chrsz is ASCII, characters >255 have their hi-byte silently ignored.
         */
        //不能删
        function str2binl(str) {
            var bin = Array();
            var mask = (1 << chrsz) - 1;
            for (var i = 0; i < str.length * chrsz; i += chrsz)
                bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (i % 32);
            return bin;
        }



        /*
         * Convert an array of little-endian words to a hex string.
         */
        //不能删
        function binl2hex(binarray) {
            var hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef';
            var str = '';
            for (var i = 0; i < binarray.length * 4; i++) {
                str += hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) +
                    hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF);
            }
            return str;
        }

        return {
            'encode': hex_md5
        };
    })();

});

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
 * @name 文本输入框控件
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 * @param {Object} options 控件初始化参数.
 */
hui.define('hui_textinput', ['hui@0.0.1'], function () {

    hui.TextInput = function (options, pending) {
        hui.TextInput.superClass.call(this, options, 'pending');

        this.type = 'textinput'; //注：在后面会自动判断
        this.form = 1;
        this.tagName = 'input';
        this.value = this.value === 0 ? 0 : (this.value || '');
        // useAgent: false <input ui="type:'TextInput'", true <div ui="type:'TextInput'"
        this.useAgent = false;
        this.autoHideError = this.autoHideError === undefined ? false : this.autoHideError;
        this.autoValidate = this.autoValidate === undefined ? false : this.autoValidate;

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.TextInput.prototype = {
        /**
         * @name 全角转半角
         */
        doDBC2SBC: function (str) {
            var result = '';
            str = str === undefined || str === null ? '' : String(str);
            for (var i = 0; i < str.length; i++) {
                var code = str.charCodeAt(i); //获取当前字符的unicode编码
                if (code >= 65281 && code <= 65373) { //在这个unicode编码范围中的是所有的英文字母已及各种字符
                    result += String.fromCharCode(str.charCodeAt(i) - 65248); //把全角字符的unicode编码转换为对应半角字符的unicode码
                } else if (code == 12288) { //空格
                    result += String.fromCharCode(str.charCodeAt(i) - 12288 + 32);
                } else {
                    result += str.charAt(i);
                }
            }
            return result;
        },
        /**
         * @name 获取文本输入框的值
         * @public
         * @return {String}
         */
        getValue: function () {
            var me = this,
                value = me.getMain().value;
            if (me.DBC2SBC) {
                value = me.doDBC2SBC(value);
            }
            return value;
        },

        /**
         * @name 设置文本输入框的值
         * @public
         * @param {String} value
         */
        setValue: function (value) {
            if (this.isReadonly() || this.isDisabled()) {
                return;
            }
            var me = this;
            value = value === undefined ? '' : value;
            if (me.DBC2SBC) {
                value = me.doDBC2SBC(value);
            }

            me.getChangeHandler(value);

            me.getMain().value = value;
            if (value) {
                me.hidePlaceholder();
                me.showEye();
                //this.getFocusHandler();
            } else {
                me.showPlaceholder();
                me.hideEye();
                //this.getBlurHandler();
            }
        },

        /**
         * @name 设置输入控件的title提示
         * @public
         * @param {String} title
         */
        setTitle: function (title) {
            this.getMain().setAttribute('title', title);
        },

        /**
         * @name 将文本框设置为不可写
         * @public
         */
        disable: function (disabled) {
            if (typeof disabled === 'undefined') {
                disabled = true;
            }
            if (disabled) {
                this.getMain().disabled = 'disabled';
            } else {
                this.getMain().removeAttribute('disabled');
            }
        },

        /**
         * @name 设置控件为只读
         * @public
         * @param {Object} readonly
         */
        setReadonly: function (readonly) {
            readonly = !!readonly;
            this.getMain().readOnly = readonly;
            /*this.getMain().setAttribute('readonly', readonly);*/
            this.readonly = readonly;
        },
        getInput: function () {
            var me = this,
                main = me.getMain(),
                input,
                input = me.useAgent ? hui.c(me.getClass('text'))[0] : main;
            return input;
        },
        getPlaceholder: function () {
            var me = this,
                main = me.getMain(),
                input,
                input = me.useAgent ? hui.c(me.getClass('placeholder'))[0] : hui.util.findSiblingByClassName(main, me.getClass('placeholder'), 'pre');
            return input;
        },
        getEye: function () {
            var me = this,
                main = me.getMain(),
                input,
                input = me.useAgent ? hui.c(me.getClass('eye'))[0] : hui.util.findSiblingByClassName(main, me.getClass('eye'), 'pre');
            return input;
        },
        renderInput: function () {
            var me = this,
                main = me.getMain(),
                tpl = '<input type="text" class="#{0}" />';
            if (me.agent) {
                hui.appendHTML(main, hui.format(tpl, me.getClass('text')));
            }
        },
        renderPlaceholder: function () {
            var me = this,
                main = me.getMain(),
                elem = me.getPlaceholder();
            if (!elem) {
                elem = me.getDocument().createElement('SPAN');
                elem.className = me.getClass('placeholder');
                me.setInnerHTML(elem, me.placeholder);
                if (me.agent) {
                    main.appendChild(elem);
                    main.insertBefore(elem, main.firstChild);
                } else {
                    main.parentNode.insertBefore(elem, main.parentNode.firstChild);
                }
            }
        },
        renderEye: function () {
            var me = this,
                main = me.getMain(),
                tpl = '<a href="#nogo" onmousedown="hui.Control.getById(\'#{1}\').onmousedown()" onmouseup="hui.Control.getById(\'#{1}\').onmouseup()" class="#{0}">Show</a>',
                elem = me.getEye();
            if (!elem) {
                elem = hui.util.getDom(hui.format(tpl, me.getClass('eye'), me.getId()))[0];

                if (me.agent) {
                    main.appendChild(elem);
                    main.insertBefore(elem, main.firstChild);
                } else {
                    main.parentNode.insertBefore(elem, main.parentNode.firstChild);
                }
            }
        },
        /**
         * @name 渲染控件
         * @protected
         * @param {Object} main 控件挂载的DOM.
         */
        render: function () {
            hui.TextInput.superClass.prototype.render.call(this);
            var me = this,
                main = me.getMain(),
                tagName = String(main.tagName).toLowerCase();

            // 判断是否input或textarea输入框
            if (tagName !== 'input' && tagName !== 'textarea' && tagName !== 'password') {
                me.useAgent = true;
            }
            if (me.useAgent) {
                me.renderInput();
            }
            if (me.placeholder) {
                me.renderPlaceholder();
            }
            if (me.useEye) {
                me.renderEye();
            }
            me.setSize();
            if (me.main && !!me.value) {
                me.getMain().value = me.value;
            }
        },
        initBehavior: function () {
            var me = this,
                main = me.getMain();
            // 设置readonly状态
            me.setReadonly(!!me.readonly);

            var input = me.getInput();
            var placeholder = me.getPlaceholder();
            if (input.value && placeholder) {
                placeholder.style.display = 'none';
            }
            me.setValue(me.getValue());
            // 绑定事件
            main.onpaste =
                main.onkeydown = me.getPressDownHandler;
            main.onkeyup = me.getPressUpHandler;
            main.onkeypress = me.getPressHandler;
            main.onfocus = me.getFocusHandler;
            main.onblur = me.getBlurHandler;
            main.onchange = me.getChangeHandler;

        },

        /**
         * @name 获取获焦事件处理函数
         * @private
         * @return {Function}
         */
        getFocusHandler: function (e) {
            // this -> control's main element
            var main = this;
            var me = main.getMain ? main : hui.Control.getById(main.control);

            if (me.autoHideError) {
                me.hideError();
            }
            me.onfocus(e);
        },

        /**
         * @name 获取失焦事件处理函数
         * @private
         * @return {Function}
         */
        getBlurHandler: function (e) {
            // this -> control's main element
            var main = this;
            var me = main.getMain ? main : hui.Control.getById(main.control);

            if (me.allowSpace === false) {
                me.removeSpace();
            }

            var value = me.getValue();
            if (me.placeholder) {
                (value ? me.hidePlaceholder() : me.showPlaceholder());
            }
            if (me.useEye) {
                (value ? me.showEye() : me.hideEye());
            }

            if (me.autoValidate) {
                me.validate();
            }
            if (!value && me.hideBlankError) {
                me.hideError();
            }
            me.onblur(e);
        },
        removeSpace: function () {
            var me = this,
                value = me.getValue();
            var v = value.replace(/\s/ig, '');
            if (value !== v) {
                me.setValue(v);
            }
        },
        /**
         * @name 获取键盘敲击的事件handler
         * @private
         * @return {Function}
         */
        getPressHandler: function (e) {
            var main = this;
            var me = main.getMain ? main : hui.Control.getById(main.control);

            e = e || hui.window.event;
            var keyCode = e.keyCode || e.which;
            if (keyCode == 13) { // enter
                return me.onenter();
            }
            me.onkeypress(e);
        },
        getPressDownHandler: function (e) {
            var main = this;
            var me = main.getMain ? main : hui.Control.getById(main.control);
            e = e || hui.window.event;
            var keyCode = e.keyCode || e.which;
            if (keyCode != 8) { // back/delete
                me.hidePlaceholder('force');
            }
            window.setTimeout(function () {
                me.onkeydown(e);
            }, 5);
        },
        getPressUpHandler: function (e) {
            var main = this,
                me = main.getMain ? main : hui.Control.getById(main.control),
                value = me.getValue();
            (value ? me.hidePlaceholder('force') : me.showPlaceholder());
            // 注：搜狗输入法会默认加个空格占位，去掉的话会导致无法输入！
            if (value.indexOf(' ') !== value.length - 1 && me.allowSpace === false) {
                me.removeSpace();
            }

            if (me.useEye) {
                (value ? me.showEye() : me.hideEye());
            }

            me.onkeyup(e);
        },
        getChangeHandler: function (e) {
            var main = this;
            var me = main.getMain ? main : hui.Control.getById(main.control);
            var value = (e && (e.target || e.srcElement)) ? me.getMain().value : e;
            me.onchange(value);
        },
        hidePlaceholder: function (sign) {
            var me = this,
                input = me.getInput(),
                placeholder = me.getPlaceholder();
            if (placeholder) {
                if (sign === false) {
                    placeholder.style.display = 'block';
                } else if (sign === 'force') {
                    placeholder.style.display = 'none';
                } else {
                    placeholder.style.display = input.value ? 'none' : 'block';
                }
            }
        },
        showPlaceholder: function () {
            this.hidePlaceholder(false);
        },
        hideEye: function (sign) {
            var me = this,
                input = me.getInput(),
                eye = me.getEye();
            if (eye) {
                if (sign === false) {
                    eye.style.display = 'block';
                } else if (sign === 'force') {
                    eye.style.display = 'none';
                } else {
                    eye.style.display = input.value ? 'block' : 'none';
                }
            }
        },
        showEye: function () {
            this.hideEye(false);
        },
        onkeypress: new Function(),
        onkeydown: new Function(),
        onkeyup: new Function(),
        onenter: new Function(),
        onfocus: new Function(),
        onblur: new Function(),
        onchange: new Function(),
        onmousedown: function () {
            var main = this;
            var me = main.getMain ? main : hui.Control.getById(main.control);
            main = me.getMain();
            me.old_type = main.type;
            //main.type = 'text';
            if (!me.main_text) {
                me.main_text = document.createElement('SPAN');
                me.main_text.innerHTML = main.outerHTML.replace(/type\=\"?password\"?/i, 'type="text" ');
                me.main_text.childNodes[0].style.marginLeft = '0px';
                main.parentNode.appendChild(me.main_text);
                main.parentNode.insertBefore(me.main_text, main.nextSibling);
            }
            me.main_text.childNodes[0].value = main.value;
            me.main_text.style.display = 'block';
            main.style.display = 'none';


        },
        onmouseup: function () {
            var main = this;
            var me = main.getMain ? main : hui.Control.getById(main.control);
            main = me.getMain();
            main.type = me.old_type || 'text';

            if (me.main_text) {
                me.main_text.style.display = 'none';
                main.style.display = 'block';
                main.parentNode.removeChild(me.main_text);
                me.main_text = null;
            }

        },

        /** 
         * @name 获焦并选中文本
         * @public
         */
        focusAndSelect: function () {
            this.getMain().select();
        },

        /**
         * @name 释放控件
         * @public
         */
        dispose: function () {
            // 卸载main的事件
            var main = this.getMain();
            main.onkeypress = null;
            main.onchange = null;
            main.onpropertychange = null;
            main.onfocus = null;
            main.onblur = null;

            hui.Control.prototype.dispose.call(this);
        }
    };

    // hui.TextInput 继承了 hui.Control
    hui.inherits(hui.TextInput, hui.Control);

});

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
 * @name 按钮控件
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 * @param {Object} options 控件初始化参数.
 */
hui.define('hui_button', ['hui@0.0.1'], function () {

    hui.Button = function (options, pending) {
        this.isFormItem = false; // 注：getParamMap时不需要处理button
        hui.Button.superClass.call(this, options, 'pending');

        // 类型声明，用于生成控件子dom的id和class
        this.type = 'btn';

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.Button.prototype = {
        /**
         * @name button的html模板
         * @private
         */
        tplButton: '<span id="#{2}" class="#{1}">#{0}</span>',

        /**
         * @name 默认的onclick事件执行函数, 不做任何事，容错
         * @public
         */
        onclick: new Function(),

        /**
         * @name 获取button主区域的html
         * @private
         * @return {String}
         */
        getMainHtml: function () {
            var me = this;

            return hui.Control.format(
                me.tplButton,
                me.content || '&nbsp;',
                me.getClass('label'),
                me.getId('label')
            );
        },

        /**
         * @name 渲染控件
         * @public
         */
        render: function () {
            hui.Button.superClass.prototype.render.call(this);
            var me = this,
                main = me.getMain(),
                innerDiv;

            innerDiv = main.firstChild;
            if (!me.content && innerDiv && innerDiv.tagName != 'DIV') {
                me.content = me.getInnerHTML();
            }

            me.setInnerHTML(me, me.getMainHtml());

            // 初始化状态事件
            main.onclick = me.getHandlerClick();

            // 设定宽度
            me.width && (main.style.width = me.width + 'px');

            // 设置disabled
            me.setDisabled(!!me.disabled);
        },

        /**
         * @name 获取按钮点击的事件处理程序
         * @private
         * @return {function}
         */
        getHandlerClick: function () {
            var me = this;
            return function (e) {
                if (!me.isDisabled()) {
                    me.onclick();
                }
            };
        },

        /**
         * @name 设置按钮的显示文字
         * @public
         * @param {String} content 按钮的显示文字
         */
        setContent: function (content) {
            this.setInnerHTML(hui.g(this.getId('label'), this.getMain()), content);
            return this;
        },
        /**
         * @name 设置按钮的显示文字
         * @public
         * @param {String} content 按钮的显示文字
         */
        showWaiting: function () {

        }
    };

    /*通过hui.Control派生hui.Button*/
    //hui.Control.derive(hui.Button);
    /* hui.Button 继承了 hui.Control */
    hui.inherits(hui.Button, hui.Control);


});


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
 * @name 按钮控件
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 * @param {Object} options 控件初始化参数.
 */
hui.define('hui_checkbox', ['hui@0.0.1'], function () {

    hui.Checkbox = function (options, pending) {
        hui.Checkbox.superClass.call(this, options, 'pending');

        this.type = 'checkbox';

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.Checkbox.prototype = {
        getInput: function () {
            var me = this,
                main = me.getMain(),
                input = hui.c(me.getClass('input'), main)[0];
            return input;
        },
        getIcon: function () {
            var me = this,
                main = me.getMain(),
                icon = hui.c(me.getClass('icon'), main)[0];
            return icon;
        },
        getLabel: function () {
            var me = this,
                main = me.getMain(),
                icon = hui.c(me.getClass('label'), main)[0];
            return icon;
        },
        renderLabel: function () {
            var me = this,
                main = me.getMain(),
                label = me.getLabel(),
                tpl = '<label class="#{0}">#{1}</label>';
            if (!label) {
                hui.appendHTML(main, hui.format(tpl,
                    me.getClass('label'),
                    me.label
                ));
            } else {
                main.appendChild(label);
            }
        },
        /**
         * @name 渲染控件
         * @protected
         * @param {Object} main 控件挂载的DOM.
         */
        render: function () {
            hui.Checkbox.superClass.prototype.render.call(this);
            var me = this,
                main = me.getMain();
            // 绘制宽度和高度
            me.setSize();

            var tpl = '<i class="#{1}"><input type="checkbox" class="#{0}" style="display:none" />✓&nbsp;&nbsp;&nbsp;</i>';
            hui.appendHTML(main, hui.format(tpl,
                me.getClass('input'),
                me.getClass('icon')
            ));
            me.renderLabel();
        },
        initBehavior: function () {
            var me = this,
                icon = me.getIcon(),
                //label = me.getLabel(),
                main = me.getMain();

            me.setChecked(!!me.checked);
            main.onclick = hui.fn(me.getClickHandler, me);
            icon.onselectstart = new Function('return false;');
        },
        setValue: function (value) {
            var me = this;
            me.setChecked(!!value);
        },
        getValue: function () {
            var me = this,
                value = me.getChecked() ? me.getPresetValue() : '';
            return value;
        },
        getPresetValue: function () {
            var me = this,
                value = me.value !== undefined ? me.value : me.getInput().value;
            return value;
        },
        setPresetValue: function (value) {
            var me = this,
                input = me.getInput();
            me.value = value;
            input.value = value;
        },
        setChecked: function (checked) {
            var me = this,
                input = me.getInput(),
                main = me.getMain();
            if (checked === false) {
                input.checked = false;
                hui.removeClass(main, me.getClass('checked'));
            } else {
                input.checked = true;
                hui.addClass(main, me.getClass('checked'));
            }
        },
        getChecked: function () {
            var me = this;
            return !!me.getInput().checked;
        },
        getClickHandler: function () {
            var me = this;
            me.setChecked(!me.getChecked());
            me.onclick();
        },
        onclick: new Function()

    };

    /* hui.Checkbox 继承了 hui.Control */
    hui.inherits(hui.Checkbox, hui.Control);


});

'use strict';
//    ____     ____                _   _     ____          ____      ____                   
//  /\  __\  /\  __\    /'\_/`\  /\ \/\ \  /\  __`\      /\  __`\  /\  __`\    /'\_/`\      
//  \ \ \_/_ \ \ \_/_  /\      \ \ \ \ \ \ \ \ \ \_\     \ \ \ \_\ \ \ \ \ \  /\      \     
//   \ \  __\ \ \  __\ \ \ \_/\_\ \ \ \ \ \ \ \ \  __     \ \ \  __ \ \ \ \ \ \ \ \_/\_\    
//    \ \ \_/  \ \ \_/_ \ \ \\ \ \ \ \ \_/ \ \ \ \_\ \  __ \ \ \_\ \ \ \ \_\ \ \ \ \\ \ \   
//     \ \_\    \ \____/ \ \_\\ \_\ \ `\___/  \ \____/ /\_\ \ \____/  \ \_____\ \ \_\\ \_\  
//      \/_/     \/___/   \/_/ \/_/  `\/__/    \/___/  \/_/  \/___/    \/_____/  \/_/ \/_/  
//                                                                                          
//                                                                                          

/**
 * @name 页面遮盖控件(全局页面只需要一个遮盖层，所以为单例)
 * @public
 * @author wanghaiyang
 * @date 2013/08/08
 * @param {Object} options 控件初始化参数.
 */
hui.define('hui_mask', ['hui@0.0.1'], function () {
    hui.Mask = {
        getId: function () {
            return 'hj001_mask';
        },
        //getStyle: function(){return 'background:#000;opacity:0.25;filter:alpha(opacity=25);width:100%;height:100%;position:absolute;top:0;left:0;z-index:50000';},
        init: function init() {
            var el = document.createElement('div');
            el.id = hui.Mask.getId();
            el.className = 'hj001_mask hide';
            document.body.appendChild(el);
            el.innerHTML = '<iframe width="100%" height="100%" frameborder="0" src="about:blank" ></iframe>';

            return el;
        },
        /**
         * @name 重新绘制遮盖层的位置
         * @private
         * @param {HTMLElement} mask 遮盖层元素.
         */
        repaintMask: function repaintMask() {
            var width = Math.max(
                    document.documentElement.offsetWidth,
                    document.body.offsetWidth
                ),
                height = Math.max(
                    document.documentElement.offsetHeight,
                    document.body.offsetHeight
                );
            var mask = hui.Mask.getMask();
            // 注：各个浏览器高宽计算不一致，因此需要针对不同浏览器分别处理！
            if (!window.ActiveXObject) {
                // '>=IE9, FF, Chrome';
                mask.style.width = width + 'px';
                mask.style.height = height + 'px';
            } else if (!window.XMLHttpRequest) {
                // 'IE6';
                mask.style.width = width - 21 + 'px';
                mask.style.height = height + 'px';
            } else if (!document.querySelector) {
                // 'IE7';
                mask.style.width = width + 'px';
                mask.style.height = height + 'px';
            } else if (!document.addEventListener) {
                // 'IE8';
                mask.style.width = width - 21 + 'px';
                mask.style.height = height - 7 + 'px';
            } else {
                // '>= IE9';
                mask.style.width = width - 18 + 'px';
                mask.style.height = height + 30 + 'px';
            }

            mask.style.top = '0px'; //document.body.scrollTop + document.documentElement.scrollTop + 'px';
            mask.style.left = '0px'; //document.body.scrollLeft + document.documentElement.scrollLeft + 'px';
        },
        /**
         * @name 页面大小发生变化的事件处理器
         * @private
         */
        resizeHandler: function resizeHandler() {
            hui.Mask.repaintMask();
        },
        /**
         * @name 获取遮盖层dom元素
         * @private
         * @return {HTMLElement} 获取到的Mask元素节点.
         */
        getMask: function getMask() {
            var mask = document.getElementById(hui.Mask.getId());
            if (!mask) {
                mask = hui.Mask.init();
            }
            return mask;
        },
        /**
         * @name 显示遮盖层
         */
        show: function () {
            var mask = hui.Mask.getMask();
            hui.Mask.repaintMask(mask);
            hui.removeClass(mask, 'hide');

            if (window.addEventListener) {
                window.addEventListener('scroll', hui.Mask.resizeHandler, false);
            } else if (window.attachEvent) {
                window.attachEvent('on' + 'scroll', hui.Mask.resizeHandler);
                //此处使用回调函数call()，让 this指向elem
            }
            /*
            hui.Mask.htmlOverflow = document.documentElement.style.overflow;
            document.documentElement.style.overflow = 'hidden';
            hui.Mask.bodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            */
        },
        /**
         * @name 隐藏遮盖层
         */
        hide: function (id) {
            hui.addClass(hui.Mask.getMask(), 'hide');

            if (window.removeEventListener) {
                window.removeEventListener('scroll', hui.Mask.resizeHandler, false);
            }
            if (window.detachEvent) {
                window.detachEvent('on' + 'scroll', hui.Mask.resizeHandler);
            }
            /*
            document.documentElement.style.overflow = hui.Mask.htmlOverflow || '';
            document.body.style.overflow = hui.Mask.bodyOverflow || '';
            */
        }
    };

});

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
 * @name 组件
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 * @param {Object} options 控件初始化参数.
 */
hui.define('hui_label', ['hui@0.0.1'], function () {

    hui.Label = function (options, pending) {
        this.isFormItem = false; // 注：getParamMap时不需要处理label
        hui.Label.superClass.call(this, options, 'pending');

        // 类型声明，用于生成控件子dom的id和class
        this.type = 'label';

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.Label.prototype = {
        /**
         * @name 渲染控件
         * @param {Object} main 控件挂载的DOM.
         */
        render: function () {
            hui.Label.superClass.prototype.render.call(this);
            var me = this;
            //me.main = main;
            if (me.text !== undefined) {
                me.setInnerHTML(me, me.text);
            }
        },
        /**
         * @name 设置文字
         * @param {Object} main 控件挂载的DOM.
         */
        setValue: function (txt) {
            var me = this;
            //me.main = main;
            if (me.main) {
                txt = String(txt);
                me.setInnerHTML(me, txt);
                me.value = txt;
                me.text = txt;
            }
        }
    };

    /* hui.Label 继承了 hui.Control */
    hui.inherits(hui.Label, hui.Control);

});

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
 * @name 对话框控件
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 * @param {Object} options 控件初始化参数.
 */

hui.define('hj_quicklogin', ['hui@0.0.1', 'hui_requester@0.0.1', 'hui_md5@0.0.1', 'hui_textinput@0.0.1', 'hui_button@0.0.1', 'hui_checkbox@0.0.1'], function () {

    hui.Validator.setRule('username', {
        'validate': function (text) {
            var len = text.length;
            if (len === 0) {
                return 1;
            } else if (len < 2 || len > 12 || !(/^[_a-zA-Z\d\u4E00-\uFA29]+$/.test(text))) {
                return 2;
            } else if (text.replace(/[0-9]/ig, '') === '') {
                return 3;
            }
            var me = this;
            if (me.existValue == text && me.isExist == 'exist') {
                return 4;
            }
            return 0;
        },
        'noticeText': {
            1: '用户名不能为空',
            2: '用户名由2-12位字母,数字,下划线,中文组成,不含标点符号',
            3: '用户名应至少包含一个字母或汉字',
            4: '用户名已存在'
        }
    }, 'force');
    hui.Validator.setRule('accountname', {
        'validate': function (text) {
            var len = text.length;
            if (len === 0) {
                return 1;
            }
            return 0;
        },
        'noticeText': {
            1: '用户名不能为空'
        }
    }, 'force');
    hui.Validator.setRule('accountpassword', {
        'validate': function (text) {
            var len = text.length;
            if (len === 0) {
                return 1;
            }
            return 0;
        },
        'noticeText': {
            1: '密码不能为空'
        }
    }, 'force');
    hui.Validator.setRule('password', {
        'validate': function (text, control_id, parentControl) {
            var len = text.length;
            if (len === 0) {
                return 1;
            } else if (len < 6) {
                return 2;
            } else if (control_id) {
                var ctr = hui.Control.getById(control_id, parentControl) || hui.Control.getByFormName(control_id, parentControl),
                    value = ctr.getValue();
                if (text === value) {
                    return 4;
                }

                // weak password
                var weak_password = ['000000', '111111', '1111111', '11111111', '112233', '123123', '123321', '123456', '12345678', '654321', '666666', '888888', 'abcdef', 'abcabc', 'abc123', 'a1b2c3', 'aaa111', '123qwe', 'qwerty', 'qweasd', 'admin', 'password', 'p@ssword', 'passwd', 'iloveyou', '5201314', 'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball', '111111', 'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael', 'football'];
                for (var i = 0; i < weak_password.length; i++) {
                    if (text == weak_password[i]) {
                        return 3;
                    }
                }
            }

            return 0;
        },
        'noticeText': {
            1: '密码不能为空',
            2: '密码至少6位',
            3: '请不要使用弱密码',
            4: '密码不能与用户名相同'
        },
        checkStrong: function (psw) {
            var level;
            // blank
            if (psw === '') {
                level = -1;
                return level;
            }
            // normal
            level = 0;
            psw = psw.replace(/\s/g, '');
            if (psw.length <= 5) return level;
            var str;
            str = psw.replace(/[a-z]/g, '');
            if (str !== psw) level++;
            psw = str;
            str = psw.replace(/[A-Z]/g, '');
            if (str !== psw) level++;
            psw = str;
            str = psw.replace(/[0-9]/g, '');
            if (str !== psw) level++;
            psw = str;
            if (str.length > 0) level++;
            psw = str;

            if (level > 3) {
                level = 3;
            }

            return level;
        }
    }, 'force');
    hui.Validator.setRule('validationcode', {
        'validate': function (text) {
            var f = /^\d{6}$/.test(text);
            if (text.length === 0) {
                return 1;
            } else if (!!text && !f) {
                return 2;
            }
            return 0;
        },
        'noticeText': {
            1: '短信验证码不能为空',
            2: '短信验证码格式不正确'
        }
    }, 'force');

    hui.Validator.setRule('mobile', {
        'validate': function (text) {
            var len = text.length;
            text = text.replace(/[^0-9]/ig, '');
            text = text.replace(/^86/ig, '');

            var f = /^(13\d|15\d|18\d|14\d|170)\d{8}$/.test(text);
            if (len === 0) {
                return 1;
            } else if (len !== 11) {
                return 2;
            } else if (!f) {
                return 3;
            }
            var me = this;
            if (me.existValue == text && me.isExist == 'exist') {
                return 4;
            }
            return 0;
        },
        'noticeText': {
            1: '手机号码不能为空',
            2: '手机号码由11位数字组成',
            3: '目前只支持13*、15*、18*、14*、170号段',
            4: '手机号已存在'
        }
    }, 'force');

    hui.Validator.setRule('email', {
        'validate': function (text) {
            var len = text.length;
            if (len === 0) {
                return 1;
            } else if (len > 64) {
                return 2;
            } else if (!/^([^@\s\u4E00-\uFA29]+)@((?:[-a-zA-Z0-9]+\.)+[a-zA-Z]{2,})$/ig.test(text)) {
                return 3;
            }
            var me = this;
            if (me.existValue == text && me.isExist == 'exist') {
                return 4;
            }
            return 0;
        },
        'noticeText': {
            1: '邮箱地址不能为空',
            2: '邮箱地址不能超过64位',
            3: '邮箱地址格式错误',
            4: '邮箱地址已存在'
        }
    }, 'force');

    // 构造函数
    hui.HJ_QuickLogin = function (options, pending) {
        this.isFormItem = false;
        hui.HJ_QuickLogin.superClass.call(this, options, 'pending');

        this.type = 'hj_quicklogin';
        this.controlMap = {};

        // 监控事件接口
        this.monitorList = {};


        // 进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.HJ_QuickLogin.prototype = {
        getCaptcha: function () {
            return '<img alt="点击更换验证码" width="150" height="40" class="hj001_captcha" id="hj001_captcha_img" onclick="this.src=this.getAttribute(\'src_bak\')+\'&\'+Math.random()" src_bak="http://captcha.yeshj.com/captcha_v2.php?token=28c880b9635a58d351932ad844fa7510&amp;w=150&amp;h=40&amp;r=0.5453804655216155">';
        },
        getTpl: function () {
            var tpl =
                '<div class="hj001_login_container">' +
                '   <a href="###" onclick="hui.Control.getByFormName(\'hj_quicklogin\').showDialog(\'\');"  class="hj001_close_btn">╳</a>' +
                '   <!-- 手机号注册-->' +
                '   <div class="hj001_dialog" ui="type:\'HJ_Reg_mobile\',formName:\'hj_reg_mobile\'" style="display:none">' +
                '       <div class="hj001_title">' +
                '           <div class="hj001_title_item hj001_title_item_mobile hj001_title_item_selected">手机注册</div>' +
                '           <div class="hj001_title_item"><a href="###" onclick="hui.Control.getByFormName(\'hj_quicklogin\').showDialog(\'hj_reg_email\', \'inner\')">邮箱注册</a></div>' +
                '           <a href="###" class="hj001_title_login" onclick="hui.Control.getByFormName(\'hj_quicklogin\').showDialog(\'hj_reg_login\', \'inner\')">' +
                '               <span class="hj001_title_login_txt">登录</span> ' +
                '               <span class="hj001_icon_gt">〉</span></a>' +
                '       </div>' +
                '       <div class="hj001_login_warp">' +
                '           <div class="hj001_item">' +
                '               <input type="text" ui="type:\'TextInput\',formName:\'mobile\',rule:\'mobile\',placeholder:\'手机号\',autoValidate:true,autoHideError:true,allowSpace:false,hideBlankError:true,DBC2SBC:true"  class="hj001_ipt" maxlength="11" tabindex="1">' +
                '           </div>' +
                '           <div class="hj001_item">' +
                '               <input type="text" ui="type:\'TextInput\',formName:\'validationcode\',rule:\'validationcode\',placeholder:\'短信验证码\',autoValidate:true,autoHideError:true,allowSpace:false,hideBlankError:true,DBC2SBC:true" class="hj001_ipt_short" maxlength="6" tabindex="2">' +
                '               <a class="hj001_send_btn hui_btn" ui="type:\'Button\',formName:\'sendsms\',disabled:true" href="###"><span class="hui_btn_label">获取短信验证码</span></a>' +
                '           </div>' +
                '           <div class="hj001_item">' +
                '               <input ui="type:\'TextInput\',formName:\'username\',rule:\'username\',placeholder:\'用户名\',autoValidate:true,autoHideError:true,allowSpace:false,hideBlankError:true,DBC2SBC:true" type="text" class="hj001_ipt" maxlength="12" tabindex="3">' +
                '           </div>' +
                '           <div class="hj001_pwd_warp">' +
                '               <input type="password" ui="type:\'TextInput\',formName:\'password\',rule:\'password,username,hj_reg_mobile\',placeholder:\'密码\',useEye:true,autoValidate:true,autoHideError:true,allowSpace:false,hideBlankError:true,DBC2SBC:true" class="hj001_ipt" maxlength="20"  tabindex="4">' +
                '               <div class="hj001_pwd_complex_warp hj001_complex_-1">' +
                '                   <i class="hj001_pwd_complex_bg"></i>' +
                '                   <i class="hj001_pwd_complex"></i>' +
                '                   <span class="hj001_pwd_complex_txt hj001_grade01">弱</span>' +
                '                   <span class="hj001_pwd_complex_txt hj001_grade02">中</span>' +
                '                   <span class="hj001_pwd_complex_txt hj001_grade03">强</span>' +
                '               </div>        ' +
                '           </div>' +
                '           <div class="hj001_agreement">' +
                '               <div class="hui_checkbox" ui="type:\'Checkbox\',formName:\'agree\',value:\'agree\',checked:\'checked\'">' +
                '                   <label class="hui_checkbox_label">同意沪江的《<a target="_blank" onclick="event.cancelBubble = true;event.stopPropagation&&event.stopPropagation();" href="/signup/agreement/">用户协议</a>》</label>' +
                '               </div>' +
                '           </div>' +
                '       </div>' +
                '       <a href="###" ui="type:\'Button\',formName:\'submit\',disabled:\'true\'" class="hj001_login_btn" tabindex="5">注&nbsp;&nbsp;册</a>' +
                '       <a href="###" onclick="hui.Control.getByFormName(\'hj_quicklogin\').showDialog(\'hj_reg_email\', \'inner\')" class="hj001_another">选择邮箱注册</a>' +
                '   </div>' +
                '   <!-- 邮箱注册-->' +
                '   <div class="hj001_dialog" ui="type:\'HJ_Reg_email\',formName:\'hj_reg_email\'" style="display:none;">' +
                '       <div class="hj001_title">' +
                '           <div class="hj001_title_item hj001_title_item_mobile"><a href="###" onclick="hui.Control.getByFormName(\'hj_quicklogin\').showDialog(\'hj_reg_mobile\', \'inner\')">手机注册</a></div>' +
                '           <div class="hj001_title_item hj001_title_item_selected">邮箱注册</div>' +
                '           <a href="###" class="hj001_title_login" onclick="hui.Control.getByFormName(\'hj_quicklogin\').showDialog(\'hj_reg_login\', \'inner\')">' +
                '               <span class="hj001_title_login_txt">登录</span> ' +
                '               <span class="hj001_icon_gt">〉</span></a>' +
                '       </div>' +
                '       <div class="hj001_login_warp">' +
                '           <div class="hj001_item" style="z-index:50">' +
                '               <input type="text" ui="type:\'TextInput\',formName:\'email\',rule:\'email\',placeholder:\'邮箱\',autoHideError:true,allowSpace:false,hideBlankError:true,DBC2SBC:true" class="hj001_ipt" maxlength="50"  tabindex="1" style="ime-mode: disabled">' +
                '               <div class="hj001_email_list">' +
                '                   <div class="hj001_row hj001_first">请选择邮箱类型</div>' +
                '                   <div class="hj001_row"><a href="###" onclick="hui.Control.getByFormName(\'email\').choose(this)">123456@qq.com</a></div>' +
                '                   <div class="hj001_row"><a href="###" onclick="hui.Control.getByFormName(\'email\').choose(this)">123456@163.com</a></div>' +
                '                   <div class="hj001_row"><a href="###" onclick="hui.Control.getByFormName(\'email\').choose(this)">123456@126.com</a></div>' +
                '                   <div class="hj001_row"><a href="###" onclick="hui.Control.getByFormName(\'email\').choose(this)">123456@sina.com</a></div>' +
                '                   <div class="hj001_row"><a href="###" onclick="hui.Control.getByFormName(\'email\').choose(this)">123456@hotmail.com</a></div>' +
                '                   <div class="hj001_row"><a href="###" onclick="hui.Control.getByFormName(\'email\').choose(this)">123456@gmail.com</a></div>' +
                '               </div>' +
                '           </div>' +
                '           <div class="hj001_item">' +
                '               <input ui="type:\'TextInput\',formName:\'username\',rule:\'username\',placeholder:\'用户名\',autoValidate:true,autoHideError:true,allowSpace:false,hideBlankError:true,DBC2SBC:true" type="text" class="hj001_ipt" maxlength="12" tabindex="3">' +
                '           </div>' +
                '           <div class="hj001_pwd_warp">' +
                '               <input type="password" ui="type:\'TextInput\',formName:\'password\',rule:\'password,username,hj_reg_email\',placeholder:\'密码\',useEye:true,autoValidate:true,autoHideError:true,allowSpace:false,hideBlankError:true,DBC2SBC:true" class="hj001_ipt" maxlength="20"  tabindex="4">' +
                '               <div class="hj001_pwd_complex_warp hj001_complex_-1">' +
                '                   <i class="hj001_pwd_complex_bg"></i>' +
                '                   <i class="hj001_pwd_complex"></i>' +
                '                   <span class="hj001_pwd_complex_txt hj001_grade01">弱</span>' +
                '                   <span class="hj001_pwd_complex_txt hj001_grade02">中</span>' +
                '                   <span class="hj001_pwd_complex_txt hj001_grade03">强</span>' +
                '               </div>        ' +
                '           </div>' +
                '           <div class="hj001_agreement">' +
                '               <div class="hui_checkbox" ui="type:\'Checkbox\',formName:\'agree\',value:\'agree\',checked:\'checked\'">' +
                '                   <label class="hui_checkbox_label">同意沪江的《<a target="_blank" onclick="event.cancelBubble = true;event.stopPropagation&&event.stopPropagation();" href="/signup/agreement/">用户协议</a>》</label>' +
                '               </div>' +
                '           </div>' +
                '       </div>' +
                '       <a href="###" ui="type:\'Button\',formName:\'submit\',disabled:\'true\'" class="hj001_login_btn"  tabindex="14">注&nbsp;&nbsp;册</a>' +
                '       <a href="###" onclick="hui.Control.getByFormName(\'hj_quicklogin\').showDialog(\'hj_reg_mobile\', \'inner\')" class="hj001_another">选择手机注册</a>' +
                '   </div>' +
                '   <!-- 登录-->' +
                '   <div class="hj001_dialog" ui="type:\'HJ_Reg_login\',formName:\'hj_reg_login\'" style="display:none;">' +
                '       <div class="hj001_title">' +
                '           <div class="hj001_title_item hj001_title_item_mobile hj001_title_item_selected">账号登录</div>' +
                '           <div class="hj001_title_item"><a href="###" onclick="hui.Control.getByFormName(\'hj_quicklogin\').showDialog(\'hj_reg_onekey\', \'inner\')">短信登录</a></div>' +
                '           <a href="###" class="hj001_title_login" onclick="hui.Control.getByFormName(\'hj_quicklogin\').showDialog(window.hjquicklogin.prefer === \'email\' ? \'hj_reg_email\' : \'hj_reg_mobile\', \'inner\')">' +
                '               <span class="hj001_title_login_txt">注册</span> ' +
                '               <span class="hj001_icon_gt">〉</span></a>' +
                '       </div>' +
                '       <div class="hj001_login_warp hj001_panel_login">' +
                '           <div class="hj001_item">' +
                '               <input ui="type:\'TextInput\',formName:\'account\',rule:\'accountname\',placeholder:\'用户名/手机号/邮箱\',autoValidate:true,autoHideError:true,hideBlankError:true,DBC2SBC:false" type="text" maxLength="50"  class="hj001_ipt"   tabindex="21" />' +
                '           </div>' +
                '           <div class="hj001_item">' +
                '               <input type="password" ui="type:\'TextInput\',formName:\'password\',rule:\'accountpassword\',placeholder:\'密码\',autoHideError:true,hideBlankError:true,useEye:true,DBC2SBC:true" class="hj001_ipt" maxlength="20" tabindex="22">' +
                '           </div>' +
                '           <div class="hj001_item" id="hj001_captcha_code" style="display: none">' +
                '               <input type="text" ui="type:\'TextInput\',formName:\'code\',rule:\'\',placeholder:\'验证码\',autoValidate:true,allowSpace:false,DBC2SBC:true" maxLength="16" class="hj001_ipt_short" tabindex="23">' +
                '               <a class="hj001_send_btn" title="点击更换验证码" href="###">    ' + this.getCaptcha() + ' </a>' +
                '           </div>' +
                '           <div class="hj001_agreement">' +
                '               <div class="hj001_check">' +
                '                   <div ui="type:\'Checkbox\',formName:\'hj001_rememberlogin\',value:true,label:\'两周内免登录\',checked:\'checked\',isFormItem:false"></div>' +
                '               </div>' +
                '               <a target="_blank" href="http://pass.hujiang.com/forgot_password/" title="忘记密码？" class="hj001_forget_pwd">忘记密码？</a>' +
                '           </div>' +
                '       </div>' +
                '       <a href="###" ui="type:\'Button\',formName:\'submit\'" class="hj001_login_btn" tabindex="24">登&nbsp;&nbsp;录</a>' +
                '       <div class="hj001_other_login" id="other_login">' +
                '           <span class="hj001_txt">合作账号直接登录：</span>' +
                '           <a target="_blank" href="http://app.hujiang.com/outapp/binds/qq/?returnurl=#{cur_location}"     onclick="hui.Control.getByFormName(\'hj_quicklogin\').monitorList[\'hj_reg_login_qq\'    ]()" class="hj001_login_link hj001_icon_qq"      ></a>' +
                '           <a target="_blank" href="http://app.hujiang.com/outapp/binds/sina/?returnurl=#{cur_location}"   onclick="hui.Control.getByFormName(\'hj_quicklogin\').monitorList[\'hj_reg_login_weibo\' ]()" class="hj001_login_link hj001_icon_weibo"   ></a>' +
                '           <a target="_blank" href="http://app.hujiang.com/outapp/binds/renren/?returnurl=#{cur_location}" onclick="hui.Control.getByFormName(\'hj_quicklogin\').monitorList[\'hj_reg_login_renren\']()" class="hj001_login_link hj001_icon_renren"  ></a>' +
                '           <a target="_blank" href="http://app.hujiang.com/outapp/binds/baidu/?returnurl=#{cur_location}"  onclick="hui.Control.getByFormName(\'hj_quicklogin\').monitorList[\'hj_reg_login_baidu\' ]()" class="hj001_login_link hj001_icon_baidu"   ></a>' +
                '           <a target="_blank" href="http://app.hujiang.com/outapp/binds/douban/?returnurl=#{cur_location}" onclick="hui.Control.getByFormName(\'hj_quicklogin\').monitorList[\'hj_reg_login_douban\']()" class="hj001_login_link hj001_icon_douban"  ></a>' +
                '           <a target="_blank" href="http://app.hujiang.com/outapp/binds/alipay/?returnurl=#{cur_location}" onclick="hui.Control.getByFormName(\'hj_quicklogin\').monitorList[\'hj_reg_login_zhifu\' ]()" class="hj001_login_link hj001_icon_zhifu"   ></a>' +
                '       </div>' +
                '       <hr class="hj001_clearfix" />' +
                '   </div>' +
                '   <!-- 免注册一键登录-->' +
                '   <div class="hj001_dialog" ui="type:\'HJ_Reg_onekey\',formName:\'hj_reg_onekey\'" style="display:none">' +
                '       <div class="hj001_title">' +
                '           <div class="hj001_title_item"><a href="###" onclick="hui.Control.getByFormName(\'hj_quicklogin\').showDialog(\'hj_reg_login\', \'inner\')">账号登录</a></div>' +
                '           <div class="hj001_title_item hj001_title_item_mobile hj001_title_item_selected">短信登录</div>' +
                '           <a href="###" class="hj001_title_login" onclick="hui.Control.getByFormName(\'hj_quicklogin\').showDialog(window.hjquicklogin.prefer === \'email\' ? \'hj_reg_email\' : \'hj_reg_mobile\', \'inner\')">' +
                '               <span class="hj001_title_login_txt">注册</span> ' +
                '               <span class="hj001_icon_gt">〉</span></a>' +
                '       </div>' +
                '       <div class="hj001_login_warp">' +
                '           <div class="hj001_item">' +
                '               <input type="text" ui="type:\'TextInput\',formName:\'mobile\',rule:\'mobile\',placeholder:\'手机号，未注册将自动创建沪江账号\',autoValidate:true,autoHideError:true,allowSpace:false,hideBlankError:true,DBC2SBC:true"  class="hj001_ipt" maxlength="11" tabindex="1">' +
                '           </div>' +
                '           <div class="hj001_item">' +
                '               <input type="text" ui="type:\'TextInput\',formName:\'validationcode\',rule:\'validationcode\',placeholder:\'短信验证码\',autoValidate:true,autoHideError:true,allowSpace:false,hideBlankError:true,DBC2SBC:true" class="hj001_ipt_short" maxlength="6" tabindex="2">' +
                '               <a class="hj001_send_btn hui_btn" ui="type:\'Button\',formName:\'sendsms\',disabled:true" href="###"><span class="hui_btn_label">获取短信验证码</span></a>' +
                '           </div>' +
                '       </div>' +
                '       <a href="###" ui="type:\'Button\',formName:\'submit\'" class="hj001_login_btn" tabindex="5">登&nbsp;&nbsp;录</a>' +
                '       <a href="###" onclick="hui.Control.getByFormName(\'hj_quicklogin\').showDialog(\'hj_reg_email\', \'inner\')" class="hj001_another">选择邮箱注册</a>' +
                '       <div class="hj001_other_login" id="other_login">' +
                '           <span class="hj001_txt">合作账号直接登录：</span>' +
                '           <a target="_blank" href="http://app.hujiang.com/outapp/binds/qq/?returnurl=#{cur_location}"     onclick="hui.Control.getByFormName(\'hj_quicklogin\').monitorList[\'hj_reg_login_qq\'    ]()" class="hj001_login_link hj001_icon_qq"      ></a>' +
                '           <a target="_blank" href="http://app.hujiang.com/outapp/binds/sina/?returnurl=#{cur_location}"   onclick="hui.Control.getByFormName(\'hj_quicklogin\').monitorList[\'hj_reg_login_weibo\' ]()" class="hj001_login_link hj001_icon_weibo"   ></a>' +
                '           <a target="_blank" href="http://app.hujiang.com/outapp/binds/renren/?returnurl=#{cur_location}" onclick="hui.Control.getByFormName(\'hj_quicklogin\').monitorList[\'hj_reg_login_renren\']()" class="hj001_login_link hj001_icon_renren"  ></a>' +
                '           <a target="_blank" href="http://app.hujiang.com/outapp/binds/baidu/?returnurl=#{cur_location}"  onclick="hui.Control.getByFormName(\'hj_quicklogin\').monitorList[\'hj_reg_login_baidu\' ]()" class="hj001_login_link hj001_icon_baidu"   ></a>' +
                '           <a target="_blank" href="http://app.hujiang.com/outapp/binds/douban/?returnurl=#{cur_location}" onclick="hui.Control.getByFormName(\'hj_quicklogin\').monitorList[\'hj_reg_login_douban\']()" class="hj001_login_link hj001_icon_douban"  ></a>' +
                '           <a target="_blank" href="http://app.hujiang.com/outapp/binds/alipay/?returnurl=#{cur_location}" onclick="hui.Control.getByFormName(\'hj_quicklogin\').monitorList[\'hj_reg_login_zhifu\' ]()" class="hj001_login_link hj001_icon_zhifu"   ></a>' +
                '       </div>' +
                '       <hr class="hj001_clearfix" />' +
                '   </div>' +
                '   <!-- 免注册一键登录成功-->' +
                '   <div class="hj001_dialog" ui="type:\'HJ_Reg_onekey_next\',formName:\'hj_reg_onekey_next\'" style="display:none">' +
                '       <div class="hj001_success">' +
                '           <i class="hj001_icon_ok"></i>' +
                '           <span class="hj001_span">恭喜您注册成功！</span>' +
                '       </div>' +
                '       <div class="hj001_login_warp">' +
                '           <div class="hj001_onekey_next_tip2">' +
                '               <div class="hj001_tiptxt">首次登录，请完善您的个人信息。</div>' +
                '           </div>' +
                '           <div class="hj001_item">' +
                '               <input ui="type:\'TextInput\',formName:\'username\',rule:\'username\',placeholder:\'用户名\',autoValidate:true,autoHideError:true,allowSpace:false,hideBlankError:true,DBC2SBC:true" type="text" class="hj001_ipt" maxlength="12" tabindex="3">' +
                '           </div>' +
                '           <div class="hj001_pwd_warp">' +
                '               <input type="password" ui="type:\'TextInput\',formName:\'password\',rule:\'password,username,hj_reg_mobile\',placeholder:\'密码\',useEye:true,autoValidate:true,autoHideError:true,allowSpace:false,hideBlankError:true,DBC2SBC:true" class="hj001_ipt" maxlength="20"  tabindex="4">' +
                '               <div class="hj001_pwd_complex_warp hj001_complex_-1">' +
                '                   <i class="hj001_pwd_complex_bg"></i>' +
                '                   <i class="hj001_pwd_complex"></i>' +
                '                   <span class="hj001_pwd_complex_txt hj001_grade01">弱</span>' +
                '                   <span class="hj001_pwd_complex_txt hj001_grade02">中</span>' +
                '                   <span class="hj001_pwd_complex_txt hj001_grade03">强</span>' +
                '               </div>        ' +
                '           </div>' +
                '           <div class="hj001_item" style="z-index:50">' +
                '               <input type="text" ui="type:\'TextInput\',formName:\'email\',rule:\'email\',placeholder:\'邮箱\',autoHideError:true,allowSpace:false,hideBlankError:true,DBC2SBC:true" class="hj001_ipt" maxlength="50"  tabindex="5" style="ime-mode: disabled">' +
                '               <div class="hj001_email_list">' +
                '                   <div class="hj001_row hj001_first">请选择邮箱类型</div>' +
                '                   <div class="hj001_row"><a href="###" onclick="hui.Control.getByFormName(\'email\').choose(this)">123456@qq.com</a></div>' +
                '                   <div class="hj001_row"><a href="###" onclick="hui.Control.getByFormName(\'email\').choose(this)">123456@163.com</a></div>' +
                '                   <div class="hj001_row"><a href="###" onclick="hui.Control.getByFormName(\'email\').choose(this)">123456@126.com</a></div>' +
                '                   <div class="hj001_row"><a href="###" onclick="hui.Control.getByFormName(\'email\').choose(this)">123456@sina.com</a></div>' +
                '                   <div class="hj001_row"><a href="###" onclick="hui.Control.getByFormName(\'email\').choose(this)">123456@hotmail.com</a></div>' +
                '                   <div class="hj001_row"><a href="###" onclick="hui.Control.getByFormName(\'email\').choose(this)">123456@gmail.com</a></div>' +
                '               </div>' +
                '           </div>' +
                '       </div>' +
                '       <a href="###" ui="type:\'Button\',formName:\'submit\'" class="hj001_login_btn" tabindex="6">确认并继续浏览</a>' +
                '       <a href="###" onclick="hui.Control.getByFormName(\'hj_quicklogin\').showDialog(\'hj_reg_email\', \'inner\')" class="hj001_another">选择邮箱注册</a>' +
                '       <div class="hj001_onekey_next_tip">快速完善个人信息，享受更多优质服务</div>' +
                '       <hr class="hj001_clearfix" />' +
                '   </div>' +
                '   <!-- 邮箱注册成功-->' +
                '   <div class="hj001_dialog" ui="type:\'HJ_Reg_email_success\',formName:\'hj_reg_email_success\'" style="display:none;">' +
                '       <div class="hj001_success">' +
                '           <i class="hj001_icon_ok"></i>' +
                '           <span class="hj001_span">恭喜您注册成功！</span>' +
                '       </div>' +
                '       <p class="hj001_txt">通过学习，成就更好的自己！</br>畅学沪江网，和千万沪友一起进步！</p>' +
                '       <a href="###" ui="type:\'Button\',formName:\'submit\'" class="hj001_continue_btn" tabindex="24">继续浏览</a>' +
                '       <p class="hj001_email_txt">已发送激活邮件，<a target="_blank" href="http://www.hujiang.com" title="进入邮箱激活" class="hj001_go_email">进入邮箱激活</a></p>' +
                '   </div>' +
                '   <!-- 手机注册成功-->' +
                '   <div class="hj001_dialog" ui="type:\'HJ_Reg_mobile_success\',formName:\'hj_reg_mobile_success\'" style="display:none;">' +
                '       <div class="hj001_success">' +
                '           <i class="hj001_icon_ok"></i>' +
                '           <span class="hj001_span">恭喜您注册成功！</span>' +
                '       </div>' +
                '       <p class="hj001_txt">通过学习，成就更好的自己！</br>畅学沪江网，和千万沪友一起进步！</p>' +
                '       <p class="hj001_auto_close">' +
                '           <em class="hj001_em"><span class="hj001_left_time">3</span>秒</em>后弹窗自动关闭，</br>如果没有关闭请点击右上角关闭按钮。' +
                '       </p>' +
                '   </div>' +
                '   <!---->' +
                '</div>';
            return tpl;
        },



        /**
         * @name 绘制对话框
         * @public
         */
        render: function (options) {
            hui.HJ_QuickLogin.superClass.prototype.render.call(this);
            var me = this,
                main = me.getMain(),
                mobile;
            hui.addClass(main, 'hj001_quicklogin');
            if (me.className) {
                hui.addClass(main, me.className);
            }
            me.setInnerHTML(main, hui.format(me.getTpl(), {
                cur_location: window.location.href
            }));
            if (window.hjquicklogin && window.hjquicklogin.prefer === 'email') {
                mobile = hui.c('hj001_title_item_mobile')[0];
                mobile.parentNode.appendChild(mobile);
                mobile = hui.c('hj001_title_item_mobile')[1];
                mobile.parentNode.appendChild(mobile);
            }
            // 渲染对话框
            hui.Control.init(main, (hui.Action ? hui.Action.get() : {}).model, me);
            //me.showDialog('hj_reg_mobile');
        },
        showDialog: function (module_name, inner) {
            var me = this,
                reg_mobile = me.getByFormName('hj_reg_mobile'),
                reg_email = me.getByFormName('hj_reg_email'),
                mobile_success = me.getByFormName('hj_reg_mobile_success'),
                email_success = me.getByFormName('hj_reg_email_success'),
                login = me.getByFormName('hj_reg_login'),
                onekey = me.getByFormName('hj_reg_onekey'),
                onekey_next = me.getByFormName('hj_reg_onekey_next'),
                module = me.getByFormName(module_name);

            reg_mobile && reg_mobile.hide();
            reg_email && reg_email.hide();
            mobile_success && mobile_success.hide();
            email_success && email_success.hide();
            login && login.hide();
            onekey && onekey.hide();
            onekey_next && onekey_next.hide();
            hui.Mask && hui.Mask.hide();

            if (module) {
                hui.Mask && hui.Mask.show();
                me.show();
                module.hideError();
                module.show();
                me.onresizeCallback();
                hui.on(window, 'resize', me.onresize);
                //hui.on(window, 'scroll', me.onresize);
                hui.on(window, 'keyup', me.onesc);
                hui.addClass(document.documentElement, 'hj001_quicklogin_html');

                if (module_name == 'hj_reg_mobile_success') {
                    // 手机注册成功页 
                    if (me.monitorList['hj_reg_mobile_success']) {
                        me.monitorList['hj_reg_mobile_success']();
                    }
                    module.startTimer();
                } else if (module_name == 'hj_reg_email_success') {
                    // 邮箱注册成功页 
                    if (me.monitorList['hj_reg_email_success']) {
                        me.monitorList['hj_reg_email_success']();
                    }
                    module.updateEmailServer();
                    hui.c('hj001_close_btn')[0].onclick = function () {
                        window.location.reload && window.location.reload();
                    };
                } else if (module_name == 'hj_reg_mobile') {
                    // 在手机注册页的邮箱注册点击 
                    if (inner !== 'inner') {
                        // 点击页面上的注册 
                        if (me.monitorList['hj_reg']) {
                            me.monitorList['hj_reg']();
                        }
                    } else {
                        if (me.monitorList['hj_reg_email_mobile']) {
                            me.monitorList['hj_reg_email_mobile']();
                        }
                    }
                    module.getByFormName('mobile').mainFocus();
                } else if (module_name == 'hj_reg_email') {
                    // 在邮箱注册页的手机注册点击 
                    if (inner !== 'inner') {
                        // 点击页面上的注册 
                        if (me.monitorList['hj_reg']) {
                            me.monitorList['hj_reg']();
                        }
                    } else {
                        if (me.monitorList['hj_reg_mobile_email']) {
                            me.monitorList['hj_reg_mobile_email']();
                        }
                    }
                    module.getByFormName('email').mainFocus();
                } else if (module_name == 'hj_reg_login') {
                    // 登录沪江页展示 
                    if (me.monitorList['hj_reg_login']) {
                        me.monitorList['hj_reg_login']();
                    }
                    module.getByFormName('account').mainFocus();
                } else if (module_name == 'hj_reg_onekey') {
                    // 登录沪江页展示 
                    if (me.monitorList['hj_reg_login']) {
                        me.monitorList['hj_reg_login']();
                    }
                    module.getByFormName('mobile').mainFocus();
                } else if (module_name == 'hj_reg_onekey_next') {
                    // 登录沪江页展示 
                    if (me.monitorList['hj_reg_login']) {
                        me.monitorList['hj_reg_login']();
                    }
                    module.getByFormName('username').mainFocus();
                }
            } else {
                // 关闭按钮事件
                if (me.monitorList['hj_reg_close']) {
                    me.monitorList['hj_reg_close']();
                }
                // 解除disabled状态
                me.getByFormName('hj_reg_mobile').checkAgree();
                me.getByFormName('hj_reg_email').checkAgree();
                me.getByFormName('hj_reg_login').getByFormName('submit').setDisabled(false);

                me.hide();
                hui.off(window, 'resize', me.onresize);
                //hui.off(window, 'scroll', me.onresize);
                hui.off(window, 'keyup', me.onesc);
                hui.removeClass(document.documentElement, 'hj001_quicklogin_html');

            }
        },
        getSubName: function () {
            var str = window.location.host;
            var subName = this.getPassName() + (str.replace('hjclass.com', '') + 'hjclass.com' === str ? '.hjclass.com/quick' : '.hujiang.com/quick');
            return subName;
        },
        getPassName: function () {
            var subName = 'http://pass';
            return subName;
        },
        getQuickSubName: function () {
            return '/quick';
        },
        onregiste: function (me) {
            var parent = this,
                hj_quicklogin = hui.Control.getByFormName('hj_quicklogin');
            /*window.Requester.JSONP(parent.getSubName() + '/token/', {
            data: {
                appid: '9c0b989a7d2d8c5a952475c0f61e792f',
                act: 'gettoken'
            },
            onsuccess: function (result) {
                if (result.code === 0) {*/
            // Token
            var paramMap = me.getParamMap();
            if (me.getByFormName('submit').isDisabled()) {
                return;
            }
            //paramMap.appid = '9c0b989a7d2d8c5a952475c0f61e792f';
            //paramMap.token = result.data;
            paramMap.act = 'register';
            //paramMap.returnurl = window.location.href;
            paramMap.template = hj_quicklogin && hj_quicklogin.template ? hj_quicklogin.template : 'default';
            paramMap.returnurl = hj_quicklogin && hj_quicklogin.returnurl ? hj_quicklogin.returnurl : window.location.href.split('#')[0];
            paramMap.password = hui.MD5.encode(paramMap.password);
            if (hj_quicklogin && hj_quicklogin.source) {
                paramMap.source = hj_quicklogin.source;
            }

            me.getByFormName('submit').setDisabled().setContent('注  册  中 . . .');
            window.Requester.JSONP(parent.getSubName() + '/account/', {
                data: paramMap,
                onsuccess: function (result) {
                    if (result.code === 0) {
                        // Token
                        //alert(result.data);
                        hui.setCookie('hj001_username', result.data.user.username);
                        //hui.setCookie('hj001_uid', result['uid']);
                        me.parentControl.updateSSO.callback = function () {
                            me.parentControl.onRegisteSuccess(me, result);
                        };
                        me.parentControl.updateSSO(encodeURIComponent(result.data.ssotoken));
                    } else {
                        var code = result.code;
                        var field = {};
                        if (~'1100,1101,9004'.indexOf(code)) {
                            field.mobile = result.message;
                        } else if (~'1102,1103,1104,3003,3004,3005,3006'.indexOf(code)) {
                            field.validationcode = result.message;
                        } else if (~'1130,1131'.indexOf(code)) {
                            field.email = result.message;
                        } else if (~'1214,1221,1222'.indexOf(code)) {
                            field.username = result.message;
                        } else if (~'1223,1224'.indexOf(code)) {
                            field.password = result.message;
                        }

                        me.showErrorByTree(field);
                        me.getByFormName('submit').setDisabled(false).setContent('注  册');
                    }

                }
            });
            /*}
            }
        });*/
        },
        checkMobile: function (me) {
            var mobile = me.getByFormName('mobile'),
                sendsms = me.getByFormName('sendsms'),
                value = mobile.getValue();
            if (value && mobile.validate('not_show')) {
                sendsms.setDisabled(false);
                me.parentControl.checkMobileExist(me);
            } else {
                sendsms.setDisabled(true);
            }
        },

        checkMobileExist: function (me) {
            var parent = this,
                mobile = me.getByFormName('mobile');
            if (mobile) {
                mobile.showWaiting();
                /*window.Requester.JSONP(parent.getSubName() + '/token/', {
                data: {
                    appid: '9c0b989a7d2d8c5a952475c0f61e792f',
                    act: 'gettoken'
                },
                onsuccess: function (result) {
                    if (result.code === 0) {*/
                // Token
                var value = mobile.getValue();
                mobile.isExist = mobile.existValue == value ? mobile.existValue : '';
                mobile.existValue = value;
                window.Requester.JSONP(parent.getSubName() + '/account/', {
                    data: {
                        //appid: '9c0b989a7d2d8c5a952475c0f61e792f',
                        //token: result.data,
                        act: 'check_mobile',
                        mobile: mobile.getValue(),
                        reversal: true
                    },
                    onsuccess: function (result) {
                        if (result && result.code === 0 && result.data === true) {
                            mobile.showError(4, 'by_code');
                            mobile.isExist = 'exist';
                            me.getByFormName('sendsms').setDisabled();
                        } else if (result && result.code === 0 && result.data === false) {
                            mobile.showOK();
                            mobile.existValue = '';
                            me.getByFormName('sendsms').setDisabled(false);
                        } else {
                            mobile.showError(result.message);
                            me.getByFormName('sendsms').setDisabled();
                        }
                    }
                });
                /*}
                }
            });*/
            }
        },
        checkEmail: function (me) {
            var parent = this,
                email = me.getByFormName('email'),
                value = email.getValue();
            if (value && email.validate()) {
                parent.checkEmailExist(me);
            }
        },
        checkEmailExist: function (me) {
            var parent = this,
                email = me.getByFormName('email');
            if (email) {
                email.showWaiting();
                /*window.Requester.JSONP(parent.getSubName() + '/token/', {
                data: {
                    appid: '9c0b989a7d2d8c5a952475c0f61e792f',
                    act: 'gettoken'
                },
                onsuccess: function (result) {
                    if (result.code === 0) {*/
                // Token
                var value = email.getValue();
                email.isExist = email.existValue == value ? email.existValue : '';
                email.existValue = value;
                window.Requester.JSONP(parent.getSubName() + '/account/', {
                    data: {
                        //appid: '9c0b989a7d2d8c5a952475c0f61e792f',
                        //token: result.data,
                        act: 'check_email',
                        email: email.getValue()
                    },
                    onsuccess: function (result) {
                        if (result && result.code === 0 && result.data === false) {
                            email.isExist = '';
                            email.showOK();
                        } else if (result && result.code === 0 && result.data === true) {
                            email.isExist = 'exist';
                            email.showError(4, 'by_code');
                        } else {
                            email.showError(result.message);
                        }
                    }
                });
                /*}
                }
            });*/
            }
        },
        checkUsername: function (me) {
            var parent = this,
                username = me.getByFormName('username'),
                value = username.getValue();
            if (value && username.validate()) {
                parent.checkUsernameExist(me);
            }
        },
        checkUsernameExist: function (me) {
            var parent = this,
                username = me.getByFormName('username');
            if (username) {
                username.showWaiting();
                /*window.Requester.JSONP(parent.getSubName() + '/token/', {
                data: {
                    appid: '9c0b989a7d2d8c5a952475c0f61e792f',
                    act: 'gettoken'
                },
                onsuccess: function (result) {
                    if (result.code === 0) {*/
                // Token
                var value = username.getValue();
                username.isExist = username.existValue == value ? username.existValue : '';
                username.existValue = value;
                window.Requester.JSONP(parent.getSubName() + '/account/', {
                    data: {
                        //appid: '9c0b989a7d2d8c5a952475c0f61e792f',
                        //token: result.data,
                        act: 'check_username',
                        username: username.getValue()
                    },
                    onsuccess: function (result) {
                        if (result && result.code === 0 && result.data === false) {
                            username.isExist = '';
                            username.showOK();
                        } else if (result && result.code === 0 && result.data === true) {
                            username.isExist = 'exist';
                            username.showError(4, 'by_code');
                        } else {
                            username.showError(result.message);
                        }

                    }
                });
                /*}
                }
            });*/
            }
        },
        checkPassword: function (me) {
            var password = me.getByFormName('password'),
                value = password.getValue(),
                main = me.getMain(),
                complex = hui.c('hj001_pwd_complex_warp', main)[0],
                level;
            me.checkPasswordStrong = me.checkPasswordStrong || hui.Validator.getRule('password').checkStrong;
            level = me.checkPasswordStrong(value);
            if (level === 0) level = 1;
            hui.removeClass(complex, 'hj001_complex_-1 hj001_complex_0 hj001_complex_1 hj001_complex_2 hj001_complex_3');
            hui.addClass(complex, 'hj001_complex_' + level);
            if (!value) {
                password.hideError();
                return;
            }
            password.validate();

        },
        getEmailList: function () {
            var emailList = {
                '@qq.com': 'http://mail.qq.com',
                '@163.com': 'http://mail.163.com',
                '@126.com': 'http://mail.126.com',
                '@sina.com': 'http://mail.sina.com',
                '@hotmail.com': 'http://mail.hotmail.com',
                '@gmail.com': 'http://mail.google.com'
            };
            return emailList;
        },
        onRegisteSuccess: function (me, result) {
            me.setValueByTree({
                username: '',
                password: '',
                email: '',
                mobile: '',
                validationcode: ''
            });

            if (me.getFormName() == 'hj_reg_mobile') {
                me.parentControl.showDialog('hj_reg_mobile_success');
            } else {
                me.parentControl.showDialog('hj_reg_email_success');
            }
        },
        onRegisteSuccessMobile: function () {},
        onLoginSuccess: function () {},
        updateSSO: function (ssotoken, remeberdays) {
            var me = this;
            if (me.updateSSOTimer) {
                window.clearTimeout(me.updateSSOTimer);
            }
            me.updateSSOTimer = window.setTimeout(function () {
                me.ssonum = 5;
                me.updateSSOCallback();
            }, 10000);
            window.Requester.JSONP(me.getPassName() + '.hujiang.com' + me.getQuickSubName() + '/synclogin.aspx?token=' + ssotoken + (remeberdays ? '&remeberdays=' + remeberdays : ''), {
                onsuccess: me.updateSSOCallback
            });
            window.Requester.JSONP(me.getPassName() + '.yeshj.com' + me.getQuickSubName() + '/synclogin.aspx?token=' + ssotoken + (remeberdays ? '&remeberdays=' + remeberdays : ''), {
                onsuccess: me.updateSSOCallback
            });
            window.Requester.JSONP(me.getPassName() + '.cctalk.com' + me.getQuickSubName() + '/synclogin.aspx?token=' + ssotoken + (remeberdays ? '&remeberdays=' + remeberdays : ''), {
                onsuccess: me.updateSSOCallback
            });
            window.Requester.JSONP(me.getPassName() + '.hjenglish.com' + me.getQuickSubName() + '/synclogin.aspx?token=' + ssotoken + (remeberdays ? '&remeberdays=' + remeberdays : ''), {
                onsuccess: me.updateSSOCallback
            });
            window.Requester.JSONP(me.getPassName() + '.hjclass.com' + me.getQuickSubName() + '/synclogin.aspx?token=' + ssotoken + (remeberdays ? '&remeberdays=' + remeberdays : ''), {
                onsuccess: me.updateSSOCallback
            });
        },
        updateSSOTimer: null,
        updateSSOCallback: function () {
            var hj_quicklogin = hui.Control.getByFormName('hj_quicklogin');
            if (hj_quicklogin.ssonum > 4) {
                if (hj_quicklogin.updateSSOTimer) {
                    hj_quicklogin.updateSSOTimer = null;
                    window.clearTimeout(hj_quicklogin.updateSSOTimer);
                }
                hj_quicklogin.updateSSO.callback && hj_quicklogin.updateSSO.callback();
            } else {
                hj_quicklogin.ssonum = hj_quicklogin.ssonum ? hj_quicklogin.ssonum : 1;
                hj_quicklogin.ssonum += 1;
            }
        },
        onresize: function () {
            var hj_quicklogin = hui.Control.getByFormName('hj_quicklogin');
            if (hj_quicklogin.onresizeTimer) {
                window.clearTimeout(hj_quicklogin.onresizeTimer);
            }
            hj_quicklogin.onresizeTimer = window.setTimeout(hj_quicklogin.onresizeCallback, 30);
        },
        // IE7下onresize容易死循环!!
        onresizeCallback: function () {
            var hj_quicklogin = hui.Control.getByFormName('hj_quicklogin');
            var main = hj_quicklogin.getMain();
            hj_quicklogin.onresizeTimer = null;

            var top = Math.max(0, (document.documentElement.clientHeight - main.clientHeight) * (hj_quicklogin.top || 0.3));
            var left = Math.max(0, (document.documentElement.clientWidth - main.clientWidth) * (hj_quicklogin.left || 0.5));
            // IE6
            if (window.ActiveXObject && !window.XMLHttpRequest) {
                var hj001_quicklogin = hui.c('hj001_quicklogin')[0];
                hj001_quicklogin.style.setExpression('top', 'eval(document.documentElement.scrollTop  + Math.max(0, (document.documentElement.clientHeight - 500)*0.4))');
                hj001_quicklogin.style.setExpression('left', 'eval(document.documentElement.scrollLeft + Math.max(0, (document.documentElement.clientWidth - 427))/2)');
                /*if (!hui.util.hasCssString('hj001_quicklogin_fixed_7181549444794655')) {
                    hui.util.importCssString('.hj001_quicklogin {_top: expression(document.documentElement.scrollTop + Math.max(0, (document.documentElement.clientHeight - 500)*0.3) + "px");_left: expression(document.documentElement.scrollLeft + Math.max(0, (document.documentElement.clientWidth - 427))/2 + "px")}}', 'hj001_quicklogin_fixed_7181549444794655');
                }*/
            } else {
                hui.util.importCssString('.hj001_quicklogin.hj001_login_box {top:' + top + 'px;left:' + left + 'px; margin-left:0px;}', 'hj001_quicklogin_fixed_7181549444794655');
            }


            hui.Mask.repaintMask();
        },
        onscroll: function (e) {
            e.cancelBubble = true;
            e.stopPropagation && e.stopPropagation();
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                window.event.returnValue = false;
            }
            return false;
        },
        onesc: function (e) {
            e = e || hui.window.event;
            var keyCode = e.keyCode || e.which;
            if (keyCode == 27) {
                hui.Control.getByFormName('hj_quicklogin').showDialog('');
            }
        }

    };
    // 继承hui.Control
    hui.inherits(hui.HJ_QuickLogin, hui.Control);


    hui.HJ_Reg_mobile = function (options, pending) {
        this.isFormItem = false;
        hui.HJ_Reg_mobile.superClass.call(this, options, 'pending');
        this.type = 'hj_reg_mobile';
        this.controlMap = {};
        // 进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.HJ_Reg_mobile.prototype = {
        render: function (options) {
            hui.HJ_Reg_mobile.superClass.prototype.render.call(this);
            var me = this;
            // 渲染对话框
            hui.Control.init(me.getMain(), (hui.Action ? hui.Action.get() : {}).model, me);
        },
        initBehavior: function (controlMap) {
            var me = this;

            var mobile = me.getByFormName('mobile'),
                username = me.getByFormName('username'),
                password = me.getByFormName('password'),
                agree = me.getByFormName('agree'),
                submit = me.getByFormName('submit'),
                sendsms = me.getByFormName('sendsms');

            password.onpaste =
                password.onkeyup = function (e) {
                    me.parentControl.checkPassword(me);
            };
            username.onpaste =
                username.onblur = function (e) {
                    me.parentControl.checkUsername(me);
            };

            //mobile.onkeydown =
            mobile.onpaste =
                mobile.onblur =
                mobile.onkeyup = function (e) {
                    me.parentControl.checkMobile(me);
            };



            sendsms.onclick = hui.fn(me.sendSms, me);
            agree.onclick = hui.fn(me.checkAgree, me);
            submit.onclick = username.onenter = password.onenter = hui.fn(me.onsubmit, me);

            if (mobile.getValue()) {
                mobile.onblur();
            }
            if (username.getValue()) {
                username.validate();
            }
            me.checkAgree();
        },
        checkAgree: function () {
            var me = this,
                agree = me.getByFormName('agree'),
                submit = me.getByFormName('submit');
            submit.setDisabled(!agree.getChecked());
        },
        /**
         * @name 初始化列表行为
         * @param {Object} controlMap 当前主内容区域绘制的控件集合.
         */
        onsubmit: function () {
            var me = this;

            // 手机号注册按钮事件 
            if (me.parentControl.monitorList['hj_reg_mobile_submit']) {
                me.parentControl.monitorList['hj_reg_mobile_submit']();
            }

            if (me.validate()) {
                //paramMap.password = hui.MD5.encode(paramMap.password);

                me.parentControl.onregiste(me);

            }
        },

        sendSms: function () {
            var me = this;
            // 获取手机验证码按钮事件 
            if (me.parentControl.monitorList['hj_reg_mobile_sendsms']) {
                me.parentControl.monitorList['hj_reg_mobile_sendsms']();
            }
            /*window.Requester.JSONP(me.parentControl.getSubName() + '/token/', {
            data: {
                appid: '9c0b989a7d2d8c5a952475c0f61e792f',
                act: 'gettoken'
            },
            onsuccess: function (result) {
                if (result.code === 0) {*/
            var validationcode = me.getByFormName('validationcode');
            // Token
            window.Requester.JSONP(me.parentControl.getSubName() + '/account/', {
                data: {
                    //appid: '9c0b989a7d2d8c5a952475c0f61e792f',
                    //token: result.data,
                    act: 'send_validation_code',
                    mobile: me.getByFormName('mobile').getValue()
                },
                onsuccess: function (result) {
                    if (result.code !== 0) {
                        me.getByFormName('mobile').showError(result.message);
                    } else if (result.data && result.data.ticket) {
                        window.Requester.JSONP(me.parentControl.getSubName() + '/account/', {
                            data: {
                                //appid: '9c0b989a7d2d8c5a952475c0f61e792f',
                                //token: result.data,
                                act: 'send_validation_code',
                                mobile: me.getByFormName('mobile').getValue(),
                                ticket: result.data.ticket
                            },
                            onsuccess: function (result) {
                                if (result.code !== 0) {
                                    me.getByFormName('mobile').showError(result.message);
                                }
                                validationcode.mainFocus();
                            }
                        });
                    }
                }
            });

            validationcode.mainFocus();
            /*}
            }
        });*/

            me.startSendSmsTimer();

        },
        sendSmsCallback: function () {
            //var me = this;
        },
        startSendSmsTimer: function () {
            var me = this,
                sendsms = me.getByFormName('sendsms');
            sendsms.leftSeconds = sendsms.leftSeconds === undefined ? 90 : sendsms.leftSeconds;
            if (sendsms.leftSeconds < 2) {
                sendsms.leftSeconds = 90;
                sendsms.setDisabled(false);
                sendsms.setContent('重新发送');
            } else {
                sendsms.leftSeconds--;
                sendsms.setDisabled(true);
                sendsms.setContent('重新发送(' + sendsms.leftSeconds + ')');
                window.setTimeout(function () {
                    me.startSendSmsTimer();
                }, 1000);
            }
        }
    };

    // hui.HJ_Reg_mobile 继承了 hui.Control 
    hui.inherits(hui.HJ_Reg_mobile, hui.Control);


    hui.HJ_Reg_email = function (options, pending) {
        this.isFormItem = false;
        hui.HJ_Reg_email.superClass.call(this, options, 'pending');
        this.type = 'hj_reg_email';
        this.controlMap = {};
        // 进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.HJ_Reg_email.prototype = {
        render: function (options) {
            hui.HJ_Reg_email.superClass.prototype.render.call(this);
            var me = this;
            // 渲染对话框
            hui.Control.init(me.getMain(), (hui.Action ? hui.Action.get() : {}).model, me);
        },
        initBehavior: function (controlMap) {
            var me = this,
                main = me.getMain();

            var email = me.getByFormName('email'),
                username = me.getByFormName('username'),
                password = me.getByFormName('password'),
                agree = me.getByFormName('agree'),
                submit = me.getByFormName('submit');

            password.onpaste =
                password.onkeyup = function (e) {
                    me.parentControl.checkPassword(me);
            };
            username.onpaste =
                username.onblur = function (e) {
                    me.parentControl.checkUsername(me);
            };

            submit.onclick = username.onenter = password.onenter = hui.fn(me.onsubmit, me);
            agree.onclick = hui.fn(me.checkAgree, me);

            me.hideEmailListHandller = me.hideEmailListHandller || function () {
                me.hideEmailList();
            };
            email.onfocus = hui.fn(me.showEmailList, me);
            email.onblur = me.hideEmailListHandller;
            email.onkeyup = hui.fn(me.updateEmailList, me);

            email.choose = function (obj) { //alert('choose');
                var str = obj.innerHTML;
                email.setValue(str);
                //email.mainFocus();
                var email_list = hui.c('hj001_email_list', main)[0];
                email_list.style.display = 'none';

                if (email.validate()) {
                    username.mainFocus();
                }
            };
            var email_list = hui.c('hj001_email_list', main)[0];
            email_list.onmouseover = function () {
                email.onblur = new Function();
            };
            email_list.onmouseout = function () {
                email.onblur = me.hideEmailListHandller;
            };


            me.checkAgree();
        },
        checkAgree: function () {
            var me = this,
                agree = me.getByFormName('agree'),
                submit = me.getByFormName('submit');
            submit.setDisabled(!agree.getChecked());
        },
        showEmailList: function (e) {
            var me = this,
                email = me.getByFormName('email'),
                value = email.getValue().replace(/\s/ig, '');
            //email.setValue(value);
            if (value) {
                me.updateEmailList(e);
            }
        },
        hideEmailListHandller: null,
        hideEmailList: function () {
            var me = this,
                email = me.getByFormName('email');
            email.email_list = email.email_list || hui.c('hj001_email_list', me.getMain())[0];
            email.email_list.style.display = 'none';

            if (email.getValue() && email.validate()) {
                me.parentControl.checkEmail(me);
            }
        },
        updateEmailList: function (e) {
            var me = this,
                main = me.getMain(),
                email = me.getByFormName('email'),
                value = email.getValue().replace(/\s/ig, ''),
                cur,
                list,
                item;
            email.email_list = email.email_list || hui.c('hj001_email_list', main)[0];
            cur = hui.c('hj001_row hj001_row_over', main)[0];
            hui.removeClass(cur, 'hj001_row_over');
            list = hui.c('hj001_row', main);

            e = e || window.event;
            var keyCode = e.keyCode || e.which;
            if (keyCode == 13) { //enter
                cur && email.choose(cur);
            } else if (keyCode == 38) { //up arrow
                if (!cur) {
                    item = hui.util.findSiblingByClassName(list[0], 'hj001_row', 'last');
                } else {
                    item = hui.util.findSiblingByClassName(cur, 'hj001_row', 'pre');
                    if (item == cur) {
                        item = hui.util.findSiblingByClassName(cur, 'hj001_row', 'last');
                    }
                }
                item && hui.addClass(item, 'hj001_row_over');
            } else if (keyCode == 40) { //down arrow
                if (!cur) {
                    item = hui.util.findSiblingByClassName(list[0], 'hj001_row', 'first');
                } else {
                    item = hui.util.findSiblingByClassName(cur, 'hj001_row', 'next');
                    if (item == cur) {
                        item = hui.util.findSiblingByClassName(cur, 'hj001_row', 'first');
                    }
                }
                item && hui.addClass(item, 'hj001_row_over');
            } else {
                //email.setValue(value);
                if (value) {
                    email.tpl_suggestion = email.tpl_suggestion || email.email_list.innerHTML;
                    email.email_list.innerHTML = me.getSuggestionEmailList(email.getValue());

                    email.email_list = email.email_list || hui.c('hj001_email_list', me.getMain())[0];
                    email.email_list.style.display = 'block';
                }
            }

        },
        getSuggestionEmailList: function (email) {
            var me = this,
                tpl = '<div class="hj001_row" index="#{index}" onmouseover="hui.addClass(this, \'hj001_row_over\')" onmouseout="hui.removeClass(this, \'hj001_row_over\')" onclick="hui.Control.getByFormName(\'email\',\'#{parent}\').choose(this)">#{email}</div>',
                emailList = me.parentControl.getEmailList(),
                list = email.split('@'),
                pre = list[0],
                src = String(list[1] || '@').toLowerCase(),
                matchList = [],
                html = '';
            for (var i in emailList) {
                if (emailList.hasOwnProperty(i) && ~i.indexOf(src)) {
                    matchList.push(i);
                }
            }
            for (var i = 0, len = matchList.length; i < len; i++) {
                html += hui.format(tpl, {
                    index: i,
                    email: pre + matchList[i],
                    parent: me.getId()
                });
            }
            return html;
        },
        /**
         * @name 初始化列表行为
         * @param {Object} controlMap 当前主内容区域绘制的控件集合.
         */
        onsubmit: function () {
            var me = this;
            // 邮箱注册按钮事件
            if (me.parentControl.monitorList['hj_reg_email_submit']) {
                me.parentControl.monitorList['hj_reg_email_submit']();
            }
            if (me.validate()) {
                //paramMap.password = hui.MD5.encode(paramMap.password);
                hui.setCookie('hj001_email', me.getParamMap().email);

                me.parentControl.onregiste(me);

            }
        }
    };

    /*通过hui.Control派生hui.Button*/
    // hui.Control.derive(hui.HJ_Reg_email);
    /* hui.HJ_Reg_email 继承了 hui.Control */
    hui.inherits(hui.HJ_Reg_email, hui.Control);



    hui.HJ_Reg_login = function (options, pending) {
        this.isFormItem = false;
        hui.HJ_Reg_login.superClass.call(this, options, 'pending');
        this.type = 'hj_reg_login';
        this.controlMap = {};
        // 进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.HJ_Reg_login.prototype = {
        render: function (options) {
            hui.HJ_Reg_login.superClass.prototype.render.call(this);
            var me = this;
            //var captcha = hui.g('hj001_captcha_img', me.getMain());
            //captcha.src = captcha.getAttribute('src1');
            // 渲染对话框
            hui.Control.init(me.getMain(), (hui.Action ? hui.Action.get() : {}).model, me);
        },
        initBehavior: function (controlMap) {
            var me = this;

            var username = me.getByFormName('account'),
                password = me.getByFormName('password'),
                code = me.getByFormName('code'),
                submit = me.getByFormName('submit');
            var u = hui.getCookie('hj001_username');
            if (u) {
                username.setValue(u);
            }

            username.onenter = password.onenter = code.onenter = submit.onclick = hui.fn(me.onLoginSubmit, me);

            /*var other_login = hui.g('other_login', me.getMain());
            me.setInnerHTML(other_login, hui.format(other_login.innerHTML, {
                cur_location: window.location.href
            }));*/

            me.showCaptcha(hui.getCookie('showcaptcha') == 'true');
        },
        /**
         * @name 初始化列表行为
         * @param {Object} controlMap 当前主内容区域绘制的控件集合.
         */
        onLoginSubmit: function () {
            var me = this;
            // 登录按钮事件 
            if (me.parentControl.monitorList['hj_reg_login_submit']) {
                me.parentControl.monitorList['hj_reg_login_submit']();
            }

            if (me.validate()) {
                var parent = me.parentControl,
                    paramMap = me.getParamMap();
                if (me.getByFormName('submit').isDisabled()) return;
                /*window.Requester.JSONP(parent.getSubName() + '/token/', {
                data: {
                    appid: '9c0b989a7d2d8c5a952475c0f61e792f',
                    act: 'gettoken'
                },
                onsuccess: function (result) {
                    if (result.code === 0) {*/
                // Token
                //paramMap.appid = '9c0b989a7d2d8c5a952475c0f61e792f';
                //paramMap.token = result.data;
                paramMap.act = 'loginverify';
                paramMap.template = parent ? parent.template : 'default';
                paramMap.returnurl = parent ? parent.returnurl : window.location.href;
                paramMap.password = hui.MD5.encode(paramMap.password);
                if (parent && parent.source) {
                    paramMap.source = parent.source;
                }
                if (me.getByFormName('hj001_rememberlogin').getChecked()) {
                    hui.setCookie('hj001_rememberlogin', 'true', 30 * 60 * 1000);
                } else {
                    hui.removeCookie('hj001_rememberlogin');
                }

                if (hui.getCookie('showcaptcha')) {
                    paramMap.captchatoken = hui.g('hj001_captcha_img').getAttribute('token');
                }

                me.getByFormName('submit').setDisabled().setContent('登  录  中 . . .');
                window.Requester.JSONP(parent.getSubName() + '/account/', {
                    data: paramMap,
                    onsuccess: function (result) {
                        var code = result.code;
                        if (result && String(code) == '0') {
                            hui.setCookie('hj001_username', result.data.username);
                            hui.Control.getByFormName('hj_quicklogin').showDialog('');
                            hui.removeCookie('showcaptcha');
                            //alert('login success');
                            me.hideError();
                            me.parentControl.updateSSO.callback = function () {
                                me.parentControl.onLoginSuccess(result);
                            };
                            me.parentControl.updateSSO(encodeURIComponent(result.data.ssotoken), hui.getCookie('hj001_rememberlogin') ? 14 : null);
                        } else {
                            var field = {};
                            if (~'1106'.indexOf(code)) {
                                field.code = result.message;
                            } else {
                                field.account = result.message;
                            }
                            me.hideError();
                            me.showErrorByTree(field);

                            me.getByFormName('submit').setDisabled(false).setContent('登  录');
                            hui.setCookie('showcaptcha', 'true', 30 * 60 * 1000);

                            if (result && result.data && result.data.showcaptcha) {
                                var code = hui.Control.getByFormName('hj_quicklogin').getByFormName('hj_reg_login').getByFormName('code');
                                code.setValue('');
                                code.mainFocus();
                            }

                            me.showCaptcha(result && result.data && result.data.showcaptcha);
                        }

                    }
                });
                /*}
                }
            });*/

            }
        },
        showCaptcha: function (sign) {
            var hj001_captcha_code = hui.g('hj001_captcha_code'),
                hj001_captcha_img = hui.g('hj001_captcha_img');
            if (sign) {
                window.Requester.JSONP('http://captcha.yeshj.com/api.php', {
                    data: {},
                    onsuccess: function (result) {
                        hj001_captcha_code.style.display = 'block';

                        hj001_captcha_img.setAttribute('src_bak', result.img);
                        hj001_captcha_img.setAttribute('token', result.token);
                        hj001_captcha_img.src = result.img + '&' + Math.random();

                        var code = hui.Control.getByFormName('hj_quicklogin').getByFormName('hj_reg_login').getByFormName('code');
                        code.setValue('');
                        code.mainFocus();
                    }
                });

                hui.Control.getByFormName('hj_quicklogin').getByFormName('hj_reg_login').getByFormName('code').mainFocus();
            } else {
                hj001_captcha_code.style.display = 'none';
            }
        }
    };

    /*通过hui.Control派生hui.Button*/
    // hui.Control.derive(hui.HJ_Reg_email);
    /* hui.HJ_Reg_login 继承了 hui.Control */
    hui.inherits(hui.HJ_Reg_login, hui.Control);

    hui.HJ_Reg_onekey = function (options, pending) {
        this.isFormItem = false;
        hui.HJ_Reg_mobile.superClass.call(this, options, 'pending');
        this.type = 'hj_reg_onekey';
        this.controlMap = {};
        // 进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.HJ_Reg_onekey.prototype = {
        render: function (options) {
            hui.HJ_Reg_onekey.superClass.prototype.render.call(this);
            var me = this;
            // 渲染对话框
            hui.Control.init(me.getMain(), (hui.Action ? hui.Action.get() : {}).model, me);
        },
        initBehavior: function (controlMap) {
            var me = this;

            var mobile = me.getByFormName('mobile'),
                submit = me.getByFormName('submit'),
                sendsms = me.getByFormName('sendsms'),
                validationcode = me.getByFormName('validationcode');

            //mobile.onkeydown =
            mobile.onpaste =
                mobile.onblur =
                mobile.onkeyup = hui.fn(me.checkMobile, me);

            sendsms.onclick = hui.fn(me.sendSms, me);
            validationcode.onenter = submit.onclick = hui.fn(me.onsubmit, me);

            if (mobile.getValue()) {
                mobile.onblur();
            }
        },
        checkMobile: function () {
            var me = this,
                mobile = me.getByFormName('mobile'),
                sendsms = me.getByFormName('sendsms'),
                value = mobile.getValue();
            if (value && mobile.validate('not_show')) {
                sendsms.setDisabled(false);
            } else {
                sendsms.setDisabled(true);
            }
        },
        /**
         * @name 初始化列表行为
         * @param {Object} controlMap 当前主内容区域绘制的控件集合.
         */
        onsubmit: function () {
            var me = this;

            // 手机号注册按钮事件 
            if (me.parentControl.monitorList['hj_reg_mobile_submit']) {
                me.parentControl.monitorList['hj_reg_mobile_submit']();
            }

            if (me.validate()) {
                var data = me.getParamMap();
                me.getByFormName('submit').setDisabled().setContent('登  录  中 . . .');
                window.Requester.JSONP(me.parentControl.getPassName() + '.hujiang.com/quick/account/?act=quick_login', {
                    data: data,
                    onsuccess: function (result) {
                        if (result && result.code !== 0) {
                            var field = {};
                            if (result.code === 1010) {
                                field.mobile = '手机号不正确';
                            } else if (result.code === 1011) {
                                field.validationcode = '验证码不能为空';
                            } else if (result.code === 1012) {
                                field.validationcode = '验证码不正确或已超时';
                            } else if (result.code === 1013) {
                                field.validationcode = '验证码输入错误次数过多，请重新获取';
                            } else if (result.code === 1014) {
                                field.validationcode = '未知错误';
                            }
                            me.showErrorByTree(field);
                            me.getByFormName('submit').setDisabled(false).setContent('登  录');
                        } else if (result && result.data) {
                            if (result.data.require_modify) {
                                me.requireModify();
                            } else {
                                me.parentControl.onLoginSuccess(result);
                            }
                            me.parentControl.updateSSO(encodeURIComponent(result.data.ssotoken), null);
                        }
                    }
                });
            }
        },
        requireModify: function () {
            var me = this;
            me.parentControl.updateSSO.callback = function () {
                me.getByFormName('submit').setDisabled(false).setContent('登  录');
                hui.Control.getByFormName('hj_quicklogin').showDialog('hj_reg_onekey_next');
            };
        },
        sendSms: function () {
            var me = this,
                mobile = me.getByFormName('mobile');
            if (mobile.validate()) {
                window.Requester.JSONP(me.parentControl.getPassName() + '.hujiang.com/quick/account/?act=send_login_validcode&mobile=' + mobile.getValue(), {
                    data: {},
                    onsuccess: function (result) {
                        if (result && result.code !== 0) {
                            var field = {};
                            if (result.code === 1000) {
                                field.validationcode = '90秒内只能获取一次';
                            } else if (result.code === 1001) {
                                field.mobile = '已达到一天获取验证码的上限';
                            } else if (result.code === 1002) {
                                field.mobile = '不正确的手机号';
                            } else {
                                field.validationcode = '验证码错误';
                            }
                            me.showErrorByTree(field);
                        } else if (result && result.data && result.data.ticket) {
                            window.Requester.JSONP(me.parentControl.getPassName() + '.hujiang.com/quick/account/?act=send_login_validcode&mobile=' + mobile.getValue(), {
                                data: {
                                    ticket: result.data.ticket
                                },
                                onsuccess: function (result) {
                                    if (result && result.code !== 0) {
                                        var field = {};
                                        if (result.code === 1000) {
                                            field.mobile = '60秒内只能获取一次';
                                        } else if (result.code === 1001) {
                                            field.mobile = '已达到一天获取验证码的上限';
                                        } else if (result.code === 1002) {
                                            field.mobile = '不正确的手机号';
                                        } else {
                                            field.validationcode = '验证码错误';
                                        }
                                        me.showErrorByTree(field);
                                    }
                                }
                            });

                        }
                    }
                });

                me.getByFormName('validationcode').mainFocus();

                me.startSendSmsTimer();
            }
        },
        startSendSmsTimer: function () {
            var me = this,
                sendsms = me.getByFormName('sendsms');
            sendsms.leftSeconds = sendsms.leftSeconds === undefined ? 90 : sendsms.leftSeconds;
            if (sendsms.leftSeconds < 2) {
                sendsms.leftSeconds = 90;
                sendsms.setDisabled(false);
                sendsms.setContent('重新发送');
            } else {
                sendsms.leftSeconds--;
                sendsms.setDisabled(true);
                sendsms.setContent('重新发送(' + sendsms.leftSeconds + ')');
                window.setTimeout(function () {
                    me.startSendSmsTimer();
                }, 1000);
            }
        }
    };

    hui.inherits(hui.HJ_Reg_onekey, hui.Control);
    // hui.HJ_Reg_onekey 继承了 hui.Control 

    hui.HJ_Reg_onekey_next = function (options, pending) {
        this.isFormItem = false;
        hui.HJ_Reg_onekey_next.superClass.call(this, options, 'pending');
        this.type = 'hj_reg_onekey_next';
        this.controlMap = {};
        // 进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.HJ_Reg_onekey_next.prototype = {
        render: function (options) {
            hui.HJ_Reg_onekey_next.superClass.prototype.render.call(this);
            //var me = this;
            // 渲染对话框
            //hui.Control.init(me.getMain(), (hui.Action ? hui.Action.get() : {}).model, me);
        },
        initBehavior: function (controlMap) {
            var me = this,
                main = me.getMain();

            var email = me.getByFormName('email'),
                username = me.getByFormName('username'),
                password = me.getByFormName('password'),
                submit = me.getByFormName('submit');

            password.onpaste =
                password.onkeyup = function (e) {
                    me.parentControl.checkPassword(me);
            };
            username.onpaste =
                username.onblur = function (e) {
                    me.parentControl.checkUsername(me);
            };

            submit.onclick = username.onenter = password.onenter = email.onenter = hui.fn(me.onsubmit, me);

            me.hideEmailListHandller = me.hideEmailListHandller || function () {
                me.hideEmailList();
            };
            email.onfocus = hui.fn(me.showEmailList, me);
            email.onblur = me.hideEmailListHandller;
            email.onkeyup = hui.fn(me.updateEmailList, me);

            email.choose = function (obj) { //alert('choose');
                var str = obj.innerHTML;
                email.setValue(str);
                //email.mainFocus();
                var email_list = hui.c('hj001_email_list', main)[0];
                email_list.style.display = 'none';

                if (email.validate()) {
                    username.mainFocus();
                }
            };
            var email_list = hui.c('hj001_email_list', main)[0];
            email_list.onmouseover = function () {
                email.onblur = new Function();
            };
            email_list.onmouseout = function () {
                email.onblur = me.hideEmailListHandller;
            };
        },
        /**
         * @name 初始化列表行为
         * @param {Object} controlMap 当前主内容区域绘制的控件集合.
         */
        onsubmit: function () {
            var me = this;

            // 手机号注册按钮事件 
            if (me.parentControl.monitorList['hj_reg_mobile_submit']) {
                me.parentControl.monitorList['hj_reg_mobile_submit']();
            }

            if (me.validate()) {
                var data = me.getParamMap();
                data.password = hui.MD5.encode(data.password);
                // &username=<username>&password=<md5password>&email=<email>
                me.getByFormName('submit').setDisabled();
                window.Requester.JSONP(me.parentControl.getPassName() + '.hujiang.com/quick/account/?act=modify_userinfo', {
                    data: data,
                    onsuccess: function (result) {
                        if (result && result.code !== 0) {
                            var field = {};
                            if (result.code === 3000) {
                                field.username = '用户名为空';
                            } else if (result.code === 3001) {
                                field.username = '用户名已存在或不能使用';
                            } else if (result.code === 3002) {
                                field.email = '电子邮件地址不正确';
                            } else if (result.code === 3003) {
                                field.email = '电子邮件地址已存在';
                            } else if (result.code === 3004) {
                                field.password = '密码不符合要求';
                            } else {
                                field.username = '系统错误';
                            }
                            me.showErrorByTree(field);
                            me.getByFormName('submit').setDisabled(false);
                        } else if (result) {
                            if (result.data && result.data.ssotoken) {
                                me.parentControl.updateSSO.callback = function () {
                                    me.parentControl.onLoginSuccess(result);
                                };
                                me.parentControl.updateSSO(encodeURIComponent(result.data.ssotoken), null);
                            } else {
                                me.parentControl.onLoginSuccess(result);
                            }
                        }

                    }
                });

            }
        }
    };

    hui.inherits(hui.HJ_Reg_onekey_next, hui.HJ_Reg_email);
    // hui.HJ_Reg_onekey_next 继承了 hui.Control 

    hui.HJ_Reg_mobile_success = function (options, pending) {
        this.isFormItem = false;
        hui.HJ_Reg_mobile_success.superClass.call(this, options, 'pending');
        this.type = 'hj_reg_mobile_success';
        this.controlMap = {};
        // 进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.HJ_Reg_mobile_success.prototype = {
        render: function (options) {
            hui.HJ_Reg_mobile_success.superClass.prototype.render.call(this);
            var me = this;
            // 渲染对话框
            hui.Control.init(me.getMain(), (hui.Action ? hui.Action.get() : {}).model, me);
        },
        initBehavior: function (controlMap) {
            // var me = this;

            // var username = me.getByFormName('username'),
            //     password = me.getByFormName('password'),
            //     submit = me.getByFormName('submit');
        },
        startTimer: function () {
            var me = this;
            me.leftSecond = 4;
            me.countDown();
        },
        countDown: function () {
            var me = this;
            me.leftSecond--;
            if (me.leftSecond < 1) {
                hui.Control.getByFormName('hj_quicklogin').showDialog('');
                hui.Control.getByFormName('hj_quicklogin').onRegisteSuccessMobile();
            } else {
                var left_time = hui.c('hj001_left_time', me.getMain())[0];
                me.setInnerHTML(left_time, me.leftSecond);
                me.timer = window.setTimeout(function () {
                    me.countDown();
                }, 1000);
            }
        }
    };

    hui.inherits(hui.HJ_Reg_mobile_success, hui.Control);
    // hui.HJ_Reg_mobile_success 继承了 hui.Control 

    hui.HJ_Reg_email_success = function (options, pending) {
        this.isFormItem = false;
        hui.HJ_Reg_email_success.superClass.call(this, options, 'pending');
        this.type = 'hj_reg_email_success';
        this.controlMap = {};
        // 进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.HJ_Reg_email_success.prototype = {
        render: function (options) {
            hui.HJ_Reg_email_success.superClass.prototype.render.call(this);
            var me = this;
            // 渲染对话框
            hui.Control.init(me.getMain(), (hui.Action ? hui.Action.get() : {}).model, me);
        },
        initBehavior: function (controlMap) {
            var me = this;

            var submit = me.getByFormName('submit');
            submit.onclick = hui.fn(me.onsubmit, me);
            hui.c('hj001_go_email', me.getMain())[0].onclick = hui.fn(me.onEmailActive, me);
            me.updateEmailServer();
        },
        onsubmit: function () {
            var me = this;
            // 继续浏览按钮事件
            if (me.parentControl.monitorList['hj_reg_email_continue']) {
                me.parentControl.monitorList['hj_reg_email_continue']();
            }

            window.location.reload && window.location.reload();
        },
        onEmailActive: function () {
            var me = this;
            // 邮箱激活按钮事件
            if (me.parentControl.monitorList['hj_reg_email_success_active']) {
                me.parentControl.monitorList['hj_reg_email_success_active']();
            }
        },
        updateEmailServer: function () {
            var me = this;
            var href,
                server = (hui.getCookie('hj001_email') + '@@').split('@')[1],
                emailList = me.parentControl.getEmailList();
            if (!!server) {
                href = emailList['@' + server] || 'http://www.' + server;
                hui.c('hj001_go_email', me.getMain())[0].href = href;
            }
        }

    };

    hui.inherits(hui.HJ_Reg_email_success, hui.Control);
    // hui.HJ_Reg_email_success 继承了 hui.Control

});

// 注：本文件内的模块加载解析完后恢复define.autoload = true;
//hui.define.autoload = true;

hui.util.importCssString(
    '.hj001_mask{background:#000;opacity:0.2;filter:alpha(opacity=20);width:100%;height:100%;position:absolute;top:0;left:0;z-index:50000}' +
    '.hj001_mask.hide{display: none;}' +
    '.hj001_quicklogin {z-index: 9000000;position: fixed; _position: absolute; aatop: 50px; aaleft: 50%; aamargin-left: -214px; _top: expression(document.documentElement.scrollTop + Math.max(0, (document.documentElement.clientHeight - 500)*0.3) + "px")}' +
    '.hj001_quicklogin_html {background-image: url("about:blank");background-attachment: fixed;}' +
    '.hj001_quicklogin.hj001_login_box {}' +
    '.hj001_login_box {font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial"; text-align: left; width: 427px; background-color: rgba(0,0,0,0.3); background-color: #c6c6c6\\0;*background-color: #c6c6c6; border-radius: 5px;  }' +
    '.hj001_login_box a {font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial";text-decoration: none; color: #666666; border: 0px;}' +
    '.hj001_login_box img {border:0px;}' +
    '.hj001_login_box a:hover {text-decoration: none; color: #ff6600}' +
    '.hj001_login_box hr.hj001_clearfix {font-size: 1px; line-height: 1px; height: 1px; overflow: hidden; clear: both; border: 0px; padding: 0px; margin: -1px 0px 0px 0px; list-style: none; border-style: none; background: none; visibility: hidden;}' +
    '.hj001_login_box .hj001_login_container{background-color:#fff;margin:5px;padding:15px 17px 35px 45px;}' +
    '.hj001_login_box .hj001_close_btn {background-color: #8A8A8A;border-radius: 16px;color: #FFFFFF;display: block;font-family: Simsun;font-size: 14px;height: 24px;overflow: hidden;padding: 8px 0 0 10px;position: absolute;right: -11px;top: -11px;width: 22px;}' +
    '.hj001_login_box .hj001_close_btn:hover {background-color: #f62626;color: #fff; }' +
    '.hj001_login_box .hj001_title_login{display:inline-block;height:30px;vertical-align:middle;line-height:25px;text-align:right;}' +
    '.hj001_login_box .hj001_title_login_txt{font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial";font-size: 16px; line-height: 1.2em; padding-top: 2px; float: left;}' +
    '.hj001_login_box .hj001_icon_gt{display:inline-block;font-family:Verdana;font-size: 16px;width:6px;height:30px;vertical-align:middle;margin-left:2px;}' +
    '.hj001_login_box .hj001_icon_right {width: 20px; height: 20px; display: inline-block; background-image: url("/static/img/icon.png");background-position:0px -100px;}' +
    '.hj001_login_box .hj001_icon_error {width: 20px; height: 20px; display: inline-block; background-image: url("/static/img/icon.png");background-position:-50px -100px;}' +
    '.hj001_login_box .hj001_icon_ok {display: inline-block; width: 33px; height: 33px; background-image: url("/static/img/icon.png");background-position:-100px -100px; vertical-align: middle; margin-top: -12px; margin-right: 10px;}' +
    '.hj001_login_box .hj001_title{height:41px;border-bottom:1px solid #e5e5e5;margin-top:24px;width:316px;position:relative;z-index:2;}' +
    '.hj001_login_box .hj001_title .hj001_title_login{position:absolute;right:2px;bottom:0;color:#075db3;text-decoration:none;font-size:16px;display:block;height:36px;line-height:26px;}' +
    '.hj001_login_box .hj001_title .hj001_title_login:hover{color:#ff6600;text-decoration:none;}' +
    '.hj001_login_box .hj001_title .hj001_title_item{font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial";font-size:19px;text-align:center;float:left;height: 19px;line-height: 19px;padding-top:11px;padding-bottom:12px;padding-left:20px;padding-right:20px;}' +
    '.hj001_login_box .hj001_title .hj001_title_item a{font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial";color:#9c9c9c; font-size: 19px;}' +
    '.hj001_login_box .hj001_title .hj001_title_item_selected{border:1px solid #e5e5e5;border-bottom-color:white;background-color:white;padding-top:10px;padding-bottom:12px;border-radius:2px;}' +
    '.hj001_login_box .hj001_login_warp{padding-top:30px;}' +
    '.hj001_login_box .hj001_login_warp .hj001_item { position: relative; z-index: 2;height: 67px;}' +
    '.hj001_login_box .hj001_login_warp .hj001_item .validate {width:99%;}' +
    '.hj001_login_box .hj001_login_warp .hj001_pwd_warp {padding-bottom: 0px; position: relative; z-index: 2; min-height:67px;}' +
    '.hj001_login_box .hj001_login_warp .hj001_ipt {width: 290px;}' +
    '.hj001_login_box .hj001_login_warp .hj001_ipt_short {width: 123px; float: left;}' +
    '.hj001_login_box .hj001_login_warp .hj001_ipt, .hj001_login_box .hj001_login_warp .hj001_ipt_short {height: 20px; border: 1px solid #e5e5e5; padding: 10px 13px; line-height: 1.2em; font-size: 14px; color: #666666; border-radius: 2px; background-color: transparent;}' +
    '.hj001_login_box .hj001_login_warp .hj001_ipt:focus, .hj001_login_box .hj001_login_warp .hj001_ipt_short:focus {border: 1px solid #4D90FE;outline:none;box-shadow:0 0 2px #4D90FE;}' +
    '.hj001_login_box .hj001_login_warp .hj001_error_txt, .hj001_login_box .hj001_login_warp .hj001_pwd_error_txt {line-height: 20px; height: 20px; font-size: 12px; color: #f62626; display: block; position: absolute; z-index: 3; overflow: hidden;}' +
    '.hj001_login_box .hj001_login_warp .hj001_error_txt {left: 5px; bottom: 2px;}' +
    '.hj001_login_box .hj001_pwd_complex_warp .hj001_pwd_error_txt {top: 0px; left: 200px;}' +
    '.hj001_login_box .hj001_login_warp .hj001_icon_right, .hj001_login_box .hj001_login_warp .hj001_icon_error {position: absolute; right: 2px; top: 11px;}' +
    '.hj001_login_box .hj001_login_warp .hj001_agreement {height: 34px; padding-bottom: 12px;clear:left;}' +
    '.hj001_login_box .hj001_agreement .hj001_icon_agree, .hj001_login_box .hj001_agreement .hj001_icon_agree_cur {margin: 9px 10px 0 0; float: left;}' +
    '.hj001_login_box .hj001_agreement .hj001_agree {color: #666666; font-size: 14px; line-height: 34px; float: left;}' +
    '.hj001_login_box .hj001_agreement .hj001_agree a {color: #666666; text-decoration: none;}' +
    '.hj001_login_box .hj001_another {line-height: 34px; height: 34px; color: #075db3; font-size: 14px; text-decoration: none; display: none; margin-bottom: 30px;}' +
    '.hj001_login_box .hj001_another:hover { color: #ff6600; text-decoration: none;}' +
    '.hj001_login_box .hj001_pwd_complex_warp {height: 20px; width: 200px; margin-top: 3px; line-height: 25px; position: relative; z-index: 2; float: left; font-size:1px;}' +
    '.hj001_login_box .hj001_pwd_complex_warp .hj001_pwd_complex_txt {position: absolute; left: 175px; top: 0px; line-height: 20px; height: 20px; color: #ffffff; font-size: 12px; overflow: hidden; display: none;}' +
    '.hj001_login_box .hj001_pwd_complex_warp .hj001_pwd_complex_bg, .hj001_login_box .hj001_pwd_complex_warp .hj001_pwd_complex {height: 6px; display: none; position: absolute; left: 0; top: 7px;}' +
    '.hj001_login_box .hj001_pwd_complex_warp .hj001_pwd_complex_bg {display: inline; width: 150px; background-color: #e4e4e4;}' +
    '.hj001_login_box .hj001_complex_-1 {display: none;}' +
    '.hj001_login_box .hj001_complex_-1 .hj001_pwd_complex, .hj001_login_box .hj001_complex_-1 .hj001_pwd_complex_bg {display: none;}' +
    '.hj001_login_box .hj001_complex_1 .hj001_pwd_complex {display: inline; width: 50px; background-color: #f62626;}' +
    '.hj001_login_box .hj001_complex_2 .hj001_pwd_complex {display: inline; width: 100px; background-color: #ffc000;}' +
    '.hj001_login_box .hj001_complex_3 .hj001_pwd_complex {display: inline; width: 150px; background-color: #5cbb00;}' +
    '.hj001_login_box .hj001_complex_1 .hj001_grade01 {display: inline; color: #f62626;}' +
    '.hj001_login_box .hj001_complex_2 .hj001_grade02 {display: inline; color: #ffc000;}' +
    '.hj001_login_box .hj001_complex_3 .hj001_grade03 {display: inline; color: #5cbb00;}' +
    '.hj001_login_box .hj001_login_warp .hj001_email_list {width: 316px; position: absolute; top: 43px; left: 0px; background-color: #ffffff; z-index: 1; display: none;}' +
    '.hj001_login_box .hj001_login_warp .hj001_email_list .hj001_row {border: 1px solid #e5e5e5; border-top: 0px;color: #666666;display: block;font-size: 14px;height: 37px;line-height: 37px;overflow: hidden;text-indent: 15px;text-overflow: ellipsis;white-space: nowrap;width: 100%;background-color:white;cursor:pointer;}' +
    '.hj001_login_box .hj001_login_warp .hj001_email_list .hj001_row_over {background-color: #f1f1f1;}' +
    '.hj001_login_box .hj001_login_warp .hj001_email_list .hj001_first {color: #999999; background-color: #eefaff; line-height: 37px; height: 37px; text-indent: 15px;}' +
    '.hj001_login_box .hj001_login_warp .hj001_forget_pwd {font-size: 14px; float: right; line-height: 34px; margin-right: 30px;}' +
    '.hj001_login_box .hj001_other_login {padding-top: 25px;}' +
    '.hj001_login_box .hj001_other_login .hj001_txt {float: left; color: #666666; font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial";font-size: 14px; line-height: 23px;}' +
    '.hj001_login_box .hj001_other_login .hj001_login_link {float: left; width: 23px; height: 23px; margin-right: 12px;}' +
    '.hj001_login_box .hj001_icon_baidu          {background-image: url("/static/img/icon.png");background-position:0px -50px;}' +
    '.hj001_login_box .hj001_icon_baidu:hover    {background-image: url("/static/img/icon.png");background-position:0px 0px;}' +
    '.hj001_login_box .hj001_icon_douban         {background-image: url("/static/img/icon.png");background-position:-50px -50px;}' +
    '.hj001_login_box .hj001_icon_douban:hover   {background-image: url("/static/img/icon.png");background-position:-50px 0px;}' +
    '.hj001_login_box .hj001_icon_qq             {background-image: url("/static/img/icon.png");background-position:-100px -50px;}' +
    '.hj001_login_box .hj001_icon_qq:hover       {background-image: url("/static/img/icon.png");background-position:-100px 0px;}' +
    '.hj001_login_box .hj001_icon_renren         {background-image: url("/static/img/icon.png");background-position:-150px -50px;}' +
    '.hj001_login_box .hj001_icon_renren:hover   {background-image: url("/static/img/icon.png");background-position:-150px 0px;}' +
    '.hj001_login_box .hj001_icon_weibo          {background-image: url("/static/img/icon.png");background-position:-200px -50px;}' +
    '.hj001_login_box .hj001_icon_weibo:hover    {background-image: url("/static/img/icon.png");background-position:-200px 0px;}' +
    '.hj001_login_box .hj001_icon_zhifu          {background-image: url("/static/img/icon.png");background-position:-250px -50px;}' +
    '.hj001_login_box .hj001_icon_zhifu:hover    {background-image: url("/static/img/icon.png");background-position:-250px 0px;}' +
    '.hj001_login_box .hj001_success {height: 33px; overflow: hidden; /* text-align: left; */ padding: 79px 0 35px 0px;}' +
    '.hj001_login_box .hj001_success .hj001_span {line-height: 33px; font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial"; font-size: 32px; height: 33px; color: #68c04a; text-align: center; display: inline-block;}' +
    '.hj001_login_box .hj001_view_btn {margin-top: 45px;}' +
    '.hj001_login_box .hj001_txt, .hj001_login_box .hj001_email_txt {line-height: 24px;font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial"; font-size: 14px; color: #666666; text-align: center;}' +
    '.hj001_login_box .hj001_go_email {color: #075db3; font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial"; font-size: 14px; padding: 0 5px; text-decoration: none;}' +
    '.hj001_login_box .hj001_go_email:hover {color: #ff6600;}' +
    '.hj001_login_box .hj001_txt {padding-bottom: 15px;padding-right: 1px;}' +
    '.hj001_login_box .hj001_email_txt {padding: 15px 0px 70px 0px;}' +
    '.hj001_login_box .hj001_auto_close {font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial";font-size: 16px; color: #666666; text-align: center; line-height: 30px; padding: 40px 0 90px; border-top: 1px dashed #999999; /* margin-right: 30px; */}' +
    '.hj001_login_box .hj001_auto_close .hj001_time {}' +
    '.hj001_login_box .hj001_auto_close em {font-style: normal;font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial"; font-size: 28px; color: #f62626; padding-right: 5px;}' +
    '.hj001_login_box .hj001_auto_close .hj001_left_time {font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial";font-size: 28px; }' +
    '.hj001_login_box .hj001_login_warp .hj001_placeholder {display: inline-block; height: 30px; line-height: 30px; font-size: 14px; color: #b5b5b5; position: absolute; z-index: -1; left: 15px; top: 5px;}' +
    '.hj001_login_box .hj001_login_warp .hj001_agreement .hj001_check_box {display: none;}' +
    '.hj001_login_box .hj001_login_warp .hj001_agreement .hj001_check {float: left;}' +
    '.hj001_login_box .hui_checkbox .hui_checkbox_label a {font-size:14px;}' +
    '.hj001_login_box .hui_checkbox .hui_checkbox_icon {font-family: Simsun; margin: 7px 10px 0 0; float: left;    border: 1px solid #d9d9d9;color: #1ba8eb;text-indent: -100px;font-size: 15px;font-style: normal;line-height: 1.2em; width: 18px;height:18px; padding-bottom: 1px;cursor:pointer;overflow:hidden;}' +
    '.hj001_login_box .hui_checkbox .hui_checkbox_label {color: #666666; font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial";font-size: 14px; line-height: 34px; float: left; padding-left: 0px; cursor: pointer;}' +
    '.hj001_login_box .hui_checkbox_checked .hui_checkbox_icon{visibility: visible;text-indent: 4px;}' +
    '.hj001_login_box .hui_textinput {font-family: Arial;background-image: url("/static/img/icon.png");background-position:1000px 1000px;background-repeat:no-repeat;*margin-left: -5px;}' +
    '.hj001_login_box .hui_textinput_placeholder {display: inline-block; height: 30px; line-height: 30px; font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial";font-size: 14px; color: #b5b5b5; position: absolute; z-index: -1; left: 15px; top: 5px; *top: 7px;}' +
    '.hj001_login_box .hui_textinput_eye {display: inline-block; height: 30px; line-height: 30px; font-size: 14px; color: #b5b5b5; position: absolute; z-index: -1; left: 15px; top: 5px;}' +
    '.hj001_login_box .hui_textinput_eye {width: 25px; height: 13px; display: inline-block; top: 5px; right: 45px; position: absolute; z-index: 2; text-indent: -100px; overflow: hidden; padding: 10px; background-color:white; background-repeat: no-repeat;  cursor: pointer; left: auto; bottom: auto;}' +
    '.hj001_login_box .hui_textinput_eye       {background-image: url("/static/img/icon.png");background-position:-290px -40px;}' +
    '.hj001_login_box .hui_textinput_eye:hover {background-image: url("/static/img/icon.png");background-position:-290px 10px;}' +
    '.hj001_login_box .validate_waiting .validate_icon {position: absolute; right: 2px; top: 11px; background-image: url("/quick/img/loading.gif"); display: inline-block; height: 20px; width: 20px;}' +
    '.hj001_login_box .validate_waiting .validate_text {display: none;}' +
    '.hj001_login_box .validate_ok .validate_icon {position: absolute; right: 2px; top: 11px; background-image: url("/static/img/icon.png");background-position:0px -100px; display: inline-block; height: 20px; width: 20px;}' +
    '.hj001_login_box .validate_ok .validate_text {bottom: 2px; left: 5px; color: #F62626; display: none; font-size: 12px; height: 20px; line-height: 20px; overflow: hidden; position: absolute;}' +
    '.hj001_login_box .hj001_panel_login .validate_ok .validate_icon {display: none;}' +
    '.hj001_login_box .validate_error .validate_icon {position: absolute; right: 2px; top: 11px; background-image: url("/static/img/icon.png");background-position:-50px -100px; display: inline-block; height: 20px; width: 20px;}' +
    '.hj001_login_box .validate_error .validate_text {color: #F62626; display: block; font-size: 12px; height: 20px; line-height: 20px; overflow: hidden; float:left;}' +
    '.hj001_login_box .hj001_pwd_warp .validate_text {display: none; margin-top: 3px;}' +
    '.hj001_login_box .hj001_pwd_warp.validate_error .validate_text {display: block; left: 200px; top: 50px;}' +
    '.hj001_login_box .hj001_login_btn    {width: 319px; height: 40px; line-height: 40px; text-align: center; color: #ffffff; display: block;  font-size: 20px; margin-bottom: 2px;}' +
    '.hj001_login_box .hj001_send_btn     {width: 152px; height: 40px; line-height: 40px; text-align: center; color: #ffffff; display: block;  font-size: 14px; margin-bottom: 2px; float: left; margin-left: 13px; cursor: pointer;}' +
    '.hj001_login_box .hj001_send_btn .hui_btn_label {font-size: 14px;}' +
    '.hj001_login_box .hj001_continue_btn {width: 162px; height: 40px; line-height: 40px; text-align: center; color: #ffffff; display: block;  font-size: 20px; margin-bottom: 2px; margin-left: auto; margin-right: auto; cursor: pointer;}' +
    '.hj001_login_box .hui_btn {cursor: pointer; background-color: #55b9ee; color: #fff; border-radius: 5px;}' +
    '.hj001_login_box .hui_btn:hover {background-color: #6dc9fa; color: #fff; text-decoration: none;}' +
    '.hj001_login_box .hui_btn_label {font-family: "Helvetica","Microsoft Yahei","Arial";*font-family: "Microsoft Yahei","Arial";font-size:20px;}' +
    '.hj001_login_box .hui_btn_disabled {cursor: default; border-radius: 5px; background-color: #c1c1c1; color: #fff;}' +
    '.hj001_login_box .hui_btn_disabled:hover {cursor: default; border-radius: 5px; background-color: #c1c1c1; color: #fff;}' +
    '.hj001_login_box .hui_hj_reg_mobile_success {text-align: center;padding-right:30px;}' +
    '.hj001_login_box .hj001_onekey_next_tip {color: #666;font-size: 14px;padding: 30px 0px 15px 45px;}' +
    '.hj001_login_box .hj001_onekey_next_tip2 {font-size: 16px;color: #666;padding-left: 42px;padding-top: 8px;padding-bottom: 34px;display:none;}' +
    '.hj001_login_box .hui_hj_reg_onekey_next .hj001_success {padding: 37px 0px 10px 16px;}' +
    '.hj001_login_box .hui_hj_reg_onekey_next .hj001_login_btn {margin-top: 10px;}' +
    '.hj001_login_box .hui_hj_reg_email_success {text-align: center;padding-right:30px;}');



//window.hjquicklogin.doLogin();
//window.hjquicklogin.doRegiste();