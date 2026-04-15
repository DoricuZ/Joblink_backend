const paymentService = require('../services/payment.service');
const Transaction = require('../../models');

class PaymentController {
  static async initializePayment(req, res, next) {
    try {
      const { job_id } = req.body;
      const employer_id = req.user.id;

      const authorization_url = await paymentService.initializePayment(job_id, employer_id);

      res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        data: { authorization_url }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getJobPayment(req, res){
  const { jobId } = req.params;

  const transaction = await Transaction.findOne({
    where: { job_id: jobId }
  });

  if (!transaction) {
    return res.status(404).json({ success: false });
  }

  res.json({ success: true, data: transaction });
};
}

module.exports = PaymentController;