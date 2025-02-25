const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Guild = sequelize.define('Guild', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: false,
});

module.exports = Guild;
