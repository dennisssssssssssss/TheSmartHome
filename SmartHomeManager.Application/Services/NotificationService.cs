using AutoMapper;
using SmartHomeManager.Common;
using SmartHomeManager.Dtos;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notifications;
        private readonly IMapper _mapper;
        private readonly IRealtimeEventPublisher _realtimeEventPublisher;

        public NotificationService(
            INotificationRepository notifications,
            IMapper mapper,
            IRealtimeEventPublisher realtimeEventPublisher)
        {
            _notifications = notifications;
            _mapper = mapper;
            _realtimeEventPublisher = realtimeEventPublisher;
        }

        public async Task<ServiceResult<IReadOnlyList<NotificationReadDto>>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            var notifications = await _notifications.GetAllOrderedAsync(cancellationToken);
            return ServiceResult<IReadOnlyList<NotificationReadDto>>.Success(
                _mapper.Map<IReadOnlyList<NotificationReadDto>>(notifications));
        }

        public async Task<ServiceResult> MarkAsReadAsync(int id, CancellationToken cancellationToken = default)
        {
            var notification = await _notifications.GetByIdAsync(id, cancellationToken);
            if (notification == null)
            {
                return ServiceResult.NotFound("Notification was not found.");
            }

            notification.Read = true;
            _notifications.Update(notification);
            await _notifications.SaveChangesAsync(cancellationToken);
            await _realtimeEventPublisher.PublishNotificationsUpdatedAsync(cancellationToken);

            return ServiceResult.Success();
        }

        public async Task<ServiceResult> MarkAllAsReadAsync(CancellationToken cancellationToken = default)
        {
            await _notifications.MarkAllAsReadAsync(cancellationToken);
            await _realtimeEventPublisher.PublishNotificationsUpdatedAsync(cancellationToken);
            return ServiceResult.Success();
        }

        public async Task<ServiceResult> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var notification = await _notifications.GetByIdAsync(id, cancellationToken);
            if (notification == null)
            {
                return ServiceResult.NotFound("Notification was not found.");
            }

            _notifications.Delete(notification);
            await _notifications.SaveChangesAsync(cancellationToken);
            await _realtimeEventPublisher.PublishNotificationsUpdatedAsync(cancellationToken);
            return ServiceResult.Success();
        }
    }
}
