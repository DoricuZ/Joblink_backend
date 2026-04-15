'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('worker_profiles', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      service_category: {
        type: Sequelize.ENUM(
        'Cleaning & Housekeeping',
        'Electrical',
        'Plumbing',
        'Home Assistance',
        'Carpentry & Woodwork',
        'Masonry & Construction',
        'Mechanical & Auto',
        'Beauty & Personal Care',
        'Fashion & Garment Services',
        'Food & Catering Services',
        'Event Service',
        'Media Services',
        'Delivery & Logistics',
        'Agricultural & Outdoor Services',
        'Repair & Maintenance Services',
        'Security & Safety Services',
        'Private lesson tutor',
        'Driving instructor',
        'Translator',
        'Cleaning & Waste Management'
        
        ),
        allowNull: false
      },
      specific_skills: Sequelize.TEXT,
      location_area: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      base_rate_naira: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      availability_schedule: Sequelize.JSON,
      average_rating: {
        type: Sequelize.DECIMAL(3,2),
        defaultValue: 0.00
      },
      completed_jobs_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('worker_profiles');
  }
};