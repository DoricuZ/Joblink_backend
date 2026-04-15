'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Rating extends Model {
    static associate(models) {

      Rating.belongsTo(models.Job, {
        foreignKey: 'job_id',
        as: 'job'
      });

      Rating.belongsTo(models.Transaction, {
        foreignKey: 'transaction_id',
        as: 'transaction'
      });

      Rating.belongsTo(models.User, {
        foreignKey: 'rater_user_id',
        as: 'rater'
      });

      Rating.belongsTo(models.User, {
        foreignKey: 'rated_user_id',
        as: 'ratedUser'
      });
    }
  }

  Rating.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rater_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rated_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rating_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 }
    },
    comment: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Rating',
    tableName: 'ratings',
    underscored: true,
    timestamps: true
  });

  return Rating;
};