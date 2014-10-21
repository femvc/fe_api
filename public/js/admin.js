window.admin = {};
window.admin.init = function () {

    window.listTable = [{
        width: 296,
        title: 'n1',
        sortable: true,
        field: 'name',
        content: function (item) {
            return item['name'];
        }
    }, {
        width: 296,
        title: 'n2',
        field: 'name',
        content: function (item) {
            return item['name'];
        }
    }, {
        width: 296,
        title: 'n3',
        field: 'atcid',
        content: function (item) {
            return item['atcid'];
        }
    }];
    window.listData = [{
        'name': 'aaaa'
    }, {
        'name': 'bbbb'
    }];


    hui.Mockup.stop = true;
    // subject_list
    Requester.get('/ue_api/internal/get_questions?answer=yes', {
        onsuccess: function (result) {
            var data = result[1];
            if (data) {

                window.listTable = [{
                    width: 296,
                    title: '题目',
                    sortable: true,
                    field: 'title',
                    content: function (item) {
                        return item['title'];
                    }
                }, {
                    width: 296,
                    title: 'option',
                    field: 'title',
                    content: function (item) {
                        var html = '',
                            tpl = '<li class="#{correct}"><div class="txt">#{index} #{content} </div></li>';
                        for (var i in item['options']) {
                            item['options'][i].index = i;
                            html += hui.format(tpl, item['options'][i])
                        }
                        return '<ul class="option_list">' + html + '</ul>';
                    }
                }, {
                    width: 296,
                    title: 'update_time',
                    field: 'update_time',
                    content: function (item) {
                        return item['update_time'];
                    }
                }, {
                    width: 296,
                    title: 'action',
                    field: 'atcid',
                    content: function (item) {
                        return '<a href="?atcid=' + item['atcid'] + '">edit</a>';
                    }
                }];

                window.listData = data.items;

                hui.Control.init(hui.g('subject_list'));

            };

        }
    });

    hui.Control.init(hui.g('subject_add'));
    window.form = hui.Control.getByFormName('form');

    window.form.addOption = function (obj) {
        var content = window.form.getById('options').getMain(),
            list,
            index;
        obj = obj || {};
        if (!obj.index) {
            var list = hui.c('td_index');
            obj.index = 1;
            for (var i = 0, len = list.length; i < len; i++) {
                index = parseInt(list[i].innerHTML);
                if (index >= obj.index) {
                    obj.index = index + 1;
                }
            }
        }
        var tpl =
            '<div class="tr_row" id="content#{index}" ui="type:\'Panel\',formName:\'#{index}\',isFormItem: true"><span class="td_index">#{index}</span>' +
            '    <div ui="type:\'Checkbox\',formName:\'correct\',id:\'correct#{index}\',value:\'yes\',checked:\'#{correct}\'"></div>' +
            '    <textarea cols="40" rows="2" name="content" ui="type:\'TextInput\',id:\'content#{index}\',value11:\'#{content}\'" tabindex="#{index}">#{content}</textarea>' +
            '    <a href="javascript:" class="td_action" onclick="hui.Control.getByFormName(\'form\').removeOption(\'#{index}\')">remove</a>' +
            '</div>';
        hui.util.appendHTML(content, hui.format(tpl, obj));
        hui.Control.create(hui.g('content' + obj.index));
    };
    window.form.removeOption = function (index) {
        var content = window.form.getById('options');
        content.getByFormName(index).dispose();
    };

    var submit = window.form.getByFormName('submit');
    submit.onclick = function () {
        var data = hui.Control.getByFormName('form').getParamMap();
        data.options = JSON.stringify(data.options);
        data.major = JSON.stringify(data.major);
        data.level = JSON.stringify(data.level);
        data.label = JSON.stringify(data.label);
        console.log(data);
        Requester.get('/ue_api/internal/save_question', {
            data: data,
            onsuccess: function (err, result) {
                window.location.reload();
            }
        });
    };
    var add = window.form.getByFormName('add');
    add.onclick = window.form.addOption;

    // subject_add
    var paramlist = hui.Master.parseLocator().query;
    if (paramlist.atcid) {
        hui.g('title').innerHTML = '修改题目';
        Requester.get('/ue_api/internal/get_question?answer=yes', {
            data: {
                atcid: paramlist.atcid
            },
            onsuccess: function (result) {

                var data = result[1];
                //data.content = JSON.parse(data.content);
                data.atcid = data.atcid;

                window.form.setValueByTree(data);
                window.form.labellist = data.label;
                window.form.getById('options').disposeChild();

                for (var i in data.options) {
                    data.options[i].index = i;
                    window.form.addOption(data.options[i]);
                }
            }
        });
    }
    else {
        window.form.getById('options').disposeChild();
        window.form.addOption();
        window.form.addOption();
        window.form.addOption();
        window.form.addOption();
    }

    Requester.get('/ue_api/account/get_uid?rand=' + Math.random(), {
        onsuccess: function (result) {
            if (result && !result[0] && result[1]) {
                hui.g('uid').innerHTML = result[1];
            }
        }
    });

    window.admin.refreshList();
    hui.CheckLabel.prototype.refreshList = window.admin.refreshList;

};

window.admin.refreshList = function () {
    Requester.get('/ue_api/internal/get_cloudlabels?rand=' + Math.random(), {
        onsuccess: function (result) {
            var data = result[1],
                item,
                label,
                container,
                html = '',
                tpl = '<label ui="type:\'CheckLabel\',formName:\'label\' ,value:\'#{value}\', label:\'#{label}\'"></label>';
            if (data) {
                for (var i = 0; i < data.length; i++) {
                    item = data[i];
                    html += hui.format(tpl, item);
                };
                html += hui.format(tpl, {
                    value: -Math.random(),
                    label: '_______'
                });

                container = hui.g('label_list');
                hui.Control.disposeList(hui.Control.findAllControl(container));
                hui.Control.init(hui.util.setInnerHTML(container, html));
                if (window.form.labellist) {
                    window.form.setValueByTree({
                        'label': window.form.labellist
                    });
                }
                //hui.Control.init(hui.g('subject_list'));
            };

        }
    });
};