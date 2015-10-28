using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNet.Identity;
using Soloco.ReactiveStarterKit.Membership.Domain;

namespace Soloco.ReactiveStarterKit.Membership.Services
{

    public class AuthRepository : IDisposable
    {
        private CustomUserStore _ctx;

        private UserManager<IdentityUser, Guid> _userManager;

        public AuthRepository()
        {
            _ctx = new CustomUserStore();
            _userManager = new UserManager<IdentityUser, Guid>(new CustomUserStore());
        }

        public async Task<IdentityResult> RegisterUser(string userName, string password)
        {
            IdentityUser user = new IdentityUser
            {
                UserName = userName
            };

            var result = await _userManager.CreateAsync(user, password);

            return result;
        }

        public async Task<IdentityUser> FindUser(string userName, string password)
        {
            IdentityUser user = await _userManager.FindAsync(userName, password);

            return user;
        }

        public Client FindClientByKey(string clientKey)
        {
            var client = _ctx.FindClientByKey(clientKey);

            return client;
        }

        public async Task<bool> AddRefreshToken(RefreshToken token)
        {

           var existingToken = _ctx.RefreshTokensBySubjectAndClient(token.Subject, token.ClientKey);

           if (existingToken != null)
           {
             var result = await RemoveRefreshToken(existingToken);
           }
          
            return await _ctx.RefreshTokensAdd(token);
        }

        public async Task<bool> RemoveRefreshToken(Guid refreshTokenId)
        {
            return await _ctx.RefreshTokenRemove(refreshTokenId);
        }

        public async Task<bool> RemoveRefreshToken(RefreshToken refreshToken)
        {
            return await _ctx.RefreshTokenRemove(refreshToken.Id);
        }

        public async Task<RefreshToken> FindRefreshToken(string refreshTokenHash)
        {
            return await _ctx.RefreshTokensFindAsync(refreshTokenHash);
        }

        public List<RefreshToken> GetAllRefreshTokens()
        {
             return  _ctx.RefreshTokensToList();
        }


        public async Task<IdentityResult> CreateAsync(IdentityUser user)
        {
            var result = await _userManager.CreateAsync(user);

            return result;
        }

        public async Task<IdentityResult> AddLoginAsync(Guid userId, UserLoginInfo login)
        {
            var result = await _userManager.AddLoginAsync(userId, login);

            return result;
        }

        public void Dispose()
        {
            _userManager.Dispose();

        }
    }
}