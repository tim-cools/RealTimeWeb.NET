using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AngularJSAuthentication.API.Entities;
using AngularJSAuthentication.API.Models;
using Microsoft.AspNet.Identity;

namespace AngularJSAuthentication.API
{
    public class CustomUserStore : IUserStore<IdentityUser>, IUserPasswordStore<IdentityUser>, IUserLoginStore<IdentityUser>
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

        private static readonly Dictionary<string, string> _usersPasswords = new Dictionary<string, string>();
        private static readonly List<Login> _usersLogin = new List<Login>();
        private static readonly Dictionary<string, IdentityUser> _users = new Dictionary<string, IdentityUser>();
        private static readonly Dictionary<string, Client> _clients = Configuration.BuildClientsList().ToDictionary(client => client.Id);
        private static readonly Dictionary<string, RefreshToken> _refreshTokens = new Dictionary<string, RefreshToken>();

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
            var id = Guid.NewGuid().ToString();
            _users.Add(id, user);
            user.Id = id;
        }

        public async Task UpdateAsync(IdentityUser user)
        {
            _users[user.Id] = user;
        }

        public async Task DeleteAsync(IdentityUser user)
        {
            _users.Remove(user.Id);
        }

        public async Task<IdentityUser> FindByIdAsync(string userId)
        {
            IdentityUser user;
            _users.TryGetValue(userId, out user);
            return user;
        }

        public async Task<IdentityUser> FindByNameAsync(string userName)
        {
            return _users.Values.SingleOrDefault(user => user.UserName == userName);
        }

        public Client FindClient(string clientId)
        {
            return _clients[clientId];
        }

        public RefreshToken RefreshTokensBySubjectAndClient(string subject, string clientId)
        {
            return _refreshTokens.Values.SingleOrDefault(where => where.ClientId == clientId && where.Subject == subject);
            //r => r.Subject == token.Subject && r.ClientId == token.ClientId).SingleOrDefault(
        }

        public async Task<bool> RefreshTokensAdd(RefreshToken token)
        {
            _refreshTokens.Add(token.Id, token);
            return true;
        }

        public async Task<RefreshToken> RefreshTokensFindAsync(string refreshTokenId)
        {
            return _refreshTokens.Values.SingleOrDefault(where => where.Id == refreshTokenId);
        }

        public async Task<bool> RefreshTokenRemove(string refreshTokenId)
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
            return _usersPasswords[user.Id];
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

    internal sealed class Configuration // : DbMigrationsConfiguration<AngularJSAuthentication.API.AuthContext>
    {
        //public Configuration()
        //{
        //    AutomaticMigrationsEnabled = false;
        //}

        //protected override void Seed(AngularJSAuthentication.API.AuthContext context)
        //{
        //    if (context.Clients.Count() > 0)
        //    {
        //        return;
        //    }

        //    context.Clients.AddRange(BuildClientsList());
        //    context.SaveChanges();
        //}

        public static List<Client> BuildClientsList()
        {

            List<Client> ClientsList = new List<Client>
            {
                new Client
                { Id = "ngAuthApp",
                    Secret= Helper.GetHash("abc@123"),
                    Name="AngularJS front-end Application",
                    ApplicationType =  Models.ApplicationTypes.JavaScript,
                    Active = true,
                    RefreshTokenLifeTime = 7200,
                    AllowedOrigin = "http://localhost:32150"
                },
                new Client
                { Id = "consoleApp",
                    Secret=Helper.GetHash("123@abc"),
                    Name="Console Application",
                    ApplicationType =Models.ApplicationTypes.NativeConfidential,
                    Active = true,
                    RefreshTokenLifeTime = 14400,
                    AllowedOrigin = "*"
                }
            };

            return ClientsList;
        }
    }
}
