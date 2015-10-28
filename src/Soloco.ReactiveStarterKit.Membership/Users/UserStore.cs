using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Elephanet;
using Microsoft.AspNet.Identity;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Users.CommandHandlers;

namespace Soloco.ReactiveStarterKit.Membership.Users
{
    public class UserStore : IUserStore<IdentityUser, Guid>, IUserPasswordStore<IdentityUser, Guid>, IUserLoginStore<IdentityUser, Guid>
    {
        private readonly IDocumentSession _session;

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

        //private static readonly Dictionary<Guid, string> _usersPasswords = new Dictionary<Guid, string>();
        //private static readonly List<Login> _usersLogin = new List<Login>();
        //private static readonly Dictionary<Guid, IdentityUser> _users = new Dictionary<Guid, IdentityUser>();
        //private static readonly Dictionary<Guid, Client> _clients = Configuration.BuildClientsList().ToDictionary(client => client.Id);
        //private static readonly Dictionary<Guid, RefreshToken> _refreshTokens = new Dictionary<Guid, RefreshToken>();

        public UserStore(IDocumentSession session)
        {
            _session = session;

            //if (_users.Count == 0)
            //{
            //    Init().Wait();
            //}
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
            _session.Store(user);
        }

        public async Task UpdateAsync(IdentityUser user)
        {
            //_users[user.Id] = user;
            throw new NotImplementedException();
        }

        public async Task DeleteAsync(IdentityUser user)
        {
            //_users.Remove(user.Id);
            throw new NotImplementedException();
        }

        public async Task<IdentityUser> FindByIdAsync(Guid userId)
        {
            //IdentityUser user;
            //_users.TryGetValue(userId, out user);
            //return user;
            throw new NotImplementedException();
        }

        public async Task<IdentityUser> FindByNameAsync(string userName)
        {
            return _session.GetFirst<IdentityUser>(user => user.UserName == userName );
        }

        public Client FindClientByKey(string clientKey)
        {
            //return _clients.Values.SingleOrDefault(client => client.Key == clientKey);
            throw new NotImplementedException();
        }

        public RefreshToken RefreshTokensBySubjectAndClient(string subject, string clientKey)
        {
            //return _refreshTokens.Values.SingleOrDefault(where => where.ClientKey == clientKey && where.Subject == subject);
            throw new NotImplementedException();
        }

        public async Task<bool> RefreshTokensAdd(RefreshToken token)
        {
            //_refreshTokens.Add(token.Id, token);
            //return true;
            throw new NotImplementedException();
        }

        public async Task<RefreshToken> RefreshTokensFindAsync(string refreshTokenHash)
        {
            //return _refreshTokens.Values.SingleOrDefault(where => where.Hash == refreshTokenHash);
            throw new NotImplementedException();
        }

        public async Task<bool> RefreshTokenRemove(Guid refreshTokenId)
        {
            //if (!_refreshTokens.ContainsKey(refreshTokenId))
            //{
            //    return false;
            //}

            //_refreshTokens.Remove(refreshTokenId);
            //return true;
            throw new NotImplementedException();
        }

        public List<RefreshToken> RefreshTokensToList()
        {
            //return _refreshTokens.Values.ToList();
            throw new NotImplementedException();
        }

        public async Task SetPasswordHashAsync(IdentityUser user, string passwordHash)
        {
            var hash = _session.GetFirst<PasswordHash>(criteria => criteria.UserId == user.Id);
            if (hash != null)
            {
                hash.SetPassword(passwordHash);
                return;
            }

            CreatePasswordHash(user, passwordHash);
        }

        private void CreatePasswordHash(IdentityUser user, string passwordHash)
        {
            var hash = new PasswordHash(user.Id, passwordHash);
            _session.Store(hash);
        }

        public async Task<string> GetPasswordHashAsync(IdentityUser user)
        {
            var passwordHash = _session.GetFirst<PasswordHash>(hash => hash.UserId == user.Id);
            return passwordHash?.Hash;
        }

        public async Task<bool> HasPasswordAsync(IdentityUser user)
        {
            //return _usersPasswords.ContainsKey(user.Id);
            throw new NotImplementedException();
        }

        public async Task AddLoginAsync(IdentityUser user, UserLoginInfo login)
        {
            //_usersLogin.Add(new Login(login, user));
            throw new NotImplementedException();
        }

        public async Task RemoveLoginAsync(IdentityUser user, UserLoginInfo login)
        {
            //var entry =
            //    _usersLogin.SingleOrDefault(
            //        where => user.Id == where.User.Id && where.Info.ProviderKey == login.ProviderKey);
            //_usersLogin.Remove(entry);
            throw new NotImplementedException();
        }

        public async Task<IList<UserLoginInfo>> GetLoginsAsync(IdentityUser user)
        {
            //return _usersLogin.Where(@where => user.Id == @where.User.Id).Select(entry => entry.Info).ToList();
            throw new NotImplementedException();
        }

        public async Task<IdentityUser> FindAsync(UserLoginInfo login)
        {
            //var singleOrDefault = _usersLogin.SingleOrDefault(@where => login.ProviderKey == @where.Info.ProviderKey);
            //return singleOrDefault != null ? singleOrDefault.User : null;
            throw new NotImplementedException();
        }
    }
}
