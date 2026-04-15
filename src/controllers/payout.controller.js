const payoutService = require('../services/payout.service');

class PayoutController {
  static async executePayout(req, res, next) {
    try {
      const transaction_id = req.params.transactionId;

      const tx = await payoutService.executePayout(transaction_id);

      res.status(200).json({
        success: true,
        message: 'Payout executed successfully',
        data: {
          transaction_id: tx.id,
          worker_payout: tx.worker_payout,
          payout_initiated_at: tx.payout_initiated_at
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PayoutController;