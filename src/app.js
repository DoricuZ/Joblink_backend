const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');


// Routes

const authRoutes = require('./routes/auth.routes');
const jobRoutes = require('./routes/jobs.routes');
const workerRoutes = require('./routes/workers.routes');
const employerRoutes = require('./routes/employers.routes');
const paymentRoutes = require('./routes/payments.routes');

// Middleware
const errorHandler = require('./middleware/error.middleware');
const notFound = require('./middleware/notFound.middleware');

const app = express();

// Global Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'TradeLink Backend Running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/payments', paymentRoutes);

// Not Found Middleware
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
