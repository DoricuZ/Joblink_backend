const express = require('express');
const router = express.Router();

const WorkerController = require('../controllers/workerController');
const authenticate = require('../middleware/auth.middleware');
const authorizeRole = require('../middleware/authorizeRole');

router.post('/profile', authenticate, authorizeRole(['worker']), WorkerController.createWorkerProfile);
router.get('/profile', authenticate, authorizeRole(['worker']), WorkerController.getWorkerProfile);
router.put('/update', authenticate, authorizeRole(['worker']), WorkerController.updateWorkerProfile);
router.get('/:id', WorkerController.getWorkerById);
router.get('/', WorkerController.listAllWorkers);
router.get('/ai', authenticate, authorizeRole(['employer']), WorkerController.getWorkersForAI);

module.exports = router;