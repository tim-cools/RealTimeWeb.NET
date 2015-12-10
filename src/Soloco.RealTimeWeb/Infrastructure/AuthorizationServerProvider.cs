using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AspNet.Security.OpenIdConnect.Server;
using Microsoft.AspNet.Authentication;
using Microsoft.AspNet.Http.Authentication;
using Microsoft.Extensions.Primitives;
using Newtonsoft.Json.Linq;
using Soloco.RealTimeWeb.Membership.Messages.Queries;

namespace Soloco.RealTimeWeb.Providers
{
    public class AuthorizationServerProvider : OpenIdConnectServerProvider
    {
        private readonly IServiceProvider _serviceProvider;

        public AuthorizationServerProvider(IServiceProvider serviceProvider)
        {
            if (serviceProvider == null) throw new ArgumentNullException(nameof(serviceProvider));

            _serviceProvider = serviceProvider;
        }
        
        public override async Task ValidateClientAuthentication(ValidateClientAuthenticationContext context)
        {
            //if (!context.TryGetBasicCredentials(out clientId, out clientSecret))
            //{
            //    context.TryGetFormCredentials(out clientId, out clientSecret);
            //}

            if (context.ClientId == null)
            {
                //Remove the comments from the below line context.SetError, and invalidate context 
                //if you want to force sending clientId/secrects once obtain access tokens. 
                context.Validated();
                //context.SetError("invalid_clientId", "ClientId should be sent.");
                return;
            }

            var messageDispatcher = _serviceProvider.GetMessageDispatcher();

            var query = new ValidateClientAuthenticationQuery(context.ClientId, context.ClientSecret);
            var result = await messageDispatcher.Execute(query);

            if (!result.Valid)
            {
                context.Rejected("invalid_clientId", $"Client '{context.ClientId}' is not registered in the system.");
                return;
            }

            context.HttpContext.Items.Add("as:clientAllowedOrigin", result.AllowedOrigin);
            context.HttpContext.Items.Add("as:clientRefreshTokenLifeTime", result.RefreshTokenLifeTime.ToString());

            context.Validated();
        }

        public override async Task GrantResourceOwnerCredentials(GrantResourceOwnerCredentialsContext context)
        {
            var allowedOrigin = context.HttpContext.Items["as:clientAllowedOrigin"] as string;

            if (allowedOrigin == null) allowedOrigin = "*";

            context.HttpContext.Response.Headers.Add("Access-Control-Allow-Origin", new StringValues(allowedOrigin));

            var messageDispatcher = _serviceProvider.GetMessageDispatcher();

            var query = new ValidUserLoginQuery(context.UserName, context.Password);
            var valid = await messageDispatcher.Execute(query);

            if (!valid)
            {
                context.Rejected("invalid_grant", "The user name or password is incorrect.");
                return;
            }

            var identity = new ClaimsIdentity(context.Options.AuthenticationScheme);  //todo was AuthenticationType
            identity.AddClaim(new Claim(ClaimTypes.Name, context.UserName));
            identity.AddClaim(new Claim(ClaimTypes.Role, "user"));
            identity.AddClaim(new Claim("sub", context.UserName));

            var props = new AuthenticationProperties(new Dictionary<string, string>
                {
                    { "as:client_id", context.ClientId ?? string.Empty },
                    { "userName", context.UserName }
                }
            );

            var principal = new ClaimsPrincipal(new [] { identity });
            var ticket = new AuthenticationTicket(principal, props, context.Options.AuthenticationScheme);
            context.Validated(ticket);

        }

        public override Task GrantRefreshToken(GrantRefreshTokenContext context)
        {
            var originalClient = context.AuthenticationTicket.Properties.Items["as:client_id"];
            var currentClient = context.ClientId;

            if (originalClient != currentClient)
            {
                context.Rejected("invalid_clientId", "Refresh token is issued to a different clientId.");
                return Task.FromResult(true);
            }

            // Change auth ticket for refresh token requests
            var principal = context.AuthenticationTicket.Principal;
            var newPrincipal = new ClaimsPrincipal(principal);

            var claimsIdentity = newPrincipal.Identity as ClaimsIdentity;
            if (claimsIdentity == null)
            {
                context.Rejected("invalid_principal", "ClaimPrincipal is invalid.");
                return Task.FromResult(true);
            }

            var newClaim = newPrincipal.Claims.FirstOrDefault(c => c.Type == "newClaim");
            if (newClaim != null)
            {
                claimsIdentity.RemoveClaim(newClaim);
            }
            claimsIdentity.AddClaim(new Claim("newClaim", "newValue"));

            var newTicket = new AuthenticationTicket(newPrincipal, context.AuthenticationTicket.Properties, context.Options.AuthenticationScheme);

            context.Validated(newTicket);

            return Task.FromResult(true);
        }

        public override Task TokenEndpointResponse(TokenEndpointResponseContext context)
        {
            foreach (var property in context.HttpContext.Items)
            {
                context.Payload.Add(property.Key as string, new JValue(property.Value));
            }
            return Task.FromResult(true);
        }

        //override Gran

        //public async Task CreateAsync(AuthenticationTokenCreateContext context)
        //{
        //    var clientid = context.Ticket.Properties.Dictionary["as:client_id"];

        //    if (string.IsNullOrEmpty(clientid))
        //    {
        //        return;
        //    }

        //    var refreshTokenLifeTime = context.OwinContext.Get<string>("as:clientRefreshTokenLifeTime");

        //    var issuedUtc = DateTime.UtcNow;
        //    var expiresUtc = issuedUtc.AddMinutes(Convert.ToDouble(refreshTokenLifeTime));

        //    context.Ticket.Properties.IssuedUtc = issuedUtc;
        //    context.Ticket.Properties.ExpiresUtc = expiresUtc;

        //    var protectedTicket = context.SerializeTicket();

        //    var messageDispatcher = _dependencyResolver.GetMessageDispatcher();

        //    var refreshTokenId = Guid.NewGuid().ToString("n");
        //    var command = new CreateRefreshTokenCommand(
        //        refreshTokenId,
        //        protectedTicket,
        //        clientid,
        //        context.Ticket.Identity.Name,
        //        issuedUtc,
        //        expiresUtc
        //        );

        //    var result = await messageDispatcher.Execute(command);

        //    if (result.Succeeded)
        //    {
        //        context.SetToken(refreshTokenId);
        //    }
        //}

        //public async Task ReceiveAsync(AuthenticationTokenReceiveContext context)
        //{
        //    var allowedOrigin = context.OwinContext.Get<string>("as:clientAllowedOrigin");
        //    context.OwinContext.Response.Headers.Add("Access-Control-Allow-Origin", new[] { allowedOrigin });

        //    throw new NotImplementedException();

        //    string hashedTokenId = Helper.GetHash(context.Token);

        //    //using (AuthRepository _repo = new AuthRepository())
        //    //{
        //    //    var refreshToken = await _repo.FindRefreshToken(hashedTokenId);

        //    //    if (refreshToken != null )
        //    //    {
        //    //        //Get protectedTicket from refreshToken class
        //    //        context.DeserializeTicket(refreshToken.ProtectedTicket);
        //    //        var result = await _repo.RemoveRefreshToken(refreshToken);
        //    //    }
        //    //}
        //}
    }
}