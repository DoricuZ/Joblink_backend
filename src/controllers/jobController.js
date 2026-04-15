const { Job, User, WorkerProfile, Transaction } = require('../../models');
const jobService = require('../services/job.service');
const { validateTransition } = require('../validators/lifecycle.validator');
const payoutService = require('../services/payout.service');
const axios = require('axios');

class JobController {

  // ================= CREATE JOB (Employer only) =================
  static async createJob(req, res, next) {
    try {
      const employer_id = req.user.id;
      const jobData = req.body;

      const job = await jobService.createJob(employer_id, jobData);

      res.status(201).json({
        success: true,
        message: 'Job created successfully',
        data: job
      });

    } catch (error) {
      next(error);
    }
  }


  // ================= DELETE JOB (Employer or Admin) =================
  static async deleteJob(req, res, next) {
    try {
      const job_id = req.params.id;
      const user_id = req.user.id;

      const result = await jobService.deleteJob(job_id, user_id);

      res.status(200).json({
        success: true,
        ...result
      });

    } catch (error) {
      next(error);
    }
  }


  // ================= SELECT WORKER (Employer only) =================
  static async selectWorker(req, res, next) {
    try {
      const job_id = req.params.id;
      const { worker_id } = req.body;
      const employer_id = req.user.id;

      const job = await jobService.selectWorker(job_id, worker_id, employer_id);

      res.status(200).json({
        success: true,
        message: 'Worker selected successfully',
        data: job
      });

    } catch (error) {
      next(error);
    }
  }


  // ================= WORKER ACCEPT JOB =================
  static async acceptJob(req, res, next) {
    try {
      const job_id = req.params.id;
      const worker_id = req.user.id;

      const job = await jobService.acceptJob(job_id, worker_id);

      res.status(200).json({
        success: true,
        message: 'Job accepted successfully',
        data: job
      });

    } catch (error) {
      next(error);
    }
  }


  // ================= UPDATE JOB STATUS (Employer/Admin) =================
  static async updateJobStatus(req, res, next) {
    try {
      const job_id = req.params.id;
      const newStatus = req.body.status;
      const actor_id = req.user.id;

      const updatedJob = await jobService.updateJobStatus(job_id, newStatus, actor_id);

      res.status(200).json({
        success: true,
        message: `Job status updated to ${newStatus}`,
        data: updatedJob
      });

    } catch (error) {
      next(error);
    }
  }


  // ================= GET JOB BY ID =================
  static async getJobById(req, res, next) {
    try {
      const job_id = req.params.id;

      const job = await Job.findByPk(job_id, {
        include: [{ model: User, attributes: ['id', 'email', 'phone_number'] }]
      });

      if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

      res.status(200).json({ success: true, data: job });

    } catch (error) {
      next(error);
    }
  }


  // ================= LIST ALL JOBS =================
  static async listJobs(req, res, next) {
    try {
      const jobs = await Job.findAll({
        include: [{ model: User, attributes: ['id', 'email', 'phone_number'] }]
      });

      res.status(200).json({
        success: true,
        count: jobs.length,
        data: jobs
      });

    } catch (error) {
      next(error);
    }
  }



  static async getAIMatches(req, res, next) {
    try {
      const { jobId } = req.params;

      const job = await Job.findByPk(jobId);
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }

      // 1. Get baseline matches (current local matching logic)
      const localMatches = await WorkerProfile.findAll({
        where: {
          service_category: job.service_category,
          location_area: job.location_area
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'phone_number']
        }]
      });

      // 2. Try external matching service
      try {
        const transformedWorkers = localMatches.map(w => {
          const profile = w.get({ plain: true });
          const transformed = {
            worker_id: profile.user_id,
            base_rate_naira: parseFloat(profile.base_rate_naira),
            completed_jobs_count: profile.completed_jobs_count || 0
          };

          // One-hot encoding for Category
          if (profile.service_category) {
            // Remove special characters and spaces to match Python key convention
            const catField = `service_category_${profile.service_category.replace(/[^a-zA-Z0-9]/g, '_')}`;
            transformed[catField] = 1;
          }

          // One-hot encoding for Location
          if (profile.location_area) {
            const locField = `location_area_${profile.location_area.replace(/[^a-zA-Z0-9]/g, '_')}`;
            transformed[locField] = 1;
          }

          return transformed;
        });

        const externalResponse = await axios.post('http://127.0.0.1:8000/match', {
          workers: transformedWorkers
        }, { timeout: 3000 });

        if (externalResponse.data && Array.isArray(externalResponse.data.matches)) {
          return res.json({
            success: true,
            source: 'external-ai',
            count: externalResponse.data.matches.length,
            data: externalResponse.data.matches
          });
        }
      } catch (externalError) {
        console.warn('External matching service (FastAPI) failed or unavailable. Falling back to internal logic.');
      }

      // 3. Fallback to internal matches
      res.json({
        success: true,
        source: 'local-internal',
        count: localMatches.length,
        data: localMatches
      });

    } catch (error) {
      next(error);
    }
  };


  // ================= CONFIRM JOB COMPLETION & PAYOUT =================
  static async confirmCompletion(req, res, next) {
    try {
      const job_id = req.params.id;

      const job = await Job.findByPk(job_id);

      if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

      if (job.status !== 'In_Progress' && job.status !== 'Accepted') {
        return res.status(400).json({ success: false, message: 'Job cannot be completed in current state' });
      }

      // Update job status to Completed
      job.status = 'Completed';
      await job.save();

      // Find transaction
      const transaction = await Transaction.findOne({ where: { job_id } });
      if (!transaction || transaction.status !== 'Success') {
        return res.status(400).json({ success: false, message: 'Cannot payout before successful payment' });
      }

      if (!transaction.payee_id) {
        return res.status(400).json({ success: false, message: 'Worker not assigned' });
      }

      // Trigger payout
      await payoutService.executePayout(transaction.id);

      res.status(200).json({
        success: true,
        message: 'Job completed and payout initiated',
        data: job
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = JobController;