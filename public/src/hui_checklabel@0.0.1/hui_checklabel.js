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
 * @name 标签云控件
 * @public
 * @author haiyang5210
 * @date 2014-11-16 21:59
 * @example
 <label ui="type:'CheckLabel',formName:'label' ,value:'aaaa', label:'aa',removeblank:false"></label>
 */
hui.define('hui_checklabel', ['hui_checkbox'], function () {
    hui.CheckLabel = function (options, pending) {
        this.isFormItem = true;
        hui.CheckLabel.superClass.call(this, options, 'pending');

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.CheckLabel.prototype = {
        /**
         * @name button的html模板
         * @private
         */
        getCheckLabelTpl: function () {
            var tpl = [
                '<input class="#{0}" old="#{1}" value="#{1}" onblur="hui.Control.getById(\'#{2}\').getBlurHandler()" type="text" size="5" /> '
                //'<!--span class="#{2}">X</span-->'
            ].join('');
            return tpl;
        },
        getUrlSave: function () {
            return this.url_save || this.parentControl.url_save;
        },
        /**
         * @name 渲染控件
         * @public
         */
        render: function () {
            hui.CheckLabel.superClass.prototype.render.call(this);
            var me = this,
                main = me.getMain();

            hui.util.appendHTML(main, hui.Control.format(me.getCheckLabelTpl(),
                me.getClass('textarea'),
                me.label,
                me.getId()
            ));
        },
        initBehavior: function () {
            var me = this,
                main = me.getMain(),
                icon = me.getIcon(),
                label = me.getLabel(),
                textarea = hui.cc(me.getClass('textarea'), main);
            me.setChecked(!!me.checked);
            icon.onclick = hui.fn(me.getClickHandler, me);
            icon.onselectstart = new Function('return false;');
            label.ondblclick = hui.fn(me.getDbClickHandler, me);
            //textarea.onblur = hui.fn(me.getBlurHandler, me);
            hui.util.onesc(textarea, hui.fn(me.onesc, me));
            hui.util.onenter(textarea, hui.fn(me.onenter, me));
        },
        getDbClickHandler: function () {
            var me = this;
            me.editLabel();
        },
        getBlurHandler: function () {
            var me = this;
            me.saveLabel();
        },
        /**
         * @name 编辑标签
         * @public
         */
        editLabel: function () {
            var me = this,
                main = me.getMain(),
                textarea = hui.cc(me.getClass('textarea'), main);
            hui.addClass(main, me.getClass('edit'));
            if (String(me.getPresetValue()).indexOf('-') === 0) {
                textarea.value = '';
            }
            textarea.focus();
        },
        /**
         * @name 保存标签
         * @public
         */
        saveLabel: function (msg) {
            var me = this,
                label_id = me.getPresetValue(),
                main = me.getMain(),
                label = hui.cc(me.getClass('label'), main),
                textarea = hui.cc(me.getClass('textarea'), main),
                value = textarea.value;

            if (value === '' && me.removeblank !== false) {
                textarea.value = textarea.getAttribute('old');

                if (window.confirm('Are you sure remove label?')) {
                    me.saveLabelData();

                    me.dispose();
                }
                else {
                    hui.removeClass(me.getMain(), me.getClass('edit'));
                }
            }
            else if (textarea.getAttribute('old') !== value) {
                if (window.confirm('Are you sure change label?')) {
                    me.saveLabelData();

                    me.setInnerHTML(label, value);
                    textarea.setAttribute('old', value);
                    hui.removeClass(main, me.getClass('edit'));
                }
                else {
                    hui.removeClass(main, me.getClass('edit'));
                    me.onesc();
                }
            }
            else if (label_id > 0) {
                hui.removeClass(main, me.getClass('edit'));
            }

        },
        saveLabelData: function () {
            var me = this,
                label_id = me.getPresetValue(),
                main = me.getMain(),
                textarea = hui.cc(me.getClass('textarea'), main),
                value = textarea.value,
                url_save = me.getUrlSave();
            if (url_save) {
                // hui.Mockup.setRule(me.getUrlSave(), []);
                window.Requester.get(me.getUrlSave(), {
                    data: {
                        value: label_id,
                        label: value
                    },
                    onsuccess: function () {
                        // alert('savelabel');
                        me.refreshList();
                    }
                });
            }
            else {
                me.refreshList();
            }
        },
        refreshList: function () {},
        onesc: function () {
            var me = this,
                main = me.getMain(),
                textarea = hui.cc(me.getClass('textarea'), main);
            textarea.value = textarea.getAttribute('old');
        },
        onenter: function () {
            this.getBlurHandler();
        }
    };

    // hui.CheckLabel 继承了 hui.Control 
    hui.inherits(hui.CheckLabel, hui.Checkbox);

    hui.util.importCssString(
        '.hui_checklabel{float:left;}' +
        '.hui_checklabel .hui_checklabel_label a{font-size:14px;}' +
        '.hui_checklabel .hui_checklabel_icon{float:left;font-family:simsun;margin:1px 5px 0 0;border:1px solid #d9d9d9;font-size:15px;font-style:normal;line-height:1.1em;width:16px;height:16px;cursor:pointer;overflow:hidden;}' +
        '.hui_checklabel .hui_checklabel_label{float:left;font-family:arial;color:#666666;font-size:14px;line-height:20px;padding-left:0px;padding-right:10px;cursor:pointer;}' +
        '.hui_checklabel .hui_checklabel_icon{color:#1ba8eb;text-indent:-100px;}' +
        '.hui_checklabel .hui_checklabel_textarea{float:left;font-family:arial;font-size:14px;border:0px;padding-left:2px;min-width:30px;border:1px solid #eee;margin-top:0px; margin-left: -3px;display:none;}' +
        '.hui_checklabel .hui_checklabel_remove{cursor:pointer;font-family:arial;margin:0px 3px;}' +
        '.hui_checklabel .hui_checklabel_remove:hover{color:#fff;background-color:red;}' +
        '.hui_checklabel_checked .hui_checklabel_icon{visibility:visible;color:#68bf4a;text-indent:3px;}' +
        '.hui_checklabel_edit .hui_checklabel_label{display:none;}' +
        '.hui_checklabel_edit .hui_checklabel_textarea{display:inline;}'
    );

});