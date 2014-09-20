/**
 * Created with JetBrains WebStorm.
 * To change this template use File | Settings | File Templates.
 * Desc: 该模块处理HTTP请求的响应格式，统一的出错处理、日志处理、统计处理。
 */

'use strict';

//以“INTERNAL_”开头的，是不展现给用户看的，后期需要打日志，分析程序bug和错误原因的用的。
var err_map = {
    INTERNAL_UNKNOWN_ERROR: '未知错误',
    INTERNAL_INVALIDE_PARAMETER: '参数格式不正确或缺少参数',
    INTERNAL_ILLEGAL_OPT: '非法操作',
    INTERNAL_INVALIDE_DATAFORMAT: '数据格式错误',
    INTERNAL_DB_OPT_FAIL: '数据库操作失败',
    INTERNAL_DB_RECORD_NOT_EXIST: '数据库记录不存在',
    INTERNAL_CACHE_OPT_FAIL: 'memcache操作失败',
    INTERNAL_HTTP_NOT_AVAILABLE: '访问HTTP失败',
    INTERNAL_SINAAPI_NOT_AVAILABLE: '微博接口不可用',
    INTERNAL_USERINFO_NOT_EXIST: '用户资料不存在',
    INTERNAL_DB_SAVE_KEY_ERROR: '存入数据库时关键属性错误或缺失',
    INTERNAL_LOGGER_NOT_AVAILABLE: '日志模块不可用',
    INTERNAL_STAT_NOT_AVAILABLE: '统计模块不可用',

    USER_TOKEN_EXPIRE: '登陆信息过期，请重新登陆。',
    USER_LOGIN_JIEPANG_FAIL: '登陆街旁失败',
    USER_USERNAME_NOT_EXIST: '用户不存在',
    USER_PASSWORD_WRONG: '密码错误',
    USER_LOGIN_FAIL: '用户不存在或密码错误',
    MISSING_PARAMETERS: '参数缺失',
    USER_ALREADY_EXIST: '用户已存在',
    USER_ROOM_IS_EMPTY: '该room里没有人'
};

exports.err = function(req, res, errcode, extra_msg) {
    var output = [
        {
            mobile: err_map[errcode],
            extra: extra_msg
        },
        errcode
    ];
    res.send(output);
//    // 内部错误日志记录
//    if (errcode.substr(0, 9) == 'INTERNAL_') {
//        var request = {
//            url: req.url,
//            params: req.paramlist,
//            method: req.method
//        };
//        request = helper_util.unicodeOnlyChs(JSON.stringify(request));
//        helper_log.logError('pick_api_call', errcode + '\t' + request, function(){});
//    }
//    //接口访问并发统计
//    helper_stat.statCount('pick_api.apiCall', 1, function(){});
};

exports.ok = function(req, res, result, next) {
    result = result || '';
    var elapsedTime = -1;
    if (req._time) {
        elapsedTime = new Date().getTime() - req._time;
    }
    var output = [null, result];
    res.send(output);

//    //接口访问并发统计
//    helper_stat.statCount('pick_api.apiCall', 1, function(){});
//    //接口访问响应时间统计
//    if (elapsedTime > -1) {
//        helper_stat.statTime('pick_api.apiCall', elapsedTime, function(){});
//    }
//    var request = {
//        url: req.url,
//        params: req.paramlist,
//        method: req.method
//    };
//    request = helper_util.unicodeOnlyChs(JSON.stringify(request));
//    //用户活跃统计
//    var uid = req.paramlist.mid || req.paramlist.uid || 'anonymous';
//    helper_log.logStat('user_activity', uid + '\t' + request, function(){});
//    //地点册被访问量统计
//    if (req.paramlist.vlid) {
//        helper_log.logStat('venuelist_hotspot', req.paramlist.vlid + '\t' + request, function(){});
//    }
//    //地点被访问量统计
//    if (req.paramlist.guid) {
//        helper_log.logStat('venue_hotspot', req.paramlist.guid + '\t' + request, function(){});
//    }
//    //攻略被访问量统计
//    if (req.paramlist.tid) {
//        helper_log.logStat('tip_hotspot', req.paramlist.tid + '\t' + request, function(){});
//    }
};
