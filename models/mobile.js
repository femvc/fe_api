'use strict';
module.exports = {
    createNew: function () {
        var mobileModel = require('./base').createNew('mobile');
        return mobileModel;
    }
};