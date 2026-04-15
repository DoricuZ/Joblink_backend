'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Job extends Model {
    static associate(models) {

      Job.belongsTo(models.User, {
        foreignKey: 'employer_id',
        as: 'employer'
      });

      Job.hasOne(models.Transaction, {
        foreignKey: 'job_id',
        as: 'transaction'
      });

      Job.hasMany(models.Rating, {
        foreignKey: 'job_id',
        as: 'ratings'
      });
    }
  }

  Job.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    employer_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    service_category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    location_area: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    scheduled_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    budget_min: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    budget_max: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    worker_id: {
      type: DataTypes.INTEGER,
      allowNull: true

    },
    status: {
      type: DataTypes.ENUM(
        'Pending',
        'Matched',
        'Paid',
        'In_Progress',
        'Completed',
        'Disputed',
        'Cancelled'
      ),
      defaultValue: 'Pending'
    }
  }, {
    sequelize,
    modelName: 'Job',
    tableName: 'jobs',
    underscored: true,
    timestamps: true
  });

  return Job;
};