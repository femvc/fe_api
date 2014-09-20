module.exports = {
    createNew: function() {
        var userModel = require('./base').createNew('user');
        return userModel;
    }
};
