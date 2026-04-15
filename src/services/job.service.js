const { sequelize, Job, Transaction, User } = require('../../models');
const { validateTransition } = require('../validators/lifecycle.validator');
const { executePayout } = require('./payout.service');
const { Op } = require('sequelize');


// ================= CREATE JOB =================
const createJob = async (employer_id, jobData) => {
  const { service_category, description, location_area, scheduled_date, budget_min, budget_max } = jobData;

  const employer = await User.findByPk(employer_id);
  if (!employer || employer.role !== 'employer') {
    throw new Error('Only employers can create jobs');
  }

  const job = await Job.create({
    employer_id,
    service_category,
    description,
    location_area,
    scheduled_date,
    budget_min,
    budget_max,
    status: 'Pending'
  });

  return job;
};


// ================= DELETE JOB =================
const deleteJob = async (job_id, user_id) => {
  return await sequelize.transaction(async (t) => {
    const job = await Job.findByPk(job_id, { transaction: t });
    if (!job) throw new Error('Job not found');

    const user = await User.findByPk(user_id);
    if (!user) throw new Error('Unauthorized');

    // Only employer who created job or admin can delete
    if (job.employer_id !== user_id && user.role !== 'admin') {
      throw new Error('You are not authorized to delete this job');
    }

    await Transaction.destroy({ where: { job_id }, transaction: t });
    await job.destroy({ transaction: t });

    return { message: 'Job deleted successfully' };
  });
};


// ================= SELECT WORKER =================
// Employer selects AI-suggested worker
const selectWorker = async (job_id, worker_id, employer_id) => {
  return await sequelize.transaction(async (t) => {

    const job = await Job.findByPk(job_id, { transaction: t });
    if (!job) throw new Error('Job not found');
    if (job.employer_id !== employer_id) throw new Error('You are not the employer of this job');

    if (job.worker_id) throw new Error('Worker already assigned to this job');

    job.worker_id = worker_id;
    job.status = 'In_Progress';
    await job.save({ transaction: t });

    // Update transaction payee
    const tx = await Transaction.findOne({
      where: { job_id },
      transaction: t
    });

    if (tx) {
      tx.payee_id = worker_id;
      await tx.save({ transaction: t });
    }

    return job;
  });
};


// ================= WORKER ACCEPT JOB =================
const acceptJob = async (job_id, worker_id) => {
  return await sequelize.transaction(async (t) => {

    const job = await Job.findByPk(job_id, { transaction: t });
    if (!job) throw new Error('Job not found');

    if (job.worker_id !== worker_id) {
      throw new Error('You are not assigned to this job');
    }

    if (job.status !== 'In_Progress') {
      throw new Error('Job is not available for acceptance');
    }

    job.status = 'Accepted';
    await job.save({ transaction: t });

    return job;
  });
};


// ================= UPDATE JOB STATUS =================
const updateJobStatus = async (job_id, newStatus, actor_id) => {
  return await sequelize.transaction(async (t) => {

    const job = await Job.findByPk(job_id, { transaction: t });
    if (!job) throw new Error('Job not found');

    const actor = await User.findByPk(actor_id);
    if (!actor) throw new Error('Unauthorized');

    // Validate lifecycle
    validateTransition(job.status, newStatus);

    // Only admin can move any status
    // Employer can move own job
    // Worker can only accept (handled separately)
    if (
      actor.role === 'worker' ||
      (actor.role === 'employer' && actor.id !== job.employer_id) ||
      !['worker','employer','admin'].includes(actor.role)
    ) {
      if (actor.role !== 'admin') {
        throw new Error('Unauthorized to change job status');
      }
    }

    job.status = newStatus;
    await job.save({ transaction: t });

    // Trigger payout if completed
    if (newStatus === 'Completed') {
      const tx = await Transaction.findOne({
        where: { job_id },
        transaction: t
      });

      if (!tx) throw new Error('Transaction not found');

      if (tx.status !== 'Success') throw new Error('Cannot payout before payment is successful');
      if (!tx.payee_id) throw new Error('Worker not assigned for payout');

      await executePayout(tx.id);
    }

    return job;
  });
};

/**
 * Get a single job by ID
 * @param {number} job_id
 * @returns Job instance
 */
const getJobById = async (job_id) => {
  const job = await Job.findByPk(job_id, {
    include: [
      { model: User, attributes: ['id', 'email', 'phone_number'] }
    ]
  });

  if (!job) throw new Error('Job not found');
  return job;
};

/**
 * List all jobs (optionally filter by employer, worker, or status)
 * @param {object} filter - optional filters
 * @returns array of jobs
 */
const listJobs = async (filter = {}) => {
  const where = {};

  if (filter.employer_id) where.employer_id = filter.employer_id;
  if (filter.worker_id) where.worker_id = filter.worker_id;
  if (filter.status) where.status = filter.status;

  const jobs = await Job.findAll({
    where,
    include: [
      { model: User, attributes: ['id', 'email', 'phone_number'] }
    ],
    order: [['created_at', 'DESC']]
  });

  return jobs;
};

/**
 * Confirm completion of a job and trigger payout
 * @param {number} job_id
 */
const confirmCompletion = async (job_id) => {
  return await sequelize.transaction(async (t) => {
    const job = await Job.findByPk(job_id, { transaction: t });
    if (!job) throw new Error('Job not found');

    if (!['In_Progress', 'Accepted'].includes(job.status)) {
      throw new Error('Job cannot be completed in current state');
    }

    job.status = 'Completed';
    await job.save({ transaction: t });

    // Find transaction
    const transaction = await Transaction.findOne({ where: { job_id }, transaction: t });
    if (!transaction || transaction.status !== 'Success') {
      throw new Error('Cannot payout before successful payment');
    }

    if (!transaction.payee_id) throw new Error('Worker not assigned for payout');

    // Trigger payout
    await executePayout(transaction.id);

    return job;
  });
};


module.exports = {
  createJob,
  deleteJob,
  selectWorker,
  acceptJob,
  updateJobStatus,
  getJobById,
  listJobs,
  confirmCompletion,
};