'use strict';
/**
 * @name 表单数据验证类
 * @public
 * @author haiyang5210
 * @date 2014-11-15 14:17
 */
hui.define('hui_validator', ['hui_util'], function () {

    hui.Validator = {
        /**
         * @name 通用错误提示
         */
        errorMsg: {
            'SUCCESS': '',
            'ERROR_EMPTY': '不能为空',
            'ERROR_REGEX': '格式错误',
            'ERROR_INT': '格式错误，请输入整数',
            'ERROR_NUMBER': '格式错误，请输入数字',
            'ERROR_MIN': '不能小于#{0}',
            'ERROR_MIN_DATE': '不能早于#{0}',
            'ERROR_MAX': '不能多于#{0}',
            'ERROR_MAX_DATE': '不能晚于#{0}',
            'ERROR_GT': '必须大于#{0}',
            'ERROR_GT_DATE': '必须晚于#{0}',
            'ERROR_LT': '必须少于#{0}',
            'ERROR_LT_DATE': '必须早于#{0}',
            'ERROR_RANGE': '范围须在#{0}与#{1}',
            'ERROR_LENGTH': '长度不等于#{0}',
            'ERROR_MIN_LENGTH': '长度不能小于#{0}',
            'ERROR_MAX_LENGTH': '长度不能大于#{0}',
            'ERROR_LENGTH_RANGE': '长度不能超出范围(#{0}, #{1})',
            'ERROR_CALENDAR': '日历格式错误，正确格式2010-01-01',
            'ERROR_EXT': '扩展名不合法，只允许#{0}',
            'ERROR_BACKEND': ' #{0}'
        },
        /**
         * @name Id后缀及错误样式名
         */
        config: {
            waitingClass: 'validate_waiting',
            okClass: 'validate_ok',
            errorClass: 'validate_error',
            validClass: 'validate',
            iconClass: 'validate_icon',
            textClass: 'validate_text',
            suffix: 'validate',
            iconSuffix: 'validateIcon',
            textSuffix: 'validateText'
        },
        /**
         * @name 待验证的对象获取值解析器
         */
        parse: function (text, type) {
            if (type === 'int') {
                return parseInt(text, 10);
            }
            else if (type === 'float') {
                return parseFloat(text);
            }
            else if (type === 'date') {
                return hui.Validator.parseDate(text);
            }
            else {
                return text;
            }
        },
        /**
         * @name 设定控件的innerHTML[nodejs&browser]
         * @public
         * @param {String} html innerHTML
         * @param {HTMLElement} elem 默认为控件主DOM[可选]
         * @return {String}
         */
        setInnerHTML: function (elem, html) {
            elem.innerHTML = html;
            return this;
        },
        /**
         * @name 在父元素的末尾提示信息
         * @private
         * @param {String} noticeText 错误信息.
         * @param {HTMLElement} input 控件元素.
         */
        getControl: function (control) {
            var ctr = control && control.getMain ?
                control.getMain() :
                (control && control.main ? hui.Validator.getDocument().getElementById(control.main) : control);
            return ctr;
        },
        showError: function (control, noticeText) {
            var me = hui.Validator;
            me.showNoticeDom(control, noticeText, 'errorClass');
        },
        showOK: function (control, noticeText) {
            var me = hui.Validator;
            me.showNoticeDom(control, noticeText, 'okClass');
        },
        showWaiting: function (control, noticeText) {
            var me = hui.Validator;
            me.showNoticeDom(control, noticeText, 'waitingClass');
        },
        showNoticeDom: function (control, noticeText, className) {
            var me = hui.Validator,
                input = me.getControl(control),
                father = input.parentNode;
            if (!me.getValidateElem(input)) {
                me.createNoticeElement(input, father);
            }
            if (me.getTextEl(input)) {
                me.createNoticeTextElem(input);
            }

            hui.Validator.removeClass(father, me.config['okClass'] + ' ' + me.config['errorClass'] + ' ' + me.config['waitingClass']);
            hui.Validator.addClass(father, me.config[className]);
            noticeText = noticeText === undefined ? '' : noticeText;

            me.setInnerHTML(me.getTextEl(control), noticeText);
        },
        /**
         * @name 创建notice元素
         * @private
         * @param {HTMLElement} input 对应的input元素.
         * @return {HTMLElement}
         */
        createNoticeElement: function (input, father) {
            var me = hui.Validator,
                inputId = input.id,
                el = me.getValidateElem(input),
                text = me.getTextEl(input);

            if (!el) {
                el = hui.Validator.getDocument().createElement('div');
                el.id = inputId + '_' + me.config['suffix'];
                el.className = me.config['validClass'];
                father.appendChild(el);
            }

            if (!text) {
                me.createNoticeTextElem(input);
            }

            return el;
        },
        createNoticeTextElem: function (input) {
            var me = hui.Validator,
                inputId = input.id,
                el = me.getValidateElem(input),
                text = me.getTextEl(input),
                icon;

            if (el && !text) {
                icon = hui.Validator.getDocument().createElement('div');
                icon.id = inputId + '_' + me.config['iconSuffix'];
                icon.className = me.config['iconClass'];
                el.appendChild(icon);

                text = hui.Validator.getDocument().createElement('div');
                text.id = inputId + '_' + me.config['textSuffix'];
                text.className = me.config['textClass'];
                el.appendChild(text);
            }
        },

        /**
         * @name 在父元素的末尾取消提示信息
         * @private
         * @param {HTMLElement} input 控件元素.
         */
        cancelNotice: function (control) {
            var me = hui.Validator,
                input = me.getControl(control),
                father = input.parentNode;

            hui.Validator.removeClass(father, me.config['errorClass'] + ' ' + me.config['okClass'] + ' ' + me.config['waitingClass']);

            if (father.lastChild.className && father.lastChild.className.replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === 'validate') {
                father.removeChild(father.lastChild);
            }
        },
        hideError: function (control) {
            this.cancelNotice(control);
        },
        /**
         * @name 获取info区域的元素
         * @private
         * @param {HTMLElement} input 对应的input元素.
         * @return {HTMLElement}
         */
        getTextEl: function (input) {
            var me = this,
                elem,
                control = input,
                input = me.getControl(control);
            elem = hui.Validator.getDocument().getElementById(input.id + '_' + me.config['textSuffix']);

            return elem;
        },

        /**
         * @name 获取提示元素
         * @private
         * @param {HTMLElement} input 对应的input元素.
         * @return {HTMLElement}
         */
        getValidateElem: function (input) {
            var me = this,
                elem,
                control = input,
                input = me.getControl(control);
            elem = hui.Validator.getDocument().getElementById(input.id + '_' + me.config['suffix']);
            return elem;
        },
        /**
         * @name 获取提示元素
         * @private
         * @param {HTMLElement} input 对应的input元素.
         * @return {HTMLElement}
         */
        getSegElement: function (control, segId) {
            var elem = hui.Validator.getDocument().getElementById(segId);
            return elem;
        },
        /**
         * @name 验证规则
         * @private
         * @param {ui.Control} control 需要验证的控件.
         * @param {String} ruleName 验证规则的名称,格式rule:not_empty,preControl,nextControl.
         * 后面会根据preserveArgument是否为true决定是否及preControl,nextControl是否
         */
        applyRule: function (control, ruleName, show_error) {
            // 判断控件是否具有获取value的方法
            if (!control || (!control.getValue && control.value === null) || !ruleName) {
                return true;
            }

            var me = this,
                args = ruleName.split(','),
                rule = me.ruleMap[args[0]],
                error,
                errorText = '';

            var text = (control.getValue ? control.getValue(true) : control.value);
            text = text === undefined ? control.getMain().value : text;
            args[0] = text;

            // CheckBox
            if (control.type == 'checkbox') {
                text = control.getChecked() || control.checked;
                args[0] = text;
            }

            error = rule.validate.apply(control, args);

            // return 0 or 'SUCCESS'
            if (error === 0 || error === 'SUCCESS') { /*ok*/ }
            // return 'ERROR_NUMBER'
            else if (Object.prototype.toString.call(error) == '[object String]' && error !== '') {
                errorText = me.errorMsg[error];
            }
            // return ['ERROR_LENGTH_RANGE', min_length, max_length]
            else if (Object.prototype.toString.call(error) === '[object Array]') {
                errorText = hui.Validator.format(me.errorMsg[error[0]], error.splice(1, error.length));
            }
            else if (error !== 0) { //TODO:这种形式是要被历史遗弃的
                if ('object' == typeof rule.noticeText) {
                    errorText = rule.noticeText[error];
                }
                else {
                    errorText = rule.noticeText;
                }
            }

            // Force not show error.
            if (show_error !== 'not_show') {
                // return 0 or 'SUCCESS'
                if (error === 0 || error === 'SUCCESS') {
                    var showOK = rule.showOK || me.showOK;
                    showOK(control, errorText);
                }
                else {
                    var showError = rule.showError || me.showError;
                    showError(control, errorText);
                }
            }

            return !errorText;
        }
    };

    hui.Validator.getDocument = function (control) {
        var bocument = null;
        if (control && control.getDocument) {
            bocument = control.getDocument();
        }
        bocument = bocument || document;
        return bocument;
    };

    /**
     * @name 通用方法
     */
    hui.Validator.format = hui.util.format;
    hui.Validator.addClass = hui.util.addClass;
    hui.Validator.removeClass = hui.util.removeClass;
    hui.Validator.parseDate = hui.util.parseDate;

    /**
     * @name 验证规则集合
     * @private
     */
    hui.Validator.ruleMap = {
        'required': {
            validate: function (text) {
                if (!text || (Object.prototype.toString.call(text) == '[object String]' && String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '')) {
                    return 'ERROR_EMPTY';
                }
                return 'SUCCESS';
            }
        },

        'ext': {
            /**
             * @param {String} text 需要检查的文本内容.
             * @param {...*} var_args 合法的后缀名.
             */
            validate: function (text, var_args) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'ERROR_EMPTY';
                }

                var allowedExt = Array.prototype.slice.call(arguments, 1);
                var dotIndex = text.lastIndexOf('.');
                if (dotIndex == -1) {
                    return ['ERROR_EXT', allowedExt.join(',')];
                }

                var ext = text.substring(dotIndex + 1).toLowerCase();
                for (var i = 0, j = allowedExt.length; i < j; i++) {
                    if (allowedExt[i].toLowerCase() == ext) {
                        return 'SUCCESS';
                    }
                }

                return ['ERROR_EXT', allowedExt.join(',')];
            }
        },

        'regex': {
            validate: function (text, pattern, modifiers) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (!new RegExp(pattern, modifiers).test(text)) {
                    return 'ERROR_REGEX';
                }
                return 'SUCCESS';
            }
        },

        'int': {
            validate: function (text) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (isNaN(text - 0) || text.indexOf('.') >= 0) {
                    return 'ERROR_INT';
                }
                return 'SUCCESS';
            }
        },

        'number': {
            validate: function (text) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (isNaN(text - 0)) {
                    return 'ERROR_NUMBER';
                }
                return 'SUCCESS';
            }
        },

        'min': {
            validate: function (text, minValue, type) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (hui.Validator.parse(text, type) < hui.Validator.parse(minValue, type)) {
                    return [type === 'date' ? 'ERROR_MIN_DATE' : 'ERROR_MIN', minValue];
                }
                return 'SUCCESS';
            }
        },

        'gt': {
            validate: function (text, minValue, type) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (hui.Validator.parse(text, type) <= hui.Validator.parse(minValue, type)) {
                    return [type === 'date' ? 'ERROR_GT_DATE' : 'ERROR_GT', minValue];
                }
                return 'SUCCESS';
            }
        },

        'max': {
            validate: function (text, maxValue, type) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (hui.Validator.parse(text, type) > hui.Validator.parse(maxValue, type)) {
                    return [type === 'date' ? 'ERROR_MAX_DATE' : 'ERROR_MAX', maxValue];
                }
                return 'SUCCESS';
            }
        },

        'lt': {
            validate: function (text, maxValue, type) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (hui.Validator.parse(text, type) >= hui.Validator.parse(maxValue, type)) {
                    return [type === 'date' ? 'ERROR_LT_DATE' : 'ERROR_LT', maxValue];
                }
                return 'SUCCESS';
            }
        },

        'range': {
            validate: function (text, minValue, maxValue, type) {
                if (String(text).replace(/(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g, '') === '') {
                    return 'SUCCESS';
                }
                if (hui.Validator.parse(text, type) - hui.Validator.parse(maxValue, type) > 0 ||
                    hui.Validator.parse(text, type) - hui.Validator.parse(minValue, type) < 0) {
                    return ['ERROR_RANGE', minValue, maxValue];
                }
                return 'SUCCESS';
            }
        },

        'length': {
            validate: function (text, length) {
                if (text.length !== length) {
                    return ['ERROR_LENGTH', length];
                }
                return 'SUCCESS';
            }
        },

        'min_length': {
            validate: function (text, min_length) {
                if (text.length < min_length) {
                    return ['ERROR_MIN_LENGTH', min_length];
                }
                return 'SUCCESS';
            }
        },

        'max_length': {
            validate: function (text, max_length) {
                if (text.length > max_length) {
                    return ['ERROR_MAX_LENGTH', max_length];
                }
                return 'SUCCESS';
            }
        },

        'length_range': {
            validate: function (text, min_length, max_length) {
                if (text.length < min_length || text.length > max_length) {
                    return ['ERROR_LENGTH_RANGE', min_length, max_length];
                }
                return 'SUCCESS';
            }
        },

        'backend_error': {
            validate: function (text, control) {
                return ['ERROR_BACKEND', control.errorMessage];
            }
        }
        /****************************以上是通用验证规则************************/
    };

    /**
     * @name 验证规则集合
     * @public
     * @param {String} ruleName 规则名称
     * @param {Map} rule 规则内容
     */
    hui.Validator.setRule = function (ruleName, ruleContent, force) {
        if (!force && hui.Validator.ruleMap[ruleName]) {
            throw {
                title: 'hui.Validator.setRule() Error: ',
                name: 'rule "' + ruleName + '" exist.'
            };
        }
        else {
            hui.Validator.ruleMap[ruleName] = ruleContent;
        }
    };
    hui.Validator.getRule = function (ruleName) {
        return hui.Validator.ruleMap[ruleName];
    };

    hui.Validator.setRule('not_empty', {
        'validate': function (text) {
            if (text === null || text === undefined || text === '') {
                return 1;
            }
            return 0;
        },
        'noticeText': {
            1: '不能为空'
        }
    }, 'force');

    hui.util.importCssString([
        '.validate_error {color: red;}',
        '.validate_error .validate_text {border: 1px solid red;}',
        '.validate_ok {color: #00ff00;}',
        '.validate_waiting {color: blue;}'
    ].join('\n'));

});