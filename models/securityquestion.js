'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SecurityQuestion extends Model {
    static associate(models) {
      SecurityQuestion.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  SecurityQuestion.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    question_text: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    answer_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'SecurityQuestion',
    tableName: 'security_questions',
    underscored: true,
    timestamps: false
  });

  return SecurityQuestion;
};