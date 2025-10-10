/**
 * Direct Pusher Service for Real-time Updates
 * This service handles Pusher events triggered directly by backend operations
 * NOT through webhooks - webhooks are now only for monitoring/logging
 */

import Pusher from 'pusher';

// Initialize Pusher with environment variables
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "2051386",
  key: process.env.PUSHER_KEY || "3968c9c9767971f47a6e",
  secret: process.env.PUSHER_SECRET || "9becd006abfcbd8937cf",
  cluster: process.env.PUSHER_CLUSTER || "us2",
  useTLS: true
});

class DirectPusherService {
  /**
   * Trigger real-time events directly (not through webhooks)
   */

  // Order-related events
  static async notifyOrderCreated(orderData) {
    try {
      const notification = {
        type: 'order-created',
        orderId: orderData.id,
        customerId: orderData.customerId,
        status: orderData.status,
        createdAt: orderData.createdAt,
        timestamp: Date.now()
      };

      await pusher.trigger('order-updates', 'order-created', notification);
      console.log(`📡 [DirectPusher] Order created notification sent: ${orderData.id}`);
    } catch (error) {
      console.error('❌ [DirectPusher] Failed to send order created notification:', error);
    }
  }

  static async notifyOrderStatusChanged(orderData, oldStatus, newStatus) {
    try {
      const notification = {
        type: 'order-status-changed',
        orderId: orderData.id,
        customerId: orderData.customerId,
        riderId: orderData.riderId,
        oldStatus: oldStatus,
        newStatus: newStatus,
        changedAt: new Date().toISOString(),
        timestamp: Date.now()
      };

      // Notify on order-updates channel
      await pusher.trigger('order-updates', 'order-status-changed', notification);

      // Also notify on specific order channel
      await pusher.trigger(`order-${orderData.id}`, 'order-status-update', {
        orderId: orderData.id,
        status: newStatus,
        oldStatus: oldStatus,
        riderId: orderData.riderId,
        customerId: orderData.customerId,
        timestamp: Date.now()
      });

      // Notify customer if assigned
      if (orderData.customerId) {
        await pusher.trigger(`customer-${orderData.customerId}`, 'order-status-update', notification);
      }

      // Notify rider if assigned
      if (orderData.riderId) {
        await pusher.trigger(`rider-${orderData.riderId}`, 'order-status-update', notification);
      }

      console.log(`📡 [DirectPusher] Order status changed: ${orderData.id} (${oldStatus} → ${newStatus})`);
    } catch (error) {
      console.error('❌ [DirectPusher] Failed to send order status change notification:', error);
    }
  }

  static async notifyOrderAssigned(orderData) {
    try {
      const notification = {
        type: 'order-assigned',
        orderId: orderData.id,
        customerId: orderData.customerId,
        riderId: orderData.riderId,
        assignedAt: new Date().toISOString(),
        timestamp: Date.now()
      };

      await pusher.trigger('order-updates', 'order-assigned', notification);

      // Notify customer
      if (orderData.customerId) {
        await pusher.trigger(`customer-${orderData.customerId}`, 'order-assigned', notification);
      }

      // Notify rider
      if (orderData.riderId) {
        await pusher.trigger(`rider-${orderData.riderId}`, 'order-assigned', notification);
      }

      console.log(`📡 [DirectPusher] Order assigned: ${orderData.id} to rider ${orderData.riderId}`);
    } catch (error) {
      console.error('❌ [DirectPusher] Failed to send order assigned notification:', error);
    }
  }

  // Rider-related events
  static async notifyRiderStatusUpdate(riderId, status, location = null) {
    try {
      const notification = {
        type: 'rider-status-update',
        riderId: riderId,
        status: status,
        location: location,
        timestamp: Date.now()
      };

      // Notify all customers about rider status changes
      await pusher.trigger('rider-updates', 'status-change', notification);

      // Notify specific customers who have active orders with this rider
      // This would need to be implemented based on active orders

      console.log(`📡 [DirectPusher] Rider status updated: ${riderId} (${status})`);
    } catch (error) {
      console.error('❌ [DirectPusher] Failed to send rider status update:', error);
    }
  }

  static async notifyNewRiderOnline(riderId, riderData) {
    try {
      const notification = {
        type: 'new-rider-online',
        riderId: riderId,
        riderData: riderData,
        timestamp: Date.now()
      };

      // Notify all customers
      await pusher.trigger('customer-updates', 'new-rider-online', notification);

      console.log(`📡 [DirectPusher] New rider online: ${riderId}`);
    } catch (error) {
      console.error('❌ [DirectPusher] Failed to send new rider online notification:', error);
    }
  }

  // Enhanced order notifications (for matching system)
  static async sendEnhancedOrderNotification(riderIds, orderData, onlineOnly = true) {
    try {
      console.log(`📡 [DirectPusher] Sending enhanced order ${orderData.orderId} to ${riderIds.length} riders`);

      const enhancedNotification = {
        type: 'enhanced-order-request',
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

      const promises = riderIds.map(riderId =>
        pusher.trigger(`rider-${riderId}`, 'enhanced-order-request', enhancedNotification)
      );

      await Promise.all(promises);
      console.log(`📡 [DirectPusher] Enhanced order notifications sent to ${riderIds.length} riders`);
    } catch (error) {
      console.error('❌ [DirectPusher] Failed to send enhanced order notifications:', error);
    }
  }

  // Location updates
  static async notifyLocationUpdate(orderId, riderId, location) {
    try {
      const locationData = {
        type: 'location-update',
        orderId: orderId,
        riderId: riderId,
        location: location,
        timestamp: Date.now()
      };

      await pusher.trigger(`order-${orderId}`, 'location-update', locationData);
      console.log(`📡 [DirectPusher] Location update sent for order: ${orderId}`);
    } catch (error) {
      console.error('❌ [DirectPusher] Failed to send location update:', error);
    }
  }

  // Completion and payment events
  static async notifyOrderCompleted(riderId, orderData) {
    try {
      const notification = {
        type: 'order-completed',
        orderId: orderData.id,
        riderId: riderId,
        customerId: orderData.customerId,
        completedAt: new Date().toISOString(),
        earnings: orderData.riderEarnings,
        timestamp: Date.now()
      };

      await pusher.trigger(`rider-${riderId}`, 'order-completed', notification);
      console.log(`📡 [DirectPusher] Order completed notification sent: ${orderData.id}`);
    } catch (error) {
      console.error('❌ [DirectPusher] Failed to send order completed notification:', error);
    }
  }

  static async notifyPaymentReceived(riderId, orderData, amount) {
    try {
      const notification = {
        type: 'payment-received',
        orderId: orderData.id,
        riderId: riderId,
        customerId: orderData.customerId,
        amount: amount,
        receivedAt: new Date().toISOString(),
        timestamp: Date.now()
      };

      await pusher.trigger(`rider-${riderId}`, 'payment-received', notification);
      console.log(`📡 [DirectPusher] Payment received notification sent: ${orderData.id} ($${amount})`);
    } catch (error) {
      console.error('❌ [DirectPusher] Failed to send payment received notification:', error);
    }
  }

  static async notifyRatingUpdated(riderId, orderData, rating, review) {
    try {
      const notification = {
        type: 'rating-updated',
        orderId: orderData.id,
        riderId: riderId,
        customerId: orderData.customerId,
        rating: rating,
        review: review,
        updatedAt: new Date().toISOString(),
        timestamp: Date.now()
      };

      await pusher.trigger(`rider-${riderId}`, 'rating-updated', notification);
      console.log(`📡 [DirectPusher] Rating updated notification sent: ${orderData.id} (${rating} stars)`);
    } catch (error) {
      console.error('❌ [DirectPusher] Failed to send rating updated notification:', error);
    }
  }
}

module.exports = DirectPusherService;