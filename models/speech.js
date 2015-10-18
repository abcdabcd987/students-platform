"use strict";

module.exports = function(sequelize, DataTypes) {
    var Speech = sequelize.define("Speech", {
        title:              DataTypes.STRING,
        subtitle:           DataTypes.STRING,
        studentID:          DataTypes.STRING,
        urlname:    { type: DataTypes.STRING, unique: true },
        description:        DataTypes.TEXT,
        thumbImage:         DataTypes.STRING,
        views:      { type: DataTypes.INTEGER, defaultValue: 0 },
        date:               DataTypes.DATE,
    }, {
        classMethods: {
            associate: function(models) {
                Speech.hasMany(models.Resource);
            },

            parse: function(obj) {
                return {
                    title: obj.title,
                    subtitle: obj.subtitle,
                    urlname: obj.urlname,
                    description: obj.description,
                    date: obj.date,
                    thumbImage: obj.thumbImage,
                    studentID: obj.studentID
                }
            }
        }
    });

    return Speech;
};
