/**
 * Pusher Webhook for Vercel
 * Handles all pusher webhook requests at /api/pusher-webhook
 * Converted from Express.js to Vercel serverless function
 */

import Pusher from 'pusher';

// Initialize Pusher with environment variables (fallback to hardcoded for now)
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

  console.log(`📱 Webhook called: ${req.method} ${req.url}`);
  console.log(`📱 Body:`, req.body);

  // Health check for GET requests
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      message: 'Pusher webhook server is running on Vercel',
      timestamp: Date.now(),
      pusherConfig: {
        appId: pusher.config.appId,
        cluster: pusher.config.cluster
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Handle different webhook actions based on the request body
  try {
    const { action, ...requestData } = req.body;

    switch (action) {
      case 'send-enhanced-order-notification':
        return await handleEnhancedOrderNotification(req, res, requestData);
      case 'notify-order-accepted':
        return await handleOrderAccepted(req, res, requestData);
      case 'notify-order-status':
        return await handleOrderStatus(req, res, requestData);
      case 'test-notification':
        return await handleTestNotification(req, res, requestData);
      default:
        // If no action specified, try to handle as enhanced order notification (backwards compatibility)
        if (requestData.riderIds && requestData.orderData) {
          return await handleEnhancedOrderNotification(req, res, requestData);
        }
        return res.status(400).json({ error: 'Unknown action or invalid request format' });
    }
  } catch (error) {
    console.error('📱 ❌ Webhook error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: Date.now()
    });
  }
}

// Handle enhanced order notifications
async function handleEnhancedOrderNotification(req, res, data) {
  const { riderIds, orderData, onlineOnly = true } = data;
  
  if (!riderIds || !Array.isArray(riderIds) || riderIds.length === 0) {
    return res.status(400).json({ error: 'riderIds array is required' });
  }
  
  if (!orderData || !orderData.orderId) {
    return res.status(400).json({ error: 'orderData with orderId is required' });
  }
  
  console.log(`📱 Sending enhanced order ${orderData.orderId} to ${riderIds.length} riders (online only: ${onlineOnly})`);
  
  let notifiedRiders = 0;
  const promises = [];
  
  for (const riderId of riderIds) {
    console.log(`📱 Preparing notification for rider: ${riderId}`);
    
    const enhancedNotification = {
      type: 'new-order-request',
      orderId: orderData.orderId,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      pickupAddress: orderData.pickupAddress,
      dropoffAddress: orderData.dropoffAddress,
      pickupLocation: orderData.pickupLocation,
      dropoffLocation: orderData.dropoffLocation,
      packageType: orderData.packageType,
      description: orderData.instructions || 'No additional instructions',
      estimatedPrice: orderData.estimatedPrice,
      riderEarnings: orderData.riderEarnings,
      distance: orderData.distance,
      estimatedDuration: orderData.estimatedDuration,
      urgency: orderData.urgency,
      customerPhone: orderData.customerPhone,
      expiresAt: orderData.expiresAt,
      timestamp: orderData.timestamp,
      notificationId: orderData.notificationId,
      canAccept: true,
      canDecline: true,
      timeToRespond: 30
    };
    
    const promise = pusher.trigger(`rider-${riderId}`, 'enhanced-order-request', enhancedNotification)
      .then(() => {
        console.log(`📱 ✅ Enhanced notification sent to rider ${riderId}`);
        notifiedRiders++;
      })
      .catch(error => {
        console.error(`📱 ❌ Failed to notify rider ${riderId}:`, error);
      });
    
    promises.push(promise);
  }

  await Promise.all(promises);
  
  console.log(`📱 ✅ Enhanced order notification sent to ${notifiedRiders}/${riderIds.length} riders`);
  
  return res.json({ 
    success: true, 
    message: 'Enhanced order notification sent',
    totalRiders: riderIds.length,
    notifiedRiders: notifiedRiders,
    orderId: orderData.orderId 
  });
}

// Handle order accepted notifications
async function handleOrderAccepted(req, res, data) {
  const { customerId, orderData } = data;
  
  if (!customerId || !orderData) {
    return res.status(400).json({ error: 'customerId and orderData are required' });
  }

  try {
    const notification = {
      type: 'order-accepted',
      title: 'Order Accepted!',
      message: `Your order has been accepted by ${orderData.riderName}`,
      data: orderData,
      timestamp: Date.now()
    };

    await pusher.trigger(`customer-${customerId}`, 'order-accepted', notification);
    
    return res.json({ success: true, message: 'Order accepted notification sent' });
  } catch (error) {
    console.error('📱 ❌ Error sending order accepted notification:', error);
    return res.status(500).json({ error: 'Failed to send order accepted notification' });
  }
}

// Handle order status updates
async function handleOrderStatus(req, res, data) {
  const { customerId, riderId, orderData } = data;
  
  try {
    const notification = {
      type: 'order-status-update',
      title: 'Order Update',
      message: `Your order status has been updated to: ${orderData.status}`,
      data: orderData,
      timestamp: Date.now()
    };

    const promises = [];
    
    if (customerId) {
      promises.push(pusher.trigger(`customer-${customerId}`, 'order-status-update', notification));
    }
    
    if (riderId) {
      promises.push(pusher.trigger(`rider-${riderId}`, 'order-status-update', notification));
    }

    await Promise.all(promises);
    
    return res.json({ success: true, message: 'Order status notification sent' });
  } catch (error) {
    console.error('📱 ❌ Error sending order status notification:', error);
    return res.status(500).json({ error: 'Failed to send order status notification' });
  }
}

// Handle test notifications
async function handleTestNotification(req, res, data) {
  try {
    const testNotification = {
      type: 'test-notification',
      title: 'Test Notification',
      message: data.message || 'This is a test notification from the webhook server',
      data: {
        test: true,
        timestamp: Date.now(),
        source: 'vercel-webhook'
      }
    };
    
    await pusher.trigger('test-channel', 'test-event', testNotification);
    
    return res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: testNotification
    });
  } catch (error) {
    console.error('📱 ❌ Error sending test notification:', error);
    return res.status(500).json({ error: 'Failed to send test notification' });
  }
}