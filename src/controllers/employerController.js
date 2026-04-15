const { EmployerProfile, User } = require('../../models');
const fs = require('fs');

// Allowed account types from DB
const ACCOUNT_TYPES = ['Household', 'Business'];

class EmployerController {

  static async createEmployerProfile(req, res, next) {
    try {
      const { first_name, last_name, account_type, location_area } = req.body;

      // Validate required fields
      if (!first_name || !last_name || !account_type || !location_area) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Validate ENUM
      if (!ACCOUNT_TYPES.includes(account_type)) {
        return res.status(400).json({ success: false, message: 'Invalid account_type' });
      }

      const existingProfile = await EmployerProfile.findOne({ where: { user_id: req.user.id } });
      if (existingProfile) return res.status(400).json({ success: false, message: 'Employer profile already exists' });

      const profile = await EmployerProfile.create({
        user_id: req.user.id,
        first_name,
        last_name,
        account_type,
        location_area
      });

      res.status(201).json({ success: true, message: 'Employer profile created', data: profile });
    } catch (error) {
      next(error);
    }
  }

  static async getEmployerProfile(req, res, next) {
    try {
      const profile = await EmployerProfile.findOne({ where: { user_id: req.user.id } });
      if (!profile) return res.status(404).json({ success: false, message: 'Employer profile not found' });

      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  static async updateEmployerProfile(req, res, next) {
    try {
      const profile = await EmployerProfile.findOne({ where: { user_id: req.user.id } });
      if (!profile) return res.status(404).json({ success: false, message: 'Employer profile not found' });

      // Validate ENUM if account_type is provided
      if (req.body.account_type && !ACCOUNT_TYPES.includes(req.body.account_type)) {
        return res.status(400).json({ success: false, message: 'Invalid account_type' });
      }

      await profile.update(req.body);

      res.status(200).json({ success: true, message: 'Employer profile updated', data: profile });
    } catch (error) {
      next(error);
    }
  }

  static async uploadLogo(req, res) {
    try {
      const profile = await EmployerProfile.findOne({ where: { user_id: req.user.id } });
      if (!profile) return res.status(404).json({ success: false });

      if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

      // Optional: remove old logo
      if (profile.logo) fs.unlinkSync(profile.logo);

      profile.logo = req.file.path;
      await profile.save();

      res.json({ success: true, logo: profile.logo });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  };

  // GET EMPLOYER BY ID
  static async getEmployerById(req, res, next) {
    try {
      const employer = await EmployerProfile.findByPk(req.params.id, {
        include: [{ model: User, attributes: ['id', 'email', 'phone_number', 'role'] }]
      });
      if (!employer) return res.status(404).json({ success: false, message: 'Employer not found' });

      res.status(200).json({ success: true, data: employer });

    } catch (error) {
      next(error);
    }
  }

  static async getMyProfile(req, res, next) {
    try {
      const employer = await EmployerProfile.findByPk(req.user.id, {
        include: [{ model: User, attributes: ['id', 'email', 'phone_number', 'role'] }]
      });
      if (!employer) return res.status(404).json({ success: false, message: 'Employer not found' });

      res.status(200).json({ success: true, data: employer });
    } catch (error) {
      next(error);
    }
  }

  // LIST ALL EMPLOYERS
  static async listAllEmployers(req, res, next) {
    try {
      const employers = await EmployerProfile.findAll({
        include: [{ model: User, attributes: ['id', 'email', 'phone_number', 'role'] }]
      });

      res.status(200).json({ success: true, count: employers.length, data: employers });

    } catch (error) {
      next(error);
    }
  }

  // AI Endpoint: Get employers for AI
  static async getEmployersForAI(req, res, next) {
    try {
      const employers = await EmployerProfile.findAll({
        include: [{ model: User, attributes: ['id', 'email', 'phone_number', 'role'] }]
      });

      res.status(200).json({ success: true, count: employers.length, data: employers });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = EmployerController;