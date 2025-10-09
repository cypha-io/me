/**
 * Test API endpoint to trigger order matching for development
 * This simulates what would happen when a customer creates a new order
 */

import { OrderMatchingService } from '../../errand/lib/orderMatchingService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    console.log(`🔄 [Test API] Triggering order matching for order: ${orderId}`);
    
    // Trigger the order matching process
    const result = await OrderMatchingService.matchOrderToRider(orderId);

    if (result.success) {
      console.log(`✅ [Test API] Order ${orderId} matched to rider ${result.matchedRiderId}`);
      return res.status(200).json({
        success: true,
        message: result.message,
        matchedRiderId: result.matchedRiderId
      });
    } else {
      console.log(`❌ [Test API] Failed to match order ${orderId}: ${result.message}`);
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('❌ [Test API] Error in order matching:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}