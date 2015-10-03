"use strict";

module.exports = function(sequelize, DataTypes) {
    var Speech = sequelize.define("Speech", {
        title:              DataTypes.STRING,
        urlname:    { type: DataTypes.STRING, unique: true },
        description:        DataTypes.TEXT,
        thumbImage:         DataTypes.STRING,
        views:      { type: DataTypes.INTEGER, defaultValue: 0 },
        date:               DataTypes.DATE,
    }, {
        classMethods: {
            associate: function(models) {
                Speech.hasOne(models.User, { as: 'Speaker', foreignKey: 'speadker' });
            }
        }
    });

    return Speech;
};
