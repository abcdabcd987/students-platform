"use strict";

module.exports = function(sequelize, DataTypes) {
    var Resource = sequelize.define("Resource", {
        type:             DataTypes.STRING,
        key:              DataTypes.STRING,
        value:            DataTypes.STRING,
        description:      DataTypes.TEXT,
        priority: { type: DataTypes.INTEGER, defaultValue: 0 }
    }, {
        classMethods: {
            associate: function(models) {
                Resource.belongsTo(models.Speech);
            },
        }
    });

    return Resource;
};
