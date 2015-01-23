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
 * @author haiyang5210
 * @date 2014-11-14 23:51
 * @param {Object} options 控件初始化参数.
 */
hui.define.autoload = true;
hui.define('hui_textinput', ['hui_control', 'hui_util'], function () {

    hui.TextInput = function (options, pending) {
        hui.TextInput.superClass.call(this, options, 'pending');

        if (this.value !== undefined) {
            this.value = String(this.value);
        }
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
                }
                else if (code == 12288) { //空格
                    result += String.fromCharCode(str.charCodeAt(i) - 12288 + 32);
                }
                else {
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
                value = me.getInput().value;
            if (me.DBC2SBC) {
                value = me.doDBC2SBC(value);
            }
            if (me.valueEncode) {
                value = hui.Control.encode(value);
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

            if (me.valueEncode) {
                value = hui.Control.encode(value);
            }

            me.getChangeHandler(value);

            me.getInput().value = value;
            if (value) {
                me.hidePlaceholder();
                me.showEye();
                //this.getFocusHandler();
            }
            else {
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
            }
            else {
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
                input = me.useAgent ? hui.cc(me.getClass('text')) : main;
            return input;
        },
        getPlaceholder: function () {
            var me = this,
                main = me.getMain(),
                input,
                input = me.useAgent ? hui.cc(me.getClass('placeholder')) : hui.util.findSiblingByClassName(main, me.getClass('placeholder'), 'pre');
            return input;
        },
        getEye: function () {
            var me = this,
                main = me.getMain(),
                input,
                input = me.useAgent ? hui.cc(me.getClass('eye')) : hui.util.findSiblingByClassName(main, me.getClass('eye'), 'pre');
            return input;
        },
        renderInput: function () {
            var me = this,
                main = me.getMain(),
                tpl = '<input type="text" class="#{0}" />';
            if (me.useAgent) {
                hui.appendHTML(main, hui.Control.format(tpl, me.getClass('text')));
            }
        },
        renderPlaceholder: function () {
            var me = this,
                main = me.getMain(),
                elem = me.getPlaceholder();
            if (!elem) {
                elem = document.createElement('SPAN');
                elem.className = me.getClass('placeholder');
                me.setInnerHTML(elem, me.placeholder);
                if (me.useAgent) {
                    main.appendChild(elem);
                    main.insertBefore(elem, main.firstChild);
                }
                else {
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
                elem = hui.util.getDom(hui.Control.format(tpl, me.getClass('eye'), me.getId()))[0];

                if (me.useAgent) {
                    main.appendChild(elem);
                    main.insertBefore(elem, main.firstChild);
                }
                else {
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
            if (me.value !== undefined) {
                me.setValue(me.value);
            }
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
            var me = main.getMain ? main : hui.Control.getById(main.getAttribute('control'));

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
            var me = main.getMain ? main : hui.Control.getById(main.getAttribute('control'));

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
            var me = main.getMain ? main : hui.Control.getById(main.getAttribute('control'));

            e = e || hui.window.event;
            var keyCode = e.keyCode || e.which;
            if (keyCode == 13) { // enter
                return me.onenter();
            }
            me.onkeypress(e);
        },
        getPressDownHandler: function (e) {
            var main = this;
            var me = main.getMain ? main : hui.Control.getById(main.getAttribute('control'));
            e = e || hui.window.event;
            var keyCode = e.keyCode || e.which;
            if (keyCode != 8) { // back/delete
                me.hidePlaceholder('force');
            }
            hui.window.setTimeout(function () {
                me.onkeydown(e);
            }, 5);
        },
        getPressUpHandler: function (e) {
            var main = this,
                me = main.getMain ? main : hui.Control.getById(main.getAttribute('control')),
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
            var me = main.getMain ? main : hui.Control.getById(main.getAttribute('control'));
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
                }
                else if (sign === 'force') {
                    placeholder.style.display = 'none';
                }
                else {
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
                }
                else if (sign === 'force') {
                    eye.style.display = 'none';
                }
                else {
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
            var me = main.getMain ? main : hui.Control.getById(main.getAttribute('control'));
            main = me.getMain();
            me.old_type = main.type;
            //main.type = 'text';
            if (!me.main_text) {
                me.main_text = document.createElement('SPAN');
                me.main_text.innerHTML = main.outerHTML.replace(/type\=\"?password\"?/i, 'type="text" '); //'"
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
            var me = main.getMain ? main : hui.Control.getById(main.getAttribute('control'));
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