require('dotenv').config();
const axios = require('axios');
const { sequelize, Transaction, WorkerProfile } = require('../../models');
const smsService = require('../notifications/sms.service');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

const executePayout = async (transaction_id) => {
  return await sequelize.transaction(async (t) => {
    const tx = await Transaction.findByPk(transaction_id, { transaction: t });
    if (!tx) throw new Error('Transaction not found');
    if (tx.status !== 'Success') throw new Error('Payment not completed');
    if (tx.payee_id === null) throw new Error('Worker not assigned for payout');

    const workerProfile = await WorkerProfile.findOne({
      where: { user_id: tx.payee_id },
      transaction: t
    });

    if (!workerProfile?.transfer_recipient_code) {
      throw new Error('Worker payout account not configured');
    }

    const payoutAmount = tx.amount - tx.commission_amount;

    let attempts = 0;
    let success = false;

    while (attempts < 3 && !success) {
      try {
        const response = await axios.post(
          'https://api.paystack.co/transfer',
          {
            source: "balance",
            amount: Math.round(payoutAmount * 100),
            recipient: workerProfile.transfer_recipient_code,
            reason: `TradeLink payout for job ${tx.job_id}`
          },
          {
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (response.data.status) success = true;
      } catch (err) {
        attempts++;
        if (attempts === 3) throw new Error('Payout failed after retries');
      }
    }

    tx.worker_payout = payoutAmount;
    tx.payout_initiated_at = new Date();
    tx.payout_completed_at = new Date();
    await tx.save({ transaction: t });

    await smsService.send(
      tx.payee_id,
      `Payout of ₦${payoutAmount} initiated.`
    );

    return tx;
  });
};

module.exports = { executePayout };