"use strict";

let utils = require('../utils');

module.exports = function(sequelize, DataTypes) {
    var User = sequelize.define("User", {
        studentID: {
            type: DataTypes.STRING,
            unique: true,
            validate: {
                notEmpty: true
            }
        },

        password:           DataTypes.STRING(512),
        name:               DataTypes.STRING,
        year:               DataTypes.INTEGER,
    }, {

        classMethods: {
            associate: function(models) {
            },

            getByStudentID: function(studentID) {
                return User.findOne({ where: { studentID: studentID } })
                .then(user => {
                    if (!user) throw new Error('User not found');
                    return user;
                });
            },

            parse: function(obj) {
                return {
                    password: obj.password,
                    name: obj.name,
                    studentID: obj.studentID,
                    year: parseInt(obj.year, 10) || 0
                }
            }
        },

        hooks: {
        }
    });

    return User;
};
