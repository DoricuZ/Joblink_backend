require('dotenv').config();
const crypto = require('crypto');
const { Transaction, Job, User } = require('../../models');
const smsService = require('../notifications/sms.service');

const verifyWebhook = async (req) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    throw new Error('Invalid signature');
  }

  const event = req.body;
  if (event.event !== 'charge.success') return;

  const reference = event.data.reference;

  const tx = await Transaction.findOne({ where: { paystack_reference: reference } });

  if (!tx) throw new Error('Transaction not found');

  if (tx.status === 'Success') return; // idempotent

  tx.status = 'Success';
  await tx.save();

  const job = await Job.findByPk(tx.job_id);
  if (!job) throw new Error('Job not found');

  job.status = 'In_Progress';
  await job.save();

  // SMS Notification to worker
  if (job.worker_id) {
    await smsService.send(
      job.worker_id,
      `You have received a new paid job.`
    );
  }
};

module.exports = { verifyWebhook };