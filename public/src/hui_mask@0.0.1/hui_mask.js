
'use strict';
//    ____     ____                _   _     ____          ____      ____                   
//  /\  __\  /\  __\    /'\_/`\  /\ \/\ \  /\  __`\      /\  __`\  /\  __`\    /'\_/`\      
//  \ \ \_/_ \ \ \_/_  /\      \ \ \ \ \ \ \ \ \ \_\     \ \ \ \_\ \ \ \ \ \  /\      \     
//   \ \  __\ \ \  __\ \ \ \_/\_\ \ \ \ \ \ \ \ \  __     \ \ \  __ \ \ \ \ \ \ \ \_/\_\    
//    \ \ \_/  \ \ \_/_ \ \ \\ \ \ \ \ \_/ \ \ \ \_\ \  __ \ \ \_\ \ \ \ \_\ \ \ \ \\ \ \   
//     \ \_\    \ \____/ \ \_\\ \_\ \ `\___/  \ \____/ /\_\ \ \____/  \ \_____\ \ \_\\ \_\  
//      \/_/     \/___/   \/_/ \/_/  `\/__/    \/___/  \/_/  \/___/    \/_____/  \/_/ \/_/  
//                                                                                          
//                                                                                          

/**
 * @name 页面遮盖控件(全局页面只需要一个遮盖层，所以为单例)
 * @public
 * @author haiyang5210
 * @date 2014-11-15 20:19
 * @param {Object} options 控件初始化参数.
 */
hui.define('hui_mask', ['hui_util'], function () {
    hui.Mask = {
        getId: function () {
            return 'hj001_mask';
        },
        //getStyle: function(){return 'background:#000;opacity:0.25;filter:alpha(opacity=25);width:100%;height:100%;position:absolute;top:0;left:0;z-index:50000';},
        init: function init() {
            var el = document.createElement('div');
            el.id = hui.Mask.getId();
            el.className = 'hj001_mask hide';
            document.body.appendChild(el);
            el.innerHTML = '<iframe width="100%" height="100%" frameborder="0" src="about:blank" ></iframe>';

            return el;
        },
        /**
         * @name 重新绘制遮盖层的位置
         * @private
         * @param {HTMLElement} mask 遮盖层元素.
         */
        repaintMask: function repaintMask() {
            var width = Math.max(
                    document.documentElement.offsetWidth,
                    document.body.offsetWidth
                ),
                height = Math.max(
                    document.documentElement.offsetHeight,
                    document.body.offsetHeight
                );
            var mask = hui.Mask.getMask();
            // 注：各个浏览器高宽计算不一致，因此需要针对不同浏览器分别处理！
            if (!hui.window.ActiveXObject) {
                // '>=IE9, FF, Chrome';
                mask.style.width = width + 'px';
                mask.style.height = height + 'px';
            }
            else if (!hui.window.XMLHttpRequest) {
                // 'IE6';
                mask.style.width = width - 21 + 'px';
                mask.style.height = height + 'px';
            }
            else if (!document.querySelector) {
                // 'IE7';
                mask.style.width = width + 'px';
                mask.style.height = height + 'px';
            }
            else if (!document.addEventListener) {
                // 'IE8';
                mask.style.width = width - 21 + 'px';
                mask.style.height = height - 7 + 'px';
            }
            else {
                // '>= IE9';
                mask.style.width = width - 18 + 'px';
                mask.style.height = height + 30 + 'px';
            }

            mask.style.top = '0px'; //document.body.scrollTop + document.documentElement.scrollTop + 'px';
            mask.style.left = '0px'; //document.body.scrollLeft + document.documentElement.scrollLeft + 'px';
        },
        /**
         * @name 页面大小发生变化的事件处理器
         * @private
         */
        resizeHandler: function resizeHandler() {
            hui.Mask.repaintMask();
        },
        /**
         * @name 获取遮盖层dom元素
         * @private
         * @return {HTMLElement} 获取到的Mask元素节点.
         */
        getMask: function getMask() {
            var mask = document.getElementById(hui.Mask.getId());
            if (!mask) {
                mask = hui.Mask.init();
            }
            return mask;
        },
        /**
         * @name 显示遮盖层
         */
        show: function () {
            var mask = hui.Mask.getMask();
            hui.Mask.repaintMask(mask);
            hui.removeClass(mask, 'hide');

            if (hui.window.addEventListener) {
                hui.window.addEventListener('scroll', hui.Mask.resizeHandler, false);
            }
            else if (hui.window.attachEvent) {
                hui.window.attachEvent('on' + 'scroll', hui.Mask.resizeHandler);
                //此处使用回调函数call()，让 this指向elem
            }
            /*
            hui.Mask.htmlOverflow = document.documentElement.style.overflow;
            document.documentElement.style.overflow = 'hidden';
            hui.Mask.bodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            */
        },
        /**
         * @name 隐藏遮盖层
         */
        hide: function (id) {
            hui.addClass(hui.Mask.getMask(), 'hide');

            if (hui.window.removeEventListener) {
                hui.window.removeEventListener('scroll', hui.Mask.resizeHandler, false);
            }
            if (hui.window.detachEvent) {
                hui.window.detachEvent('on' + 'scroll', hui.Mask.resizeHandler);
            }
            /*
            document.documentElement.style.overflow = hui.Mask.htmlOverflow || '';
            document.body.style.overflow = hui.Mask.bodyOverflow || '';
            */
        }
    };

    hui.util.importCssString(
        '.hj001_mask{background:#000;opacity:0.02;filter:alpha(opacity=20);width:100%;height:100%;position:absolute;top:0;left:0;z-index:50000}' +
        '.hj001_mask.hide{display: none;}'
    );

});