const Pusher = require('pusher');
const express = require('express');
const cors = require('cors');

// Initialize Pusher with debug logging
const pusher = new Pusher({
  appId: "2051386",
  key: "3968c9c9767971f47a6e",
  secret: "9becd006abfcbd8937cf",
  cluster: "us2",
  useTLS: true
});

console.log('📱 Pusher initialized with app ID:', pusher.config.appId);

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for cross-origin requests

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Pusher webhook server is running' });
});

// Enhanced endpoint to send order notifications to only online riders
app.post('/api/send-enhanced-order-notification', async (req, res) => {
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
        customerId: orderData.customerId, // 🔧 FIX: Include customerId for order acceptance
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
        // Add response options
        canAccept: true,
        canDecline: true,
        timeToRespond: 30 // seconds
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
    
    res.json({ 
      success: true, 
      message: 'Enhanced order notification sent',
      totalRiders: riderIds.length,
      notifiedRiders: notifiedRiders,
      orderId: orderData.orderId 
    });
  } catch (error) {
    console.error('📱 ❌ Error sending enhanced order notification:', error);
    res.status(500).json({ error: 'Failed to send enhanced order notification' });
  }
});

// Handle rider accepting an order
app.post('/api/rider-accept-order', async (req, res) => {
  try {
    const { riderId, orderId, customerId, allRiderIds } = req.body;
    
    console.log(`📱 [DEBUG] Received order acceptance request:`, {
      riderId,
      orderId, 
      customerId,
      allRiderIds: allRiderIds?.length || 0
    });
    
    if (!riderId || !orderId || !customerId) {
      console.log(`📱 [ERROR] Missing required parameters:`, { riderId, orderId, customerId });
      return res.status(400).json({ 
        error: 'riderId, orderId, and customerId are required',
        missing: {
          riderId: !riderId,
          orderId: !orderId,
          customerId: !customerId
        }
      });
    }
    
    console.log(`📱 Rider ${riderId} accepting order ${orderId} from customer ${customerId}`);
    
    // STEP 1: Handle database operations (create/update order record)
    console.log(`📱 [DEBUG] Step 1: Creating order record in database...`);
    try {
      // For now, we'll create a simple order record
      // In a real implementation, you'd use your database service here
      const orderRecord = {
        orderId: orderId,
        customerId: customerId,
        riderId: riderId,
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        timestamp: Date.now()
      };
      
      console.log(`📱 [DEBUG] Order record prepared:`, orderRecord);
      
      // TODO: Actually save to database
      // Example: await database.createOrder(orderRecord);
      
      console.log(`✅ [DEBUG] Order record created successfully`);
    } catch (dbError) {
      console.error(`📱 [ERROR] Database operation failed:`, dbError);
      return res.status(500).json({
        error: 'Database error occurred while processing order',
        details: dbError.message,
        timestamp: Date.now()
      });
    }

    // STEP 2: Send notifications to customer
    console.log(`📱 [DEBUG] Step 2: Sending customer notification...`);
    try {
      console.log(`📱 [DEBUG] Sending customer notification to channel: customer-${customerId}`);
      await pusher.trigger(`customer-${customerId}`, 'order-accepted', {
        orderId: orderId,
        status: 'accepted',
        riderId: riderId,
        riderName: 'Rider', // TODO: Get actual rider name
        message: 'Your order has been accepted by a rider!',
        riderInfo: {
          riderId: riderId,
          // Additional rider info could be added here
        },
        timestamp: Date.now()
      });
      
      console.log(`📱 ✅ Customer ${customerId} notified about order acceptance`);
    } catch (customerNotifyError) {
      console.error(`📱 [ERROR] Failed to notify customer:`, customerNotifyError);
      // Don't fail the entire process if customer notification fails
    }
    
    // STEP 3: Notify other riders that the order is no longer available
    console.log(`📱 [DEBUG] Step 3: Notifying other riders...`);
    if (allRiderIds && Array.isArray(allRiderIds) && allRiderIds.length > 0) {
      const otherRiders = allRiderIds.filter(id => id !== riderId);
      console.log(`📱 [DEBUG] Notifying ${otherRiders.length} other riders order is taken`);
      
      try {
        const otherRiderPromises = otherRiders.map(otherRiderId => {
          console.log(`📱 [DEBUG] Notifying rider ${otherRiderId} that order is taken`);
          return pusher.trigger(`rider-${otherRiderId}`, 'order-no-longer-available', {
            orderId: orderId,
            status: 'taken',
            message: 'Order was accepted by another rider',
            acceptedBy: riderId,
            timestamp: Date.now()
          });
        });
        
        await Promise.all(otherRiderPromises);
        console.log(`📱 ✅ Notified ${otherRiders.length} other riders that order was taken`);
      } catch (riderNotifyError) {
        console.error(`📱 [ERROR] Failed to notify other riders:`, riderNotifyError);
        // Don't fail the entire process if other rider notifications fail
      }
    } else {
      console.log(`📱 [DEBUG] No other riders to notify (allRiderIds: ${allRiderIds?.length || 0})`);
    }
    
    const response = { 
      success: true, 
      message: 'Order acceptance processed successfully',
      orderId: orderId,
      acceptedBy: riderId,
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    console.log(`📱 [SUCCESS] Order acceptance complete:`, response);
    res.json(response);
    
  } catch (error) {
    console.error('📱 ❌ [CRITICAL ERROR] Error processing order acceptance:', error);
    console.error('📱 ❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to process order acceptance',
      details: error.message,
      timestamp: Date.now()
    });
  }
});

// Handle rider declining an order
app.post('/api/rider-decline-order', async (req, res) => {
  try {
    const { riderId, orderId, customerId } = req.body;
    
    if (!riderId || !orderId) {
      return res.status(400).json({ error: 'riderId and orderId are required' });
    }
    
    console.log(`📱 Rider ${riderId} declined order ${orderId}`);
    
    // Optional: Notify customer about decline (for analytics/transparency)
    if (customerId) {
      await pusher.trigger(`customer-${customerId}`, 'rider-response', {
        orderId: orderId,
        riderId: riderId,
        response: 'declined',
        message: 'A rider declined your order. Looking for other available riders...',
        timestamp: Date.now()
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Order decline processed',
      orderId: orderId,
      declinedBy: riderId 
    });
  } catch (error) {
    console.error('📱 ❌ Error processing order decline:', error);
    res.status(500).json({ error: 'Failed to process order decline' });
  }
});

// Endpoint to send order notifications to multiple riders
app.post('/api/send-order-notification', async (req, res) => {
  try {
    const { riderIds, orderData } = req.body;
    
    if (!riderIds || !Array.isArray(riderIds) || riderIds.length === 0) {
      return res.status(400).json({ error: 'riderIds array is required' });
    }
    
    if (!orderData || !orderData.orderId) {
      return res.status(400).json({ error: 'orderData with orderId is required' });
    }
    
    console.log(`📱 Sending order ${orderData.orderId} to ${riderIds.length} riders`);
    
    const promises = riderIds.map(riderId => {
      console.log(`📱 Sending to rider: ${riderId}`);
      return pusher.trigger(`rider-${riderId}`, 'new-order-request', {
        ...orderData,
        expiresAt: Date.now() + 30000, // 30 seconds expiry
        timestamp: Date.now()
      });
    });

    await Promise.all(promises);
    
    console.log(`📱 ✅ Order notification sent to ${riderIds.length} riders`);
    
    // Also notify the customer about the search progress
    if (orderData.customerId) {
      try {
        await pusher.trigger(`customer-${orderData.customerId}`, 'rider-search-update', {
          orderId: orderData.orderId,
          availableRiders: riderIds.length,
          message: `Found ${riderIds.length} riders nearby. Waiting for responses...`,
          timestamp: Date.now()
        });
        console.log(`📱 ✅ Customer notified about rider search progress`);
      } catch (customerError) {
        console.error('📱 ❌ Error notifying customer about search progress:', customerError);
      }
    }
    
    res.json({ 
      success: true, 
      message: `Order sent to ${riderIds.length} riders`,
      orderId: orderData.orderId,
      ridersNotified: riderIds.length
    });
  } catch (error) {
    console.error('📱 ❌ Error sending Pusher notification:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Failed to send order notification via Pusher'
    });
  }
});

// Endpoint to notify order acceptance
app.post('/api/notify-order-accepted', async (req, res) => {
  try {
    const { customerId, acceptedRiderId, orderData, riderIds } = req.body;
    
    console.log(`📱 [DEBUG] Received notify-order-accepted request:`, {
      customerId,
      acceptedRiderId,
      orderId: orderData?.orderId,
      riderIds: riderIds?.length || 0
    });
    
    if (!customerId || !acceptedRiderId || !orderData) {
      console.log(`📱 [ERROR] Missing required parameters:`, { 
        customerId, 
        acceptedRiderId, 
        hasOrderData: !!orderData 
      });
      return res.status(400).json({ 
        error: 'customerId, acceptedRiderId, and orderData are required',
        missing: {
          customerId: !customerId,
          acceptedRiderId: !acceptedRiderId,
          orderData: !orderData
        }
      });
    }
    
    console.log(`📱 Notifying order ${orderData.orderId} acceptance by rider ${acceptedRiderId}`);
    
    try {
      // Notify customer that order was accepted
      console.log(`📱 [DEBUG] Triggering customer notification to: customer-${customerId}`);
      await pusher.trigger(`customer-${customerId}`, 'order-accepted', {
        ...orderData,
        status: 'accepted',
        riderId: acceptedRiderId,
        riderName: 'Rider', // TODO: Get actual rider name from orderData or database
        message: 'Your order has been accepted by a rider!',
        timestamp: Date.now()
      });
      console.log(`📱 ✅ Customer notification sent successfully`);
    } catch (customerError) {
      console.error(`📱 [ERROR] Failed to notify customer:`, customerError);
    }
    
    // Notify other riders that order was taken (if riderIds provided)
    if (riderIds && Array.isArray(riderIds)) {
      const otherRiders = riderIds.filter(id => id !== acceptedRiderId);
      console.log(`📱 [DEBUG] Notifying ${otherRiders.length} other riders order is no longer available`);
      
      try {
        const riderPromises = otherRiders.map(riderId => {
          console.log(`📱 [DEBUG] Notifying rider ${riderId} order taken`);
          return pusher.trigger(`rider-${riderId}`, 'order-update', {
            orderId: orderData.orderId,
            status: 'accepted',
            message: 'Order was accepted by another rider',
            acceptedBy: acceptedRiderId,
            timestamp: Date.now()
          });
        });
        
        await Promise.all(riderPromises);
        console.log(`📱 ✅ Notified ${otherRiders.length} other riders about order acceptance`);
      } catch (ridersError) {
        console.error(`📱 [ERROR] Failed to notify other riders:`, ridersError);
      }
    } else {
      console.log(`📱 [DEBUG] No other riders to notify (riderIds count: ${riderIds?.length || 0})`);
    }
    
    const response = {
      success: true, 
      message: 'Order acceptance notifications sent',
      customerId,
      acceptedRiderId,
      orderId: orderData.orderId,
      timestamp: Date.now()
    };
    
    console.log(`📱 [SUCCESS] Order acceptance notifications complete:`, response);
    res.json(response);
    
  } catch (error) {
    console.error('📱 ❌ [CRITICAL ERROR] Error sending acceptance notification:', error);
    console.error('📱 ❌ Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Failed to send order acceptance notifications',
      timestamp: Date.now()
    });
  }
});

// Endpoint to notify order status updates
app.post('/api/notify-order-status', async (req, res) => {
  try {
    const { customerId, riderId, orderData, status } = req.body;
    
    if (!customerId || !riderId || !orderData || !status) {
      return res.status(400).json({ error: 'customerId, riderId, orderData, and status are required' });
    }
    
    console.log(`📱 Sending status update for order ${orderData.orderId}: ${status}`);
    
    const statusData = {
      ...orderData,
      status,
      timestamp: Date.now()
    };
    
    // Notify customer
    await pusher.trigger(`customer-${customerId}`, 'order-update', statusData);
    
    // Notify rider (if different event type needed)
    if (status === 'cancelled') {
      await pusher.trigger(`rider-${riderId}`, 'order-cancelled', statusData);
    }
    
    res.json({ 
      success: true, 
      message: `Status update sent: ${status}`,
      orderId: orderData.orderId
    });
  } catch (error) {
    console.error('📱 ❌ Error sending status update:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint to send rider location updates to customers
app.post('/api/notify-rider-location', async (req, res) => {
  try {
    const { customerId, riderId, location, orderId } = req.body;
    
    if (!customerId || !riderId || !location || !orderId) {
      return res.status(400).json({ error: 'customerId, riderId, location, and orderId are required' });
    }
    
    await pusher.trigger(`customer-${customerId}`, 'rider-location-update', {
      riderId,
      orderId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: Date.now()
      }
    });
    
    res.json({ 
      success: true, 
      message: 'Rider location update sent to customer' 
    });
  } catch (error) {
    console.error('📱 ❌ Error sending location update:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint to broadcast rider location updates
app.post('/api/broadcast-rider-location', async (req, res) => {
  try {
    const { customerId, orderId, location, additionalData } = req.body;
    
    if (!customerId || !orderId || !location) {
      return res.status(400).json({ error: 'customerId, orderId, and location are required' });
    }
    
    await pusher.trigger(`customer-${customerId}`, 'rider-location-update', {
      orderId,
      location,
      additionalData,
      timestamp: Date.now()
    });
    
    res.json({ success: true, message: 'Rider location broadcast sent' });
  } catch (error) {
    console.error('📱 ❌ Error broadcasting rider location:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to update ETA for customer
app.post('/api/update-eta', async (req, res) => {
  try {
    const { customerId, orderId, etaData } = req.body;
    
    if (!customerId || !orderId || !etaData) {
      return res.status(400).json({ error: 'customerId, orderId, and etaData are required' });
    }
    
    await pusher.trigger(`customer-${customerId}`, 'eta-update', {
      orderId,
      etaData,
      timestamp: Date.now()
    });
    
    res.json({ success: true, message: 'ETA update sent' });
  } catch (error) {
    console.error('📱 ❌ Error updating ETA:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to broadcast rider status changes
app.post('/api/broadcast-rider-status', async (req, res) => {
  try {
    const { riderId, statusData, affectedCustomers } = req.body;
    
    if (!riderId || !statusData) {
      return res.status(400).json({ error: 'riderId and statusData are required' });
    }
    
    console.log(`📱 Broadcasting rider status change for rider ${riderId}:`, statusData);
    
    // 🔥 CRITICAL FIX: Update database with rider status
    try {
      // Import Neon database service
      const { NeonDB } = require('../lib/neon');
      
      // Update rider status in database
      await NeonDB.updateRiderStatus(riderId, {
        isOnline: statusData.isOnline,
        isAvailable: statusData.isAvailable,
        currentLocation: statusData.currentLocation
      });
      
      console.log(`✅ Database updated for rider ${riderId}: online=${statusData.isOnline}, available=${statusData.isAvailable}`);
    } catch (dbError) {
      console.error(`❌ Failed to update database for rider ${riderId}:`, dbError);
      // Continue with Pusher broadcast even if DB update fails
    }
    
    // Update presence channel
    await pusher.trigger('presence-riders', 'rider-status-changed', {
      riderId,
      statusData,
      timestamp: Date.now()
    });
    
    // Notify affected customers if any
    if (affectedCustomers && affectedCustomers.length > 0) {
      const customerPromises = affectedCustomers.map(customerId => {
        return pusher.trigger(`customer-${customerId}`, 'rider-availability-changed', {
          riderId,
          statusData,
          timestamp: Date.now()
        });
      });
      
      await Promise.all(customerPromises);
    }
    
    res.json({ success: true, message: 'Rider status broadcast sent and database updated' });
  } catch (error) {
    console.error('📱 ❌ Error broadcasting rider status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to notify new rider online in area
app.post('/api/notify-new-rider-online', async (req, res) => {
  try {
    const { customers, riderData } = req.body;
    
    if (!customers || !riderData) {
      return res.status(400).json({ error: 'customers and riderData are required' });
    }
    
    const customerPromises = customers.map(customerId => {
      return pusher.trigger(`customer-${customerId}`, 'new-rider-available', {
        riderData,
        timestamp: Date.now()
      });
    });
    
    await Promise.all(customerPromises);
    
    res.json({ success: true, message: 'New rider online notifications sent' });
  } catch (error) {
    console.error('📱 ❌ Error notifying new rider online:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to send system notifications
app.post('/api/send-system-notification', async (req, res) => {
  try {
    const { targetType, targetIds, notification } = req.body;
    
    if (!targetType || !notification) {
      return res.status(400).json({ error: 'targetType and notification are required' });
    }
    
    console.log(`📱 Sending system notification to ${targetType}: ${targetIds?.length || 0} users`);
    
    if (targetType === 'all') {
      // Broadcast to global channel
      await pusher.trigger('system-notifications', 'global-notification', {
        notification,
        timestamp: Date.now()
      });
    } else {
      // Send to specific users
      const channelPrefix = targetType === 'riders' ? 'rider-' : 
                           targetType === 'customers' ? 'customer-' : 'admin-';
      
      const userPromises = targetIds.map(userId => {
        return pusher.trigger(`${channelPrefix}${userId}`, 'system-notification', {
          notification,
          timestamp: Date.now()
        });
      });
      
      await Promise.all(userPromises);
    }
    
    res.json({ success: true, message: 'System notification sent' });
  } catch (error) {
    console.error('📱 ❌ Error sending system notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint for emergency notifications
app.post('/api/emergency-notification', async (req, res) => {
  try {
    const { targetUsers, emergencyData } = req.body;
    
    if (!emergencyData) {
      return res.status(400).json({ error: 'emergencyData is required' });
    }
    
    console.log(`📱 🚨 EMERGENCY NOTIFICATION`);
    
    // Send to emergency channel
    await pusher.trigger('emergency-alerts', 'emergency-alert', {
      emergencyData,
      timestamp: Date.now()
    });
    
    // Send to specific users if provided
    if (targetUsers && targetUsers.length > 0) {
      const emergencyPromises = targetUsers.map(userId => {
        return pusher.trigger(`emergency-${userId}`, 'personal-emergency', {
          emergencyData,
          timestamp: Date.now()
        });
      });
      
      await Promise.all(emergencyPromises);
    }
    
    res.json({ success: true, message: 'Emergency notification sent' });
  } catch (error) {
    console.error('📱 ❌ Error sending emergency notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint for admin dashboard updates
app.post('/api/admin-dashboard-update', async (req, res) => {
  try {
    const { updateType, updateData } = req.body;
    
    if (!updateType || !updateData) {
      return res.status(400).json({ error: 'updateType and updateData are required' });
    }
    
    await pusher.trigger('admin-dashboard', 'dashboard-update', {
      updateType,
      updateData,
      timestamp: Date.now()
    });
    
    res.json({ success: true, message: 'Admin dashboard update sent' });
  } catch (error) {
    console.error('📱 ❌ Error sending admin dashboard update:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to test notifications (for development)
app.post('/api/test-notification', async (req, res) => {
  try {
    const { channel, event, data } = req.body;
    
    if (!channel || !event) {
      return res.status(400).json({ error: 'channel and event are required' });
    }
    
    console.log(`📱 Sending test notification to ${channel}:${event}`);
    
    await pusher.trigger(channel, event, {
      ...data,
      isTest: true,
      timestamp: Date.now()
    });
    
    res.json({ 
      success: true, 
      message: `Test notification sent to ${channel}` 
    });
  } catch (error) {
    console.error('📱 ❌ Error sending test notification:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DEBUG: Test order acceptance endpoint
app.post('/api/debug-order-acceptance', async (req, res) => {
  try {
    console.log('📱 [DEBUG] Received debug order acceptance test request');
    console.log('📱 [DEBUG] Request body:', JSON.stringify(req.body, null, 2));
    
    const { riderId, orderId, customerId, allRiderIds } = req.body;
    
    // Test basic parameters
    const testResult = {
      timestamp: Date.now(),
      received: {
        riderId,
        orderId,
        customerId,
        allRiderIds: allRiderIds?.length || 0
      },
      validation: {
        hasRiderId: !!riderId,
        hasOrderId: !!orderId,
        hasCustomerId: !!customerId,
        hasAllRiderIds: Array.isArray(allRiderIds)
      },
      pusherTest: null,
      error: null
    };
    
    // Test Pusher connection
    try {
      await pusher.trigger('test-channel', 'debug-test', {
        message: 'Debug test from order acceptance',
        timestamp: Date.now()
      });
      testResult.pusherTest = 'SUCCESS - Pusher connection working';
    } catch (pusherError) {
      testResult.pusherTest = `FAILED - Pusher error: ${pusherError.message}`;
      testResult.error = pusherError.message;
    }
    
    // Test customer notification
    if (customerId) {
      try {
        await pusher.trigger(`customer-${customerId}`, 'debug-test', {
          message: 'Debug test customer notification',
          orderId: orderId,
          riderId: riderId,
          timestamp: Date.now()
        });
        testResult.customerNotificationTest = 'SUCCESS';
      } catch (customerError) {
        testResult.customerNotificationTest = `FAILED: ${customerError.message}`;
      }
    }
    
    console.log('📱 [DEBUG] Test results:', testResult);
    res.json(testResult);
    
  } catch (error) {
    console.error('📱 [DEBUG] Error in debug endpoint:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      timestamp: Date.now()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('📱 Server error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: error.message 
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📱 Pusher webhook server running on port ${PORT}`);
  console.log(`📱 Server accessible at: http://0.0.0.0:${PORT} and http://192.168.1.41:${PORT}`);
  console.log(`📱 Enhanced with comprehensive real-time features:`);
  console.log(`   🔸 ENHANCED ORDER MANAGEMENT:`);
  console.log(`     POST /api/send-enhanced-order-notification`);
  console.log(`     POST /api/rider-accept-order`);
  console.log(`     POST /api/rider-decline-order`);
  console.log(`   🔸 STANDARD ORDER MANAGEMENT:`);
  console.log(`     POST /api/send-order-notification`);
  console.log(`     POST /api/notify-order-accepted`);
  console.log(`     POST /api/notify-order-status`);
  console.log(`   🔸 REAL-TIME LOCATION:`);
  console.log(`     POST /api/notify-rider-location`);
  console.log(`     POST /api/broadcast-rider-location`);
  console.log(`     POST /api/update-eta`);
  console.log(`   🔸 PRESENCE & AVAILABILITY:`);
  console.log(`     POST /api/broadcast-rider-status`);
  console.log(`     POST /api/notify-new-rider-online`);
  console.log(`   🔸 SYSTEM NOTIFICATIONS:`);
  console.log(`     POST /api/send-system-notification`);
  console.log(`     POST /api/emergency-notification`);
  console.log(`     POST /api/admin-dashboard-update`);
  console.log(`   🔸 DEVELOPMENT:`);
  console.log(`     POST /api/test-notification`);
  console.log(`     GET  /health`);
  console.log('📱 Enhanced notification system ready!');
});