const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth.middleware');
const authorizeRole = require('../middleware/authorizeRole');
const JobController = require('../controllers/jobController');

// ---------------- EMPLOYER ----------------
// Create a new job → triggers AI (frontend does matching)
router.post(
  '/',
  authenticate,
  authorizeRole(['employer']),
  JobController.createJob
);

// Select AI-suggested worker
router.post(
  '/:id/select-worker',
  authenticate,
  authorizeRole(['employer']),
  JobController.selectWorker
);

// Update job status (employer can move own jobs, lifecycle enforced)
router.patch(
  '/:id/status',
  authenticate,
  authorizeRole(['employer', 'admin']),
  JobController.updateJobStatus
);

// Delete a job (employer owns job) or admin
router.delete(
  '/:id',
  authenticate,
  authorizeRole(['employer', 'admin']),
  JobController.deleteJob
);

// ---------------- WORKER ----------------
// Accept a job assigned to worker
router.post(
  '/:id/accept',
  authenticate,
  authorizeRole(['worker']),
  JobController.acceptJob
);

// ---------------- ADMIN ----------------
// Optionally admin can confirm completion directly
router.post(
  '/:id/confirm-completion',
  authenticate,
  authorizeRole(['admin', 'employer']),
  JobController.confirmCompletion
);

//get AI matches
router.get('/:jobId/matches', authenticate, authorizeRole(['employer']), JobController.getAIMatches);

// ---------------- PUBLIC / AUTHENTICATED ----------------
// Get single job details
router.get(
  '/:id',
  authenticate,
  JobController.getJobById
);

// List all jobs (optionally filtered inside controller/service)
router.get(
  '/',
  authenticate,
  JobController.listJobs
);

module.exports = router;