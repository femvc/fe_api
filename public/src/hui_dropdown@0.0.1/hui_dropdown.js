'use strict';

/**
 * @name 下拉列表控件
 * @public
 * @author haiyang5210
 * @date 2014-11-16 23:12
 * @param {Object} options 控件初始化参数.
 * @example
 <div ui="type:'Dropdown',formName:'city',placeholder:'- 请选择 -',rule:'not_empty',
 options:[{value:110000,text:'北京市'},{value:310000,text:'上海市'},{value:120000,text:'天津市'}],
 size:{width:280}"></div>
 <div ui="type:'Dropdown',formName:'mm',placeholder:'- 月 -',value:'',
 optionStart:1,optionEnd:12,optionStep:1,
 size:{width:86}"></div>
 */
hui.define('hui_dropdown', ['hui_util', 'hui_control'], function () {
    hui.Dropdown = function (options, pending) {
        hui.Dropdown.superClass.call(this, options, 'pending');

        this.data_value = this.data_value || 'value';
        this.data_text = this.data_text || 'text';

        this.autoHideError = this.autoHideError === undefined ? false : this.autoHideError;
        this.autoValidate = this.autoValidate === undefined ? false : this.autoValidate;

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };
    hui.Dropdown.expandClassName = 'hui_dropdown_expand';

    hui.Dropdown.prototype = {
        /**
         * @name 渲染控件
         * @protected
         * @param {Object} main 控件挂载的DOM.
         */
        initModel: function () {
            var me = this;
            if (me.options && typeof me.options == 'string') {
                me.options = JSON.parse(me.options);
            }
        },
        getTitle: function () {
            var me = this,
                main = me.getMain(),
                title_text = hui.cc(me.getClass('title_text'), main);
            if (!title_text) {
                var title = me.getDocument().createElement('DIV');
                title.className = me.getClass('title');
                title.innerHTML = '<span class="' + me.getClass('title_text') + '">&nbsp;</span> <i class="' + me.getClass('arrow') + '"><s class="' + me.getClass('arrow_icon') + '">&nbsp;</s></i>';
                main.appendChild(title);
                main.insertBefore(title, main.childNodes[0]);

                title_text = hui.cc(me.getClass('title_text'), title);
            }
            return title_text;
        },
        getOptionContainer: function () {
            var me = this,
                main = me.getMain(),
                optionContainer = hui.cc(me.getClass('options'), main);
            if (!optionContainer) {
                optionContainer = me.getDocument().createElement('DIV');
                optionContainer.className = me.getClass('options');
                me.getMain().appendChild(optionContainer);
            }
            return optionContainer;
        },
        /**
         * @name 渲染控件
         * @protected
         * @param {Object} main 控件挂载的DOM.
         */
        render: function () {
            hui.Dropdown.superClass.prototype.render.call(this);
            var me = this;
            // 绘制宽度和高度
            me.setSize();
            if (me.placeholder && !me.value) {
                hui.setInnerText(me.getTitle(), me.placeholder);
            }
            me.renderOptions();
        },
        initBehavior: function () {
            var me = this,
                main = me.getMain(),
                title = me.getTitle().parentNode,
                optionContainer = me.getOptionContainer();
            title.onclick = hui.fn(me.onTitleClick, me);
            optionContainer.onclick = me.onOptionsClick;
            main.onselectstart = new Function('return false;');
            me.getShowOptionsHandler();

            if (me.value !== undefined) {
                me.setValue(me.value);
            }
        },
        onTitleClick: function (e) {
            e.cancelBubble = true;
            e.stopPropagation && e.stopPropagation();
            var me = this;
            me.showOptions();
        },
        getShowOptionsHandler: function () {
            // Use closure bind to body onclick
            this.showOptions = this.showOptions || hui.fn(function (e) {
                var me = this,
                    main = me.getMain();
                if (hui.hasClass(main, hui.Dropdown.expandClassName)) {
                    me.hideAllOptions();
                    hui.off(document.body, 'click', me.showOptions);
                }
                else {
                    me.hideAllOptions();
                    hui.addClass(main, hui.Dropdown.expandClassName);
                    if (me.size && me.size.scrollTop && !me.size.doscrollTop) {
                        hui.cc('hui_dropdown_options', main).scrollTop = me.size.scrollTop;
                        me.size.doscrollTop = true;
                    }
                    hui.off(document.body, 'click', me.showOptions);
                    hui.on(document.body, 'click', me.hideAllOptions);
                }
            }, this);
            return this.showOptions;
        },
        hideAllOptions: function () {
            var list = hui.c('hui_dropdown');
            for (var i = 0, len = list.length; i < len; i++) {
                hui.removeClass(list[i], hui.Dropdown.expandClassName);
            }
        },
        onOptionsClick: function (e) {
            e = e || window.event;
            var elem = e.target || e.srcElement,
                ctr = hui.Control.findByElem(elem),
                item,
                value;
            if (ctr) {
                item = hui.util.findParentByClassName(elem, ctr.getClass('item'));
                if (item && (item.value !== undefined || item.getAttribute('value') !== undefined)) {
                    value = item.value !== undefined ? item.value : item.getAttribute('value');
                    ctr.setValue(value);
                    ctr.showOptions();
                }
            }
        },
        removeOption: function (value) {
            if (value === undefined) {
                return;
            }
            var me = this,
                dataValue = me['data_value'],
                optionContainer = me.getOptionContainer(),
                list = hui.c(me.getClass('item'), optionContainer),
                v,
                item;
            for (var i = list.length - 1; i > -1; i--) {
                v = list[i].value === undefined ? list[i].getAttribute('value') : list[i].value;
                if (v === value) {
                    optionContainer.removeChild(list[i]);
                }
            }
            for (var i = 0, len = me.options.length; i < len; i++) {
                item = me.options[i];
                v = typeof item == 'string' ? item : item[dataValue];
                if (v === value) {
                    me.options.splice(i, 1);
                }
            }
        },
        removeOptionAll: function () {
            var me = this;
            me.options = [];
            hui.setInnerHTML(me.getOptionContainer(), '');
        },
        addOption: function (item) {
            if (item === undefined) {
                return;
            }
            var me = this,
                dataValue = me['data_value'],
                dataText = me['data_text'];

            var elem = me.getDocument().createElement('DIV');
            elem.value = typeof item == 'string' ? item : item[dataValue];
            elem.className = me.getClass('item');
            elem.setAttribute('value', elem.value);
            hui.setInnerText(elem, typeof item == 'string' ? item : item[dataText]);

            me.getOptionContainer().appendChild(elem);
        },
        renderOptions: function () {
            var me = this,
                start = Number(me.optionStart),
                end = Number(me.optionEnd),
                step = Number(me.optionStep),
                index,
                list = [];
            if (!me.options && me.optionStart !== undefined && me.optionEnd !== undefined) {
                start = start !== start ? 0 : start;
                end = end !== end ? 0 : end;
                step = step !== step ? 1 : step;
                index = start;

                for (var i = 0, len = Math.abs(end - start); i <= len; i += Math.abs(step)) {
                    list.push({
                        value: index,
                        text: index
                    });
                    index += step;
                }
                me.options = list;
            }
            if (me.options) {
                for (var i = 0, len = me.options.length; i < len; i++) {
                    me.addOption(me.options[i]);
                }
            }
        },
        setOptions: function (options) {
            var me = this;
            me.removeOptionAll();

            me.options = options;
            me.renderOptions();
        },
        setValue: function (v) {
            var me = this,
                dataValue = me['data_value'],
                dataText = me['data_text'],
                // main = me.getMain(),
                options = me.options,
                c;

            var value = (v && (typeof v) === 'object') ? v[dataValue] : v;
            var text = (v && (typeof v) === 'object') ? v[dataText] : '';

            for (var i = 0, len = options.length; i < len; i++) {
                c = options[i];
                if ((typeof c == 'string' && c === value) || c[dataValue] === value || (value === undefined && c[dataText] === text)) {
                    hui.setInnerText(me.getTitle(), typeof c == 'string' ? c : c[dataText]);
                    value = c[dataValue];

                    if (value !== me.value) {
                        c = me.getMain().value;
                        me.getMain().value = value;
                        if (me.autoHideError) {
                            me.hideError();
                        }
                        if (me.autoValidate) {
                            me.validate();
                        }
                        me.onchange(value, c);
                    }
                    break;
                }
            }
        },
        getValue: function () {
            var me = this,
                item,
                dataValue = me['data_value'],
                selected = me.getMain().value;
            if (me.options) {
                for (var i = 0, len = me.options.length; i < len; i++) {
                    item = me.options[i];
                    if ((typeof item == 'string' && item === selected) || item[dataValue] === selected) {
                        selected = item[dataValue];
                        break;
                    }
                }
            }
            return selected;
        },
        getText: function () {
            var me = this,
                item,
                dataText = me['data_text'],
                dataValue = me['data_value'],
                selected = me.getMain().value;
            if (me.options) {
                for (var i = 0, len = me.options.length; i < len; i++) {
                    item = me.options[i];
                    if ((typeof item == 'string' && item === selected) || item[dataValue] === selected) {
                        selected = item[dataText];
                        break;
                    }
                }
            }
            return selected;
        },

        onchange: function () {}
    };

    /* hui.Dropdown 继承了 hui.Control */
    hui.inherits(hui.Dropdown, hui.Control);

    hui.util.importCssString(
        '.hui_dropdown{position:relative;z-index:2;background-color:white;float:left;margin-right:9px;}' +
        '.hui_dropdown .hui_dropdown_title{padding-left:12px;color:#333;height:37px;line-height:1.5em;border:1px solid #ddd;line-height:37px;cursor:pointer;}' +
        '.hui_dropdown .hui_dropdown_title:hover{border:1px solid #D1D0D1;color:#666;}' +
        '.hui_dropdown .hui_dropdown_options{display:none;border:1px #ddd solid;background-color:#fff;position:absolute;width:99%;z-index:900;max-height:196px;overflow:auto;}' +
        '.hui_dropdown .hui_dropdown_item{padding-left:12px;color:#333;height:2em;line-height:2em;cursor:pointer;}' +
        '.hui_dropdown .hui_dropdown_item:hover{background-color:#ececec;}' +
        '.hui_dropdown_arrow{position: absolute;z-index: 1;right: 2px;top: 4px;padding: 10px 5px;width: 12px;height: 11px;}' +
        '.hui_dropdown_arrow_icon{border-style: solid;border-color: #999 transparent transparent;border-width: 10px 6px 0px;width: 0px;overflow: hidden;font-size: 0;height: 0px;line-height: 0px;vertical-align: top;position: absolute;}' +
        '.hui_dropdown_expand{display:block;z-index:3;}' +
        '.hui_dropdown_expand .hui_dropdown_options{display:block;}' +
        '.hui_dropdown_expand .hui_dropdown_arrow{padding: 8px 5px 12px;}' +
        '.hui_dropdown_expand .hui_dropdown_arrow_icon{border-color: transparent transparent #999 transparent;border-width: 0px 6px 10px;}'
    );
});