/**
 * Direct Pusher API Endpoint
 * Client-side interface to DirectPusherService
 */

import { DirectPusherService } from '../direct-pusher-service.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    console.log(`📡 [DirectPusherAPI] Handling action: ${action}`);

    switch (action) {
      case 'sendEnhancedOrderNotification':
        const { riderIds, orderData, onlineOnly } = data;
        await DirectPusherService.sendEnhancedOrderNotification(riderIds, orderData, onlineOnly);
        return res.json({ success: true, message: 'Enhanced order notification sent' });

      case 'notifyOrderAccepted':
        const { customerId, acceptedRiderId, orderData: orderDataAccepted } = data;
        await DirectPusherService.notifyOrderStatusChanged(orderDataAccepted, 'pending', 'accepted');
        return res.json({ success: true, message: 'Order acceptance notification sent' });

      case 'notifyOrderStatusChange':
        const { orderData: orderDataStatus, newStatus } = data;
        const oldStatus = orderDataStatus.status || 'unknown';
        await DirectPusherService.notifyOrderStatusChanged(orderDataStatus, oldStatus, newStatus);
        return res.json({ success: true, message: 'Order status change notification sent' });

      case 'broadcastRiderLocation':
        const { orderId, riderId, location } = data;
        await DirectPusherService.notifyLocationUpdate(orderId, riderId || 'unknown', location);
        return res.json({ success: true, message: 'Rider location broadcast sent' });

      case 'broadcastRiderStatusChange':
        const { riderId: riderIdStatus, statusData } = data;
        const status = statusData.isOnline ? (statusData.isAvailable ? 'available' : 'busy') : 'offline';
        await DirectPusherService.notifyRiderStatusUpdate(riderIdStatus, status, statusData.currentLocation);
        return res.json({ success: true, message: 'Rider status broadcast sent' });

      case 'notifyNewRiderOnline':
        const { riderData } = data;
        await DirectPusherService.notifyNewRiderOnline(riderData.riderId || 'unknown', riderData);
        return res.json({ success: true, message: 'New rider online notification sent' });

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('❌ [DirectPusherAPI] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}