'use strict';
const { Model } = require('sequelize');
const fs = require('fs');

module.exports = (sequelize, DataTypes) => {
  class EmployerProfile extends Model {
    static associate(models) {

      EmployerProfile.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  EmployerProfile.init({
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    account_type: {
      type: DataTypes.ENUM('Household', 'Business'),
      allowNull: false
    },
    location_area: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'EmployerProfile',
    tableName: 'employer_profiles',
    underscored: true,
    timestamps: false
  });

  return EmployerProfile;
};