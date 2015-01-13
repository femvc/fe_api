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
 * @date 2014-11-15 19:53
 * @param {Object} options 控件初始化参数.
 */
hui.define('hui_button', ['hui_util', 'hui_control'], function () {

    hui.Button = function (options, pending) {
        this.isFormItem = false; // 注：getParamMap时不需要处理button
        hui.Button.superClass.call(this, options, 'pending');

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

    /* hui.Button 继承了 hui.Control */
    hui.inherits(hui.Button, hui.Control);


});