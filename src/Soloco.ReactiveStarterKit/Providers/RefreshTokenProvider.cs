using System;
using System.Threading.Tasks;
using System.Web.Http.Dependencies;
using Microsoft.Owin.Security.Infrastructure;
using Soloco.ReactiveStarterKit.Membership;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;

namespace Soloco.ReactiveStarterKit.Providers
{
    public class RefreshTokenProvider : IAuthenticationTokenProvider
    {
        private readonly IDependencyResolver _dependencyResolver;

        public RefreshTokenProvider(IDependencyResolver dependencyResolver)
        {
            if (dependencyResolver == null) throw new ArgumentNullException(nameof(dependencyResolver));

            _dependencyResolver = dependencyResolver;
        }

        public async Task CreateAsync(AuthenticationTokenCreateContext context)
        {
            var clientid = context.Ticket.Properties.Dictionary["as:client_id"];

            if (string.IsNullOrEmpty(clientid))
            {
                return;
            }

            var refreshTokenLifeTime = context.OwinContext.Get<string>("as:clientRefreshTokenLifeTime");

            var issuedUtc = DateTime.UtcNow;
            var expiresUtc = issuedUtc.AddMinutes(Convert.ToDouble(refreshTokenLifeTime));

            context.Ticket.Properties.IssuedUtc = issuedUtc;
            context.Ticket.Properties.ExpiresUtc = expiresUtc;

            var protectedTicket = context.SerializeTicket();

            var messageDispatcher = _dependencyResolver.GetMessageDispatcher();

            var refreshTokenId = Guid.NewGuid().ToString("n");
            var command = new CreateRefreshTokenCommand(
                refreshTokenId,
                protectedTicket, 
                clientid, 
                context.Ticket.Identity.Name,
                issuedUtc,
                expiresUtc
                );

            var result = await messageDispatcher.Execute(command);

            if (result.Succeeded)
            {
                context.SetToken(refreshTokenId);
            }
        }

        public async Task ReceiveAsync(AuthenticationTokenReceiveContext context)
        {
            var allowedOrigin = context.OwinContext.Get<string>("as:clientAllowedOrigin");
            context.OwinContext.Response.Headers.Add("Access-Control-Allow-Origin", new[] { allowedOrigin });

            throw new NotImplementedException();

            string hashedTokenId = Helper.GetHash(context.Token);

            //using (AuthRepository _repo = new AuthRepository())
            //{
            //    var refreshToken = await _repo.FindRefreshToken(hashedTokenId);

            //    if (refreshToken != null )
            //    {
            //        //Get protectedTicket from refreshToken class
            //        context.DeserializeTicket(refreshToken.ProtectedTicket);
            //        var result = await _repo.RemoveRefreshToken(refreshToken);
            //    }
            //}
        }

        public void Create(AuthenticationTokenCreateContext context)
        {
            throw new NotImplementedException();
        }

        public void Receive(AuthenticationTokenReceiveContext context)
        {
            throw new NotImplementedException();
        }
    }
}