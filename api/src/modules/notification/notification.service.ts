import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

interface CreateNotificationDto {
  userId: number;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async findByUser(
    userId: number,
    options: { page?: number; limit?: number; unreadOnly?: boolean },
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = options;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (unreadOnly) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    const [items, total] = await queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    return {
      items,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...data,
      data: data.data || null,
      isRead: false,
    });
    return this.notificationRepository.save(notification);
  }

  async markAsRead(userId: number, notificationId: number): Promise<void> {
    const result = await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true },
    );

    if (result.affected === 0) {
      throw new NotFoundException('通知不存在');
    }
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async delete(userId: number, notificationId: number): Promise<void> {
    const result = await this.notificationRepository.delete({
      id: notificationId,
      userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('通知不存在');
    }
  }

  // 便捷方法：创建各类通知
  async notifyComment(
    postAuthorId: number,
    commenterName: string,
    postTitle: string,
    postId: number,
  ): Promise<Notification> {
    return this.create({
      userId: postAuthorId,
      type: NotificationType.COMMENT,
      title: '收到新评论',
      content: `${commenterName} 评论了你的文章《${postTitle}》`,
      data: { postId },
    });
  }

  async notifyReply(
    parentAuthorId: number,
    replyerName: string,
    postTitle: string,
    postId: number,
    commentId: number,
  ): Promise<Notification> {
    return this.create({
      userId: parentAuthorId,
      type: NotificationType.REPLY,
      title: '收到新回复',
      content: `${replyerName} 回复了你在《${postTitle}》中的评论`,
      data: { postId, commentId },
    });
  }

  async notifyLikePost(
    postAuthorId: number,
    likerName: string,
    postTitle: string,
    postId: number,
  ): Promise<Notification> {
    return this.create({
      userId: postAuthorId,
      type: NotificationType.LIKE_POST,
      title: '文章被点赞',
      content: `${likerName} 点赞了你的文章《${postTitle}》`,
      data: { postId },
    });
  }

  async notifyFollow(
    targetUserId: number,
    followerName: string,
    followerId: number,
  ): Promise<Notification> {
    return this.create({
      userId: targetUserId,
      type: NotificationType.FOLLOW,
      title: '新增关注者',
      content: `${followerName} 关注了你`,
      data: { followerId },
    });
  }

  async notifyAuditResult(
    userId: number,
    postTitle: string,
    approved: boolean,
    reason?: string,
    postId?: number,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.AUDIT_RESULT,
      title: approved ? '审核通过' : '审核未通过',
      content: approved
        ? `你的文章《${postTitle}》已通过审核`
        : `你的文章《${postTitle}》未通过审核，原因：${reason || '无'}`,
      data: { postId, approved, reason },
    });
  }
}
