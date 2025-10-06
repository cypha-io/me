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

    // Also send to order-specific channel for searching pages
    if (orderData.orderId) {
      promises.push(pusher.trigger(`order-${orderData.orderId}`, 'order-status-update', {
        ...notification,
        status: orderData.status,
        riderId: riderId
      }));
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

// Handle broadcast rider status updates
async function handleBroadcastRiderStatus(req, res, data) {
  const { riderId, statusData, affectedCustomers } = data;
  
  try {
    console.log(`📱 Broadcasting rider status for ${riderId}:`, statusData);
    
    const notification = {
      type: 'rider-status-update',
      riderId: riderId,
      statusData: statusData,
      timestamp: Date.now()
    };

    const promises = [];
    
    // Broadcast to general rider channel
    promises.push(pusher.trigger('rider-updates', 'status-change', notification));
    
    // If there are affected customers, notify them specifically
    if (affectedCustomers && affectedCustomers.length > 0) {
      affectedCustomers.forEach(customerId => {
        promises.push(pusher.trigger(`customer-${customerId}`, 'rider-status-update', notification));
      });
    }

    await Promise.all(promises);
    
    return res.json({ 
      success: true, 
      message: 'Rider status broadcast sent successfully',
      riderId: riderId,
      affectedCustomers: affectedCustomers?.length || 0
    });
  } catch (error) {
    console.error('📱 ❌ Error broadcasting rider status:', error);
    return res.status(500).json({ error: 'Failed to broadcast rider status' });
  }
}

// Handle new rider online notifications
async function handleNotifyNewRiderOnline(req, res, data) {
  const { customers, riderData } = data;
  
  try {
    console.log(`📱 Notifying customers about new rider online:`, riderData);
    
    const notification = {
      type: 'new-rider-online',
      title: 'New Rider Available',
      message: 'A new delivery person is now available in your area',
      riderData: riderData,
      timestamp: Date.now()
    };

    const promises = [];
    
    // Notify each customer in the area
    if (customers && customers.length > 0) {
      customers.forEach(customerId => {
        promises.push(pusher.trigger(`customer-${customerId}`, 'new-rider-online', notification));
      });
    }
    
    // Also broadcast to general customers channel
    promises.push(pusher.trigger('customer-updates', 'new-rider-online', notification));

    await Promise.all(promises);
    
    return res.json({ 
      success: true, 
      message: 'New rider online notification sent successfully',
      notifiedCustomers: customers?.length || 0
    });
  } catch (error) {
    console.error('📱 ❌ Error notifying new rider online:', error);
    return res.status(500).json({ error: 'Failed to notify new rider online' });
  }
}

// Handle order completed notifications
async function handleOrderCompleted(req, res, data) {
  const { riderId, orderData } = data;
  
  try {
    console.log(`📱 Sending order completed notification to rider ${riderId}`);
    
    const notification = {
      type: 'order-completed',
      title: 'Order Completed!',
      message: `You have successfully completed order #${orderData.orderId}`,
      orderData: orderData,
      timestamp: Date.now()
    };

    await pusher.trigger(`rider-${riderId}`, 'order-completed', notification);
    
    return res.json({ 
      success: true, 
      message: 'Order completed notification sent successfully',
      riderId: riderId
    });
  } catch (error) {
    console.error('📱 ❌ Error sending order completed notification:', error);
    return res.status(500).json({ error: 'Failed to send order completed notification' });
  }
}

// Handle payment received notifications
async function handlePaymentReceived(req, res, data) {
  const { riderId, paymentData } = data;
  
  try {
    console.log(`📱 Sending payment received notification to rider ${riderId}`);
    
    const notification = {
      type: 'payment-received',
      title: 'Payment Received!',
      message: `You received $${paymentData.amount} for order #${paymentData.orderId}`,
      paymentData: paymentData,
      timestamp: Date.now()
    };

    await pusher.trigger(`rider-${riderId}`, 'payment-received', notification);
    
    return res.json({ 
      success: true, 
      message: 'Payment received notification sent successfully',
      riderId: riderId
    });
  } catch (error) {
    console.error('📱 ❌ Error sending payment received notification:', error);
    return res.status(500).json({ error: 'Failed to send payment received notification' });
  }
}

// Handle rating updated notifications
async function handleRatingUpdated(req, res, data) {
  const { riderId, ratingData } = data;
  
  try {
    console.log(`📱 Sending rating updated notification to rider ${riderId}`);
    
    const notification = {
      type: 'rating-updated',
      title: 'New Rating Received!',
      message: `You received a ${ratingData.rating}-star rating`,
      ratingData: ratingData,
      timestamp: Date.now()
    };

    await pusher.trigger(`rider-${riderId}`, 'rating-updated', notification);
    
    return res.json({ 
      success: true, 
      message: 'Rating updated notification sent successfully',
      riderId: riderId
    });
  } catch (error) {
    console.error('📱 ❌ Error sending rating updated notification:', error);
    return res.status(500).json({ error: 'Failed to send rating updated notification' });
  }
}

// Handle order created notifications
async function handleOrderCreated(req, res, data) {
  const { orderData } = data;
  
  try {
    console.log(`📱 Broadcasting new order created: ${orderData.orderId}`);
    
    const notification = {
      type: 'order-created',
      title: 'New Order Available',
      message: `New ${orderData.errandType} order in ${orderData.location}`,
      orderData: orderData,
      timestamp: Date.now()
    };

    await pusher.trigger('order-updates', 'order-created', notification);
    
    return res.json({ 
      success: true, 
      message: 'Order created notification sent successfully',
      orderId: orderData.orderId
    });
  } catch (error) {
    console.error('📱 ❌ Error sending order created notification:', error);
    return res.status(500).json({ error: 'Failed to send order created notification' });
  }
}

// Handle order status changed notifications
async function handleOrderStatusChanged(req, res, data) {
  const { orderData, previousStatus } = data;
  
  try {
    console.log(`📱 Broadcasting order status changed: ${orderData.orderId} from ${previousStatus} to ${orderData.status}`);
    
    const notification = {
      type: 'order-status-changed',
      title: 'Order Status Updated',
      message: `Order #${orderData.orderId} status changed to ${orderData.status}`,
      orderData: orderData,
      previousStatus: previousStatus,
      status: orderData.status,
      timestamp: Date.now()
    };

    await pusher.trigger('order-updates', 'order-status-changed', notification);
    
    return res.json({ 
      success: true, 
      message: 'Order status changed notification sent successfully',
      orderId: orderData.orderId,
      status: orderData.status
    });
  } catch (error) {
    console.error('📱 ❌ Error sending order status changed notification:', error);
    return res.status(500).json({ error: 'Failed to send order status changed notification' });
  }
}

// Handle order assigned notifications
async function handleOrderAssigned(req, res, data) {
  const { orderData } = data;
  
  try {
    console.log(`📱 Broadcasting order assigned: ${orderData.orderId} to rider ${orderData.riderId}`);
    
    const notification = {
      type: 'order-assigned',
      title: 'Order Assigned',
      message: `Order #${orderData.orderId} has been assigned`,
      orderData: orderData,
      timestamp: Date.now()
    };

    await pusher.trigger('order-updates', 'order-assigned', notification);
    
    return res.json({ 
      success: true, 
      message: 'Order assigned notification sent successfully',
      orderId: orderData.orderId,
      riderId: orderData.riderId
    });
  } catch (error) {
    console.error('📱 ❌ Error sending order assigned notification:', error);
    return res.status(500).json({ error: 'Failed to send order assigned notification' });
  }
}

// Handle order status updates for real-time UI updates
async function handleOrderStatusUpdate(req, res, data) {
  const { customerId, riderId, orderData } = data;
  
  try {
    console.log(`📱 Sending order status update for order ${orderData.orderId} to status ${orderData.status}`);
    
    const notification = {
      type: 'order-status-update',
      title: 'Order Update',
      message: `Order status updated to ${orderData.status}`,
      data: orderData,
      timestamp: Date.now()
    };

    // Send to order-specific channel for tracking pages
    if (orderData.orderId) {
      await pusher.trigger(`order-${orderData.orderId}`, 'order-status-update', notification);
    }

    // Also send to customer and rider channels if available
    const promises = [];
    if (customerId) {
      promises.push(pusher.trigger(`customer-${customerId}`, 'order-status-update', notification));
    }
    if (riderId) {
      promises.push(pusher.trigger(`rider-${riderId}`, 'order-status-update', notification));
    }

    await Promise.all(promises);
    
    return res.json({ 
      success: true, 
      message: 'Order status update sent successfully',
      orderId: orderData.orderId,
      status: orderData.status
    });
  } catch (error) {
    console.error('📱 ❌ Error sending order status update:', error);
    return res.status(500).json({ error: 'Failed to send order status update' });
  }
}

// Handle rider location updates for real-time tracking
async function handleRiderLocationUpdate(req, res, data) {
  const { orderId, location } = data;
  
  try {
    console.log(`📱 Sending rider location update for order ${orderId}`);
    
    const locationData = {
      type: 'location-update',
      orderId: orderId,
      location: location,
      timestamp: Date.now()
    };

    // Send to rider channel if we have rider info, or broadcast to order channel
    // For now, we'll send to order channel since tracking page listens there
    if (orderId) {
      await pusher.trigger(`order-${orderId}`, 'location-update', locationData);
    }
    
    return res.json({ 
      success: true, 
      message: 'Rider location update sent successfully',
      orderId: orderId,
      location: location
    });
  } catch (error) {
    console.error('📱 ❌ Error sending rider location update:', error);
    return res.status(500).json({ error: 'Failed to send rider location update' });
  }
}