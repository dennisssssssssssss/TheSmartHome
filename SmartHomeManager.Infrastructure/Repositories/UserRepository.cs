using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Infrastructure.Repositories
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(AppDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<User?> GetByUsernameAsync(string username, bool asNoTracking = false, CancellationToken cancellationToken = default)
        {
            var query = asNoTracking ? DbSet.AsNoTracking() : DbSet;
            return await query.SingleOrDefaultAsync(user => user.Username == username, cancellationToken);
        }

        public async Task<User?> GetByEmailAsync(string email, bool asNoTracking = false, CancellationToken cancellationToken = default)
        {
            var query = asNoTracking ? DbSet.AsNoTracking() : DbSet;
            return await query.SingleOrDefaultAsync(user => user.Email == email, cancellationToken);
        }
    }
}
