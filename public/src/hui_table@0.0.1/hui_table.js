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
 * @name 表格控件
 * @public
 * @author haiyang5210
 * @date 2014-11-14 23:32
 * @param {Object} options 控件初始化参数.
 * @example 
 <div ui="type:'Table',formName:'skill_list',fields:'&listTable',datasource:'&listData',sortable:true,size:{width:200}"></div>

     window.listTable = [{
        width: 100,
        title: '技能',
        sortable: true,
        field: 'index',
        content: function (item) {
            return item['skill'];
        }
    }, {
        width: 40,
        title: '答对',
        sortable: true,
        field: 'correct',
        content: function (item) {
            return item['correct'];
        }
    }, {
        width: 40,
        title: '得分',
        sortable: true,
        field: 'score',
        content: function (item) {
            return item['score'];
        }
    }];
    window.listData = [{
        'skill': 'html',
        'correct': 2,
        'score': 40
    }, {
        'skill': 'css',
        'correct': 2,
        'score': 40
    }];
 */
hui.define('hui_table', ['hui_util', 'hui_control'], function () {
    hui.Table = function (options, pending) {
        this.isFormItem = false; // 注：getParamMap时不需要处理table
        hui.Table.superClass.call(this, options, 'pending');
        
        this.noDataHtml = this.noDataHtml || '';
        this.setFields(this.fields);

        //进入控件处理主流程!
        if (pending != 'pending') {
            this.enterControl();
        }
    };

    hui.Table.prototype = {
        /**
         * @name dom表格起始的html模板
         * @private
         */
        getTplTablePrefix: function (argument) {
            return '<table cellpadding="0" cellspacing="0" border="0" width="#{0}" control="#{1}">';
        },
        /**
         * @name 默认的onclick事件执行函数, 不做任何事，容错
         * @public
         */
        onclick: new Function(),
        /**
         * @name 获取table主区域的html
         * @private
         * @return {String}
         */
        getMainHtml: function () {
            var me = this;

            return hui.Control.format(
                me.tplTable,
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
            hui.Table.superClass.prototype.render.call(this);
            var me = this,
                main = me.getMain();

            if (!me._fields) {
                return;
            }
            // me.setInnerHTML(me, me.getMainHtml());
            me.setSize();
            // 如果未绘制过，初始化main元素
            if (!me.isRendered) {
                me._width = me.getWidth();
                me.initColsWidth();
                main.style.width = me._width + 'px';

                me.renderHead(); // 绘制表格头
                me.renderBody(); // 绘制列表
            }

            me.isRendered = true;
        },

        /**
         * @name 初始化列宽
         * @private
         */
        initColsWidth: function () {
            var me = this,
                canExpand = [],
                leaveAverage,
                leftWidth,
                fields = me._fields,
                field,
                len = fields.length,
                offset,
                width;

            me.colsWidth = [];

            // 减去边框的宽度
            leftWidth = me._width - len - 2;

            // 读取列宽并保存
            for (var i = 0; i < len; i++) {
                field = fields[i];
                width = parseInt(field.width, 10);
                leftWidth -= width;
                me.colsWidth.push(width);
                if (!field.stable) {
                    canExpand.push(i);
                }
            }

            // 根据当前容器的宽度，计算可拉伸的每列宽度
            len = canExpand.length;
            leaveAverage = Math.floor(leftWidth / len);
            for (var i = 0; i < len; i++) {
                offset = Math.abs(leftWidth) > Math.abs(leaveAverage) ? leaveAverage : leftWidth;

                leftWidth -= offset;
                me.colsWidth[canExpand[i]] += offset;
            }
        },

        /**
         * @name 获取表格所在区域宽度
         * @private
         * @return {number}
         */
        getWidth: function () {
            var me = this,
                width;
            // FIXME 有可能算出的width为0
            var rulerDiv = document.createElement('div'),
                parent = me.getMain();
            rulerDiv.innerHTML = '&nbsp;';
            parent.appendChild(rulerDiv);
            width = rulerDiv.offsetWidth;
            parent.removeChild(rulerDiv);
            if (!width) {
                width = me.size && me.size.width ? me.size.width : 200;
            }

            return width;
        },
        /**
         * @name 第一列的多选框
         * @private
         */
        checkboxField: function () {
            return {
                width: 30,
                stable: true,
                select: true,
                title: function () {
                    return '<input type="checkbox" id="' + this.getId('selectAll') + '" onclick="' + 'hui.Control.getById(\'' + this.id + '\').toggleSelectAll()' + '" />';
                },
                content: function (item, index) {
                    return '<input type="checkbox" id="' + this.getId('multiSelect') + index + '" onclick="' + 'hui.Control.getById(\'' + this.id + '\').rowCheckboxClick(' + index + ')' + '" />';
                }
            };
        },

        /**
         * @name 第一列的单选框
         * @private
         */
        radioboxField: function () {
            return {
                width: 30,
                stable: true,
                title: '&nbsp;',
                select: true,
                content: function (item, index) {
                    var id = this.getId('singleSelect');
                    return '<input type="radio" id="' + id + index + '" name="' + id + '" onclick="' + 'hui.Control.getById(\'' + this.id + '\').selectSingle(' + index + ');' + 'var e=arguments[0]||window.event;if(e.stopPropagation){e.stopPropagation();}else{e.cancelBubble=true;}" />';
                }
            };
        },
        /**
         * @name 初始化表格的字段
         * @protected
         * @param {Array} fields 字段数组.
         */
        setFields: function (fields) {
            if (!fields) {
                return;
            }
            // 避免刷新时重新注入
            var _fields = fields.slice(0),
                len = _fields.length;
            while (len--) {
                if (!_fields[len]) {
                    _fields.splice(len, 1);
                }
            }
            this._fields = _fields;

            if (!this.select) {
                return;
            }
            switch (String(this.select).toLowerCase()) {
            case 'multi':
                _fields.unshift(this.checkboxField());
                break;
            case 'single':
                _fields.unshift(this.radioboxField());
                break;
            }
        },
        /**
         * @name 获取列表体容器素
         * @public
         * @return {HTMLElement}
         */
        getBody: function () {
            return hui.g(this.getId('body'));
        },
        /**
         * @name 获取列表头容器元素
         * @public
         * @return {HTMLElement}
         */
        getHead: function () {
            return hui.g(this.getId('head'));
        },
        /**
         * @name 获取checkbox选择列表格头部的checkbox表单
         * @private
         * @return {HTMLElement}
         */
        getHeadCheckbox: function () {
            return hui.g(this.getId('selectAll'));
        },
        onselect: function (index) {},
        /**
         * @name 行的checkbox点击时间处理函数
         * @private
         */
        rowCheckboxClick: function (index) {
            if (this.selectMode != 'line') {
                this.selectMulti(index);
            }
            else {
                this.preSelectIndex = index;
            }
        },
        /**
         * @name 根据checkbox是否全部选中，更新头部以及body的checkbox状态
         * @private
         * @param {number} index 需要更新的body中checkbox行，不传则更新全部.
         */
        selectMulti: function (index) {
            var me = this,
                inputs = me.getBody().getElementsByTagName('input'),
                currentIndex = 0,
                allChecked = me,
                len = inputs.length,
                selectAll = me.getHeadCheckbox(),
                selected = [],
                selectedClass = me.getClass('row-selected'),
                cbIdPrefix = me.getId('multiSelect'),
                input, inputId, row,
                updateAll = !index;

            for (var i = 0; i < len; i++) {
                input = inputs[i];
                inputId = input.id;
                if (input.getAttribute('type') == 'checkbox' && inputId && inputId.indexOf(cbIdPrefix) >= 0) {
                    // row = me.getRow(currentIndex); // add speed
                    if (updateAll) {
                        row = input.parentNode;
                        while (1) {
                            if (row.tagName == 'DIV') {
                                break;
                            }
                            row = row.parentNode;
                        }
                    }

                    if (!input.checked) {
                        allChecked = false;

                        updateAll && hui.Control.removeClass(row, selectedClass); // add speed
                    }
                    else {
                        selected.push(currentIndex);
                        updateAll && hui.Control.addClass(row, selectedClass);
                    }
                    currentIndex++;
                }
            }

            me.selected = selected;
            me.onselect(selected);
            if (!updateAll) {
                row = me.getRow(index);
                input = hui.g(cbIdPrefix + index);
                if (input.checked) {
                    hui.Control.addClass(row, selectedClass);
                }
                else {
                    hui.Control.removeClass(row, selectedClass);
                }
            }
            selectAll.checked = allChecked;
        },
        /**
         * @name 单选选取
         * @private
         * @param {number} index 选取的序号.
         */
        selectSingle: function (index) {
            var me = this,
                selectedClass = me.getClass('row-selected'),
                selectedIndex = me.selected[0];

            if (me.onselect(index) !== false) {
                if ('number' == typeof selectedIndex) {
                    hui.Control.removeClass(me.getRow(selectedIndex), selectedClass);
                }

                me.selected = [index];
                hui.Control.addClass(me.getRow(index), selectedClass);
            }
        },
        /**
         * @name 全选/不选 所有的checkbox表单
         * @private
         */
        toggleSelectAll: function () {
            this.selectAll(this.getHeadCheckbox().checked);
        },
        /**
         * @name 更新所有checkbox的选择状态
         * @private
         * @param {boolean} checked 是否选中.
         */
        selectAll: function (checked) {
            var inputs = this.getBody().getElementsByTagName('input'),
                len = inputs.length,
                i = 0,
                index = 0,
                selected = [],
                selectedClass = this.getClass('row-selected'),
                input, inputId;

            for (; i < len; i++) {
                input = inputs[i];
                inputId = input.id;
                if (input.getAttribute('type') == 'checkbox' && inputId && inputId.indexOf('multiSelect') > 0) {
                    inputs[i].checked = checked;

                    if (checked) {
                        selected.push(index);
                        hui.Control.addClass(this.getRow(index), selectedClass);
                    }
                    else {
                        hui.Control.removeClass(this.getRow(index), selectedClass);
                    }

                    index++;
                }
            }
            this.selected = selected;
            this.onselect(selected);
        },
        getSelected: function () {
            var me = this,
                selected = me.selected,
                datasource = me.datasource,
                result = [];
            for (var i = 0, len = selected.length; i < len; i++) {
                result[i] = datasource[selected[i]];
            }
            return result;
        },
        /**
         * @name 绘制表格头
         * @private
         */
        renderHead: function () {
            var me = this,
                type = 'head',
                head = hui.g(me.getId(type));

            if (me.noTitle) {
                return;
            }

            if (!head) {
                head = document.createElement('div');
                head.id = me.getId(type);
                head.className = me.getClass(type);
                me.getMain().appendChild(head);
            }

            head.style.width = (me._width - 1) + 'px';
            head.innerHTML = me.getHeadHtml();
        },
        /**
         * @name 获取表格头的html
         * @private
         * @return {string}
         */
        getHeadHtml: function () {
            var me = this,
                fields = me._fields,
                len = fields.length,
                html = [],
                i, field, title,
                thCntrClass = me.getClass('thcntr'),
                thTextClass = me.getClass('thtext'),
                sortClass = me.getClass('thsort'),
                selClass = me.getClass('thsel'),
                contentTpl = '<div class="#{0}">#{1}</div>#{2}',
                contentHtml,
                orderClass,
                sortIconHtml,
                sortable,
                tipHtml,
                currentSort;


            // 拼装html
            html.push('<div class="' + me.getClass('row') + '">');
            html.push(hui.Control.format(me.getTplTablePrefix(), me._width - 2, me.id, (me.cellpadding || 0), (me.cellspacing || 0)));
            html.push('<tr>');
            for (i = 0; i < len; i++) {
                field = fields[i];
                title = field.title;
                sortable = (me.sortable && field.sortable);
                currentSort = (sortable && field.field && field.field == me.orderBy);

                // 计算排序图标样式
                sortIconHtml = '';
                orderClass = '';
                if (sortable) {
                    if (currentSort) {
                        orderClass = ' ' + me.getClass('th' + me.order) + ' ' + me.getClass('thcntr_sort');
                    }
                    sortIconHtml = hui.Control.format(me.getTplSortIcon(),
                        sortClass);
                }

                // 计算内容html
                // 如果通过function制定title，则不绘制排序小图标
                if ('function' == typeof title) {
                    contentHtml = title.call(me);
                    sortIconHtml = '';
                }
                else {
                    contentHtml = title || '';
                }
                contentHtml = hui.Control.format(contentTpl,
                    thTextClass,
                    contentHtml,
                    sortIconHtml);
                html.push(
                    hui.Control.format('<th id="#{0}" index="#{1}" #{2} style="width:#{3}px"><div class="#{4}">#{5} #{6}</div></th>',
                        this.getTitleCellId(i),
                        i,
                        sortAction(field, i),
                        me.colsWidth[i],
                        thCntrClass + orderClass + (field.select ? ' ' + selClass : ''),
                        contentHtml,
                        tipHtml
                    )
                );
            }
            html.push('</tr></table></div>');
            return html.join('');

            /**
             * @name 获取表格排序的单元格预定义属性html
             * @private
             * @internal
             * @return {string}
             */
            function sortAction(field, index) {
                if (me.sortable && field.sortable) {
                    return hui.Control.format(
                        ' onmouseover="#{0}" onmouseout="#{1}" onclick="#{2}" sortable="1"',
                        'hui.Control.getById(\'' + me.id + '\').titleOverHandler(this)',
                        'hui.Control.getById(\'' + me.id + '\').titleOutHandler(this)',
                        'hui.Control.getById(\'' + me.id + '\').titleClickHandler(this)'
                    );
                }

                return '';
            }
        },

        /**
         * @name 获取表格头单元格的id
         * @private
         * @param {number} index 单元格的序号.
         * @return {string}
         */
        getTitleCellId: function (index) {
            return this.getId('titleCell') + index;
        },


        getTplSortIcon: function () {
            return '<div class="#{0}"></div>';
        },
        tplTipIcon: function () {
            return '<div class="#{0}" #{1}></div>';
        },

        /**
         * @name 表格头单元格鼠标移入的事件handler
         * @private
         * @param {HTMLElement} cell 移出的单元格.
         */
        titleOverHandler: function (cell) {
            this.sortReady = 1;
            hui.Control.addClass(cell.firstChild, this.getClass('thcntr-hover'));
        },

        /**
         * @name 表格头单元格鼠标移出的事件handler
         * @private
         * @param {HTMLElement} cell 移出的单元格.
         */
        titleOutHandler: function (cell) {
            this.sortReady = 0;
            hui.Control.removeClass(cell.firstChild, this.getClass('thcntr-hover'));
        },
        /**
         * @name 表格排序事件handler及默认排序方法
         * @private
         * @param {String} field 排序列.
         * @param {String} order 升降序asc/desc.
         */
        onsort: function (field, order) {},
        sort: function (field, order) {
            var me = this,
                m, n;
            me.datasource.sort(function (a, b) {
                m = String(a[field] || '').toLowerCase();
                n = String(b[field] || '').toLowerCase();
                if (parseInt(m) + parseInt(n) > 0) {
                    m = parseInt(m);
                    n = parseInt(n);
                }
                return order == 'asc' ? m <= n : m >= n;
            });
            me.sorted = true;
        },

        /**
         * @name 表格内容点击的事件handler
         * @private
         * @param {Number} index 点击的行.
         */
        bodyClickHandler: function (cell) {},
        /**
         * @name 表格头单元格点击的事件handler
         * @private
         * @param {HTMLElement} cell 点击的单元格.
         */
        titleClickHandler: function (cell) {
            if (this.sortReady) { // 避免拖拽触发排序行为
                var me = this,
                    field = me._fields[cell.getAttribute('index')].field,
                    orderBy = me.orderBy,
                    order = me.order;

                if (orderBy == field) {
                    order = (!order || order == 'asc') ? 'desc' : 'asc';
                }
                else {
                    order = 'desc';
                }

                me.sorted = false;
                me.order = order;
                me.orderBy = field;
                if (me.onsort) {
                    me.onsort(field, order);
                }
                if (!me.sorted) {
                    me.sort(field, order);
                }
                me.renderHead();
                me.renderBody();
            }
        },

        /**
         * @name 重置表头样式
         * @private
         */
        resetHeadStyle: function () {
            var ths = this.getHead().getElementsByTagName('th'),
                len = ths.length,
                th;

            while (len--) {
                th = ths[len];
                hui.Control.removeClass(th.firstChild, this.getClass('thcntr_sort'));
            }
        },

        /**
         * @name 绘制表格主体
         * @private
         */
        renderBody: function () {
            var me = this,
                type = 'body',
                id = me.getId(type),
                list = hui.g(id),
                style;

            if (!list) {
                list = document.createElement('div');
                list.id = id;
                list.className = me.getClass(type);

                if (me.bodyHeight) {
                    style = list.style;
                    style.height = me.bodyHeight + 'px';
                    style.overflowX = 'hidden';
                    style.overflowY = 'auto';
                }
                me.getMain().appendChild(list);
            }

            list.style.width = (me._width - 2) + 'px';
            list.innerHTML = me.getBodyHtml();
        },

        /**
         * @name 获取表格体的单元格id
         * @protected
         * @param {number} rowIndex 当前行序号.
         * @param {number} fieldIndex 当前字段序号.
         * @return {string}
         */
        getBodyCellId: function (rowIndex, fieldIndex) {
            return this.getId('cell') + rowIndex + '_' + fieldIndex;
        },

        /**
         * @name 获取表格主体的html
         * @private
         * @return {string}
         */
        getBodyHtml: function () {
            var data = this.datasource || [],
                dataLen = data.length,
                html = [],
                i, item;

            if (!dataLen) {
                return this.noDataHtml;
            }

            for (i = 0; i < dataLen; i++) {
                item = data[i];
                html.push(this.getRowHtml(item, i));
            }

            return html.join('');
        },

        tplRowPrefix: function () {
            return '<div id="#{0}" class="#{1}" onmouseover="#{2}" onmouseout="#{3}" onclick="#{4}">';
        },

        /**
         * @name 获取表格行的html
         * @protected
         * @param {Object} data 当前行的数据.
         * @param {number} index 当前行的序号.
         * @return {string}
         */
        getRowHtml: function (data, index) {
            var me = this,
                html = [],
                fields = me._fields,
                fieldLen = fields.length,
                colWidth,
                content,
                tdCntrClass = me.getClass('tdcntr'),
                tdBreakClass = me.getClass('tdbreak'),
                tdClass,
                contentHtml,
                field;

            html.push(hui.Control.format(me.tplRowPrefix(),
                    me.getId('row') + index,
                    me.getClass('row'),
                    'hui.Control.getById(\'' + me.id + '\').rowOverHandler( ' + index + ')',
                    'hui.Control.getById(\'' + me.id + '\').rowOutHandler(  ' + index + ')',
                    'hui.Control.getById(\'' + me.id + '\').rowClickHandler(' + index + ')'
                ),
                hui.Control.format(me.getTplTablePrefix(), me._width - 2, me.id));

            for (var i = 0; i < fieldLen; i++) {
                field = fields[i];
                content = field.content;
                colWidth = me.colsWidth[i];
                tdClass = field.breakLine ? tdBreakClass : tdCntrClass;
                if (field.select) {
                    tdClass += ' ' + me.getClass('tdsel');
                }


                contentHtml = '<div class="' + tdClass + '">';
                contentHtml += (field.breakLine ? '' : '<nobr>') + ('function' == typeof content ? content.call(me, data, index, i) : data[content]); + (field.breakLine ? '' : '</nobr>') + '</div>';

                html.push('<td id="' + me.getBodyCellId(index, i) + '"',
                    ' style="width:' + colWidth + 'px" control="' + me.id,
                    '" row="' + index + '" col="' + i + '">',
                    contentHtml,
                    '</td>');
            }
            html.push('</tr></table></div>');

            return html.join('');
        },
        /**
         * @name 表格行鼠标移上的事件handler
         * @private
         * @param {number} index 表格行序号.
         */
        rowOverHandler: function (index) {
            var row = this.getRow(index);
            if (row) {
                hui.Control.addClass(row, this.getClass('row-over'));
            }
        },

        /**
         * @name 表格行鼠标移出的事件handler
         * @private
         * @param {number} index 表格行序号.
         */
        rowOutHandler: function (index) {
            var row = this.getRow(index);
            if (row) {
                hui.Control.removeClass(row, this.getClass('row-over'));
            }
        },

        /**
         * @name 阻止行选，用于点击在行的其他元素，不希望被行选时。
         * @public
         */
        preventLineSelect: function () {
            this.dontSelectLine = 1;
        },

        /**
         * @name 表格行鼠标点击的事件handler
         * @private
         * @param {number} index 表格行序号.
         */
        rowClickHandler: function (index) {
            if (this.selectMode == 'line') {
                if (this.dontSelectLine) {
                    this.dontSelectLine = false;
                    return;
                }

                var input;

                switch (this.select) {
                case 'multi':
                    input = hui.g(this.getId('multiSelect') + index);
                    // 如果点击的是checkbox，则不做checkbox反向处理
                    if (!this.preSelectIndex) {
                        input.checked = !input.checked;
                    }
                    this.selectMulti(index);
                    this.preSelectIndex = null;
                    break;
                case 'single':
                    input = hui.g(this.getId('singleSelect') + index);
                    input.checked = true;
                    this.selectSingle(index);
                    break;
                }
            }
            this.bodyClickHandler(index);
        },

        /**
         * @name 获取表格内容行的dom元素
         * @private
         * @param {number} index 行号.
         * @return {HTMLElement}
         */
        getRow: function (index) {
            return hui.g(this.getId('row') + index);
        },

        /**
         * @name 释放控件
         * @protected
         */
        dispose: function () {
            var head = hui.g(this.getId('head'));

            if (head) {
                head.onmousemove = null;
                head.onmousedown = null;
            }

            hui.Table.superClass.dispose.call(this);
        }

    };

    // hui.Table 继承了 hui.Control 
    hui.inherits(hui.Table, hui.Control);

    hui.util.importCssString(
        '.hui_table{}' +
        '.hui_table_head{}' +
        '.hui_table_head .hui_table_row{}' +
        '.hui_table_head .hui_table_row .hui_table_thsel{}' +
        '.hui_table_head .hui_table_row .hui_table_thcntr{text-align:left;cursor:pointer;}' +
        '.hui_table_head .hui_table_row .hui_table_thtext{float:left}' +
        '.hui_table_head .hui_table_row .hui_table_thsort{height:0;width:0;border:10px solid #9c9c9c;border-color:transparent;border-width:10px 5px;float:right;margin-top:-5px;margin-bottom:-10px;margin-right:0px}' +
        '.hui_table_head .hui_table_thasc  .hui_table_thsort{border-bottom-color:#9c9c9c;border-top:0px;margin-top:10px;display:inline}' +
        '.hui_table_head .hui_table_thdesc .hui_table_thsort{border-top-color:#9c9c9c;border-bottom:0px;margin-top:10px;display:inline}' +
        '.hui_table_body{}' +
        '.hui_table_body .hui_table_row{}' +
        '.hui_table_body .hui_table_row .hui_table_tdsel{}' +
        '.hui_table_body .hui_table_row .hui_table_tdcntr{display:inline-block}'
    );

});