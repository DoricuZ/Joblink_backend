const webhookService = require('../services/webhook.service');

class WebhookController {

  // Handle Paystack webhook
  // Paystack calls this URL server-to-server
  
  static async handleWebhook(req, res, next) {
    try {
      await webhookService.verifyWebhook(req);

      // Respond quickly to Paystack
      res.status(200).json({ status: true, message: 'Webhook processed' });
    } catch (error) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ status: false, message: error.message });
    }
  }
}

module.exports = WebhookController;

