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
    <label ui="type:'Radiobox',formname:'gender',targetForm:'result',value:'male'">
        <input type="radio" class="hui_radiobox_input" />
        <span class="hui_radiobox_label">男</span>
    </label>
 */
hui.define('hui_radiobox', ['hui_checkbox'], function () {
    hui.Radiobox = function (options, pending) {
        hui.Radiobox.superClass.call(this, options, 'pending');

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.Radiobox.prototype = {
        getTpl: function () {
            return '<span class="#{1}"><span class="#{3}">〇</span><span class="#{2}">●</span><input type="radio" class="#{0}" style="display:none" /></span>';
        },
        /**
         * @name 渲染控件
         * @protected
         * @param {Object} main 控件挂载的DOM.
         */
        render: function () {
            hui.Control.prototype.render.call(this);
            var me = this,
                main = me.getMain();
            // 绘制宽度和高度

            var tpl = me.getTpl();
            hui.appendHTML(main, hui.Control.format(tpl,
                me.getClass('input'),
                me.getClass('icon'),
                me.getClass('point'),
                me.getClass('dot')
            ));
            me.renderLabel();
            // 设置_rendered
            main.setAttribute('_rendered', 'true');
        },
        initBehavior: function () {
            var me = this,
                icon = me.getIcon(),
                label = me.getLabel();

            me.setChecked(!!me.checked);
            icon.onclick = label.onclick = hui.fn(me.getClickHandler, me);
            icon.onselectstart = new Function('return false;');
        },

        setChecked: function (checked) {
            var me = this,
                targetFormList = me.parentControl === hui.window ? [hui.Control] : [me.parentControl],
                list,
                target,
                formname = me.getFormname();
            if (checked) {
                if (me.targetForm) {
                    targetFormList = [];
                    list = me.targetForm.split(',');
                    for (var i = 0, len = list.length; i < len; i++) {
                        target = hui.Control.getByFormname(list[i]);
                        (target && targetFormList.push(target));
                    }
                }
                else if (me.targetControl) {
                    targetFormList = [];
                    list = me.targetControl.split(',');
                    for (var i = 0, len = list.length; i < len; i++) {
                        target = hui.Control.getById(list[i]);
                        (target && targetFormList.push(target));
                    }
                }
                for (var j = 0, len2 = targetFormList.length; j < len2; j++) {
                    list = targetFormList[j].getByFormnameAll(formname);
                    for (var i = 0, len = list.length; i < len; i++) {
                        if (list[i] != me && list[i].getChecked && list[i].getChecked()) {
                            list[i].setChecked(false);
                        }
                    }
                }
            }

            hui.Radiobox.superClass.prototype.setChecked.call(this, checked);
        },
        getClickHandler: function () {
            var me = this;
            me.setChecked(true);
            me.onclick();
        }
    };

    /* hui.Radiobox 继承了 hui.Control */
    hui.inherits(hui.Radiobox, hui.Checkbox);

    hui.util.importCssString(
        '.hui_radiobox{float:left;cursor:pointer;}' +
        '.hui_radiobox .hui_radiobox_input{display:none;}' +
        '.hui_radiobox .hui_radiobox_icon{float:left;display:inline-block;width:30px;height:20px;padding-top:0px;}' +
        '.hui_radiobox .hui_radiobox_point{font-size:15px;color:transparent;width:14px;height:20px;line-height:18px;*line-height:20px;line-height:20px\\9;position:absolute;z-index:2;text-align:center;vertical-align:middle;margin-left:0px;font-family:\'microsoft yahei\';margin-top:0px;margin-left:4px;}' +
        '.hui_radiobox .hui_radiobox_dot{font-size:16px;color:#ccc;width:20px;height:20px;line-height:20px;position:absolute;z-index:1;text-align:center;vertical-align:middle;margin-top:0px;font-family:\'microsoft yahei\';}' +
        '.hui_radiobox .hui_radiobox_icon li{float:left;padding:1px;margin:1px;height:33px;}' +
        '.hui_radiobox .hui_radiobox_text{float:left;}' +
        '.hui_radiobox_checked .hui_radiobox_icon{}' +
        '.hui_radiobox_checked .hui_radiobox_point{color:#68bf4a;}' +
        '.hui_radiobox_checked .hui_radiobox_dot{}'
    );

});