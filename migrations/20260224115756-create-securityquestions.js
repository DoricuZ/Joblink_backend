'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('security_questions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      question_text: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      answer_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('security_questions');
  }
};