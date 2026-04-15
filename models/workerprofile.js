'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WorkerProfile extends Model {
    static associate(models) {

      WorkerProfile.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  WorkerProfile.init({
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
    service_category: {
      type: DataTypes.ENUM(
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
    specific_skills: DataTypes.TEXT,
    location_area: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    base_rate_naira: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    availability_schedule: DataTypes.JSON,
    average_rating: {
      type: DataTypes.DECIMAL(3,2),
      defaultValue: 0.00
    },
    completed_jobs_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'WorkerProfile',
    tableName: 'worker_profiles',
    underscored: true,
    timestamps: false
  });

  return WorkerProfile;
};