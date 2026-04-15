require('dotenv').config();
const axios = require('axios');
const { Job, Transaction, User } = require('../../models');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
const COMMISSION_RATE = 0.15;

const initializePayment = async (job_id, employer_id) => {
  const job = await Job.findByPk(job_id);
  if (!job) throw new Error('Job not found');
  if (job.employer_id !== employer_id) throw new Error('Unauthorized');

  const existingTx = await Transaction.findOne({ where: { job_id } });
  if (existingTx && existingTx.status === 'Success') {
    throw new Error('Job already paid');
  }

  const employer = await User.findByPk(employer_id);
  if (!employer) throw new Error('Employer not found');

  const jobFee = job.budget_max; 
  const commission = jobFee * COMMISSION_RATE;
  const total = jobFee + commission;

  const response = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    {
      email: employer.email,
      amount: Math.round(total * 100),
      metadata: { job_id }
    },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.data.status) throw new Error('Failed to initialize payment');

  const tx = await Transaction.create({
    paystack_reference: response.data.data.reference,
    job_id: job.id,
    payer_id: employer_id,
    payee_id: null, // worker to be assigned later
    amount: jobFee,
    commission_amount: commission,
    transaction_type: 'Payment_In',
    status: 'Pending'
  });

  return response.data.data.authorization_url;
};

module.exports = { initializePayment };