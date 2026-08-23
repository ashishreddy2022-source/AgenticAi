import { Notification } from '../models/Notification.js';

export class NotificationController {
  static async listNotifications(req, res, next) {
    try {
      const notifications = await Notification.find({ owner: req.user.id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const unreadCount = await Notification.countDocuments({
        owner: req.user.id,
        isRead: false
      });

      res.status(200).json({
        success: true,
        data: {
          notifications,
          unreadCount
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, owner: req.user.id },
        { $set: { isRead: true } },
        { new: true }
      );
      res.status(200).json({
        success: true,
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      await Notification.updateMany(
        { owner: req.user.id, isRead: false },
        { $set: { isRead: true } }
      );
      res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      next(error);
    }
  }
}
