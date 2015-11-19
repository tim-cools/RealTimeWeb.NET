using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Store;
using Soloco.ReactiveStarterKit.Membership.Domain;

namespace Soloco.ReactiveStarterKit.Membership.Services
{
    public class UserStore : IUserStore<User, Guid>, IUserPasswordStore<User, Guid>, IUserLoginStore<User, Guid>
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

        public async Task CreateAsync(User user)
        {            
            _session.Store(user);
        }

        public async Task UpdateAsync(User user)
        {
            _session.Store(user);
        }

        public async Task DeleteAsync(User user)
        {
            //_users.Remove(user.Id);
            throw new NotImplementedException();
        }

        public async Task<User> FindByIdAsync(Guid userId)
        {
            return _session.Load<User>(userId);
        }

        public async Task<User> FindByNameAsync(string userName)
        {
            var identityUser = _session.GetFirst<User>(user => user.UserName == userName);
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

        public async Task SetPasswordHashAsync(User user, string passwordHash)
        {
            user.PasswordHash = passwordHash;
        }

        public async Task<string> GetPasswordHashAsync(User user)
        {
            return user.PasswordHash;
        }

        public async Task<bool> HasPasswordAsync(User user)
        {
            return user.PasswordHash != null;
        }

        public async Task AddLoginAsync(User user, UserLoginInfo login)
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

        public async Task RemoveLoginAsync(User user, UserLoginInfo login)
        {
            //var entry =
            //    _usersLogin.SingleOrDefault(
            //        where => user.Id == where.User.Id && where.Info.ProviderKey == login.ProviderKey);
            //_usersLogin.Remove(entry);
            throw new NotImplementedException();
        }

        public async Task<IList<UserLoginInfo>> GetLoginsAsync(User user)
        {
            //return _usersLogin.Where(@where => user.Id == @where.User.Id).Select(entry => entry.Info).ToList();
            throw new NotImplementedException();
        }

        public async Task<User> FindAsync(UserLoginInfo login)
        {
            var userLogin = _session.GetFirst<UserLogin>(criteria => criteria.ProviderKey == login.ProviderKey);
            return userLogin != null ? await FindByIdAsync(userLogin.UserId) : null;
        }
    }
}
