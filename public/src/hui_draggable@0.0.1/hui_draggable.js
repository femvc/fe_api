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
 * @name 拖拽功能
 * @public
 * @author haiyang5210
 * @date 2014-11-15 20:38
 * @example
 <div ui="type:'CheckLabel',id:'ddd',value:[{label_id:1,value:'javascript'},{label_id:2,value:'css'}],
 url_save:'/savelabelUrl',url_remove:'/removelabelUrl',url_list:'/labellist',auto123:'true'"></div>
 */
hui.define('hui_draggable', ['hui_util'], function () {
    hui.Draggable = (function () {
        var supportsTouches = ('createTouch' in document); //判断是否支持触摸

        function _drag(elem, opt) {
            for (var i in opt) {
                this[i] = opt[i];
            }

            this.elem = (typeof elem == 'string') ? document.getElementById(elem) : elem; //被拖动节点
            this.onstart = opt.start || new Function(); //
            this.onmove = opt.move || new Function();
            this.onend = opt.end || new Function();
            this.click = opt.click || new Function();
            this.revert = opt.revert === undefined || opt.revert ? true : false;

            this.action = false;
            this.init();
        }
        _drag.prototype = {
            startEvent: supportsTouches ? 'touchstart' : 'mousedown', //支持触摸式使用相应的事件替代
            moveEvent: supportsTouches ? 'touchmove' : 'mousemove',
            endEvent: supportsTouches ? 'touchend' : 'mouseup',
            preventDefaultEvent: function (e) {
                if (e) {
                    e.preventDefault();
                }
                else {
                    window.event.returnValue = false;
                }
            },
            getMousePoint: function (e) {
                var x = 0,
                    y = 0,
                    doc = document.documentElement,
                    body = document.body;
                if (!e) {
                    e = window.event;
                }
                if (window.pageYoffset) {
                    x = window.pageXOffset;
                    y = window.pageYOffset;
                }
                else {
                    x = (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                    y = (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
                }
                if (supportsTouches) {
                    var evt = e.touches.item(0); //仅支持单点触摸,第一个触摸点
                    x = evt.pageX;
                    y = evt.pageY;
                }
                else {
                    x += e.clientX;
                    y += e.clientY;
                }
                return {
                    'x': x,
                    'y': y
                };
            },
            getCurrentPosition: function (elem) {
                var x = elem.currentStyle ? elem.currentStyle.left : getComputedStyle(elem).left,
                    y = elem.currentStyle ? elem.currentStyle.top : getComputedStyle(elem).top,
                    oldPosition = {
                        left: parseInt('0' + x, 10),
                        top: parseInt('0' + y, 10)
                    };

                return oldPosition;
            },
            cumulativeOffset: function (elem) {
                var valueT = 0,
                    valueL = 0;
                if (elem.parentNode) {
                    do {
                        valueT += elem.offsetTop || 0;
                        valueL += elem.offsetLeft || 0;
                        elem = elem.offsetParent;
                    } while (elem);
                }
                return {
                    left: valueL,
                    top: valueT
                };
            },
            onmousemove: function () {
                var me = this;
                if (me.autoTop !== false && !me.zIndex) {
                    me.zIndex = me.elem.style.zIndex;
                }
                me.elem.style.zIndex = 1000;

                if (!me.preventDefault) {
                    me.elem.style.left = (me.oldPosition.left + (me.nowPoint.x - me.startPoint.x)) + 'px';
                    me.elem.style.top  = (me.oldPosition.top  + (me.nowPoint.y - me.startPoint.y)) + 'px';
                }
                // Check if any element affect by drag.
                if (typeof hui.Droppables != 'undefined' && hui.Droppables.show && !me.dropTimer) {
                    me.dropTimer = window.setTimeout(function () {
                        me.dropTimer = null;
                        hui.Droppables.show(me.nowPoint, me);

                    }, 50);
                }

                me.onmove();
            },
            init: function () {
                var me = this,
                    elem = me.elem;

                elem.setAttribute('draggable', 'true');

                // 注：只支持自身是relative的拖拽，absolute的有待扩展
                me.position = elem.currentStyle ? elem.currentStyle.position : getComputedStyle(elem).position;
                if (me.position != 'relative' && me.position != 'absolute') {
                    elem.style.position = 'relative';
                }

                elem['on' + me.startEvent] = me.bind(function (e) { //绑定节点的 [鼠标按下/触摸开始] 事件

                    //根据外部处理结果决定是否
                    if (this.onstart(e) !== false) {
                        //this.preventDefaultEvent(e);
                        if (this.action) return false;
                        else this.action = true;

                        this.startPoint = this.getMousePoint(e);
                        // 注：被拖拽对象的原始位置. 有可能position:relative;left:10px;top:10px;
                        this.oldPosition = this.getCurrentPosition(this.elem);
                        this.startPosition = this.getCurrentPosition(this.elem);
                        this.oldParentOffset = this.cumulativeOffset(this.elem.parentNode);
                        this.nowPoint = this.getMousePoint(e);

                        this.isMoved = false;

                        document['on' + this.moveEvent] = this.bind(function (e) {
                            //取消文档的默认行为[鼠标移动、触摸移动]
                            this.preventDefaultEvent(e);
                            var me = this;
                            me.isMoving = true;
                            me.nowPoint = me.getMousePoint(e);

                            if (!me.onmoveTimer) {
                                me.onmoveTimer = window.setTimeout(function () {
                                    me.onmoveTimer = null;
                                    me.isMoved = true;
                                    me.onmousemove(e);
                                }, 30);
                            }

                        }, this);

                        document['on' + this.endEvent] = document['ontouchcancel'] = this.bind(function () {
                            window.clearTimeout(this.onmoveTimer);
                            this.onmoveTimer = null;

                            document['on' + this.endEvent] = document['ontouchcancel'] = document['on' + this.moveEvent] = null;
                            me.isMoving = false;

                            if (this.autoTop !== false) {
                                this.elem.style.zIndex = this.zIndex;
                            }
                            this.action = false;
                            if (this.isMoved && this.onend() !== false && this.revert) {
                                this.elem.style.left = this.startPosition.left + 'px';
                                this.elem.style.top  = this.startPosition.top  + 'px';
                            }
                        }, this);
                    }
                    else {
                        this.action = false;
                    }
                }, me);
            },
            bind: function (fn, obj) {
                return function () {
                    fn.apply(obj, arguments);
                };
            },
            appendTo: function (parentNode) {
                var me = this;
                me.oldParentOffset = me.cumulativeOffset(me.elem.parentNode);
                parentNode.appendChild(me.elem);
                me.newParentOffset = me.cumulativeOffset(me.elem.parentNode);
                me.oldPosition.left = me.oldPosition.left + me.oldParentOffset.left - me.newParentOffset.left;
                me.oldPosition.top  = me.oldPosition.top  + me.oldParentOffset.top  - me.newParentOffset.top ;
                me.onmousemove();
            }
        };

        var result = function (elem, opt) {
            var dragElem = new _drag(elem, opt);
            result.drags.push(dragElem);

            return dragElem;
        };
        result.drags = [];

        return result;
    })();
});