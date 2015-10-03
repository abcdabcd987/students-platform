"use strict";

let utils = require('../utils');

module.exports = function(sequelize, DataTypes) {
    var User = sequelize.define("User", {
        username: {
            type: DataTypes.STRING,
            unique: true,
            validate: {
                notEmpty: true
            }
        },

        password:           DataTypes.STRING(512),
        name:               DataTypes.STRING,
        studentID:          DataTypes.STRING,
        year:               DataTypes.INTEGER,
    }, {

        classMethods: {
            associate: function(models) {
            }
        },

        hooks: {
        }
    });

    return User;
};
