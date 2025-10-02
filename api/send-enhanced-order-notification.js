/**
 * Enhanced Order Notification Endpoint for Vercel
 * POST /api/send-enhanced-order-notification
 */

// This would normally import Pusher, but for Vercel deployment we'll use environment variables
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "2051386",
  key: process.env.PUSHER_KEY || "3968c9c9767971f47a6e",
  secret: process.env.PUSHER_SECRET || "9becd006abfcbd8937cf",
  cluster: process.env.PUSHER_CLUSTER || "us2",
  useTLS: true
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { riderIds, orderData, onlineOnly = true } = req.body;
    
    if (!riderIds || !Array.isArray(riderIds) || riderIds.length === 0) {
      return res.status(400).json({ error: 'riderIds array is required' });
    }
    
    if (!orderData || !orderData.orderId) {
      return res.status(400).json({ error: 'orderData with orderId is required' });
    }
    
    console.log(`📱 Sending enhanced order ${orderData.orderId} to ${riderIds.length} riders (online only: ${onlineOnly})`);
    
    // Track which riders are actually notified
    let notifiedRiders = 0;
    const promises = [];
    
    for (const riderId of riderIds) {
      console.log(`📱 Preparing notification for rider: ${riderId}`);
      
      // Enhanced order notification with detailed information
      const enhancedNotification = {
        type: 'new-order-request',
        orderId: orderData.orderId,
        title: 'New Order Available!',
        message: `Order from ${orderData.customerName || 'Customer'} - ${orderData.packageType || 'Package'}`,
        data: {
          orderId: orderData.orderId,
          customerId: orderData.customerId,
          customerName: orderData.customerName || 'Customer',
          packageType: orderData.packageType || 'Package',
          estimatedAmount: orderData.estimatedAmount || '0.00',
          distance: orderData.distance || '0.0 km',
          estimatedDuration: orderData.estimatedDuration || '0 min',
          urgency: orderData.urgency || 'normal',
          pickupLocation: orderData.pickupLocation || {},
          dropoffLocation: orderData.dropoffLocation || {},
          description: orderData.description || '',
          timestamp: Date.now(),
          expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes to respond
        },
        priority: orderData.urgency === 'urgent' ? 'high' : 'normal',
        sound: 'order_alert.wav',
        actions: [
          { id: 'accept', title: 'Accept Order', type: 'primary' },
          { id: 'decline', title: 'Decline', type: 'secondary' }
        ]
      };
      
      // Send to rider's specific channel
      const channelName = `rider-${riderId}`;
      
      try {
        const result = await pusher.trigger(channelName, 'new-order-request', enhancedNotification);
        console.log(`✅ Order notification sent to rider ${riderId}:`, result);
        notifiedRiders++;
        promises.push(Promise.resolve({ riderId, success: true }));
      } catch (error) {
        console.error(`❌ Failed to send notification to rider ${riderId}:`, error);
        promises.push(Promise.resolve({ riderId, success: false, error: error.message }));
      }
    }
    
    // Wait for all notifications to complete
    const results = await Promise.all(promises);
    
    const response = {
      success: true,
      message: `Enhanced order notification sent to ${notifiedRiders}/${riderIds.length} riders`,
      orderId: orderData.orderId,
      notifiedRiders,
      totalRiders: riderIds.length,
      results,
      timestamp: Date.now()
    };
    
    console.log(`✅ Enhanced order notification batch completed:`, response);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Error in enhanced order notification endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}