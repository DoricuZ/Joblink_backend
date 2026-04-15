'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {

      User.hasOne(models.WorkerProfile, {
        foreignKey: 'user_id',
        as: 'workerProfile'
      });

      User.hasOne(models.EmployerProfile, {
        foreignKey: 'user_id',
        as: 'employerProfile'
      });

      User.hasMany(models.Job, {
        foreignKey: 'employer_id',
        as: 'jobs'
      });

      User.hasMany(models.Transaction, {
        foreignKey: 'payer_id',
        as: 'paymentsMade'
      });

      User.hasMany(models.Transaction, {
        foreignKey: 'payee_id',
        as: 'paymentsReceived'
      });

      User.hasMany(models.Rating, {
        foreignKey: 'rater_user_id',
        as: 'ratingsGiven'
      });

      User.hasMany(models.Rating, {
        foreignKey: 'rated_user_id',
        as: 'ratingsReceived'
      });

      User.hasMany(models.SecurityQuestion, {
        foreignKey: 'user_id',
        as: 'securityQuestions'
      });
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    phone_number: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('worker', 'employer', 'admin'),
      allowNull: false
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    failed_security_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    security_lock_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    otp_code: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    otp_expires: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true
  });

  return User;
};