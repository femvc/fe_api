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
 * @name 滑块控件
 * @public
 * @author haiyang5210
 * @date 2014-11-16 20:00
 * @param {Object} options 控件初始化参数.
 * @example 
 <div ui="type:'Slider',id:'a',labels:'both',ticks:true,tickStep:4,minValue:25,maxValue:65,width:300,smallChange:1,rangeSelection:false"></div>
 */
hui.define('hui_slider', ['hui_util', 'hui_draggable', 'hui_control'], function () {

    hui.Slider = function (options, pending) {
        hui.Slider.superClass.call(this, options, 'pending');

        this.minValue = this.minValue === undefined ? 0 : Number(this.minValue);
        this.maxValue = this.maxValue === undefined ? 100 : Number(this.maxValue);
        this.tickStep = this.tickStep === undefined ? 1 : Number(this.tickStep);
        this.width = this.width === undefined ? 300 : Number(this.width);
        this.smallChange = this.smallChange === undefined ? 1 : Number(this.smallChange);

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.Slider.prototype = {
        getMainTpl: function () {
            var tpl =
                '<div class="hui_slider_layer">' +
                '    <div class="hui_slider_leftside">' +
                '        <input type="text" class="hui_slider_leftinput" onblur="hui.Control.getById(\'#{0}\').setLeftValue(this.value)" />' +
                '        <span class="hui_slider_min" style="display:none;">0</span>' +
                '    </div>' +
                '    <div class="hui_slider_rightside">' +
                '        <span class="hui_slider_max" style="display:none;">20</span>' +
                '        <input type="text" class="hui_slider_rightinput" onblur="hui.Control.getById(\'#{0}\').setRightValue(this.value)" />' +
                '    </div>' +
                '    <div class="hui_slider_scrollbar">' +
                '        <div class="hui_slider_inner">&nbsp;</div>' +
                '    </div>' +
                '    <div class="hui_slider_ticks"></div>' +
                '    <div class="hui_slider_percent"></div>' +
                '    <div class="hui_slider_leftpoint"></div>' +
                '    <div class="hui_slider_rightpoint"></div>' +
                '</div>' +
                '<div style="clear:both; overflow:hidden; font-size:0px;line-height:0px;height:1px;">&nbsp;</div>';
            return tpl;
        },
        getTickTpl: function () {
            var tpl =
                '<div class="hui_slider_unit" style="left:#{1}px;">' +
                '    <span class="hui_slider_line">|</span>' +
                '    <span class="hui_slider_num">#{0}</span>' +
                '</div>';
            return tpl;
        },
        showTicks: function () {
            if (this.ticks) {
                var me = this,
                    main = me.getMain(),
                    tickTpl = me.getTickTpl();

                var minValue = me.minValue,
                    maxValue = me.maxValue,
                    tickStep = me.tickStep,
                    width = me.width - 1,
                    tickHTML = '';

                for (var i = minValue - minValue % tickStep + (minValue % tickStep === 0 ? 0 : tickStep); i <= maxValue; i += tickStep) {
                    tickHTML += hui.Control.format(tickTpl, i, (i - minValue) * width / (me.maxValue - me.minValue));
                }

                me.setInnerHTML(hui.cc('hui_slider_ticks', main), tickHTML);
            }
        },
        showLabels: function () {
            var me = this,
                main = me.getMain(),
                min,
                max;
            if (me.labels === undefined || me.labels === 'both' || me.labels === 'left') {
                min = hui.cc('hui_slider_min', main);
                me.setInnerHTML(min, me.minValue);
                min.style.display = 'inline';
            }
            if (me.labels === undefined || me.labels === 'both' || me.labels === 'right') {
                max = hui.cc('hui_slider_max', main);
                me.setInnerHTML(max, me.maxValue);
                max.style.display = 'inline';
            }
        },
        /**
         * @name 渲染控件
         * @public
         */
        render: function () {
            hui.Slider.superClass.prototype.render.call(this);
            var me = this,
                main = me.getMain();

            me.setInnerHTML(me, hui.Control.format(me.getMainTpl(), me.getId()));

            hui.cc('hui_slider_layer', main).style.width = me.width + 'px';

            me.showTicks();
            me.showLabels();

            // 设置disabled
            me.setDisabled(!!me.disabled);
        },
        initBehavior: function () {
            var me = this,
                main = me.getMain();

            me.handler1 = hui.Draggable(hui.cc('hui_slider_leftpoint', main), {
                preventDefault: true,
                move: function () {
                    if (this.moving) {
                        return;
                    }
                    this.moving = true;
                    me.handler2.elem.style.zIndex = 999;
                    var dx = this.nowPoint.x - this.startPoint.x;
                    var left = this.oldPosition.left + dx;
                    left = left < 0 ? 0 : (left > me.width ? me.width : left);

                    main.leftPercent = left / me.width;
                    if (main.leftPercent > main.rightPercent) {
                        main.leftPercent = main.rightPercent;
                    }
                    me.setLeftValue(me.minValue + (me.maxValue - me.minValue) * main.leftPercent);


                    me.onmove();
                    this.moving = false;
                },
                revert: false,
                autoTop: false
            });

            me.handler2 = hui.Draggable(hui.cc('hui_slider_rightpoint', main), {
                preventDefault: true,
                move: function () {
                    if (this.moving) {
                        return;
                    }
                    this.moving = true;
                    me.handler1.elem.style.zIndex = 999;
                    var dx = this.nowPoint.x - this.startPoint.x;
                    var left = this.oldPosition.left + dx;
                    left = left < 0 ? 0 : (left > me.width ? me.width : left);

                    main.rightPercent = left / me.width;

                    me.setRightValue(me.minValue + (me.maxValue - me.minValue) * main.rightPercent);

                    me.onmove();
                    this.moving = false;
                },
                revert: false,
                autoTop: false
            });

            if (!me.rangeSelection) {
                hui.cc('hui_slider_leftpoint', main).style.display = 'none';
                hui.cc('hui_slider_leftinput', main).style.display = 'none';
            }

            if (me.value !== undefined) {
                me.setValue(me.value);
            }
            else {
                me.setValue([me.minValue, me.maxValue]);
            }
        },
        // onmove事件
        onmove: new Function(),
        getLeftPercent: function () {
            return this.getMain().leftPercent;
        },
        getRightPercent: function () {
            return this.getMain().rightPercent;
        },
        getLeftValue: function () {
            var me = this,
                main = me.getMain(),
                value = hui.cc('hui_slider_leftinput', main).value;
            return value;
        },
        getRightValue: function () {
            var me = this,
                main = me.getMain(),
                value = hui.cc('hui_slider_rightinput', main).value;
            return value;
        },
        setLeftValue: function (value) {
            var me = this,
                main = me.getMain();
            hui.cc('hui_slider_leftinput', main).value = Math.round(value / me.smallChange) * me.smallChange;
            value = value < me.minValue ? me.minValue : value > me.maxValue ? me.maxValue : Number(value);
            main.leftPercent = (value - me.minValue) / (me.maxValue - me.minValue);
            if (main.leftPercent > main.rightPercent) {
                main.leftPercent = main.rightPercent;
                hui.cc('hui_slider_leftinput', main).value = Math.round((me.minValue + (me.maxValue - me.minValue) * main.rightPercent) / me.smallChange) * me.smallChange;
            }
            me.handler1.elem.style.left = (me.width * main.leftPercent) + 'px';
            hui.cc('hui_slider_inner', main).style.left = (me.width * main.leftPercent) + 'px';
        },
        setRightValue: function (value) {
            var me = this,
                main = me.getMain();
            hui.cc('hui_slider_rightinput', main).value = Math.round(value / me.smallChange) * me.smallChange;
            value = value < me.minValue ? me.minValue : value > me.maxValue ? me.maxValue : Number(value);
            main.rightPercent = (value - me.minValue) / (me.maxValue - me.minValue);
            if (main.rightPercent < main.leftPercent) {
                main.rightPercent = main.leftPercent;
                hui.cc('hui_slider_rightinput', main).value = Math.round((me.minValue + (me.maxValue - me.minValue) * main.rightPercent) / me.smallChange) * me.smallChange;
            }
            me.handler2.elem.style.left = (me.width * main.rightPercent) + 'px';
            hui.cc('hui_slider_inner', main).style.right = (me.width * (1 - main.rightPercent)) + 'px';
        },
        setValue: function (value) {
            var me = this;
            if (Object.prototype.toString.call(value) !== '[object Array]') {
                value = [me.minValue, value];
            }
            me.setLeftValue(value[0]);
            me.setRightValue(value[1]);
        },
        getValue: function () {
            return !this.rangeSelection ? this.getRightValue() : [this.getLeftValue(), this.getRightValue()];
        }
    };

    // hui.Slider 继承了 hui.Control 
    hui.inherits(hui.Slider, hui.Control);

    hui.util.importCssString(
        '.hui_slider {padding-left: 42px;font-size:14px;}' +
        '.hui_slider .hui_slider_leftinput{width: 22px;padding: 2px 2px 0px;font-size: 13px;text-align: right;}' +
        '.hui_slider .hui_slider_rightinput{width: 22px;padding: 2px 2px 0px;font-size: 13px;text-align: left;}' +
        '.hui_slider .hui_slider_leftside{position:absolute;z-index:1;right:100%;padding-right:10px;margin-top:-6px;text-align:right;white-space:nowrap;}' +
        '.hui_slider .hui_slider_rightside{position:absolute;z-index:1;left:100%;padding-left:10px;margin-top:-6px;text-align:left;white-space:nowrap;}' +
        '.hui_slider .hui_slider_layer{position:relative;z-index:1;}' +
        '.hui_slider .hui_slider_scrollbar{border:1px solid #bbb;background-color:#f3f3f9;border-radius:3px;position:relative;z-index:1;height: 5px;}' +
        '.hui_slider .hui_slider_inner{height:5px;background-color:#fe6502;border-radius:3px;position:absolute;z-index: 1;right: 0px;left: 0px;}' +
        '.hui_slider .hui_slider_leftpoint,' +
        '.hui_slider .hui_slider_rightpoint{height:16px;width:16px;position:absolute;z-index:1;top:-5px;margin-left:-9px;cursor:pointer;border:1px solid #99968f;background-color:#fff;border-radius:5px;}' +
        '.hui_slider .hui_slider_percent{}' +
        '.hui_slider .hui_slider_ticks{height:40px;}' +
        '.hui_slider .hui_slider_ticks .hui_slider_unit{position:absolute;z-index:1;font-size:13px;}' +
        '.hui_slider .hui_slider_ticks .hui_slider_line{display:block;color:transparent;border-left:1px solid #999;height:8px;}' +
        '.hui_slider .hui_slider_ticks .hui_slider_num{display:block;margin-left:-3px;}'
    );

});