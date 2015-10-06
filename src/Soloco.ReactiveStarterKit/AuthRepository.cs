using AngularJSAuthentication.API.Entities;
using AngularJSAuthentication.API.Models;
using Microsoft.AspNet.Identity;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AngularJSAuthentication.API
{

    public class AuthRepository : IDisposable
    {
        private CustomUserStore _ctx;

        private UserManager<IdentityUser> _userManager;

        public AuthRepository()
        {
            _ctx = new CustomUserStore();
            _userManager = new UserManager<IdentityUser>(new CustomUserStore());
        }

        public async Task<IdentityResult> RegisterUser(UserModel userModel)
        {
            IdentityUser user = new IdentityUser
            {
                UserName = userModel.UserName
            };

            var result = await _userManager.CreateAsync(user, userModel.Password);

            return result;
        }

        public async Task<IdentityUser> FindUser(string userName, string password)
        {
            IdentityUser user = await _userManager.FindAsync(userName, password);

            return user;
        }

        public Client FindClient(string clientId)
        {
            var client = _ctx.FindClient(clientId);

            return client;
        }

        public async Task<bool> AddRefreshToken(RefreshToken token)
        {

           var existingToken = _ctx.RefreshTokensBySubjectAndClient(token.Subject, token.ClientId);

           if (existingToken != null)
           {
             var result = await RemoveRefreshToken(existingToken);
           }
          
            return await _ctx.RefreshTokensAdd(token);
        }

        public async Task<bool> RemoveRefreshToken(string refreshTokenId)
        {
            return await _ctx.RefreshTokenRemove(refreshTokenId);
        }

        public async Task<bool> RemoveRefreshToken(RefreshToken refreshToken)
        {
            return await _ctx.RefreshTokenRemove(refreshToken.Id);
        }

        public async Task<RefreshToken> FindRefreshToken(string refreshTokenId)
        {
            return await _ctx.RefreshTokensFindAsync(refreshTokenId);
        }

        public List<RefreshToken> GetAllRefreshTokens()
        {
             return  _ctx.RefreshTokensToList();
        }

        public async Task<IdentityUser> FindAsync(UserLoginInfo loginInfo)
        {
            IdentityUser user = await _userManager.FindAsync(loginInfo);

            return user;
        }

        public async Task<IdentityResult> CreateAsync(IdentityUser user)
        {
            var result = await _userManager.CreateAsync(user);

            return result;
        }

        public async Task<IdentityResult> AddLoginAsync(string userId, UserLoginInfo login)
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