const express = require('express');
const router = express.Router();

const EmployerController = require('../controllers/employerController');
const authenticate = require('../middleware/auth.middleware');
const authorizeRole = require('../middleware/authorizeRole');
const multer = require('multer');

const upload = multer({ dest: 'uploads/logos/' });

router.post('/profile', authenticate, authorizeRole(['employer']), EmployerController.createEmployerProfile);
router.put('/updateEmployer', authenticate, authorizeRole(['employer']), EmployerController.updateEmployerProfile);
router.get('/profile', authenticate, authorizeRole(['employer']), EmployerController.getEmployerProfile);
router.get('/:id', EmployerController.getEmployerById);
router.get('/', EmployerController.listAllEmployers);
router.get('/ai', authenticate, authorizeRole(['employer']), EmployerController.getEmployersForAI);


router.post('/logo', upload.single('logo'), EmployerController.uploadLogo);

module.exports = router;