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
 * @name Template模板管理类
 * @public
 * @author wanghaiyang
 * @date 2014/05/05
 */
hui.define('hui_template', [], function () {
    hui.Template = {
        /**
         * @name 解析前 originTargetContainer, 解析后 parsedTargetContainer
         */
        originTargetContainer: {},
        parsedTargetContainer: {},
        targetRule: /<!--\s*target:\s*([a-zA-Z0-9\.\-_]+)\s*-->/g,
        importRule: /<!--\s*import:\s*([a-zA-Z0-9\.\-_]+)\s*-->/g,
        /**
         * @name 解析模板字符串流[增加target]
         * @public
         * @param {String} tplStr 模板字符串流tpl:<!-- target:mergeTest -->hello #{myName}!
         * @param {Object|string...} opts 提供相应数据的对象或多个字符串
         * @returns {String} 格式化后的字符串
         */
        parseTemplate: function (tplStr, lazyParse) {
            var me = this,
                k,
                targetNameList,
                targetContentList,
                targetList,
                sep;

            //基本思路: 使用正则提取targetName与targetContent分别放入两个数组
            tplStr = !tplStr ? '' : String(tplStr);

            //坑爹的String.split(RegExp)有兼容性问题!!!
            //找到一个不重复的字符串做分隔符
            sep = String(Math.random()).replace('.', '');
            for (var i = 0; tplStr.indexOf(sep) > -1 && i < 1000; i++) {
                sep = String(Math.random()).replace('.', '');
            }
            if (tplStr.indexOf(sep) > -1) {
                throw new Error({
                    title: 'HUI Template Error: ',
                    name: 'Math.random()'
                });
            }

            targetList = {};
            targetNameList = tplStr.match(me.targetRule) || [],
                targetContentList = tplStr.replace(me.targetRule, sep).split(sep);

            //抛弃掉第一个<!-- target: XXX -->之前的内容
            if (targetContentList.length - targetNameList.length == 1) {
                targetContentList.shift();
            }
            if (targetContentList.length != targetNameList.length) {
                throw new Error({
                    title: 'HUI Template Error: ',
                    name: 'Methond "parseTemplate()" error.'
                });
            }

            for (var i = 0, len = targetNameList.length; i < len; i++) {
                k = targetNameList[i].replace(me.targetRule, '$1');
                targetList[k] = targetContentList[i];

                //存入全局target容器(parsedTargetContainer中的后面将会替换)
                me.originTargetContainer[k] = targetContentList[i];
            }

            if (lazyParse !== true) {
                me.parseAllTarget();
            }

            return targetList;
        },
        /**
         * @name 获取Target
         * @public
         * @param {String} targetName Target名字
         * @returns {String} 未解析的target
         */
        getTarget: function (targetName) {
            var me = this;
            if (targetName === null || targetName === '') return '';

            if (me.parsedTargetContainer[targetName] === undefined) {
                throw new Error('Target "' + targetName + '" not exist.');
            }

            return me.parsedTargetContainer[targetName];
        },
        /**
         * @name 依赖于me.originTargetContainer循环解析targetList中的target
         * @public
         * @param {String} tplStr 模板字符串流tpl:<!-- target:mergeTest -->hello #{myName}!
         * @param {Object|String...} opts 提供相应数据的对象或多个字符串
         * @returns {String} 格式化后的字符串
         */
        parseAllTarget: function () {
            var me = this,
                targetList = {};
            /**
             * 解析所有target
             */
            for (var i in me.originTargetContainer) {
                if (!i) continue;
                targetList[i] = me.originTargetContainer[i];
            }

            for (var i in me.originTargetContainer) {
                if (!i) continue;
                var v = me.originTargetContainer[i];
                for (var j in targetList) {
                    if (!j || i == j) continue;
                    //importRule
                    targetList[j] = targetList[j].replace(new RegExp('<!--\\s*import\\s*:\\s*(' + i + ')\\s*-->', 'g'), v);
                }
            }

            me.parsedTargetContainer = targetList;

            return targetList;
        },
        /**
         * @name 合并模板与数据
         * @public
         * @param {HTMLElement} targetContent  原始模板内容.
         * @param {Object}      model    数据模型
         * @return {String} 替换掉#{varName}变量后的模板内容.
         */
        merge: function (targetContent, model) {
            return hui.Template.parse(targetContent, model);
        },
        format: function (source, opts) {
            source = String(source);
            var data = Array.prototype.slice.call(arguments, 1),
                toString = Object.prototype.toString;
            if (data.length) {
                data = (data.length == 1 ?
                    /* IE 下 Object.prototype.toString.call(null) == '[object Object]' */
                    (opts !== null && (/\[object (Array|Object)\]/.test(toString.call(opts))) ? opts : data) : data);
                return source.replace(/#\{(.+?)\}/g, function (match, key) {
                    key = String(key).replace(/(^\s+|\s+$)/g, '');
                    var parts,
                        part,
                        cur,
                        replacer;

                    if (key.indexOf('(') !== -1) {
                        // #{Math.floor(user.age, user.birth)}
                        replacer = hui.runWithoutStrict(key, data);
                    }
                    else {
                        parts = hui.Template.overloadOperator(key).split('.');
                        cur = data;
                        part = parts.shift();
                        while (part && cur) {
                            cur = cur[part] !== undefined ? cur[part] : cur = undefined;
                            part = parts.shift();
                        }
                        replacer = cur;
                    }

                    if ('[object Function]' === toString.call(replacer)) {
                        replacer = replacer(key);
                    }
                    return (undefined === replacer ? '' : replacer);
                });
            }
            return source;
        },
        error: function (msg) {
            msg = 'Template: ' + msg;
            if (hui.window.console) {
                hui.window.console.log(msg);
            }
            else throw Error(msg);
        },
        varConvert: function (token, model, strMap, str) {
            var s2,
                value,
                c,
                m;
            model = model || {};

            for (var i = 0, ilen = token.length; i < ilen; i++) {
                s2 = token[i];
                if (s2 === ',') continue;

                value = s2[s2.length - 1];
                if (s2.length === 2 || value === '') {
                    throw new Error('Template syntax error: ' + s2 + ' in ' + str);
                }
                value = hui.Template.getExpValue(value, model, strMap);
                // Deal with a=b=, attention: won't want break s2, so use length-1 instead pop()
                for (var j = 0, jlen = s2.length; j < jlen - 1; j++) {
                    if (s2[j] !== '=') {
                        if (s2[j].length > 1 && s2[j].indexOf('.') !== -1) {
                            m = s2[j];
                            m = m.split('.').join('=.=').split('=');

                            c = hui.Template.expCalculate(m, model, strMap, 'keep_var');
                            c.parent[c.child] = value;
                        }
                        else {
                            model[s2[j]] = value;
                        }
                    }
                }
            }
            return model;
        },
        varTokenization: function (str) {
            var list,
                c,
                m,
                notValue = true,
                preQuot = -1,
                isJSON = false,
                preBracket = [],
                lineNum,
                s1 = [],
                s2 = [],
                s3 = [],
                t1 = [],
                t2 = [],
                s4;

            list = String(str).split('');
            for (var i = 0, ilen = list.length; i < ilen; i++) {
                c = list[i];

                // 单引或双引
                if (/^[\'\"]$/.test(c)) { //'
                    if (notValue === true && preQuot === -1) {
                        notValue = false;
                        preQuot = i;
                        t1.push(c);
                        continue;
                    }
                    // 值 !notValue == isValue
                    if (!notValue) {
                        // 前面反斜杠个数
                        lineNum = 0;
                        for (var j = i - 1; j > -1; j--) {
                            if (list[j] === '\\') {
                                lineNum++;
                            }
                            else {
                                j = -1;
                            }
                        }
                        // 个数为偶数且和开始引号相同
                        // 结束引号
                        if (lineNum % 2 === 0) {
                            if (list[preQuot] === c) {
                                t1.push(c);
                                s1.push('#{' + t2.length + '}');
                                t2.push(t1);
                                t1 = [];

                                notValue = true;
                                preQuot = -1;
                            }
                        }
                        else {
                            t1.push(c);
                        }
                    }
                    // 非值 notValue = true;
                    else {
                        // 开始引号
                        if (preQuot === -1) {
                            notValue = false;
                            preQuot = i;

                            t1.push(c);
                        }
                        // 结束引号
                        else if (list[preQuot] === c) {
                            notValue = true;
                            preQuot = -1;
                        }
                    }
                }
                else {
                    // is String value
                    if (!notValue) {
                        t1.push(c);
                    }
                    // 非值 notValue = true
                    else {
                        if (c === '{' || c === '[') {
                            isJSON = true;
                            preBracket.push(c);

                            s1.push(c);
                        }
                        else if (c === '}' || c === ']') {
                            if (preBracket[preBracket.length - 1] === (c === '}' ? '{' : '[')) {
                                preBracket.pop();
                            }
                            if (preBracket.length === 0) {
                                isJSON = false;

                                s1.push(c);
                            }
                        }
                        // 逗号
                        else if (!isJSON && c === ',') {
                            s2.push(s1);
                            s3.push(s2);
                            s3.push(',');
                            s1 = [];
                            s2 = [];
                        }
                        // 等号, 且不是 != , >= , <= , ==
                        else if ((c === '=' || c === '是') && list[i - 1] !== '不' && list[i - 1] !== '!' && list[i - 1] !== '>' &&
                            list[i - 1] !== '<' && list[i - 1] !== '=' && list[i + 1] !== '=') {
                            s2.push(s1);
                            s2.push('=');
                            s1 = [];
                        }
                        else if (c === '#' && list[i + 1] === '{') {
                            s1.push(' ');
                            for (var j = i + 2; j < ilen; j++) {
                                if (list[j] === '}') {
                                    i = j;
                                    break;
                                }
                                s1.push(list[j]);
                            }
                            s1.push(' ');
                        }
                        else {
                            s1.push(c);
                        }
                    }


                }
            }

            if (t1.join('')) {
                s1.push('#{' + t2.length + '}');
                t2.push(t1);
            }

            s2.push(s1);
            s3.push(s2);


            for (var i = 0, ilen = s3.length; i < ilen; i++) {
                s4 = s3[i];
                if (Object.prototype.toString.call(s4) === '[object Array]') {
                    for (var j = 0, jlen = s4.length; j < jlen; j++) {
                        if (Object.prototype.toString.call(s4[j]) === '[object Array]') {
                            s4[j] = s4[j].join('');
                        }
                        s4[j] = String(s4[j]).replace(/(^\s+|\s+$)/g, '');
                    }
                }
            }

            for (var i = 0, ilen = t2.length; i < ilen; i++) {
                c = t2[i];
                if (c[c.length - 1] === '"' || c[c.length - 1] === '\'') {
                    c.pop();
                }
                if (c[0] === '"' || c[0] === '\'') {
                    c.shift();
                }
                t2[i] = c.join('');
            }

            for (var i = 0, ilen = s3.length; i < ilen; i++) {
                c = s3[i];
                if (Object.prototype.toString.call(c) === '[object Array]') {
                    for (var j = 0, jlen = c.length; j < jlen; j++) {
                        m = c[j];
                        c[j] = hui.Template.overloadOperator(m);
                    }
                }
                else {
                    s3[i] = hui.Template.overloadOperator(c);
                }
            }

            return {
                token: s3,
                strMap: t2
            };
        },
        overloadOperator: function (str) {
            var opList = [
                '有', '.',
                '的', '.',
                '自加加', '++',
                '自减减', '--',
                '非', '!',
                '正', '+',
                '负', '-',
                '乘以', '*',
                '除以', '/',
                '求余', '%',
                '加上', '+',
                '减去', '-',
                '不大于', '<=',
                '不小于', '>=',
                '不等于', '!=',
                '不是', '!==',
                '恒等于', '===',
                '真的是', '===',
                '不恒等于', '!==',
                '大于', '>',
                '小于', '<',
                '等于', '==',
                '且', '&&',
                '或', '||',
                '实体', '{}',
                '数组', '[]'
            ];
            for (var i = 0, ilen = opList.length; i < ilen;) {
                str = str.split(opList[i++]).join(opList[i++]);
            }
            return str;
        },
        getExpValue: function (v1, model, strMap) {
            v1 = String(v1);
            strMap = strMap || [];
            var keyword = {
                'null': {
                    v: null
                },
                'undefined': {
                    v: undefined
                },
                'true': {
                    v: true
                },
                'false': {
                    v: false
                }
            };
            var value = v1,
                v = v1;
            // Number
            if (v.replace(/^[+\-]?(\d+\.)?\d+/g, '') === '' || ~'"\''.indexOf(v.substr(0, 1)) || ~'{['.indexOf(v.substr(0, 1)) ||
                keyword[v] ||
                v.replace(/^[a-zA-Z_]+[a-zA-Z0-9_]*/g, '') === '') {
                value = hui.Template.getKeyValue(v);
            }
            // Exp
            else {
                // != , >= , <= , ==
                var token1 = hui.Template.expTokenization(v, model);
                var token2 = hui.Template.expConvertBracket(token1, model, strMap);
                var token3 = hui.Template.expConvertTree(token2, model, strMap);
                value = hui.Template.expCalculate(token3, model, strMap);
            }
            // console.log(value);
            return value;
        },
        // <!-- if: a = 123 -->  =>  <!-- var: a = 123 --> <!-- if: a -->
        //hui.Template.expBuildTree(['w.a','&&','w.a','/','w.a'])
        expCalculate: function (list, model, strMap, keep_var) {
            if (!list.opr) {
                if (list.length === 1) {
                    if (Object.prototype.toString.call(list[0]) === '[object Array]') {
                        result = hui.Template.expCalculate(list[0], model, strMap, keep_var);
                    }
                    // a[aa]
                    else {
                        result = hui.Template.getKeyValue(list[0], model, strMap);
                    }
                    return result;
                }

                for (var i = 0, ilen = list.length; i < ilen; i++) {
                    if (hui.Template.expIsOperator(list[i])) {
                        list.opr = list[i];
                        break;
                    }
                }
            }

            var c, m, result, data;
            // var degree = {
            //     '.': 11,  '的': 11,'[': 11,']': 11,'(': 10,')': 10,'++': 9,'自加加': 9,'--': 9,'自减减': 9,'^!': 8,'非': 8,
            //     '^+': 8,'正': 8,'^-': 8,'负': 8,'*': 7,'乘以': 7,'/': 7,'除以': 7,'%': 7,'求余': 7,'+': 6,'加上': 6,'-': 6,
            //     '减去': 6,'<': 5,'小于': 5,'<=': 5,'不大于': 5,'>': 5,'大于': 5,'>=': 5,'不小于': 5,'==': 4,'等于': 4,'!=': 4,
            //     '不等于': 4,'===': 4,'恒等于': 4,'!==': 4,'不恒等于': 4,'&&': 3,'且': 3,'||': 2,'或': 2
            // };

            if (list.opr === '++' || list.opr === '--') {
                c = list[0] === '++' || list[0] === '--' ? list[1] : list[0];
                if (Object.prototype.toString.call(c) !== '[object Array]' && (!c || c.replace(/^[a-zA-Z_]+[a-zA-Z0-9_]*/g, '') !== '')) {
                    throw new Error('Syntax error: "++","--" in ' + hui.Template.format(list.join(' '), strMap));
                }
                c = c.join ? hui.Template.expCalculate(c, model, strMap, 'keep_var') : {
                    parent: model,
                    child: c
                };

                result = c.parent[c.child];
                c.parent[c.child] = result + (list.opr === '++' ? 1 : -1);
                result = list[0] === '++' || list[0] === '--' ? c.parent[c.child] : result;

            }
            else if (list.opr === '.') {
                for (var i = 0, ilen = list.length; i < ilen; i++) {
                    c = list[i];
                    if (Object.prototype.toString.call(c) === '[object Array]') {
                        c = hui.Template.expCalculate(c, model, strMap);
                    }
                    if (c && String(c).indexOf('#') === 0) {
                        c = strMap[c.replace(/(^#{|}$)/g, '')];
                    }
                    list[i] = c;
                }

                data = model;
                var ilen = list.length + (keep_var === 'keep_var' ? -1 : 0);

                for (var i = 0; i < ilen; i++) {
                    c = list[i];
                    if (!data) {
                        break;
                    }
                    data = data[c];
                    i++;
                }
                result = keep_var === 'keep_var' ? {
                    parent: data || {},
                    child: list[list.length - 1]
                } : data;
            }
            else {
                for (var i = 0, ilen = list.length; i < ilen; i++) {
                    c = list[i];
                    if (Object.prototype.toString.call(c) === '[object Array]') {
                        c = hui.Template.expCalculate(c, model, strMap);
                        list[i] = c;
                    }
                    else {
                        list[i] = hui.Template.expIsOperator(c) ? list[i] : hui.Template.getKeyValue(c, model, strMap);
                    }

                }

                if (list.opr === '!') {
                    result = list.pop();
                    for (var i = list.length - 1; i > -1; i--) {
                        result = !m;
                    }
                }
                else if (list.opr === '?') {
                    c = list[0];
                    if (c) {
                        result = list[2];
                    }
                    else {
                        result = list[4];
                    }
                }
                else if (list.opr === '||') {
                    result = false || list[0];
                    for (var i = 1, ilen = list.length; i < ilen && !result; i++) {
                        c = list[i];
                        if (c === '||' && !result) {
                            m = list[i + 1];
                            result = result || m;
                        }
                        i++;
                    }
                }
                else if (list.opr === '&&') {
                    result = true && list[0];
                    for (var i = 1, ilen = list.length; i < ilen && result; i++) {
                        c = list[i];
                        if (c === '&&' && result) {
                            m = list[i + 1];
                            result = result && m;
                        }
                        i++;
                    }
                }
                else if (list.opr === '!==' || list.opr === '===' || list.opr === '!=' || list.opr === '==') {
                    result = list[0];
                    for (var i = 1, ilen = list.length; i < ilen; i++) {
                        c = list[i];
                        m = list[i + 1];
                        if (c === '!==' || c === '!=') {
                            result = String(result) !== String(m);
                        }
                        else if (c === '===' || c === '==') {
                            result = String(result) === String(m);
                        }
                        i++;
                    }
                }
                else if (list.opr === '>' || list.opr === '>=' || list.opr === '<' || list.opr === '<=') {
                    result = list[0];
                    for (var i = 1, ilen = list.length; i < ilen; i++) {
                        c = list[i];
                        m = list[i + 1];
                        if (c === '>') {
                            result = result > m;
                        }
                        else if (c === '>=') {
                            result = result >= m;
                        }
                        else if (c === '<') {
                            result = result < m;
                        }
                        else if (c === '<=') {
                            result = result <= m;
                        }
                        i++;
                    }
                }
                else if (list.opr === '+' || list.opr === '-') {
                    if (list[0] === '+' || list[0] === '-') {
                        result = list.pop();
                        for (var i = list.length - 1; i > -1; i--) {
                            result = list[i] === '-' ? 0 - result : result;
                        }
                    }
                    else {
                        result = list[0];
                        for (var i = 1, ilen = list.length; i < ilen; i++) {
                            c = list[i];
                            m = list[i + 1];
                            if (c === '+') {
                                result = result + m;
                            }
                            else if (c === '-') {
                                result = result - m;
                            }
                            i++;
                        }
                    }
                }
                else if (list.opr === '*' || list.opr === '/' || list.opr === '%') {
                    result = list[0];
                    for (var i = 1, ilen = list.length; i < ilen; i++) {
                        c = list[i];
                        m = list[i + 1];
                        if (c === '*') {
                            result = result * m;
                        }
                        else if (c === '/') {
                            result = result / m;
                        }
                        else if (c === '%') {
                            result = result % m;
                        }
                        i++;
                    }
                }
            }

            return result;
        },
        getKeyValue: function (v1, model, strMap, keep_str) {
            v1 = String(v1);
            strMap = strMap || [];
            var keyword = {
                'null': {
                    v: null
                },
                'undefined': {
                    v: undefined
                },
                'true': {
                    v: true
                },
                'false': {
                    v: false
                }
            };
            var value = v1,
                v = v1;

            // Number
            if (v.replace(/^[+\-]?(\d+\.)?\d+/g, '') === '') {
                value = Number(v);
            }
            // String
            else if (~'"\''.indexOf(v.substr(0, 1))) {
                value = v.replace(/(^[\"\']|[\"\']$)/g, ''); //"
            }
            // JSON
            else if (~'{['.indexOf(v.substr(0, 1))) {
                v = v1.replace(/#{(\d+)}/g, function (match, key) {
                    return strMap[key];
                });
                v = v.replace(/@@/g, '#').replace(/@_/g, '@');

                value = (new Function('return ' + v))();
                value = value;
            }
            // null, undefined, true, false
            else if (keyword[v]) {
                value = keyword[v].v;
            }
            // #{0}
            else if (v.indexOf('#') > -1) {
                value = hui.Template.format(strMap[v.replace(/(^#{|}$)/g, '')], model);
                //value = v;
            }
            // model[v]
            else {
                //else if (v.replace(/^[a-zA-Z_]+[a-zA-Z0-9_]*/g, '') === '') {
                value = model[v];
            }

            return value;
        },
        // b.a !== #{0}, b[#{1}] !== #{2}, a+b
        expTokenization: function (str) {
            var list,
                pre,
                next,
                c,
                isOperator = false,
                s1 = [],
                s2 = [];

            list = String(str).split('');
            for (var i = 0, ilen = list.length; i < ilen; i++) {
                c = list[i];
                pre = ',' + String(list[i - 1]) + c + ',';
                next = String(list[i - 1]) + c + String(list[i + 1]);
                if ('[]()+-!*/%<=>&|?:,.'.indexOf(c) !== -1) {
                    isOperator = true;
                    if (',++,--,==,!=,>=,<=,&&,||,'.indexOf(pre) !== -1 || /\d\.\d/.test(next)) {
                        s1.push(c);
                    }
                    else {
                        if (s1.length) {
                            s2.push(s1);
                        }
                        s1 = [];
                        s1.push(c);
                    }
                }
                else if (c === '#') {
                    if (s1.length) {
                        s2.push(s1);
                    }
                    s1 = [];
                    for (var j = i; j < ilen; j++) {
                        s1.push(list[j]);
                        if (list[j] === '}') {
                            i = j;
                            break;
                        }
                    }
                    s2.push(s1);
                    s1 = [];
                }
                else if (c === ' ' || c === '\t') {
                    continue;
                }
                else if (list[i - 1] === '.' && '0123456789'.indexOf(c) !== -1) {
                    s1.push(c);
                }
                else {
                    if (isOperator) {
                        isOperator = false;
                        if (s1.length) {
                            s2.push(s1);
                        }
                        s1 = [];
                    }
                    s1.push(c);
                }
            }

            if (s1.length) {
                s2.push(s1);
            }

            for (var i = 0, ilen = s2.length; i < ilen; i++) {
                if (s2[i] && s2[i].join) {
                    s2[i] = s2[i].join('');
                }
            }

            return s2;
        },
        expConvertBracket: function (token, model, strMap) {
            //
            token = token || [];
            var root = [],
                parent = null,
                cur = root,
                list = [root],
                c;
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '(' || c === '[') {
                    parent = cur;
                    if (c === '[') {
                        cur.push('.');
                    }
                    cur = [];

                    parent.push(cur);
                    list.push(cur);

                }
                else if (list.length > 1 && c === ')' || c === ']') {
                    list.pop();
                    cur = parent || cur;
                    if (c === ']') {
                        //cur.push(c);
                    }
                    parent = list[list.length - 2];
                }
                else {
                    cur.push(c);
                }

            }

            return root;
        },
        expConvertTree: function (token, model, strMap) {
            for (var i = 0, ilen = token.length; i < ilen; i++) {
                if (Object.prototype.toString.call(token[i]) === '[object Array]') {
                    token[i] = hui.Template.expConvertTree(token[i]);
                    i = i;
                }
            }
            return hui.Template.expBuildTree(token);
        },
        expBuildTree: function (token) {
            token = token && token.length && token.join ? token : [];

            var degree = {
                '.': 11,
                '的': 11,
                '[': 11,
                ']': 11,
                '(': 10,
                ')': 10,
                '++': 9,
                '自加加': 9,
                '--': 9,
                '自减减': 9,
                '^!': 8,
                '非': 8,
                '^+': 8,
                '正': 8,
                '^-': 8,
                '负': 8,
                '*': 7,
                '乘以': 7,
                '/': 7,
                '除以': 7,
                '%': 7,
                '求余': 7,
                '+': 6,
                '加上': 6,
                '-': 6,
                '减去': 6,
                '<': 5,
                '小于': 5,
                '<=': 5,
                '不大于': 5,
                '>': 5,
                '大于': 5,
                '>=': 5,
                '不小于': 5,
                '==': 4,
                '等于': 4,
                '!=': 4,
                '不等于': 4,
                '===': 4,
                '恒等于': 4,
                '!==': 4,
                '不恒等于': 4,
                '&&': 3,
                '且': 3,
                '||': 2,
                '或': 2
            };
            var c,
                pre,
                nxt,
                cd,
                newtoken,
                n;
            // .
            token = token;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '.') {
                    cd = degree[c];
                    pre = newtoken[newtoken.length - 1];
                    // a.b
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(token[i + 1])) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                        }
                        else {
                            pre = [];
                            pre.push(newtoken.pop());
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.push(pre);
                        }
                    }
                    else {
                        throw new Error('SyntaxError: invalid Dot(.) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                }
                else {
                    newtoken.push(c);
                }
            }
            // ++, --
            token = newtoken;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '++' || c === '--') {
                    // i++
                    if (hui.Template.expIsOperand(token[i - 1]) && !hui.Template.expIsOperand(token[i + 1])) {
                        n = [];
                        n.push(newtoken.pop());
                        n.push(c);
                        n.lev = degree[c];
                        n.opr = c;
                        newtoken.push(n);
                    }
                    // ++i
                    else if (!hui.Template.expIsOperand(token[i - 1]) && hui.Template.expIsOperand(token[i + 1])) {
                        n = [];
                        n.push(c);
                        n.push(token[i + 1]);
                        n.lev = degree[c];
                        n.opr = c;
                        newtoken.push(n);
                        i++;
                    }
                    else {
                        throw new Error('SyntaxError: invalid Increment(++),Decrement(--) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                }
                else {
                    newtoken.push(c);
                }
            }
            // ! + -
            token = newtoken;
            newtoken = [token.pop()];
            for (var i = token.length - 1; i > -1; i--) {
                c = token[i];
                if ((c === '+' || c === '-' || c === '!') && (hui.Template.expIsOperator(token[i - 1]) || i === 0)) {
                    // ! ! ! + - - - + a
                    cd = degree['^' + c];
                    pre = newtoken[0];
                    if (hui.Template.expIsOperand(pre)) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.unshift(c);
                        }
                        else {
                            pre = [];
                            pre.unshift(newtoken.shift());
                            pre.unshift(c);
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.unshift(pre);
                        }
                    }
                    else {
                        throw new Error('SyntaxError: invalid Negative(+),Positive(-) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                }
                else {
                    newtoken.unshift(c);
                }
            }
            // * / %
            token = newtoken;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '*' || c === '/' || c === '%') {
                    cd = degree[c];
                    pre = newtoken[newtoken.length - 1];
                    // a.b
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(token[i + 1])) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                        }
                        else {
                            pre = [];
                            pre.push(newtoken.pop());
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.push(pre);
                        }
                    }
                    else {
                        throw new Error('SyntaxError: invalid MUL(*),DIV(/),(MOD)% operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                }
                else {
                    newtoken.push(c);
                }
            }
            // a + b
            token = newtoken;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '+' || c === '-') {
                    cd = degree[c];
                    pre = newtoken[newtoken.length - 1];
                    // a.b
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(token[i + 1])) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                        }
                        else {
                            pre = [];
                            pre.push(newtoken.pop());
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.push(pre);
                        }
                    }
                    else {
                        throw new Error('SyntaxError: invalid ADD(+) or SUB(-) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                }
                else {
                    newtoken.push(c);
                }
            }
            // a >= b
            token = newtoken;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '>' || c === '>=' || c === '<' || c === '<=') {
                    cd = degree[c];
                    pre = newtoken[newtoken.length - 1];
                    // a.b
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(token[i + 1])) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                        }
                        else {
                            pre = [];
                            pre.push(newtoken.pop());
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.push(pre);
                        }
                    }
                    else {
                        throw new Error('SyntaxError: invalid Morethan(>,>=),Lessthan(<=,<) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                }
                else {
                    newtoken.push(c);
                }
            }
            // a === b
            token = newtoken;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '==' || c === '!=' || c === '===' || c === '!==') {
                    cd = degree[c];
                    pre = newtoken[newtoken.length - 1];
                    // a.b
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(token[i + 1])) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                        }
                        else {
                            pre = [];
                            pre.push(newtoken.pop());
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.push(pre);
                        }
                    }
                    else {
                        throw new Error('SyntaxError: invalid Equal(==,!==) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                }
                else {
                    newtoken.push(c);
                }
            }
            // a && b
            token = newtoken;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '&&') {
                    cd = degree[c];
                    pre = newtoken[newtoken.length - 1];
                    // a.b
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(token[i + 1])) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                        }
                        else {
                            pre = [];
                            pre.push(newtoken.pop());
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.push(pre);
                        }
                    }
                    else {
                        throw new Error('SyntaxError: invalid AND(&&) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                }
                else {
                    newtoken.push(c);
                }
            }
            // a || b
            token = newtoken;
            newtoken = [];
            for (var i = 0, len = token.length; i < len; i++) {
                c = token[i];
                if (c === '||') {
                    cd = degree[c];
                    pre = newtoken[newtoken.length - 1];
                    // a.b
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(token[i + 1])) {
                        if (pre && pre.lev && pre.lev === cd) {
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                        }
                        else {
                            pre = [];
                            pre.push(newtoken.pop());
                            pre.push(c);
                            pre.push(token[i + 1]);
                            i++;
                            pre.lev = cd;
                            pre.opr = c;
                            newtoken.push(pre);
                        }
                    }
                    else {
                        throw new Error('SyntaxError: invalid OR(||) operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                }
                else {
                    newtoken.push(c);
                }
            }
            // a ? b : c
            token = newtoken;
            newtoken = [];
            for (var i = token.length - 1; i > -1; i--) {
                c = token[i];
                if (c === '?') {
                    // a ? b : c
                    cd = degree[c];
                    pre = token[i - 1];
                    if (hui.Template.expIsOperand(pre) && hui.Template.expIsOperand(newtoken[0]) && newtoken[1] === ':' && hui.Template.expIsOperand(newtoken[2])) {
                        nxt = [];
                        nxt.push(pre);
                        nxt.push(c);
                        nxt.push(newtoken.shift());
                        nxt.push(newtoken.shift());
                        nxt.push(newtoken.shift());
                        i--;

                        nxt.lev = cd;
                        nxt.opr = c;
                        newtoken.unshift(nxt);
                    }
                    else {
                        throw new Error('SyntaxError: invalid "A ? B : C"  operand in "' + token[i - 1] + ' ' + token[i] + ' ' + token[i + 1] + '"');
                    }
                }
                else {
                    newtoken.unshift(c);
                }
            }

            return newtoken;
        },
        expIsOperator: function (key) {
            key = key === null || key === undefined ? '' : key;
            if (Object.prototype.toString.call(key) === '[object Array]') {
                key = '';
            }

            key = String(key).replace(/(^\s+|\s+$)/g, '');
            var result = key.length < 4 && ',+,-,*,/,%,&&,||,!,==,===,!=,!==,>,<,>=,<=,.,[,],(,),'.indexOf(',' + key + ',') != -1;
            return result;
        },
        expIsOperand: function (v) {
            return v !== null && v !== undefined && !hui.Template.expIsOperator(v);
        },

        // Regular Expressions for parsing tags and attributes
        startTag: /^<!--\s*([A-Za-z0-9\u4e00-\u9fa5]+):(.*?)-->/,
        endTag: /^<!--\s*\/([A-Za-z0-9\u4e00-\u9fa5]+)\s*-->/,

        // Block Elements
        typeBlock: {
            'if': 1,
            'elif': 1,
            'else': 1,
            'for': 1
        },

        // Elements that you can':1,' intentionally':1,' leave open
        // (and which close themselves)
        typeCloseSelf: {
            'var': 1,
            'use': 1
        },
        typeEndAndStart: {
            'elif': 1,
            'else': 1
        },
        typeScope: {
            'for': 1,
            'use': 1,
            'html': 1
        },
        // Strict xml model!!
        parse: function (html, model, root) {
            var me = this;
            var stack = me.tokenization(html);
            if (root === undefined) {
                // 根节点 
                root = hui.Template.createElement('html', {
                    childNodes: [],
                    nodeType: 'startTag',
                    labelValue: ''
                });
                hui.Template.rootNode = root;
            }
            if (model) {
                root.scopeChain = root.scopeChain || {};
                for (var i in model) {
                    if (model.hasOwnProperty(i)) {
                        root.scopeChain[i] = model[i];
                    }
                }
            }
            me.treeConstruction(stack, root);

            var c = root;
            var result = '';
            var tplList = [];
            for (var j = 0, jlen = c.childNodes.length; j < jlen; j++) {
                tplList.push(me.mergeModel(c.childNodes[j]));
            }
            result = tplList.join('');

            return result;
            //me.domtree;
        },
        overloadTagName: function (node) {
            var tagNameList = [
                '安排', 'var',
                '定义', 'var',
                '设定', 'var',
                '如果', 'if',
                '如果结束', 'if',
                '假如', 'if',
                '假设', 'if',
                '假设结束', 'if',
                '又假设', 'elif',
                '又假如', 'elif',
                '否则', 'else',
                '循环', 'for',
                '循环结束', 'for'
            ];
            if (node) {
                for (var i = 0, ilen = tagNameList.length; i < ilen; i++) {
                    if (node.tagName === tagNameList[i++]) {
                        node.tagName = tagNameList[i];

                    }
                }
            }
            return node;
        },

        // Token serial
        tokenization: function (html) {
            var me = this,
                tokenserial = [],
                index,
                m, n,
                token,
                nodeValue,
                match,
                html = String(html);


            // <!--comment--> <html>1234</html>
            while (html) {
                // start tag
                if (html.indexOf('<!--') === 0 && me.startTag.test(html)) {
                    match = html.match(me.startTag);

                    token = {
                        tagName: match[1],
                        nodeValue: match[2],
                        labelValue: match[0],
                        nodeType: 'startTag'
                    };
                    token = hui.Template.overloadTagName(token);
                    token.nodeType = me.typeCloseSelf[token.tagName] ? 'selfClose' : (me.typeEndAndStart[token.tagName] ? 'typeEndAndStart' : token.nodeType);
                    tokenserial.push(token);

                    html = html.substring(match[0].length);
                }
                // end tag
                else if (html.indexOf('<!--') === 0 && me.endTag.test(html)) {
                    match = html.match(me.endTag);

                    token = {
                        tagName: match[1],
                        nodeType: 'endTag'
                    };
                    tokenserial.push(hui.Template.overloadTagName(token));

                    html = html.substring(match[0].length);
                }
                // Comment
                else if (html.indexOf('<!--') === 0) {
                    m = html.indexOf('<!--');
                    n = html.indexOf('-->', m + 4);
                    n = n == -1 ? html.length : n;
                    nodeValue = html.substring(m + 4, n);
                    token = {
                        tagName: 'comment',
                        nodeValue: nodeValue,
                        labelValue: nodeValue,
                        nodeType: 'selfClose'
                    };
                    tokenserial.push(hui.Template.overloadTagName(token));

                    html = html.substring(0, m) + html.substring(n + 3, html.length);
                }
                // text
                else {
                    m = html.indexOf('<!--', 1);
                    index = m == -1 ? html.length : m;
                    nodeValue = html.substring(0, index);

                    token = {
                        tagName: 'nodetext',
                        nodeValue: nodeValue,
                        labelValue: nodeValue,
                        nodeType: 'selfClose'
                    };
                    tokenserial.push(hui.Template.overloadTagName(token));
                    html = html.substring(index, html.length);
                }
            }

            return tokenserial;
        },
        treeConstruction: function (tokens, parentNode) {
            var me = this,
                domtree = parentNode || hui.Template.rootNode,
                curentParent = domtree,
                token,
                elem,
                parentElem;
            for (var i = 0, len = tokens.length; i < len; i++) {
                token = tokens[i];

                if (token.nodeType == 'selfClose') {
                    elem = me.createElement(token.tagName, token);
                    curentParent.childNodes.push(elem);
                    // elem.parentNode = curentParent.getGUID();
                    elem.parentNode = curentParent;
                }
                else if (token.nodeType == 'startTag') {
                    // 'if,elif,else' is special.
                    if (token.tagName == 'if') {
                        elem = me.createElement('ifif', {});
                        curentParent.childNodes.push(elem);
                        // elem.parentNode = curentParent.getGUID();
                        elem.parentNode = curentParent;
                        elem.childNodes = [];
                        curentParent = elem;
                    }

                    elem = me.createElement(token.tagName, token);
                    curentParent.childNodes.push(elem);
                    // elem.parentNode = curentParent.getGUID();
                    elem.parentNode = curentParent;

                    // Not empty tag
                    if (!me.typeCloseSelf[token.tagName]) {
                        elem.childNodes = [];
                        curentParent = elem;
                    }
                }
                else if (token.nodeType == 'endTag') {
                    if (!me.typeCloseSelf[token.tagName]) {

                        if (token.tagName == curentParent.tagName) {
                            curentParent = curentParent.parentNode;
                        }
                        else if (token.tagName == 'if' && ~',if,elif,else,'.indexOf(',' + curentParent.tagName)) {
                            parentElem = curentParent.parentNode;
                            if (parentElem.tagName == 'ifif') {
                                curentParent = parentElem.parentNode;
                            }
                        }
                        // Only deal with typeBlock!
                        else if (me.typeBlock[token.tagName]) {
                            parentElem = curentParent;
                            while (parentElem) {
                                if (parentElem.tagName == token.tagName) {
                                    curentParent = parentElem.parentNode;
                                }
                                else {
                                    parentElem = parentElem.parentNode;
                                }
                            }
                        }
                    }
                }
                else if (token.nodeType == 'typeEndAndStart') {
                    if (me.typeEndAndStart[token.tagName]) {
                        if (~',if,elif,'.indexOf(',' + curentParent.tagName + ',') && ~',elif,else,'.indexOf(',' + token.tagName)) {
                            curentParent = curentParent.parentNode;
                        }

                        elem = me.createElement(token.tagName, token);
                        curentParent.childNodes.push(elem);
                        // elem.parentNode = curentParent.getGUID();
                        elem.parentNode = curentParent;

                        // Not empty tag
                        if (!me.typeCloseSelf[token.tagName]) {
                            elem.childNodes = [];
                            curentParent = elem;
                        }
                    }
                }
            }
            return domtree;

        },
        createElement: function (tagName, options) {
            var me = this,
                clazz = hui.Template.NodeElement,
                elem = new clazz();

            options = options || {};
            options.tagName = tagName;

            for (var i in options) {
                elem[i] = options[i];
            }
            if (me.typeScope[String(tagName).toLowerCase()]) {
                elem.scopeChain = elem.scopeChain || {};
            }
            return elem;
        },
        mergeModel: function (nodeItem) {
            var me = this,
                str,
                k,
                v,
                c,
                list,
                tplList,
                model,
                result;
            if (nodeItem && nodeItem.tagName) {
                var tagName = String(nodeItem.tagName).toLowerCase();

                if (tagName === 'var') {
                    str = nodeItem.nodeValue;
                    list = hui.Template.varTokenization(str);
                    result = '';
                    model = nodeItem.getScopeChainModel();
                    hui.Template.varConvert(list.token, model, list.strMap, str);
                    nodeItem.updateScopeChainModel(model);
                }
                else if (tagName === 'ifif') {
                    model = nodeItem.getScopeChainModel();
                    result = '';
                    for (var i = 0, ilen = nodeItem.childNodes.length; i < ilen; i++) {
                        c = nodeItem.childNodes[i];
                        if (c.tagName === 'else') {
                            tplList = [];
                            for (var j = 0, jlen = c.childNodes.length; j < jlen; j++) {
                                tplList.push(me.mergeModel(c.childNodes[j]));
                            }
                            result = tplList.join('');
                            break;
                        }
                        else {
                            k = hui.Template.varTokenization(c.nodeValue);
                            var k2 = hui.Template.getExpValue(k.token[0][0], model, k.strMap);
                            if (k2) {
                                tplList = [];
                                for (var j = 0, jlen = c.childNodes.length; j < jlen; j++) {
                                    tplList.push(me.mergeModel(c.childNodes[j]));
                                }
                                result = tplList.join('');
                                break;
                            }
                        }
                    }
                }
                else if (tagName === 'for') {
                    str = nodeItem.nodeValue;
                    var scopeChain = nodeItem.scopeChain;
                    model = nodeItem.getScopeChainModel();

                    v = str.split(' in ');
                    k = v[0].replace(/(^\s+|\s+$)/g, '').replace(/(^#{|}$)/g, '');
                    list = model[v[1].replace(/(^\s+|\s+$)/g, '').replace(/(^#{|}$)/g, '')];

                    if (Object.prototype.toString.call(list) !== '[object Array]') {
                        throw new Error('SyntaxError: invalid "list" operand in "' + str + '"');
                    }

                    c = nodeItem;
                    result = '';
                    tplList = [];
                    for (var i in list) {
                        if (list.hasOwnProperty(i)) {
                            scopeChain[k] = model[k] = list[i];
                        }
                        for (var j = 0, jlen = c.childNodes.length; j < jlen; j++) {
                            tplList.push(me.mergeModel(c.childNodes[j]));
                        }
                    }
                    result = tplList.join('');
                    return result;
                }
                /**
                '<!-- use: item(main=${p.name}, sub=${p.email}) -->',
                '<!-- target: item --><li>${main}[${sub}]</li>'
                */
                else if (tagName === 'use') {
                    str = nodeItem.nodeValue.replace(/(^\s+|\s+$)/g, '');
                    model = nodeItem.getScopeChainModel();
                    nodeItem.childNodes = [];

                    var varStr = str.substring(str.indexOf('(') + 1, str.lastIndexOf(')')),
                        targetName = str.substring(0, str.indexOf('(')),
                        targetContent = hui.Template.getTarget(targetName);
                    //varStr = hui.Template.format(varStr, model);
                    me.parse('<!--var:' + varStr + '-->', null, nodeItem);
                    result = me.parse(targetContent, null, nodeItem);
                }
                else if (tagName === 'nodetext') {
                    str = nodeItem.nodeValue;
                    model = nodeItem.getScopeChainModel();
                    result = hui.Template.format(str, model);
                }
                else {
                    result = nodeItem.labelValue;
                }
            }
            return result;
        }

    };

    hui.Template.NodeElement = function (options) {
        this.nodeValue = '';
        this.guid = hui.Template.NodeElement.makeGUID();
    };
    hui.Template.NodeElement.prototype = {
        getGUID: function () {
            var me = this;
            return me.guid;
        },
        getScopeChain: function () {
            var me = this,
                parent = me,
                result = [],
                typeScope = hui.Template.typeScope;
            while (parent) {
                if (typeScope[String(parent.tagName).toLowerCase()]) {
                    result.unshift(parent.scopeChain);
                }
                parent = parent.parentNode;
            }
            return result;
        },
        getScopeChainModel: function () {
            var me = this,
                list = me.getScopeChain(),
                model = {};
            for (var j = list.length - 1; j > -1; j--) {
                for (var i in list[j]) {
                    if (!model.hasOwnProperty(i)) {
                        model[i] = list[j][i];
                    }
                }
            }
            return model;
        },
        updateScopeChainModel: function (model) {
            var me = this,
                list = me.getScopeChain();
            for (var i in model) {
                if (model.hasOwnProperty(i)) {
                    for (var j = list.length - 1; j > -1; j--) {
                        if (list[j].hasOwnProperty(i)) {
                            list[j][i] = model[i];
                            j = -1;
                            i = undefined;
                        }
                    }
                    if (i !== undefined) {
                        list[list.length - 1][i] = model[i];
                    }
                }
            }

        }
    };
    /**
     * @name 获取唯一id
     * @public
     * @return {String}
     */
    hui.Template.NodeElement.makeGUID = (function () {
        var guid = 1000; // 0 -> root
        return function () {
            return String('tpl_' + guid++);
        };
    })();

    hui.format = hui.Template.format;
});