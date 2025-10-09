/**
 * Pusher Webhook for Vercel - MONITORING ONLY
 * Handles webhook requests for backend monitoring and logging
 * NO LONGER triggers Pusher events - use DirectPusherService instead
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

    console.log(`📱 Webhook action: ${action}`);
    console.log(`📱 Webhook requestData:`, JSON.stringify(requestData, null, 2));

    switch (action) {
      case 'send-enhanced-order-notification':
        return await handleEnhancedOrderNotification(req, res, requestData);
      case 'notify-order-accepted':
        return await handleOrderAccepted(req, res, requestData);
      case 'notify-order-status':
        return await handleOrderStatus(req, res, requestData);
      case 'order-status-update':
        return await handleOrderStatusUpdate(req, res, requestData);
      case 'location-update':
        return await handleRiderLocationUpdate(req, res, requestData);
      case 'broadcast-rider-status':
        return await handleBroadcastRiderStatus(req, res, requestData);
      case 'notify-new-rider-online':
        return await handleNotifyNewRiderOnline(req, res, requestData);
      case 'test-notification':
        return await handleTestNotification(req, res, requestData);
      case 'order-completed':
        return await handleOrderCompleted(req, res, requestData);
      case 'payment-received':
        return await handlePaymentReceived(req, res, requestData);
      case 'rating-updated':
        return await handleRatingUpdated(req, res, requestData);
      case 'order-created':
        return await handleOrderCreated(req, res, requestData);
      case 'order-status-changed':
        return await handleOrderStatusChanged(req, res, requestData);
      case 'order-assigned':
        return await handleOrderAssigned(req, res, requestData);
      default:
        // Log unknown actions for monitoring
        console.log(`📊 [Webhook] Unknown action received: ${action}`, requestData);
        return res.status(400).json({
          error: 'Unknown action',
          action: action,
          logged: true,
          timestamp: Date.now()
        });
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

// Handle enhanced order notifications - MONITORING ONLY
async function handleEnhancedOrderNotification(req, res, data) {
  const { riderIds, orderData, onlineOnly = true } = data;

  console.log(`📊 [Webhook] Enhanced order notification logged: ${orderData?.orderId} to ${riderIds?.length || 0} riders (online only: ${onlineOnly})`);
  console.log(`� [Webhook] Order details:`, {
    orderId: orderData?.orderId,
    customerId: orderData?.customerId,
    estimatedPrice: orderData?.estimatedPrice,
    distance: orderData?.distance,
    urgency: orderData?.urgency
  });

  // Log notification for monitoring purposes only
  // Real-time notifications are now handled by DirectPusherService

  return res.status(200).json({
    success: true,
    action: 'enhanced-order-notification-logged',
    orderId: orderData?.orderId,
    ridersNotified: riderIds?.length || 0,
    logged: true,
    timestamp: Date.now()
  });
}

// Handle order accepted notifications - MONITORING ONLY
async function handleOrderAccepted(req, res, data) {
  const { customerId, orderData } = data;

  console.log(`📊 [Webhook] Order accepted logged: ${orderData?.orderId} by rider ${orderData?.riderId} for customer ${customerId}`);

  // Log event for monitoring purposes only
  // Real-time notifications are now handled by DirectPusherService

  return res.status(200).json({
    success: true,
    action: 'order-accepted-logged',
    orderId: orderData?.orderId,
    customerId: customerId,
    riderId: orderData?.riderId,
    logged: true,
    timestamp: Date.now()
  });
}

// Handle order status updates - MONITORING ONLY
async function handleOrderStatus(req, res, data) {
  const { customerId, riderId, orderData } = data;

  console.log(`📊 [Webhook] Order status logged: ${orderData?.orderId} → ${orderData?.status} (Customer: ${customerId}, Rider: ${riderId})`);

  return res.status(200).json({
    success: true,
    action: 'order-status-logged',
    orderId: orderData?.orderId,
    status: orderData?.status,
    customerId: customerId,
    riderId: riderId,
    logged: true,
    timestamp: Date.now()
  });
}

// Handle test notifications - MONITORING ONLY
async function handleTestNotification(req, res, data) {
  console.log(`📊 [Webhook] Test notification logged: ${data?.message || 'No message'}`);

  return res.status(200).json({
    success: true,
    action: 'test-notification-logged',
    message: data?.message || 'Test notification',
    logged: true,
    timestamp: Date.now()
  });
}

// Handle broadcast rider status updates - MONITORING ONLY
async function handleBroadcastRiderStatus(req, res, data) {
  const { riderId, statusData, affectedCustomers } = data;

  console.log(`� [Webhook] Rider status broadcast logged: Rider ${riderId} status update, affecting ${affectedCustomers?.length || 0} customers`);

  return res.status(200).json({
    success: true,
    action: 'rider-status-broadcast-logged',
    riderId: riderId,
    statusData: statusData,
    affectedCustomers: affectedCustomers?.length || 0,
    logged: true,
    timestamp: Date.now()
  });
}

// Handle new rider online notifications - MONITORING ONLY
async function handleNotifyNewRiderOnline(req, res, data) {
  const { customers, riderData } = data;

  console.log(`� [Webhook] New rider online notification logged: Rider ${riderData?.riderId} came online, notifying ${customers?.length || 0} customers`);

  return res.status(200).json({
    success: true,
    action: 'new-rider-online-logged',
    riderId: riderData?.riderId,
    notifiedCustomers: customers?.length || 0,
    logged: true,
    timestamp: Date.now()
  });
}

// Handle order completed notifications - MONITORING ONLY
async function handleOrderCompleted(req, res, data) {
  const { riderId, orderData } = data;

  console.log(`� [Webhook] Order completed notification logged: Rider ${riderId} completed order ${orderData?.orderId}`);

  return res.status(200).json({
    success: true,
    action: 'order-completed-logged',
    riderId: riderId,
    orderId: orderData?.orderId,
    logged: true,
    timestamp: Date.now()
  });
}

// Handle payment received notifications - MONITORING ONLY
async function handlePaymentReceived(req, res, data) {
  const { riderId, paymentData } = data;

  console.log(`� [Webhook] Payment received notification logged: Rider ${riderId} received $${paymentData?.amount} for order ${paymentData?.orderId}`);

  return res.status(200).json({
    success: true,
    action: 'payment-received-logged',
    riderId: riderId,
    orderId: paymentData?.orderId,
    amount: paymentData?.amount,
    logged: true,
    timestamp: Date.now()
  });
}

// Handle rating updated notifications - MONITORING ONLY
async function handleRatingUpdated(req, res, data) {
  const { riderId, ratingData } = data;

  console.log(`� [Webhook] Rating updated notification logged: Rider ${riderId} received ${ratingData?.rating}-star rating`);

  return res.status(200).json({
    success: true,
    action: 'rating-updated-logged',
    riderId: riderId,
    rating: ratingData?.rating,
    logged: true,
    timestamp: Date.now()
  });
}

// Handle order created notifications - MONITORING ONLY
async function handleOrderCreated(req, res, data) {
  const { orderData } = data;

  console.log(`� [Webhook] Order created notification logged: New ${orderData?.errandType} order ${orderData?.orderId} in ${orderData?.location}`);

  return res.status(200).json({
    success: true,
    action: 'order-created-logged',
    orderId: orderData?.orderId,
    errandType: orderData?.errandType,
    location: orderData?.location,
    logged: true,
    timestamp: Date.now()
  });
}

// Handle order status changed notifications - MONITORING ONLY
async function handleOrderStatusChanged(req, res, data) {
  const { orderData, previousStatus } = data;

  console.log(`� [Webhook] Order status changed notification logged: Order ${orderData?.orderId} changed from ${previousStatus} to ${orderData?.status}`);

  return res.status(200).json({
    success: true,
    action: 'order-status-changed-logged',
    orderId: orderData?.orderId,
    previousStatus: previousStatus,
    newStatus: orderData?.status,
    logged: true,
    timestamp: Date.now()
  });
}

// Handle order assigned notifications - MONITORING ONLY
async function handleOrderAssigned(req, res, data) {
  const { orderData } = data;

  console.log(`� [Webhook] Order assigned notification logged: Order ${orderData?.orderId} assigned to rider ${orderData?.riderId}`);

  return res.status(200).json({
    success: true,
    action: 'order-assigned-logged',
    orderId: orderData?.orderId,
    riderId: orderData?.riderId,
    logged: true,
    timestamp: Date.now()
  });
}

// Handle order status updates for real-time UI updates - MONITORING ONLY
async function handleOrderStatusUpdate(req, res, data) {
  const { customerId, riderId, orderData } = data;

  console.log(`� [Webhook] Order status update logged: Order ${orderData?.orderId} → ${orderData?.status} (Customer: ${customerId}, Rider: ${riderId})`);

  return res.status(200).json({
    success: true,
    action: 'order-status-update-logged',
    orderId: orderData?.orderId,
    status: orderData?.status,
    customerId: customerId,
    riderId: riderId,
    logged: true,
    timestamp: Date.now()
  });
}

// Handle rider location updates for real-time tracking - MONITORING ONLY
async function handleRiderLocationUpdate(req, res, data) {
  const { orderId, location } = data;

  console.log(`� [Webhook] Rider location update logged: Order ${orderId} location update`);

  return res.status(200).json({
    success: true,
    action: 'rider-location-update-logged',
    orderId: orderId,
    location: location,
    logged: true,
    timestamp: Date.now()
  });
}