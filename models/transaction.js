'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {

      Transaction.belongsTo(models.Job, {
        foreignKey: 'job_id',
        as: 'job'
      });

      Transaction.belongsTo(models.User, {
        foreignKey: 'payer_id',
        as: 'payer'
      });

      Transaction.belongsTo(models.User, {
        foreignKey: 'payee_id',
        as: 'payee'
      });

      Transaction.hasMany(models.Rating, {
        foreignKey: 'transaction_id',
        as: 'ratings'
      });
    }
  }

  Transaction.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    payer_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    payee_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    commission_amount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    transaction_type: {
      type: DataTypes.ENUM('Payment_In','Payout_Out'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Pending','Success','Failed'),
      allowNull: false
    },
    paystack_reference: {
      type: DataTypes.STRING(100),
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    underscored: true,
    timestamps: true
  });

  return Transaction;
};