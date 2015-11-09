using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Store;
using Soloco.ReactiveStarterKit.Membership.Domain;

namespace Soloco.ReactiveStarterKit.Membership.Services
{
    public class UserStore : IUserStore<IdentityUser, Guid>, IUserPasswordStore<IdentityUser, Guid>, IUserLoginStore<IdentityUser, Guid>
    {
        private readonly IDocumentSession _session;

        public UserStore(IDocumentSession session)
        {
            if (session == null) throw new ArgumentNullException(nameof(session));

            _session = session;
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
            _session.Store(user);
        }

        public async Task DeleteAsync(IdentityUser user)
        {
            //_users.Remove(user.Id);
            throw new NotImplementedException();
        }

        public async Task<IdentityUser> FindByIdAsync(Guid userId)
        {
            return _session.Load<IdentityUser>(userId);
        }

        public async Task<IdentityUser> FindByNameAsync(string userName)
        {
            var identityUser = _session.GetFirst<IdentityUser>(user => user.UserName == userName);
            return identityUser;
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
            var entity = new Domain.UserLogin
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                LoginProvider = login.LoginProvider,
                ProviderKey = login.ProviderKey
            };

            _session.Store(entity);
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
            var userLogin = _session.GetFirst<UserLogin>(criteria => criteria.ProviderKey == login.ProviderKey);
            return userLogin != null ? await FindByIdAsync(userLogin.UserId) : null;
        }
    }
}
