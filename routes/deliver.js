const express = require('express');
const router = express.Router();
const axios = require('axios');

let CRM_BASE_URL = process.env.CRM_BASE_URL || 'http://localhost:5000';
if (CRM_BASE_URL.endsWith('/')) {
  CRM_BASE_URL = CRM_BASE_URL.slice(0, -1);
}

// Helper to generate a random delay between min and max milliseconds
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to send the status webhook event back to CRM
async function sendCallbackReceipt(logId, status) {
  try {
    await axios.post(`${CRM_BASE_URL}/api/campaigns/receipt`, {
      logId,
      status,
      timestamp: new Date()
    });
  } catch (err) {
    console.error(`[Webhook Callback Failed] logId: ${logId}, status: ${status}. Error: ${err.message}`);
  }
}

// @route   POST /api/deliver
// @desc    Initiate messaging delivery and trigger async lifecycle timers
router.post('/deliver', (req, res) => {
  const { logId, recipient, channel } = req.body;

  if (!logId) {
    return res.status(400).json({ error: 'logId is required' });
  }

  // 1. Immediately return 200 Accepted to allow non-blocking CRM execution
  res.json({ accepted: true });

  // 2. Start the asynchronous simulation in the background
  setTimeout(async () => {
    // Stage 1: Delivered or Failed
    // Deterministic test case: if phone/recipient ends with '0', fail delivery.
    // Otherwise, simulate a 15% random transient failure rate.
    const shouldFail = String(recipient).endsWith('0') || Math.random() < 0.15;
    
    if (shouldFail) {
      console.log(`[Simulation] Delivery failed for ${recipient}. Triggering webhook fail receipt.`);
      await sendCallbackReceipt(logId, 'failed');
      return;
    }

    await sendCallbackReceipt(logId, 'delivered');

    // Stage 2: Opened (60%) after 3s - 8s
    setTimeout(async () => {
      const isOpened = Math.random() < 0.60;
      if (!isOpened) return;

      await sendCallbackReceipt(logId, 'opened');

      // Stage 3: Read (70%) after 5s - 15s
      setTimeout(async () => {
        const isRead = Math.random() < 0.70;
        if (!isRead) return;

        await sendCallbackReceipt(logId, 'read');

        // Stage 4: Clicked (30%) after 10s - 30s
        setTimeout(async () => {
          const isClicked = Math.random() < 0.30;
          if (!isClicked) return;

          await sendCallbackReceipt(logId, 'clicked');

          // Stage 5: Converted (20%) after 20s - 60s
          setTimeout(async () => {
            const isConverted = Math.random() < 0.20;
            if (!isConverted) return;

            await sendCallbackReceipt(logId, 'converted');
          }, randomDelay(20000, 60000));

        }, randomDelay(10000, 30000));

      }, randomDelay(5000, 15000));

    }, randomDelay(3000, 8000));

  }, randomDelay(500, 2000));
});

module.exports = router;
