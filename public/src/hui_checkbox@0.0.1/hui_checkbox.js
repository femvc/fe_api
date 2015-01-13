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
 * @author haiyang5210
 * @date 2014-11-16 20:22
 * @param {Object} options 控件初始化参数.
 * @example 
<label ui="type:'Checkbox',formName:'book',value:'icdn0001',checked:'',label:'基督山'"></label>
<label ui="type:'Checkbox',formName:'book',value:'icdn0002',checked:''">呼啸山</label>
 */
hui.define('hui_checkbox', ['hui_util', 'hui_control'], function () {

    hui.Checkbox = function (options, pending) {
        hui.Checkbox.superClass.call(this, options, 'pending');

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.Checkbox.prototype = {
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
                tpl = '<span class="#{0}">#{1}</span>';
            if (!label) {
                hui.appendHTML(main, hui.Control.format(tpl,
                    me.getClass('label'),
                    me.label
                ));
            }
            else {
                main.appendChild(label);
            }
        },
        getTpl: function () {
            return '<i class="#{1}"><input type="checkbox" class="#{0}" style="display:none" />✓&nbsp;&nbsp;&nbsp;</i>';
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

            var tpl = me.getTpl();
            hui.appendHTML(main, hui.Control.format(tpl,
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
        setLabel: function (label) {
            var me = this,
                elem = me.getLabel();
            me.label = label;
            me.setInnerHTML(elem, label);
        },
        setValue: function (value) {
            var me = this,
                preset = me.getPresetValue();
            me.setChecked(value == preset && String(value) == String(preset));
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
                main = me.getMain(),
                oldChecked = input.checked;
            if (checked === false) {
                input.checked = false;
                hui.removeClass(main, me.getClass('checked'));
            }
            else {
                input.checked = true;
                hui.addClass(main, me.getClass('checked'));
            }
            if (checked != oldChecked) {
                me.onchange();
            }
        },
        getChecked: function () {
            var me = this,
                checked = !!me.getInput().checked;
            return checked;
        },
        getClickHandler: function () {
            var me = this;
            me.setChecked(!me.getChecked());
            me.onclick();
        },
        onclick: new Function(),
        onchange: new Function()
    };

    /* hui.Checkbox 继承了 hui.Control */
    hui.inherits(hui.Checkbox, hui.Control);

    hui.util.importCssString(
        '.hui_checkbox{float:left;}' +
        '.hui_checkbox .hui_checkbox_label{}' +
        '.hui_checkbox .hui_checkbox_label a{font-size:14px;}' +
        '.hui_checkbox .hui_checkbox_icon{font-family:simsun;margin:1px 5px 0 0;float:left;border:1px solid #d9d9d9;font-size:15px;font-style:normal;line-height:1.1em;width:16px;height:16px;cursor:pointer;overflow:hidden;}' +
        '.hui_checkbox .hui_checkbox_label{color:#666666;font-size:14px;line-height:20px;float:left;padding-left:0px;padding-right:5px;cursor:pointer;}' +
        '.hui_checkbox .hui_checkbox_icon{color:#1ba8eb;text-indent:-100px;}' +
        '.hui_checkbox_checked .hui_checkbox_icon{visibility:visible;color:#68bf4a;text-indent:3px;}'
    );
});