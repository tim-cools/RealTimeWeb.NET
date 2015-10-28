using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNet.Identity;
using Soloco.ReactiveStarterKit.Membership.Domain;

namespace Soloco.ReactiveStarterKit.Membership.Services
{
    public class CustomUserStore : IUserStore<IdentityUser, Guid>, IUserPasswordStore<IdentityUser, Guid>, IUserLoginStore<IdentityUser, Guid>
    {
        private class Login
        {
            public Login(UserLoginInfo info, IdentityUser user)
            {
                User = user;
                Info = info;
            }

            public IdentityUser User { get; set; }
            public UserLoginInfo Info { get; set; }
        }

        private static readonly Dictionary<Guid, string> _usersPasswords = new Dictionary<Guid, string>();
        private static readonly List<Login> _usersLogin = new List<Login>();
        private static readonly Dictionary<Guid, IdentityUser> _users = new Dictionary<Guid, IdentityUser>();
        private static readonly Dictionary<Guid, Client> _clients = Configuration.BuildClientsList().ToDictionary(client => client.Id);
        private static readonly Dictionary<Guid, RefreshToken> _refreshTokens = new Dictionary<Guid, RefreshToken>();

        public CustomUserStore()
        {
            if (_users.Count == 0)
            {
                Init().Wait();
            }
        }

        private async Task Init()
        {
            var user = new IdentityUser("123456");
            await CreateAsync(user);

            var hasher = new PasswordHasher();
            await SetPasswordHashAsync(user, hasher.HashPassword("123456"));
        }

        public void Dispose()
        {
        }

        public async Task CreateAsync(IdentityUser user)
        {
            _users.Add(user.Id, user);
        }

        public async Task UpdateAsync(IdentityUser user)
        {
            _users[user.Id] = user;
        }

        public async Task DeleteAsync(IdentityUser user)
        {
            _users.Remove(user.Id);
        }

        public async Task<IdentityUser> FindByIdAsync(Guid userId)
        {
            IdentityUser user;
            _users.TryGetValue(userId, out user);
            return user;
        }

        public async Task<IdentityUser> FindByNameAsync(string userName)
        {
            return _users.Values.SingleOrDefault(user => user.UserName == userName);
        }

        public Client FindClientByKey(string clientKey)
        {
            return _clients.Values.SingleOrDefault(client => client.Key == clientKey);
        }

        public RefreshToken RefreshTokensBySubjectAndClient(string subject, string clientKey)
        {
            return _refreshTokens.Values.SingleOrDefault(where => where.ClientKey == clientKey && where.Subject == subject);
            //r => r.Subject == token.Subject && r.ClientId == token.ClientId).SingleOrDefault(
        }

        public async Task<bool> RefreshTokensAdd(RefreshToken token)
        {
            _refreshTokens.Add(token.Id, token);
            return true;
        }

        public async Task<RefreshToken> RefreshTokensFindAsync(string refreshTokenHash)
        {
            return _refreshTokens.Values.SingleOrDefault(where => where.Hash == refreshTokenHash);
        }

        public async Task<bool> RefreshTokenRemove(Guid refreshTokenId)
        {
            if (!_refreshTokens.ContainsKey(refreshTokenId))
            {
                return false;
            }

            _refreshTokens.Remove(refreshTokenId);
            return true;
        }

        public List<RefreshToken> RefreshTokensToList()
        {
            return _refreshTokens.Values.ToList();
        }

        public async Task SetPasswordHashAsync(IdentityUser user, string passwordHash)
        {
            _usersPasswords[user.Id] = passwordHash;
        }

        public async Task<string> GetPasswordHashAsync(IdentityUser user)
        {
            return _usersPasswords.ContainsKey(user.Id) ? _usersPasswords[user.Id] : null;
        }

        public async Task<bool> HasPasswordAsync(IdentityUser user)
        {
            return _usersPasswords.ContainsKey(user.Id);
        }

        public async Task AddLoginAsync(IdentityUser user, UserLoginInfo login)
        {
            _usersLogin.Add(new Login(login, user));
        }

        public async Task RemoveLoginAsync(IdentityUser user, UserLoginInfo login)
        {
            var entry =
                _usersLogin.SingleOrDefault(
                    where => user.Id == where.User.Id && where.Info.ProviderKey == login.ProviderKey);
            _usersLogin.Remove(entry);
        }

        public async Task<IList<UserLoginInfo>> GetLoginsAsync(IdentityUser user)
        {
            return _usersLogin.Where(@where => user.Id == @where.User.Id).Select(entry => entry.Info).ToList();
        }

        public async Task<IdentityUser> FindAsync(UserLoginInfo login)
        {
            var singleOrDefault = _usersLogin.SingleOrDefault(@where => login.ProviderKey == @where.Info.ProviderKey);
            return singleOrDefault != null ? singleOrDefault.User : null;
        }
    }
}
