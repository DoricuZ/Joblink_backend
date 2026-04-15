'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jobs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      employer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      service_category: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      location_area: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      scheduled_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      budget_min: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      budget_max: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
     worker_id: {
      type: Sequelize.INTEGER,
      allowNull: true

    },
      status: {
        type: Sequelize.ENUM(
          'Pending',
          'Matched',
          'Paid',
          'In_Progress',
          'Completed',
          'Disputed',
          'Cancelled'
        ),
        defaultValue: 'Pending'
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
    await queryInterface.dropTable('jobs');
  }
};