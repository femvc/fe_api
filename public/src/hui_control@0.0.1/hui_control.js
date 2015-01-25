'use strict';
/**
 * @name 控件基础类
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 */
hui.define('hui_control', [], function () {
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
            }
            else if (Object.prototype.toString.call(eventType) === '[object Array]') {
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

    hui.Flow = function () {
        this.que = []; // 注：存放要调用的函数列表
        this.id = Math.random(); // 注：仅用于标示，不会被调用（即使删掉也没什么影响）
    };

    /**  
     * @name 添加需要异步执行的函数
     * @param {Function} fn 需要异步执行的函数
     * @return {this} 返回主体以便于后续操作
     */
    hui.Flow.prototype.push = function (fn, target) {
        var me = this,
            _fn = target ? hui.fn(fn, target) : fn,
            callback = hui.fn(me.next, me);

        fn = function () {
            _fn(callback);
        };
        me.que.push(fn);

        return me;
    };

    /**  
     * @name 开始执行异步队列
     * @param {Function} callback 嵌套时的回调函数，其实就是hui.Flow.prototype.next
     * @return {void}
     */
    hui.Flow.prototype.next = function (callback) {
        if (callback) {
            callback();
        }

        if (this.que.length > 0) {
            var fn = this.que.shift();
            fn();
        }
    };

    /**  
     * @name Javascript简单异步框架 
     * @property {Array} que 保存回调队列  
     * @method {Function} push 添加需要异步执行的函数
     * @method {Function} next 开始执行异步队列
     * @comment 异步队列中的函数需要实现callback的接口
     * @example
         function doit() {
            alert('a');
            
            var que1 = new hui.Flow();
            que1.push(a);
            que1.push(d); 
            setTimeout(function(){
                que1.next();
            },400);
        }

         function a(callback) {
            alert('a');
            
            var que2 = new hui.Flow();
            que2.push(b).push(c).push(callback); 
            
            setTimeout(function(){
                que2.next();
            },400);
        }
        function b(callback) {
            alert('b');
            callback&&callback();
        }
        function c(callback) {
            alert('c');
            callback&&callback();
        }
     */

    // Define hui_control
    hui.Control = function (options, pending) {
        hui.EventDispatcher.call(this);

        // 状态列表
        options = options || {};
        // 初始化参数
        this.initOptions(options);
        // 生成控件id
        if (!this.id) {
            this.id = hui.Control.makeGUID(this.formname);
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
        // controlMap: [],
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
                idPrefix = me.id === undefined ? '' : me.id;

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
            elem = me.main ? document.getElementById(me.main) : null;
            return elem;
        },
        mainFocus: function () {
            // Fix IE8 bug: hidden elem focus() cause error
            var main = this.getMain();
            try {
                main.focus();
            }
            catch (e) {}
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
            }
            else if (elem.innerHTML !== undefined) {
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
            if (!html && typeof elem === 'string' && this.getMain) {
                html = elem;
                elem = this.getMain();
            }
            return hui.Control.setInnerHTML(elem, html);
        },
        /**
         * @name 渲染控件
         * @public
         */
        render: function () {
            // var me = this;
            // var main = me.getMain();
            // var data = me.model && me.model.getData && typeof me.model.getData === 'function' ? me.model.getData() : {};
            // hui.Control.init(main, data, me);
            // main.setAttribute('_rendered', 'true');
        },
        // 
        /**
         * @name 生成HTML
         * @public
         */
        // initView: function (callback) {
        //     callback && callback();
        // },
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
                for (var i = 0, len = me.controlMap.length; i < len; i++) {
                    me.controlMap[i].initBehaviorByTree();
                }
            }
            if (main.getAttribute('_initbehavior') != 'true') {
                main.setAttribute('_initbehavior', 'true');
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
                for (var i = 0, len = controlMap.length; i < len; i++) {
                    n = controlMap[i].validate(show_error);
                    result = n && result;
                    m = m === null && !n ? controlMap[i] : m;
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
                for (var i = 0, len = me.controlMap.length; i < len; i++) {
                    me.controlMap[i].hideError();
                }
            }
            return me;
        },
        showError: function (errorMsg, code) {
            var me = this,
                Validator = hui.Control.getExtClass('hui.Validator'),
                rule = Validator.getRule(me.rule);
            if (rule && code === 'by_code') {
                errorMsg = rule.noticeText[errorMsg];
            }

            Validator.showError(me.getMain(), errorMsg);
            return me;
        },
        showErrorByTree: function (paramMap, code) {
            var me = this,
                value,
                list,
                ctr;
            if (me.controlMap && paramMap) {
                for (var formname in paramMap) {
                    if (formname && paramMap.hasOwnProperty(formname)) {
                        value = Object.prototype.toString.call(paramMap[formname]) !== '[object Array]' ?
                            [paramMap[formname]] : paramMap[formname];
                        ctr = me.getById(formname);
                        list = ctr ? [ctr] : me.getByFormnameAll(formname, false);
                        if (list.length < 1) {
                            continue;
                        }
                        for (var i = 0, len = value.length; i < len; i++) {
                            ctr = list[i];
                            if (ctr) {
                                if (Object.prototype.toString.call(value[i]) === '[object Object]' &&
                                    ctr.controlMap) {
                                    ctr.showErrorByTree(value[i], code);
                                }
                                else if (ctr.showError) {
                                    ctr.showError(value[i], code);
                                }
                                ctr = null;
                            }
                        }
                    }
                }
            }
            return me;
        },
        showOK: function () {
            var me = this,
                Validator = hui.Control.getExtClass('hui.Validator');
            Validator.showOK(me);
            return me;
        },
        showWaiting: function () {
            var me = this,
                Validator = hui.Control.getExtClass('hui.Validator');
            Validator.showWaiting(me);
            return me;
        },
        /**
         * @name 返回控件的值
         * @public
         */
        //getValue:   new Function(), // 注: 控件直接返回值(对象/数组/字符串)时才能使用getValue! 获取所有子控件的值,应该用getParamMap
        setValue: function (paramMap) {
            var me = this;
            if (me.controlMap && (/\[object Object\]/.test(Object.prototype.toString.call(paramMap)))) {
                me.setValueByTree(this.value);
            }
            else {
                // 注：在setValue/getValue时不允许使用me.getMain().setAttirbute('value', value)和me.getMain()
                // .getAttirbute('value'),因为value有可能是数组/对象！！
                // 如果确定value是num或str可以在子类中覆盖setValue/getValue！！
                me.getMain().value = paramMap;
            }
            return me;
        },
        /**
         * @name 给控件树一次性赋值
         * @param {Object} v 值
         */
        setValueByTree: function (paramMap) {
            var me = this,
                value,
                list,
                ctr,
                main;
            if (me.controlMap && paramMap) {
                for (var formname in paramMap) {
                    if (formname && paramMap.hasOwnProperty(formname)) {
                        value = Object.prototype.toString.call(paramMap[formname]) !== '[object Array]' ?
                            [paramMap[formname]] : paramMap[formname];
                        ctr = me.getById(formname);
                        list = ctr ? [ctr] : me.getByFormnameAll(formname, false);
                        if (list.length < 1) {
                            continue;
                        }
                        for (var i = 0, len = list.length; i < len; i++) {
                            ctr = list[i];

                            if (ctr.constructor &&
                                ctr.setValue &&
                                ctr.getPresetValue) {
                                var presetValue = ctr.getPresetValue();
                                for (var j = 0, len2 = value.length; j < len2; j++) {
                                    if (value[j] && presetValue === String(value[j])) {
                                        ctr.setValue(value[j]);
                                        break;
                                    }
                                }
                            }
                            else if (ctr.constructor &&
                                ctr.setValue &&
                                ctr.setValue !== hui.Control.prototype.setValue) {
                                ctr.setValue(value[i]);
                            }
                            else if (ctr.controlMap) {
                                ctr.setValueByTree(value[i]);
                            }
                            else if (ctr.getMain || ctr.main) {
                                main = (ctr.getMain ? ctr.getMain() : document.getElementById(ctr.main)) || {};
                                main.value = value[i];
                            }

                            ctr = null;
                        }
                    }
                }
            }

            return me;
        },
        getValue: function () {
            var me = this,
                main = me.getMain ? me.getMain() : document.getElementById(me.main),
                value = main.value;
            if (me.controlMap) {
                value = me.getParamMap();
            }
            return value;
        },
        /**
         * @name 获取子控件的值，返回一个map
         * @public
         */
        getParamMap: function () {
            var me = this,
                paramMap = {},
                ctr,
                formname,
                value;
            // 如果有子控件建议递归调用子控件的getValue!!
            if (me.controlMap) {
                for (var i = 0, len = me.controlMap.length; i < len; i++) {
                    ctr = me.controlMap[i];
                    formname = hui.Control.prototype.getFormname.call(ctr);
                    if (String(ctr.isFormItem) !== 'false') {
                        paramMap[formname] = paramMap[formname] ? paramMap[formname] : [];
                        if (ctr.getValue) {
                            value = ctr.getValue();
                            paramMap[formname].push(value);
                        }
                        else if (ctr.getMain || ctr.main) {
                            value = (ctr.getMain ? ctr.getMain() : document.getElementById(ctr.main)).value;
                            paramMap[formname].push(value);
                        }
                        else if (ctr.controlMap) {
                            value = ctr.getParamMap();
                            paramMap[formname].push(value);
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
         * @name 通过formname访问子控件
         * @public
         * @param {String} formname 子控件的formname
         */
        getByFormname: function (formname) {
            var me = this;
            return hui.Control.getByFormname(formname, me);
        },
        getByFormnameAll: function (formname, all) {
            var me = this;
            return hui.Control.getByFormnameAll(formname, me, all);
        },
        getById: function (id) {
            var me = this;
            return hui.Control.getById(id, me);
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
            }
            else {
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
            me.size = size ? size : me.size || {};
            me.size.width = me.size.width === undefined ? me.size.w : me.size.width;
            me.size.height = me.size.height === undefined ? me.size.h : me.size.height;
            me.size.top = me.size.top === undefined ? me.size.t : me.size.top;
            me.size.bottom = me.size.bottom === undefined ? me.size.b : me.size.bottom;
            me.size.left = me.size.left === undefined ? me.size.l : me.size.left;
            me.size.right = me.size.right === undefined ? me.size.r : me.size.right;

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
        getFormname: function () {
            var me = this,
                main = me.getMain ? me.getMain() : document.getElementById(me.main);
            var itemName = me.formname || me['name'] || (main ? main.getAttribute('name') : null);
            return itemName;
        },
        /**
         * @name 释放控件
         * @protected
         */
        dispose: function () {
            var me = this,
                controlMap,
                main = me.getMain ? me.getMain() : document.getElementById(me.main),
                list;
            // 从父控件的controlMap中删除引用
            if (me.parentControl) {
                controlMap = me.parentControl.controlMap;
                for (var i = 0, len = controlMap.length; i < len; i++) {
                    if (controlMap[i] === me) {
                        controlMap.splice(i, 1);
                        break;
                    }
                }
            }

            me.disposeChild && me.disposeChild();

            if (main) {
                // 释放控件主区域的常用事件
                list = 'onmouseover|onmouseout|onmousedown|onmouseup|onkeyup|onkeydown|onkeypress|onchange|onpropertychange|' +
                    'onfocus|onblur|onclick|ondblclick|ontouchstart|ontouchmove|ontouchend|ondragover|ondrop|ondragstart'.split('|');
                for (var i = 0, len = list.length; i < len; i++) {
                    try {
                        main[list[i]] = Function('');
                    }
                    catch (e) {}
                }

                // 清空HTML内容
                if (main.setInnerHTML) {
                    main.setInnerHTML(main, '');
                }
                else if (main.innerHTML) {
                    main.innerHTML = '';
                }
                main.parentNode.removeChild(main);
            }

            // 因为使用的属性而非闭包实现的EventDispatcher，因此无需担心内存回收的问题。
        },
        disposeChild: function () {
            var me = this;
            // dispose子控件
            if (me.controlMap) {
                for (var i = me.controlMap.length - 1; i > -1; i--) {
                    me.controlMap[i].dispose();
                    me.controlMap[i] = null;
                }
                me.controlMap = [];
            }
        },
        // /**
        //  * @name 获取视图模板名
        //  * @protected
        //  * @return {String} target名字
        //  * @default 默认为action的id
        //  */
        // getView: function () {
        //     var view = (this.view === null ? '' : this.view);
        //     // 获取view
        //     if (typeof view === 'function') {
        //         view = view();
        //     }
        //     view = hui.Action.getExtClass('hui.Template').getTarget(String(view));

        //     return view;
        // },
        /**
         * @name Control的主要处理流程
         * @protected
         * @param {Object} argMap arg表.
         */
        enterControl: function (callback) {
            var uiObj = this,
                parentControl = uiObj.parentControl;
            // 注：默认增加一个空元素作为控件主元素!
            if (typeof uiObj.getMain !== 'function') {
                uiObj.getMain = hui.Control.prototype.getMain;
            }
            var elem = uiObj.getMain() || (uiObj.createMain ? uiObj.createMain() : hui.Control.prototype.createMain.call(uiObj));
            if (!elem) {
                return hui.Control.error('Control\'s main element is invalid');
            }

            var que = new hui.Flow(); // 注：可以参照hui_flow.js文件。非常简单，不到30行代码
            if (elem.getAttribute && !elem.getAttribute('ctrid')) {
                que.push(function (next) {
                    var me = this;
                    var main = me.getMain();
                    // 默认设置value
                    if (uiObj.value !== undefined) {
                        main.value = uiObj.value;
                    }
                    // 便于通过main.getAttribute('ctrid')找到control
                    main.setAttribute('ctrid', uiObj.getId ? uiObj.getId() : uiObj.id);
                    hui.Control.addClass(main, me.getClass());
                    me.setSize();

                    next && next();
                }, uiObj);
            }

            // 初始化Model
            if (elem.getAttribute && elem.getAttribute('_initModel') != 'true') {
                if (uiObj.initModel && uiObj.initModelMethod !== 'async' && uiObj.initModelMethod !== 'skip') {
                    que.push(function (next) {
                        var me = this;
                        me.initModel();

                        next && next();
                    }, uiObj);
                    que.push(function (next) {
                        var me = this;
                        var main = me.getMain();
                        main.getAttribute('_initModel', 'true');
                        next && next();
                    }, uiObj);
                }
                else if (uiObj.initModelAsync && uiObj.initModelMethod !== 'sync' && uiObj.initModelMethod !== 'skip') {
                    que.push(uiObj.initModelAsync, uiObj);
                    que.push(function (next) {
                        var me = this;
                        var main = me.getMain();
                        main.getAttribute('_initModel', 'true');
                        next && next();
                    }, uiObj);
                }
            }

            // 渲染视图
            if (elem.getAttribute && elem.getAttribute('_initView') != 'true') {
                if (uiObj.getView && uiObj.getViewMethod !== 'async' && uiObj.getViewMethod !== 'skip') {
                    que.push(function (next) {
                        var me = this;
                        var main = me.getMain();
                        var tpl = me.getView();
                        var mainHTML = me.model && me.model.getData ? hui.Action.getExtClass('hui.Template').merge(tpl, me.model.getData()) : tpl;
                        hui.Control.prototype.setInnerHTML(main, mainHTML);

                        next && next();
                    }, uiObj);
                    que.push(function (next) {
                        var me = this;
                        var main = me.getMain();
                        main.getAttribute('_initView', 'true');
                        next && next();
                    }, uiObj);
                }
                else if (uiObj.getViewAsync && uiObj.getViewMethod !== 'sync' && uiObj.getViewMethod !== 'skip') {
                    que.push(function (next) {
                        var me = this;
                        me.getViewAsync(function (tpl) {
                            var main = me.getMain();
                            var mainHTML = me.model && me.model.getData ? hui.Action.getExtClass('hui.Template').merge(tpl, me.model.getData()) : tpl;
                            hui.Control.prototype.setInnerHTML(main, mainHTML);

                            next && next();
                        });
                    }, uiObj);
                    que.push(function (next) {
                        var me = this;
                        var main = me.getMain();
                        main.getAttribute('_initView', 'true');

                        next && next();
                    }, uiObj);
                }
            }

            que.push(function (next) {
                var me = this;
                var main = me.getMain();
                // 动态生成control需手动维护me.parentControl
                // 回溯找到父控件,若要移动控件,则需手动维护parentControl属性!!
                var parentElement = main;
                while (parentElement && parentElement.tagName && parentElement.parentNode) {
                    parentElement = parentElement.parentNode;
                    //label标签自带control属性!!
                    if (parentElement && hui.Control.isControlMain(parentElement)) {
                        var control = hui.Control.getById(parentElement.getAttribute('ctrid'), parentControl);
                        hui.Control.appendControl(control, me);
                        break;
                    }
                    // 未找到直接父控件则将control从hui.window.controlMap移动到action.controlMap中
                    else if (~',html,body,'.indexOf(',' + String(parentElement.tagName).toLowerCase() + ',')) {
                        hui.Control.appendControl(null, me);
                        break;
                    }
                }
                next && next();
            }, uiObj);

            // 1. initView()会在render调用父类的render时自动调用，
            // 2. 不管是批量hui.Control.init()还是hui.Control.create(), 都会通过enterControl来执行render
            // 3. initBehavior()会在后面执行
            if (elem.getAttribute && elem.getAttribute('_rendered') != 'true') {
                que.push(function (next) {
                    var me = this;
                    var main = me.getMain();
                    me.render && me.render();

                    if (!me.render || main.getAttribute('_rendered') === 'false') {
                        var data = me.model && me.model.getData && typeof me.model.getData === 'function' ? me.model.getData() : {};
                        hui.Control.init(main, data, me);
                        main.setAttribute('_rendered', 'true');
                    }

                    next && next();
                }, uiObj);
            }
            if (elem.getAttribute && elem.getAttribute('_initBehavior') != 'true') {
                que.push(function (next) {
                    var me = this;
                    if (me.initBehaviorByTree) {
                        me.initBehaviorByTree();
                    }
                    else if (me.initBehavior) {
                        me.initBehavior();
                    }

                    next && next();
                }, uiObj);
            }
            que.push(function (next) {
                var me = this;
                me.finish && me.finish();

                callback && callback();
            }, uiObj);

            que.next();
        },
        /**
         * @name 生成DOM
         * @protected
         */
        createMain: function () {
            var me = this,
                tagName = this.tagName || 'DIV',
                main = document.createElement(String(tagName).toUpperCase()),
                control = me.parentControl,
                wrap = null;

            if (!wrap && control && control.getMain) {
                wrap = control.getMain();
            }
            if (!wrap && control && control.main) {
                wrap = document.getElementById(control.main);
            }
            if (!wrap) {
                wrap = document.body || document.documentElement;
            }

            wrap.appendChild(main);

            main.id = hui.Control.makeElemGUID(me.id);
            me.main = main.id;

            return main;
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
        return function (formname) {
            return (formname ? formname : 'inner') + '_' + hui.Control.getHashCode('inner') + (guid++);
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
            return (id !== undefined ? id + hui.Control.getHashCode(id) : ('_' + hui.Control.formatDate(new Date(), 'yyyyMMddHHmm') + '_' + (guid++)));
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
            if (~',html,body,'.indexOf(',' + String(elem.tagName).toLowerCase() + ',') == -1) break;
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
        // label的control是DOM
        if (elem && elem.getAttribute && elem.getAttribute('ctrid')) {
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
        if (!opt_wrap || opt_wrap.getAttribute('_rendered') === 'true') {
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
        parentControl = parentControl || hui.window;
        parentControl.controlMap = parentControl.controlMap || [];


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
            if (elem && elem.getAttribute && elem.getAttribute(uiAttr) && (elem.getAttribute('_initview') !== 'true' || elem.getAttribute('_initbehavior') !== 'true')) {
                uiEls.push(elem);
            }
        }
        for (var i = 0, len = uiEls.length; i < len; i++) {
            elem = uiEls[i];
            if (!hui.Control.isChildControl(elem, uiEls) && elem.getAttribute('_rendered') !== 'true') {

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
        // 注：扩展了一下，直接支持hui.Control.create(Element);
        if (type && Object.prototype.toString.call(type) != '[object String]' && type.getAttribute) {
            options = options || {};
            if (hui.Control.isControlMain(type)) {
                var control = hui.Control.getById(type.getAttribute('ctrid'));
                if (control) {
                    hui.Control.appendControl(options.parentControl, control);
                }
            }
            var str, attrs;
            try {
                str = type.getAttribute(hui.Control.UI_ATTRIBUTE || 'ui');
                try {
                    attrs = hui.Control.parseCustomAttribute(str);
                }
                catch (e) {
                    attrs = hui.Control.parseCustomAttribute(str.replace(/\\\'/g, '\'').replace(/\\\"/g, '\"')); //"
                }
            }
            catch (e) {
                hui.window.JSON && hui.window.JSON.stringify && hui.window.console && hui.window.console.error && hui.window.console.error('JSON Error: ', str);
                return;
            }

            var text, action, key;
            for (var i in attrs) {
                text = attrs[i];
                if (text && Object.prototype.toString.call(text) === '[object String]') {
                    if (text.indexOf('&') === 0) {
                        key = text.replace('&', '');
                        attrs[i] = hui.window[key];
                    }
                    else if (text.indexOf('@') === 0 && hui.Action && (typeof hui.Action.get) === 'function') {
                        key = text.replace('&', '');
                        action = hui.Action.get();
                        if (action && action.model && (typeof action.model.get) === 'function') {
                            attrs[i] = action.model.get(key);
                        }
                        else if (action && action.model) {
                            attrs[i] = action.model[key];
                        }
                        else if (action) {
                            attrs[i] = action[key];
                        }

                    }
                }
            }

            for (var i in options) {
                if (i && options.hasOwnProperty(i)) {
                    attrs[i] = attrs[i] !== undefined ? attrs[i] : options[i];
                }
            }
            // 注：每个控件必须有id
            attrs.id = attrs.id ? attrs.id : hui.Control.makeGUID(attrs['formname']);
            // 注：type即elem
            type.id = type.id || hui.Control.makeElemGUID(attrs.id);
            attrs.main = type.id;
            attrs.bocument = type.bocument;

            return hui.Control.create(attrs['type'], attrs);
        }

        options = options || {};

        // 注：创建并渲染控件，每个控件必须有id
        var objId = options.id;
        if (!objId) {
            objId = hui.Control.makeGUID(options['formname']);
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
            var child = uiObj,
                parent = hui.Control.prototype;
            for (var key in parent) {
                if (parent.hasOwnProperty(key)) {
                    child[key] = parent[key];
                }
            }
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
        parent.controlMap = parent.controlMap || [];

        // var ctrId = uiObj.getId ? uiObj.getId() : uiObj.id;
        // 注：从原来的父控件controlMap中移除
        if (uiObj.parentControl && uiObj.parentControl.controlMap && uiObj.parentControl.controlMap != parent.controlMap) {
            var list = uiObj.parentControl.controlMap;
            for (var i = list.length - 1; i > -1; i--) {
                if (list[i] === uiObj) {
                    list.splice(i, 1);
                }
            }
        }

        // !!!悲催的案例,如果将controlMap放在prototype里, 这里parent.controlMap===uiObj.controlMap!!!
        var exist = false;
        for (var i = 0, len = parent.controlMap.length; i < len; i++) {
            if (parent.controlMap[i] === uiObj) {
                exist = true;
                break;
            }
        }
        if (!exist) {
            parent.controlMap.push(uiObj);
        }
        // 重置parentControl标识
        uiObj.parentControl = parent;
        // !!!不能移动DOM，需自行解决，因为会打乱html布局
        /*var parentNode = parent.getMain ? parent.getMain() : null,
            main = uiObj.getMain();
        if (parentNode && main) {
            parentNode.appendChild(main);
        };*/
    };

    /**
     * @name 获取所有子节点element
     * @public
     * @param {HTMLElement} main
     * @param {String} stopAttr 如果元素存在该属性,如'ui',则不遍历其下面的子元素
     */
    hui.Control.findAllNodes = function (main, stopAttr) {
        var childNode,
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
            // 注：Nodelist是伪数组且IE不支持Array.prototype.slice.call(Nodelist)转化数组
            for (var i = 0, len = childlist.length; i < len; i++) {
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
        var childNode,
            results,
            list,
            control;
        results = [];
        if (Object.prototype.toString.call(parentControl).indexOf('Element') > -1) {
            list = hui.Control.findAllNodes(parentControl);
            for (var i = 0, len = list.length; i < len; i++) {
                if (hui.Control.isControlMain(list[i])) {
                    control = hui.Control.getById(list[i].getAttribute('ctrid'));
                    if (control) {
                        results.push(control);
                    }
                }
            }
        }
        else {
            list = [parentControl];
            while (list.length) {
                childNode = list.pop();
                if (!childNode) continue;

                results.push(childNode);

                if (!childNode.controlMap) continue;
                list = list.concat(childNode.controlMap);
            }
            // 去掉顶层父控件或Action,如不去掉处理复合控件时会导致死循环!!
            if (results.length > 0) results.shift();
            // 后序遍历出来的结果，因此需要反转数组
            results.reverse();
        }
        return results;
    };
    // 所有控件实例的索引. 注释掉原因: 建了索引会造成无法GC内存暴涨!
    // hui.Control.elemList = [];
    /**
     * @name 回溯找到当前元素所在的控件
     * @public
     * @param {Element} parentElement DOM元素
     */
    hui.Control.findByElem = function (parentElement) {
        var control = null;
        while (parentElement && parentElement.tagName) {
            //label标签自带control属性!!
            if (parentElement && hui.Control.isControlMain(parentElement)) {
                control = hui.Control.getById(parentElement.getAttribute('ctrid'));
                break;
            }
            else if (~',html,body,'.indexOf(',' + String(parentElement.tagName).toLowerCase() + ',')) {
                break;
            }
            parentElement = parentElement.parentNode;
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
            (hui.Action && hui.Action.get ? (hui.Action.get(parentControl) || hui.Action.get()) : hui.window);

        if (id === undefined || (parentControl && parentControl.getId && id === parentControl.getId())) {
            result = parentControl;
        }
        else if (parentControl) {
            list = hui.Control.findAllControl(parentControl);
            for (var i = 0, len = list.length; i < len; i++) {
                if (list[i].id == id) {
                    result = list[i];
                }
            }
        }

        // If not found then find in 'window.controlMap'
        if (!result) {
            list = hui.Control.findAllControl(hui.window);
            for (var i = 0, len = list.length; i < len; i++) {
                if (list[i].id == id) {
                    result = list[i];
                }
            }
        }

        return result;
    };
    /**
     * @name 根据控件formname找到对应控件
     * @static
     * @param {String} 控件formname
     */
    hui.Control.getByFormnameAll = function (formname, parentNode, all) {
        var list = [],
            childNodes,
            item,
            /* 强制确认parentControl: 如果传入是parentControl的id，则找出其对应的Control */
            parentControl = hui.Control.getById(undefined, parentNode) || hui.window;

        if (formname) {
            formname = String(formname);

            // 先查找自身
            childNodes = parentControl && parentControl.controlMap ? parentControl.controlMap : [];
            //childNodes.unshift(parentControl);
            if (parentControl.getFormname && parentControl.getFormname() === formname) {
                list.push(parentControl);
            }

            // 再遍历控件树
            childNodes = parentControl && parentControl.controlMap ?
                (all === false ? parentControl.controlMap : hui.Control.findAllControl(parentControl)) : [];
            for (var i = 0, len = childNodes.length; i < len; i++) {
                item = childNodes[i];
                if ((item.getFormname && item.getFormname() === formname) || item['formname'] === formname) {
                    list.push(childNodes[i]);
                }
            }
        }

        return list;
    };
    /**
     * @name 根据控件formname找到对应控件
     * @static
     * @param {String} 控件formname
     */
    hui.Control.getByFormname = function (formname, parentNode) {
        var result = null,
            list;
        if (typeof parentNode == 'string') {
            parentNode = hui.Control.getById(parentNode) || hui.Control.getByFormname(parentNode);
        }
        list = hui.Control.getByFormnameAll(formname, parentNode);
        if (parentNode && parentNode.parentNode && parentNode.childNodes) {
            for (var i = 0, len = list.length; i < len; i++) {
                if (hui.Control.checkParentNode(list[i], parentNode)) {
                    result = list[i];
                    break;
                }
            }
        }
        else {
            result = list[0];
        }

        return result;
    };
    /**
     * @name 销毁一组控件
     * @static
     * @param {String} list 一组控件
     */
    hui.Control.disposeList = function (list) {
        if (Object.prototype.toString.call(list) === '[object Array]') {
            for (var i = 0, len = list.length; i < len; i++) {
                if (list[i] && list[i].dispose) {
                    list[i].dispose();
                }
            }
        }
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
                }
                else {
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
    hui.Control.hasClass = function (element, className) {
        return (~(' ' + element.className + ' ').indexOf(' ' + className + ' '));
    };
    hui.Control.addClass = function (element, className) {
        if (~'[object Array][object NodeList]'.indexOf(Object.prototype.toString.call(element))) {
            for (var i = 0, len = element.length; i < len; i++) {
                hui.Control.addClass(element[i], className);
            }
        }
        else if (element) {
            hui.Control.removeClass(element, className);
            element.className = (element.className + ' ' + className).replace(/(\s)+/ig, ' ');
        }
        return element;
    };
    // Support * and ?, like hui.Control.removeClass(elem, 'daneden-*');
    hui.Control.removeClass = function (element, className) {
        if (~'[object Array][object NodeList]'.indexOf(Object.prototype.toString.call(element))) {
            for (var i = 0, len = element.length; i < len; i++) {
                hui.Control.removeClass(element[i], className);
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
    };

    hui.Control.format = function (source, opts) {
        source = String(source);
        var data = Array.prototype.slice.call(arguments, 1),
            toString = Object.prototype.toString;
        if (data.length) {
            data = (data.length == 1 ?
                /* ie 下 Object.prototype.toString.call(null) == '[object Object]' */
                (opts !== null && (/\[object (Array|Object)\]/.test(toString.call(opts))) ? opts : data) : data);
            return source.replace(/#\{(.+?)\}/g, function (match, key) {
                var encode = String(key).indexOf('!') === 0,
                    parts = key.replace(/^!/, '').split('.'),
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
                return (undefined === variable ? '' : encode ? variable : hui.Control.encodehtml(variable));
            });
        }
        return source;
    };

    hui.Control.formatDate = function (date, fmt) {
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
    hui.Control.parseDate = function (str) {
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
    hui.Control.encode = function (str, decode) {
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
    hui.Control.decode = function (str) {
        return this.encode(str, 'decode');
    };
    hui.Control.encodehtml = function (str, decode) {
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
    hui.Control.decodehtml = function (str) {
        return this.encodehtml(str, 'decode');
    };


    //setInnerHTML: function (elem, html){}
    hui.Control.setInnerHTML = function (elem, html) {
        elem = elem && elem.getMain ? elem.getMain() : elem;
        if (elem && elem.innerHTML !== undefined) {
            elem.innerHTML = html;
        }
        return elem;
    };
    hui.Control.setInnerText = function (elem, text) {
        if (!elem) return;
        if (elem.textContent !== undefined) {
            elem.textContent = text;
        }
        else {
            elem.innerText = text;
        }
    };

    hui.Control.error = function (str) {
        if (hui.window && hui.window.console && hui.window.console.error) {
            hui.window.console.error(str);
        }
    };
    hui.Control.log = function (str) {
        if (hui.window && hui.window.console && hui.window.console.log) {
            hui.window.console.log(str);
        }
    };
    hui.Control.getExtClass = function (clazz) {
        var result = function () {};
        switch (clazz) {
        case 'hui.BaseModel':
            if (typeof hui !== 'undefined' && hui.BaseModel) {
                result = hui.BaseModel;
            }
            else {
                result.get = new Function();
                result.set = new Function();
            }
            break;
        case 'hui.Template':
            if (typeof hui !== 'undefined' && hui && hui.Template) {
                result = hui.Template;
            }
            else {
                result.getTarget = new Function();
                result.merge = new Function();
            }
            break;
        case 'hui.Validator':
            if (typeof hui !== 'undefined' && hui.Validator) {
                result = hui.Validator;
            }
            else {
                result.cancelNotice = new Function();
                result.set = new Function();
            }
            break;
        case 'hui.Action':
            if (typeof hui !== 'undefined' && hui.Validator) {
                result = hui.Validator;
            }
            else {
                result.get = new Function();
            }
            break;
        case 'hui.context':
            if (typeof hui !== 'undefined' && hui.context) {
                result = hui.context;
            }
            else {
                result = {};
                result.get = new Function();
            }
            break;
        default:
        }
        return result;
    };
});