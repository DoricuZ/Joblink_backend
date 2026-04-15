const { WorkerProfile, User } = require('../../models');

// Allowed service categories from DB
const SERVICE_CATEGORIES = [
  'Cleaning', 'Electrical', 'Plumbing', 'Caregiving',
  'Tailoring', 'Hairstyling', 'Painting', 'Carpentry', 'Other'
];

class WorkerController {

  static async createWorkerProfile(req, res, next) {
    try {
      const { first_name, last_name, specific_skills, service_category, availability_schedule, base_rate_naira, location_area } = req.body;

      // Validate required fields
      if (!first_name || !last_name || !service_category || !location_area || !base_rate_naira) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Validate ENUM
      if (!SERVICE_CATEGORIES.includes(service_category)) {
        return res.status(400).json({ success: false, message: 'Invalid service_category' });
      }

      const existingProfile = await WorkerProfile.findOne({ where: { user_id: req.user.id } });
      if (existingProfile) return res.status(400).json({ success: false, message: 'Worker profile already exists' });

      const profile = await WorkerProfile.create({
        user_id: req.user.id,
        first_name,
        last_name,
        specific_skills,
        service_category,
        availability_schedule,
        base_rate_naira,
        location_area
      });

      res.status(201).json({ success: true, message: 'Worker profile created', data: profile });
    } catch (error) {
      next(error);
    }
  }

  static async getWorkerProfile(req, res, next) {
    try {
      const profile = await WorkerProfile.findOne({
        where: { user_id: req.user.id },
        include: [{ model: User, attributes: ['email', 'phone_number', 'role'] }]
      });

      if (!profile) return res.status(404).json({ success: false, message: 'Worker profile not found' });

      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  static async updateWorkerProfile(req, res, next) {
    try {
      const profile = await WorkerProfile.findOne({ where: { user_id: req.user.id } });
      if (!profile) return res.status(404).json({ success: false, message: 'Worker profile not found' });

      // Validate ENUM if service_category is provided
      if (req.body.service_category && !SERVICE_CATEGORIES.includes(req.body.service_category)) {
        return res.status(400).json({ success: false, message: 'Invalid service_category' });
      }

      await profile.update(req.body);

      res.status(200).json({ success: true, message: 'Worker profile updated', data: profile });
    } catch (error) {
      next(error);
    }
  }


  // GET WORKER BY ID
  static async getWorkerById(req, res, next) {
    try {
      const worker = await WorkerProfile.findByPk(req.params.id, {
        include: [{ model: User, attributes: ['id', 'email', 'phone_number', 'role'] }]
      });

      if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

      res.status(200).json({ success: true, data: worker });

    } catch (error) {
      next(error);
    }
  }

  // LIST ALL WORKERS
  static async listAllWorkers(req, res, next) {
    try {
      const { availability_schedule } = req.query;
      const whereClause = {};
      if (availability_schedule) whereClause.availability_schedule = availability_schedule;

      const workers = await WorkerProfile.findAll({
        where: whereClause,
        include: [{ model: User, attributes: ['id', 'email', 'phone_number', 'role'] }]
      });

      res.status(200).json({ success: true, count: workers.length, data: workers });
    } catch (error) {
      next(error);
    }
  }

  // worker.controller.js


  // static async getProfile(req, res, next)  {
  //   try {
  //     const profile = await WorkerProfile.findOne({
  //       where: { user_id: req.user.id },
  //       include: [{ model: User, attributes: ['id', 'full_name', 'phone_number', 'email'] }]
  //     });

  //     if (!profile) {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'Worker profile not found'
  //       });
  //     }

  //     res.json({
  //       success: true,
  //       data: profile
  //     });

  //   } catch (error) {
  //     next(error);
  //   }
  // };

  // AI Endpoint: Get workers for AI
  static async getWorkersForAI(req, res, next) {
    try {
      const { availability_schedule } = req.query;
      const whereClause = {};
      if (availability_schedule) whereClause.availability_schedule = availability_schedule;

      const workers = await WorkerProfile.findAll({
        where: whereClause,
        include: [{ model: User, attributes: ['id', 'email', 'phone_number', 'role'] }]
      });

      res.status(200).json({ success: true, count: workers.length, data: workers });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = WorkerController;