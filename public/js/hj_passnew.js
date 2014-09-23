hui = hui;
'use strict';
hui.define('hui_panel', ['hui'], function () {
    hui.Panel = function (options, pending) {
        this.isFormItem = false;
        hui.Panel.superClass.call(this, options, 'pending');

        this.type = 'panel';
        this.controlMap = {};
        
        // 进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.Panel.prototype = {
        /**
         * @name 绘制对话框
         * @public
         */
        render: function (options) {
            hui.Panel.superClass.prototype.render.call(this);
            var me = this;
            // 渲染对话框
            hui.Control.init(me.getMain(), {}, me);
        },
        getValue: function () {
            return this.getParamMap();
        }

    };

    // hui.Panel 继承了 hui.Control 
    hui.inherits(hui.Panel, hui.Control);

});


hui.define('hui_boxpanel', ['hui'], function () {
    hui.BoxPanel = function (options, pending) {
        this.isFormItem = false;
        hui.BoxPanel.superClass.call(this, options, 'pending');

        this.type = 'boxpanel';
        this.controlMap = {};
        
        // 进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.BoxPanel.prototype = {
        /**
         * @name 绘制对话框
         * @public
         */
        render: function (options) {
            hui.BoxPanel.superClass.prototype.render.call(this);
            var me = this;
            // 渲染对话框
            hui.Control.init(me.getMain(), {}, me);
            hui.util.addCssRule('.' + me.getClass('html'), 'background-image: url("about:blank");background-attachment: fixed;');
            hui.util.addCssRule('.' + me.getClass(), 'z-index: 9000000;position: fixed; _position: absolute; _top: expression(document.documentElement.scrollTop + Math.max(0, (document.documentElement.clientHeight - 500)*0.3) + "px"); background-color:white;border: 5px solid #c6c6c6;border-color: rgba(0,0,0,0.3); border-color: #c6c6c6\\0;*border-color: #c6c6c6; border-radius: 5px; display: none;');
            hui.util.addCssRule('.' + me.getClass('close') + '{background-color: #8A8A8A;border-radius: 16px;color: #FFFFFF;display: block;font-family: Simsun;font-size: 14px;height: 24px;overflow: hidden;padding: 8px 0 0 10px;position: absolute;right: -16px;top: -16px;width: 22px;}');
            hui.util.addCssRule('.' + me.getClass('close:hover') + '{background-color: #f62626;color: #fff; }');
        },
        initBehavior: function () {
            var me = this;
            me.onresizeHandler = hui.fn(me.onresize, me);
            if (!hui.cc(me.getClass('close'), me.getMain())) {
                me.addCloseButton();
            }
        },
        show: function () {
            var me = this;
            hui.on(window, 'resize', me.onresizeHandler);
            hui.addClass(document.documentElement, me.getClass('html'));

            hui.Mask && hui.Mask.show();
            me.getMain().style.display = 'block';
            me.onresizeCallback();
        },
        hide: function () {
            var me = this;
            hui.off(window, 'resize', me.onresizeHandler);
            hui.removeClass(document.documentElement, me.getClass('html'));
            me.getMain().style.display = 'none';
            hui.Mask && hui.Mask.hide();
        },
        onresize: function () {
            var me = this;
            if (me.onresizeTimer) {
                window.clearTimeout(me.onresizeTimer);
            }
            me.onresizeTimer = window.setTimeout(hui.fn(me.onresizeCallback, me), 30);
        },
        onresizeCallback: function () {
            var me = this,
                main = me.getMain();
            me.onresizeTimer = null;

            var top = Math.round(Math.max(0, (document.documentElement.clientHeight - main.clientHeight) * (me.top || 0.3)));
            var left = Math.round(Math.max(0, (document.documentElement.clientWidth - main.clientWidth) * (me.left || 0.5)));
            // IE6
            if (window.ActiveXObject && !window.XMLHttpRequest) {
                main.style.setExpression('top', 'eval(document.documentElement.scrollTop  + Math.max(0, (document.documentElement.clientHeight - 500)*0.4))');
                main.style.setExpression('left', 'eval(document.documentElement.scrollLeft + Math.max(0, (document.documentElement.clientWidth - 427))/2)');
            }
            else {
                hui.util.importCssString('.' + me.getClass() + '{top:' + top + 'px;left:' + left + 'px; margin-left:0px;}', me.getClass('7181549444794655'));
            }

            hui.Mask && hui.Mask.repaintMask();
        },
        addCloseButton: function () {
            var me = this,
                main = me.getMain(),
                btn_close = document.createElement('A');
            btn_close.href = '###';
            btn_close.innerHTML = '╳';
            btn_close.className = me.getClass('close');
            main.insertBefore(btn_close, main.firstChild);

            btn_close.onclick = hui.fn(function () {
                this.hide();
            }, me);
        },
        getValue: function () {
            return this.getParamMap();
        }

    };

    // hui.BoxPanel 继承了 hui.Control 
    hui.inherits(hui.BoxPanel, hui.Control);

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
hui.define('hui_dropdown', ['hui@0.0.1'], function () {

    hui.Dropdown = function (options, pending) {
        hui.Dropdown.superClass.call(this, options, 'pending');

        this.type = 'dropdown';
        this.data_value = this.data_value || 'value';
        this.data_text = this.data_text || 'text';

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
                title = hui.cc(me.getClass('title'), main);
            if (!title) {
                title = me.getDocument().createElement('DIV');
                title.className = me.getClass('title');
                title.innerHTML = '&nbsp;';
                main.appendChild(title);
                main.insertBefore(title, main.childNodes[0]);
            }
            return title;
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
                title = me.getTitle(),
                optionContainer = me.getOptionContainer();
            title.onclick = me.onTitleClick;
            optionContainer.onclick = me.onOptionsClick;
            main.onselectstart = new Function('return false;');
            me.getShowOptionsHandler();

            if (me.value !== undefined) {
                me.setValue(me.value);
            }
        },
        onTitleClick: function (e) {
            e = e || window.event;
            var elem = e.target || e.srcElement;
            e.cancelBubble = true;
            e.stopPropagation && e.stopPropagation();
            var ctr;
            if (elem && elem.parentNode) {
                ctr = hui.Control.getById(elem.parentNode.control);
                ctr && ctr.showOptions();
            }
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
                ctr = hui.Control.findElemControl(elem),
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


});


/**
 * @name 按钮控件
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 * @param {Object} options 控件初始化参数.
 */
hui.define('hui_radioinputgroup', ['hui@0.0.1'], function () {

    hui.RadioInputGroup = function (options, pending) {
        hui.RadioInputGroup.superClass.call(this, options, 'pending');
        // 类型声明，用于生成控件子dom的id和class
        this.type = 'radioinputgroup';

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.RadioInputGroup.prototype = {
        /**
         * @name 渲染控件
         * @public
         */
        render: function () {
            hui.RadioInputGroup.superClass.prototype.render.call(this);
            var me = this,
                main = me.getMain();
            me.setSize();
            hui.Control.init(main);
        },
        setChecked: function (child) {
            var me = this,
                c;
            for (var i in me.controlMap) {
                c = me.controlMap[i];
                if (c && c !== child && c.setChecked) {
                    c.setChecked(false);
                }
            }
        },
        getValue: function () {
            var me = this,
                value,
                c;
            for (var i in me.controlMap) {
                c = me.controlMap[i];
                if (c && c.getChecked && c.getChecked()) {
                    value = c.getValue();
                    break;
                }
            }
            return value;
        },
        setValue: function (v) {
            var me = this,
                value,
                c;
            v = !v ? '' : String(v);
            for (var i in me.controlMap) {
                c = me.controlMap[i];
                if (c && v !== undefined && c.getPresetValue && String(c.getPresetValue()) === v && c.setChecked) {
                    c.setChecked(true);
                }
                else if (c && c.setChecked) {
                    c.setChecked(false);
                }
            }
            return value;
        }
    };

    /*通过hui.Control派生hui.RadioInputGroup*/
    //hui.Control.derive(hui.RadioInputGroup);
    /* hui.RadioInputGroup 继承了 hui.Control */
    hui.inherits(hui.RadioInputGroup, hui.Control);


});


/**
 * @name 按钮控件
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 * @param {Object} options 控件初始化参数.
 */
hui.define('hui_radioinput', ['hui@0.0.1'], function () {

    hui.RadioInput = function (options, pending) {
        hui.RadioInput.superClass.call(this, options, 'pending');

        this.type = 'radioinput';

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.RadioInput.prototype = {
        getInput: function () {
            var me = this,
                main = me.getMain(),
                input = hui.cc(me.getClass('input'), main);
            return input;
        },
        getIcon: function () {
            var me = this,
                main = me.getMain(),
                icon = hui.cc(me.getClass('icon'), main);
            return icon;
        },
        getLabel: function () {
            var me = this,
                main = me.getMain(),
                icon = hui.cc(me.getClass('label'), main);
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
            }
            else {
                main.appendChild(label);
            }
        },
        /**
         * @name 渲染控件
         * @protected
         * @param {Object} main 控件挂载的DOM.
         */
        render: function () {
            hui.RadioInput.superClass.prototype.render.call(this);
            var me = this,
                main = me.getMain();
            // 绘制宽度和高度
            me.setSize();

            var tpl = '<i class="#{1}"><input type="radio" class="#{0}" style="display:none" />&nbsp;</i>';
            hui.appendHTML(main, hui.format(tpl,
                me.getClass('input'),
                me.getClass('icon')
            ));
            me.renderLabel();
        },
        initBehavior: function () {
            var me = this,
                icon = me.getIcon(),
                label = me.getLabel();

            me.setChecked(!!me.checked);
            icon.onclick = label.onclick = hui.fn(me.getClickHandler, me);
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
                input = me.getInput(),
                value = me.value;
            if (value === undefined) {
                value = me.getMain().value;
            }
            if (value === undefined) {
                value = input.value;
            }
            if (value === undefined || value === null) {
                value = '';
            }
            return String(value);
        },
        setPresetValue: function (value) {
            var me = this,
                input = me.getInput();
            me.getMain().value = value;
            input.value = value;
        },
        setChecked: function (checked) {
            var me = this,
                input = me.getInput(),
                main = me.getMain();
            if (checked && me.parentControl && me.parentControl.setChecked) {
                me.parentControl.setChecked(me);
            }
            if (checked === false) {
                input.checked = false;
                hui.removeClass(main, me.getClass('checked'));
            }
            else {
                input.checked = true;
                hui.addClass(main, me.getClass('checked'));
            }
        },
        getChecked: function () {
            var me = this,
                checked = !!me.getInput().checked;
            return checked;
        },
        getClickHandler: function () {
            var me = this;
            me.setChecked(true);
            me.onclick();
        },
        onclick: new Function()

    };

    /* hui.RadioInput 继承了 hui.Control */
    hui.inherits(hui.RadioInput, hui.Control);


});

/**
 * @name 按钮控件
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 * @param {Object} options 控件初始化参数.
 */
hui.define('hui_checkboxgroup', ['hui@0.0.1', 'hui_checkbox@0.0.1'], function () {

    hui.CheckboxGroup = function (options, pending) {
        hui.CheckboxGroup.superClass.call(this, options, 'pending');
        // 类型声明，用于生成控件子dom的id和class
        this.type = 'checkboxgroup';

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.CheckboxGroup.prototype = {
        /**
         * @name 渲染控件
         * @public
         */
        render: function () {
            hui.CheckboxGroup.superClass.prototype.render.call(this);
            var me = this,
                main = me.getMain();
            hui.Control.init(main);
        },
        getValue: function () {
            var me = this,
                value = [],
                c;
            for (var i in me.controlMap) {
                c = me.controlMap[i];
                if (c && c.getChecked && c.getChecked()) {
                    value.push(c.getValue());
                }
            }
            return value;
        },
        setValue: function (v) {
            var me = this,
                checkedMap = {},
                c;
            if (v && v.length && v.join) {
                for (var i = 0, len = v.length; i < len; i++) {
                    checkedMap[v[i]] = 1;
                }
            }
            for (var i in me.controlMap) {
                c = me.controlMap[i];
                if (c && c.getFormName && checkedMap[c.getFormName()] && c.setChecked) {
                    c.setChecked(true);
                }
                else if (c && c.setChecked) {
                    c.setChecked(false);
                }
            }
        },
        renderOptions: function (datasource, checked) {
            datasource = datasource && datasource.length && datasource.join ? datasource : [];
            checked = checked && checked.length && checked.join ? checked : [];
            var me = this,
                html = '',
                c,
                m;
            var tpl =
                '<label class="hui_checkbox" ui="type:\'Checkbox\',formName:\'#{id}\',value:\'#{id}\',checked:\'#{checked}\'">' +
                '    <span class="hui_checkbox_label">#{title}</span>' +
                '</label>';
            var checkedMap = {};
            for (var i = 0, len = checked.length; i < len; i++) {
                checkedMap[checked[i]] = 1;
            }
            me.disposeChild && me.disposeChild();

            for (var i = 0, len = datasource.length; i < len; i++) {
                c = datasource[i];
                m = {
                    id: c.id,
                    title: c.title,
                    checked: (checkedMap[c.id] ? 'checked' : '')
                };
                html += hui.format(tpl, m);
            }
            me.setInnerHTML(me, html);

            hui.Control.init(me.getMain());
        }

    };

    // hui.CheckboxGroup 继承了 hui.Control 
    hui.inherits(hui.CheckboxGroup, hui.Control);


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
hui.define('hui_birthdaydropdown', ['hui@0.0.1'], function () {

    hui.BirthdayDropdown = function (options, pending) {
        hui.BirthdayDropdown.superClass.call(this, options, 'pending');
        // 类型声明，用于生成控件子dom的id和class
        this.type = 'birthdaydropdown';

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.BirthdayDropdown.prototype = {
        /**
         * @name 渲染控件
         * @public
         */
        render: function () {
            hui.BirthdayDropdown.superClass.prototype.render.call(this);
            var me = this,
                main = me.getMain();
            hui.Control.init(main);
        },
        initBehavior: function () {
            var me = this,
                yy = me.getByFormName('yy'),
                mm = me.getByFormName('mm');
            yy.onchange = hui.fn(me.updateMonth, me);
            mm.onchange = hui.fn(me.updateDay, me);
        },
        updateMonth: function () {
            var me = this,
                yy = me.getByFormName('yy'),
                dd = me.getByFormName('dd'),
                mm = me.getByFormName('mm'),
                y = yy.getValue(),
                now = !me.maxDate || me.maxDate === 'now' ? new Date() : hui.parseDate(me.maxDate);
            if (me.maxDate && y >= now.getFullYear()) {
                mm.optionEnd = now.getMonth() + 1;
                mm.setOptions();
            }

            if (!mm.getValue()) {
                mm.setValue(1);
            }
            if (!dd.getValue()) {
                dd.setValue(1);
            }
            me.updateDay();
        },
        updateDay: function () {
            var me = this,
                dd = me.getByFormName('dd'),
                mm = me.getByFormName('mm'),
                yy = me.getByFormName('yy'),
                y = yy.getValue() || 2000,
                m = Number(mm.getValue()),
                now = !me.maxDate || me.maxDate === 'now' ? new Date() : hui.parseDate(me.maxDate);
            if (m) {
                if (m === 2) {
                    if ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) {
                        dd.optionEnd = 29;
                    }
                    else {
                        dd.optionEnd = 28;
                    }
                }
                else {
                    if (m === 4 || m === 6 || m === 9 || m === 11) {
                        dd.optionEnd = 30;
                    }
                    else {
                        dd.optionEnd = 31;
                    }
                }
                if (me.maxDate && yy.getValue() >= now.getFullYear() && mm.getValue() >= now.getMonth() + 1) {
                    dd.optionEnd = now.getDate();
                }
                if (dd.getValue() > dd.optionEnd) {
                    dd.setValue(dd.optionEnd);
                }

                dd.setOptions();
            }
        },
        getValue: function () {
            var me = this,
                dd = me.getByFormName('dd'),
                mm = me.getByFormName('mm'),
                yy = me.getByFormName('yy'),
                d = dd.getValue(),
                m = mm.getValue(),
                y = yy.getValue();
            return y && m && d ? y + '-' + m + '-' + d : '';
        },
        setValue: function (v) {
            var me = this,
                dd = me.getByFormName('dd'),
                mm = me.getByFormName('mm'),
                yy = me.getByFormName('yy'),
                date = hui.util.parseDate(v);
            yy.setValue(date.getFullYear());
            mm.setValue(date.getMonth() + 1);
            dd.setValue(date.getDate());
        }
    };

    /* hui.BirthdayDropdown 继承了 hui.Control */
    hui.inherits(hui.BirthdayDropdown, hui.Control);
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
hui.define('hui_citylistdropdown', ['hui@0.0.1'], function () {

    hui.CitylistDropdown = function (options, pending) {
        hui.CitylistDropdown.superClass.call(this, options, 'pending');
        // 类型声明，用于生成控件子dom的id和class
        this.type = 'citylistdropdown';

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.CitylistDropdown.prototype = {
        getProvincelist: function () {
            var list = new Array(
                new Array(110000, '北京市'),
                new Array(310000, '上海市'),
                new Array(120000, '天津市'),
                new Array(500000, '重庆市'),
                new Array(440000, '广东省'),
                new Array(320000, '江苏省'),
                new Array(330000, '浙江省'),
                new Array(340000, '安徽省'),
                new Array(370000, '山东省'),
                new Array(350000, '福建省'),
                new Array(430000, '湖南省'),
                new Array(420000, '湖北省'),
                new Array(510000, '四川省'),
                new Array(610000, '陕西省'),
                new Array(130000, '河北省'),
                new Array(410000, '河南省'),
                new Array(360000, '江西省'),
                new Array(140000, '山西省'),
                new Array(150000, '内蒙古'),
                new Array(210000, '辽宁省'),
                new Array(220000, '吉林省'),
                new Array(230000, '黑龙江省'),
                new Array(450000, '广西'),
                new Array(460000, '海南省'),
                new Array(520000, '贵州省'),
                new Array(530000, '云南省'),
                new Array(540000, '西藏'),
                new Array(620000, '甘肃省'),
                new Array(640000, '宁夏'),
                new Array(630000, '青海省'),
                new Array(650000, '新疆'),
                new Array(710000, '台湾省'),
                new Array(810000, '香港'),
                new Array(820000, '澳门'),
                new Array(830000, '海外')
            );
            var result = [],
                c;
            for (var i = 0, len = list.length; i < len; i++) {
                c = list[i];
                result.push({
                    value: c[0],
                    text: c[1]
                });
            }
            return result;

        },
        getCitylist: function (value) {
            var list = new Array(
                new Array(110100, '北京'),
                new Array(120100, '天津'),
                new Array(130101, '石家庄'),
                new Array(130201, '唐山'),
                new Array(130301, '秦皇岛'),
                new Array(130701, '张家口'),
                new Array(130801, '承德'),
                new Array(131001, '廊坊'),
                new Array(130401, '邯郸'),
                new Array(130501, '邢台'),
                new Array(130601, '保定'),
                new Array(130901, '沧州'),
                new Array(133001, '衡水'),
                new Array(140101, '太原'),
                new Array(140201, '大同'),
                new Array(140301, '阳泉'),
                new Array(140501, '晋城'),
                new Array(140601, '朔州'),
                new Array(142201, '忻州'),
                new Array(142331, '离石'),
                new Array(142401, '榆次'),
                new Array(142601, '临汾'),
                new Array(142701, '运城'),
                new Array(140401, '长治'),
                new Array(150101, '呼和浩特'),
                new Array(150201, '包头'),
                new Array(150301, '乌海'),
                new Array(152601, '集宁'),
                new Array(152701, '东胜'),
                new Array(152801, '临河'),
                new Array(152921, '阿拉善左旗'),
                new Array(150401, '赤峰'),
                new Array(152301, '通辽'),
                new Array(152502, '锡林浩特'),
                new Array(152101, '海拉尔'),
                new Array(152201, '乌兰浩特'),
                new Array(210101, '沈阳'),
                new Array(210201, '大连'),
                new Array(210301, '鞍山'),
                new Array(210401, '抚顺'),
                new Array(210501, '本溪'),
                new Array(210701, '锦州'),
                new Array(210801, '营口'),
                new Array(210901, '阜新'),
                new Array(211101, '盘锦'),
                new Array(211201, '铁岭'),
                new Array(211301, '朝阳'),
                new Array(211401, '锦西'),
                new Array(210601, '丹东'),
                new Array(220101, '长春'),
                new Array(220201, '吉林'),
                new Array(220301, '四平'),
                new Array(220401, '辽源'),
                new Array(220601, '浑江'),
                new Array(222301, '白城'),
                new Array(222401, '延吉'),
                new Array(220501, '通化'),
                new Array(230101, '哈尔滨'),
                new Array(230301, '鸡西'),
                new Array(230401, '鹤岗'),
                new Array(230501, '双鸭山'),
                new Array(230701, '伊春'),
                new Array(230801, '佳木斯'),
                new Array(230901, '七台河'),
                new Array(231001, '牡丹江'),
                new Array(232301, '绥化'),
                new Array(230201, '齐齐哈尔'),
                new Array(230601, '大庆'),
                new Array(232601, '黑河'),
                new Array(232700, '加格达奇'),
                new Array(310100, '上海'),
                new Array(320101, '南京'),
                new Array(320201, '无锡'),
                new Array(320301, '徐州'),
                new Array(320401, '常州'),
                new Array(320501, '苏州'),
                new Array(320600, '南通'),
                new Array(320701, '连云港'),
                new Array(320801, '淮阴'),
                new Array(320901, '盐城'),
                new Array(321001, '扬州'),
                new Array(321101, '镇江'),
                new Array(321201, '昆山'),
                new Array(321301, '常熟'),
                new Array(321401, '张家港'),
                new Array(321501, '太仓'),
                new Array(321601, '江阴'),
                new Array(321701, '宜兴'),
                new Array(321801, '泰州'),
                new Array(330101, '杭州'),
                new Array(330201, '宁波'),
                new Array(330301, '温州'),
                new Array(330401, '嘉兴'),
                new Array(330501, '湖州'),
                new Array(330601, '绍兴'),
                new Array(330701, '金华'),
                new Array(330801, '衢州'),
                new Array(330901, '舟山'),
                new Array(332501, '丽水'),
                new Array(332602, '临海'),
                new Array(332702, '义乌'),
                new Array(332802, '萧山'),
                new Array(332901, '慈溪'),
                new Array(332603, '台州'),
                new Array(340101, '合肥'),
                new Array(340201, '芜湖'),
                new Array(340301, '蚌埠'),
                new Array(340401, '淮南'),
                new Array(340501, '马鞍山'),
                new Array(340601, '淮北'),
                new Array(340701, '铜陵'),
                new Array(340801, '安庆'),
                new Array(341001, '黄山'),
                new Array(342101, '阜阳'),
                new Array(342201, '宿州'),
                new Array(342301, '滁州'),
                new Array(342401, '六安'),
                new Array(342501, '宣州'),
                new Array(342601, '巢湖'),
                new Array(342901, '贵池'),
                new Array(350101, '福州'),
                new Array(350201, '厦门'),
                new Array(350301, '莆田'),
                new Array(350401, '三明'),
                new Array(350501, '泉州'),
                new Array(350601, '漳州'),
                new Array(352101, '南平'),
                new Array(352201, '宁德'),
                new Array(352601, '龙岩'),
                new Array(360101, '南昌'),
                new Array(360201, '景德镇'),
                new Array(362101, '赣州'),
                new Array(360301, '萍乡'),
                new Array(360401, '九江'),
                new Array(360501, '新余'),
                new Array(360601, '鹰潭'),
                new Array(362201, '宜春'),
                new Array(362301, '上饶'),
                new Array(362401, '吉安'),
                new Array(362502, '临川'),
                new Array(370101, '济南'),
                new Array(370201, '青岛'),
                new Array(370301, '淄博'),
                new Array(370401, '枣庄'),
                new Array(370501, '东营'),
                new Array(370601, '烟台'),
                new Array(370701, '潍坊'),
                new Array(370801, '济宁'),
                new Array(370901, '泰安'),
                new Array(371001, '威海'),
                new Array(371100, '日照'),
                new Array(371200, '莱芜市'),
                new Array(372301, '滨州'),
                new Array(372401, '德州'),
                new Array(372501, '聊城'),
                new Array(372801, '临沂'),
                new Array(372901, '菏泽'),
                new Array(410101, '郑州'),
                new Array(410201, '开封'),
                new Array(410301, '洛阳'),
                new Array(410401, '平顶山'),
                new Array(410501, '安阳'),
                new Array(410601, '鹤壁'),
                new Array(410701, '新乡'),
                new Array(410801, '焦作'),
                new Array(410901, '濮阳'),
                new Array(411001, '许昌'),
                new Array(411101, '漯河'),
                new Array(411201, '三门峡'),
                new Array(412301, '商丘'),
                new Array(412701, '周口'),
                new Array(412801, '驻马店'),
                new Array(412901, '南阳'),
                new Array(413001, '信阳'),
                new Array(420101, '武汉'),
                new Array(420201, '黄石'),
                new Array(420301, '十堰'),
                new Array(420400, '荆州'),
                new Array(420501, '宜昌'),
                new Array(420601, '襄阳'),
                new Array(420701, '鄂州'),
                new Array(420801, '荆门'),
                new Array(422103, '黄冈'),
                new Array(422201, '孝感'),
                new Array(422301, '咸宁'),
                new Array(433000, '仙桃'),
                new Array(433100, '潜江'),
                new Array(431700, '天门'),
                new Array(421300, '随州'),
                new Array(422801, '恩施'),
                new Array(430101, '长沙'),
                new Array(430401, '衡阳'),
                new Array(430501, '邵阳'),
                new Array(432801, '郴州'),
                new Array(432901, '永州'),
                new Array(430801, '大庸'),
                new Array(433001, '怀化'),
                new Array(433101, '吉首'),
                new Array(430201, '株洲'),
                new Array(430301, '湘潭'),
                new Array(430601, '岳阳'),
                new Array(430701, '常德'),
                new Array(432301, '益阳'),
                new Array(432501, '娄底'),
                new Array(440101, '广州'),
                new Array(440301, '深圳'),
                new Array(441501, '汕尾'),
                new Array(441301, '惠州'),
                new Array(441601, '河源'),
                new Array(440601, '佛山'),
                new Array(441801, '清远'),
                new Array(441901, '东莞'),
                new Array(440401, '珠海'),
                new Array(440701, '江门'),
                new Array(441201, '肇庆'),
                new Array(442001, '中山'),
                new Array(440801, '湛江'),
                new Array(440901, '茂名'),
                new Array(440201, '韶关'),
                new Array(440501, '汕头'),
                new Array(441401, '梅州'),
                new Array(441701, '阳江'),
                new Array(441901, '潮州'),
                new Array(445200, '揭阳'),
                new Array(450101, '南宁'),
                new Array(450401, '梧州'),
                new Array(452501, '玉林'),
                new Array(450301, '桂林'),
                new Array(452601, '百色'),
                new Array(452701, '河池'),
                new Array(452802, '钦州'),
                new Array(450201, '柳州'),
                new Array(450501, '北海'),
                new Array(460100, '海口'),
                new Array(460200, '三亚'),
                new Array(510101, '成都'),
                new Array(513321, '康定'),
                new Array(513101, '雅安'),
                new Array(513229, '马尔康'),
                new Array(510301, '自贡'),
                new Array(500100, '重庆'),
                new Array(512901, '南充'),
                new Array(510501, '泸州'),
                new Array(510601, '德阳'),
                new Array(510701, '绵阳'),
                new Array(510901, '遂宁'),
                new Array(511001, '内江'),
                new Array(511101, '乐山'),
                new Array(512501, '宜宾'),
                new Array(510801, '广元'),
                new Array(513021, '达县'),
                new Array(513401, '西昌'),
                new Array(510401, '攀枝花'),
                //new Array(500239,'黔江土家族苗族自治县'),
                new Array(520101, '贵阳'),
                new Array(520200, '六盘水'),
                new Array(522201, '铜仁'),
                new Array(522501, '安顺'),
                new Array(522601, '凯里'),
                new Array(522701, '都匀'),
                new Array(522301, '兴义'),
                new Array(522421, '毕节'),
                new Array(522101, '遵义'),
                new Array(530101, '昆明'),
                new Array(530201, '东川'),
                new Array(532201, '曲靖'),
                new Array(532301, '楚雄'),
                new Array(532401, '玉溪'),
                new Array(532501, '个旧'),
                new Array(532621, '文山'),
                new Array(532721, '思茅'),
                new Array(532101, '昭通'),
                new Array(532821, '景洪'),
                new Array(532901, '大理'),
                new Array(533001, '保山'),
                new Array(533121, '潞西'),
                new Array(533221, '丽江纳西族自治县'),
                new Array(533321, '泸水'),
                new Array(533421, '中甸'),
                new Array(533521, '临沧'),
                new Array(540101, '拉萨'),
                new Array(542121, '昌都'),
                new Array(542221, '乃东'),
                new Array(542301, '日喀则'),
                new Array(542421, '那曲'),
                new Array(542523, '噶尔'),
                new Array(542621, '林芝'),
                new Array(610101, '西安'),
                new Array(610201, '铜川'),
                new Array(610301, '宝鸡'),
                new Array(610401, '咸阳'),
                new Array(612101, '渭南'),
                new Array(612301, '汉中'),
                new Array(612401, '安康'),
                new Array(612501, '商州'),
                new Array(612601, '延安'),
                new Array(612701, '榆林'),
                new Array(620101, '兰州'),
                new Array(620401, '白银'),
                new Array(620301, '金昌'),
                new Array(620501, '天水'),
                new Array(622201, '张掖'),
                new Array(622301, '武威'),
                new Array(622421, '定西'),
                new Array(622624, '成县'),
                new Array(622701, '平凉'),
                new Array(622801, '西峰'),
                new Array(622901, '临夏'),
                new Array(623027, '夏河'),
                new Array(620201, '嘉峪关'),
                new Array(622102, '酒泉'),
                new Array(630100, '西宁'),
                new Array(632121, '平安'),
                new Array(632221, '门源回族自治县'),
                new Array(632321, '同仁'),
                new Array(632521, '共和'),
                new Array(632621, '玛沁'),
                new Array(632721, '玉树'),
                new Array(632802, '德令哈'),
                new Array(640101, '银川'),
                new Array(640201, '石嘴山'),
                new Array(642101, '吴忠'),
                new Array(642221, '固原'),
                new Array(650101, '乌鲁木齐'),
                new Array(650201, '克拉玛依'),
                new Array(652101, '吐鲁番'),
                new Array(652201, '哈密'),
                new Array(652301, '昌吉'),
                new Array(652701, '博乐'),
                new Array(652801, '库尔勒'),
                new Array(652901, '阿克苏'),
                new Array(653001, '阿图什'),
                new Array(653101, '喀什'),
                new Array(654101, '伊宁'),
                new Array(710001, '台北'),
                new Array(710002, '基隆'),
                new Array(710020, '台南'),
                new Array(710019, '高雄'),
                new Array(710008, '台中'),
                new Array(211001, '辽阳'),
                new Array(653201, '和田'),
                new Array(542200, '泽当镇'),
                new Array(542600, '八一镇'),
                new Array(820001, '澳门'),
                new Array(830001, '美国'),
                new Array(830002, '加拿大'),
                new Array(830003, '日本'),
                new Array(830004, '韩国'),
                new Array(830005, '新加坡'),
                new Array(830006, '澳大利亚'),
                new Array(830007, '新西兰'),
                new Array(830008, '英国'),
                new Array(830009, '法国'),
                new Array(830010, '德国'),
                new Array(830011, '意大利'),
                new Array(830012, '俄罗斯'),
                new Array(830013, '印尼'),
                new Array(830014, '马来西亚'),
                new Array(830015, '其他'),
                new Array(810001, '香港')
            );
            if (Number(value) !== Number(value)) {
                var plist = this.getProvincelist();
                for (var i = 0, len = plist.length; i < len; i++) {
                    if (plist[i].text === value) {
                        value = plist[i].value;
                        break;
                    }
                }
            }
            if (Number(value) !== Number(value)) {
                var plist = this.getProvincelist();
                for (var i = 0, len = plist.length; i < len; i++) {
                    if (plist[i].text.indexOf(value) !== -1) {
                        value = plist[i].value;
                        break;
                    }
                }
            }

            var result = [],
                c;
            value = !value || Number(value) !== Number(value) ? 0 : Number(value);
            for (var i = 0, len = list.length; i < len; i++) {
                c = list[i];
                if (value && (c[0] > value && c[0] < value + 10000)) {
                    result.push({
                        value: c[0],
                        text: c[1]
                    });
                }
            }
            return result;
        },
        /**
         * @name 渲染控件
         * @public
         */
        render: function () {
            hui.CitylistDropdown.superClass.prototype.render.call(this);
            var me = this,
                main = me.getMain();

            var html = '<div ui="type:\'Dropdown\',formName:\'child_province\',placeholder:\'- 请选择 -\',options:[],size:{width:131}"></div>' +
                '<div ui="type:\'Dropdown\',formName:\'child_city\',placeholder:\'- 请选择 -\',options:[],size:{width:140}"></div>';
            me.setInnerHTML(me, html);
            hui.Control.init(main);

            var me = this,
                province = me.getByFormName('child_province');
            province.setOptions(me.getProvincelist());

            me.updateCity();
            if (me.value) {
                me.setValue(me.value);
            }
        },
        initBehavior: function () {
            var me = this,
                province = me.getByFormName('child_province');
            province.onchange = hui.fn(me.updateCity, me);
        },
        updateCity: function () {
            var me = this,
                province = me.getByFormName('child_province'),
                city = me.getByFormName('child_city'),
                list,
                value;
            value = province.getValue();
            list = me.getCitylist(value);
            city.setOptions(list);
            city.setValue(list[0]);
            if (list.length <= 1) {
                province.setSize({
                    width: 280
                });
                city.hide();
            }
            else {
                province.setSize({
                    width: 131
                });
                city.show();
            }
        },
        getValue: function () {
            var me = this,
                value = me.getParamMap();
            return value.child_city;
        },
        setValue: function (value) {
            var me = this,
                province = me.getByFormName('child_province'),
                city = me.getByFormName('child_city'),
                list,
                c,
                exist = false;
            if (value) {
                // isNaN
                c = value.child_province;
                if (Number(c) !== Number(c)) {
                    list = me.getProvincelist();
                    for (var i = 0, len = list.length; i < len; i++) {
                        if (list[i].text === c) {
                            c = list[i].text;
                            exist = true;
                            break;
                        }
                    }
                    for (var i = 0, len = list.length; i < len && !exist; i++) {
                        if (list[i].text.indexOf(c) !== -1) {
                            c = list[i].text;
                            break;
                        }
                    }
                }

                province.setValue({
                    text: c
                });
                me.updateCity();
                city.setValue({
                    text: value.child_city
                });
            }
        }
    };

    /* hui.CitylistDropdown 继承了 hui.Control */
    hui.inherits(hui.CitylistDropdown, hui.Control);
});

hui.define('hui_changecaptcha', ['hj_quicklogin'], function () {
    hui.HJ_QuickLogin.prototype.getCaptcha = function () {
        return '<img alt="点击更换验证码" width="150" height="40" class="hj001_captcha" id="hj001_captcha_img" onclick="this.src=this.getAttribute(\'src_bak\')+\'&\'+Math.random()" src_bak="/captcha.aspx?token=28c880b9635a58d351932ad844fa7510&w=150&h=40">';
    };

    hui.HJ_QuickLogin.prototype.getPassName = function () {
        var subName = 'http://pass';
        return subName;
    };



    hui.HJ_Reg_login.prototype.showCaptcha = function (sign) {
        var hj001_captcha_code = hui.g('hj001_captcha_code'),
            hj001_captcha_img = hui.g('hj001_captcha_img');
        if (sign) {
            hj001_captcha_code.style.display = 'block';
            hj001_captcha_img.src_bak = '/captcha.aspx?token=28c880b9635a58d351932ad844fa7510&w=150&h=40' + '&' + Math.random();
            hj001_captcha_img.src = '/captcha.aspx?token=28c880b9635a58d351932ad844fa7510&w=150&h=40' + '&' + Math.random();
        }
        else {
            hj001_captcha_code.style.display = 'none';
        }
    };

    hui.HJ_Reg_login.prototype.getQuickSubName = function () {
        return '/handler';
    };
});