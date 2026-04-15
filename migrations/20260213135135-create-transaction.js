'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      job_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'jobs',
          key: 'id'
        }
      },
      payer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      payee_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      amount: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      commission_amount: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      transaction_type: {
        type: Sequelize.ENUM('Payment_In','Payout_Out'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('Pending','Success','Failed'),
        allowNull: false
      },
      paystack_reference: {
        type: Sequelize.STRING(100),
        unique: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transactions');
  }
};