using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Infrastructure.Repositories
{
    public class NotificationRepository : Repository<Notification>, INotificationRepository
    {
        public NotificationRepository(AppDbContext dbContext)
            : base(dbContext)
        {
        }

        public async Task<IReadOnlyList<Notification>> GetAllOrderedAsync(CancellationToken cancellationToken = default)
        {
            return await DbContext.Notifications
                .AsNoTracking()
                .OrderByDescending(notification => notification.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public Task<int> MarkAllAsReadAsync(CancellationToken cancellationToken = default)
        {
            return DbContext.Notifications
                .Where(notification => !notification.Read)
                .ExecuteUpdateAsync(setters => setters.SetProperty(notification => notification.Read, true), cancellationToken);
        }
    }
}
