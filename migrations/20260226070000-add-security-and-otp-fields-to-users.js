'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'failed_security_attempts', {
            type: Sequelize.INTEGER,
            defaultValue: 0
        });

        await queryInterface.addColumn('users', 'security_lock_until', {
            type: Sequelize.DATE,
            allowNull: true
        });

        await queryInterface.addColumn('users', 'otp_code', {
            type: Sequelize.STRING(10),
            allowNull: true
        });

        await queryInterface.addColumn('users', 'otp_expires', {
            type: Sequelize.DATE,
            allowNull: true
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('users', 'failed_security_attempts');
        await queryInterface.removeColumn('users', 'security_lock_until');
        await queryInterface.removeColumn('users', 'otp_code');
        await queryInterface.removeColumn('users', 'otp_expires');
    }
};
