using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AspNet.Security.OpenIdConnect.Server;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http.Authentication;
using Microsoft.Extensions.Primitives;
using Newtonsoft.Json.Linq;
using AspNet.Security.OpenIdConnect.Extensions;
using Microsoft.Extensions.Configuration;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Clients;
using Soloco.RealTimeWeb.Membership.Messages.RefreshTokens;
using Soloco.RealTimeWeb.Membership.Messages.Users;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;
using AuthenticationProperties=Microsoft.AspNetCore.Http.Authentication.AuthenticationProperties;

namespace Soloco.RealTimeWeb.Infrastructure
{
    public class AuthorizationServerProvider : OpenIdConnectServerProvider
    {
        ///// <summary>
        ///// Validates whether the client is a valid known application in our system.
        ///// </summary>
        //public override async Task ValidateClientAuthentication(ValidateClientAuthenticationContext context)
        //{
        //    var query = new ClientValidator(context.ClientId, context.ClientSecret);
        //    var result = await ExecuteMessage(context, query);

        //    if (!result.Succeeded)
        //    {
        //        context.Reject(
        //            error: "invalid_client",
        //            description: "Client not found in the database: ensure that your client_id is correct");

        //        return;
        //    }

        //    context.HttpContext.Items.Add("as:clientAllowedOrigin", result.AllowedOrigin);

        //    context.Validated();
        //}
        
        ///// <summary>
        ///// Validate wether the redirect uri is valid for the specific client .
        ///// </summary>
        //public override async Task ValidateClientRedirectUri(ValidateClientRedirectUriContext context)
        //{
        //    var query = new ClientRedirectUriValidator(context.ClientId, context.RedirectUri);
        //    var result = await ExecuteMessage(context, query);

        //    if (!result.Succeeded)
        //    {
        //        context.Reject(
        //            error: "invalid_client",
        //            description: "Invalid redirect uri");

        //        return;
        //    }

        //    context.Validated();
        //}

        /// <summary>
        /// Validates the userName and password provided by the user.
        /// </summary>
        public override async Task GrantResourceOwnerCredentials(GrantResourceOwnerCredentialsContext context)
        {
            var query = new UserNamePasswordLogin(context.UserName, context.Password);
            var result = await ExecuteMessage(context, query);

            if (!result.Succeeded)
            {
                context.Reject("invalid_grant", "The user name or password is incorrect.");
                return;
            }

            SetCorsHeader(context);

            var ticket = CreateAuthenticationTicket(result, context);
            context.Validate(ticket);
        }

        /// <summary>
        /// Set cross-origin HTTP request (Cors) header to allow requests from a different domains. 
        /// This Cors value is specific to an Application and set by when validating the client application (ValidateClientAuthenticationp).
        /// </summary>
        private static void SetCorsHeader(GrantResourceOwnerCredentialsContext context)
        {
            var allowedOrigin = context.HttpContext.Items["as:clientAllowedOrigin"] as string;
            if (allowedOrigin != null)
            {
                context.HttpContext.Response.Headers.Add("Access-Control-Allow-Origin", new StringValues(allowedOrigin));
            }
        }

        /// <summary>
        /// Creates a valid authentication token used to create the access_token.
        /// </summary>
        private static AuthenticationTicket CreateAuthenticationTicket(LoginResult result, GrantResourceOwnerCredentialsContext context)
        {
            var identity = new ClaimsIdentity(context.Options.AuthenticationScheme);
            identity.AddClaim(ClaimTypes.Name, result.UserName, "id_token token");
            identity.AddClaim(ClaimTypes.NameIdentifier, result.UserId.ToString(), "id_token token");

            var properties = new AuthenticationProperties();
            var principal = new ClaimsPrincipal(new[] { identity });

            return CreateAuthenticationTicket(principal, properties, context.Options, context);
        }

        /// <summary>
        /// Grant a new access_token based on the current refresh_token. Here we couldvalidate whether the 
        /// refresh token is still valid or revoked.
        /// </summary>
        public override async Task GrantRefreshToken(GrantRefreshTokenContext context)
        {
            var originalClient = context.Ticket.Properties.Items["client_id"];
            if (originalClient != context.ClientId)
            {
                context.Reject("invalid_clientId", "Refresh token is issued to a different clientId.");
                return;
            }

            var properties = context.Ticket.Properties;
            var validator = new RefreshTokenValidator(context.Request.RefreshToken,
                properties.Items["client_id"],
                context.Ticket.Principal.GetClaim(ClaimTypes.NameIdentifier));

            var result = await ExecuteMessage(context, validator);
            if (!result.Succeeded)
            {
                context.Reject(OpenIdConnectConstants.Errors.InvalidRequest, "Could not validate refresh_token.");
                return;
            }

            var principal = new ClaimsPrincipal(context.Ticket.Principal);
            var ticket = CreateAuthenticationTicket(principal, context.Ticket.Properties, context.Options, context);

            context.Validate(ticket);
        }

        private static AuthenticationTicket CreateAuthenticationTicket(ClaimsPrincipal principal, AuthenticationProperties authenticationProperties, OpenIdConnectServerOptions options, BaseContext context)
        {
            var configuration = Configuration(context);
            var ticket = new AuthenticationTicket(principal, authenticationProperties, options.AuthenticationScheme);
            ticket.SetResources(new[] { configuration.ApiHostName() });
            return ticket;
        }

        public override Task ApplyTokenResponse(ApplyTokenResponseContext context)
        {
            AddCustomPropertiesTokenResponsePayload(context);
            return Task.FromResult(true);
        }

        private static void AddCustomPropertiesTokenResponsePayload(ApplyTokenResponseContext context)
        {
            foreach (var property in context.HttpContext.Items.Where(item => item.Key.ToString().StartsWith("as:")))
            {
                context.Response.Add(property.Key as string, new JValue(property.Value));
            }
        }

        public override async Task SerializeRefreshToken(SerializeRefreshTokenContext context)
        {
            //context.RefreshToken = await context.RefreshTokenSerializeTicketAsync();

            await StoreRefreshToken(context);
        }

        private async Task StoreRefreshToken(SerializeRefreshTokenContext context)
        {
            var principal = context.Ticket.Principal;
            var properties = context.Ticket.Properties;

            var command = new CreateRefreshTokenCommand(
                context.RefreshToken,
                properties.Items["client_id"],
                principal.GetClaim(ClaimTypes.NameIdentifier),
                principal.GetClaim(ClaimTypes.Name),
                context.HttpContext.Connection.RemoteIpAddress?.ToString(),
                properties.IssuedUtc.GetValueOrDefault(),
                properties.ExpiresUtc.GetValueOrDefault());

            var result = await ExecuteMessage(context, command);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException("Could not store the refreshtoken");
            }
        }

        /// <summary>
        /// Validate whether the requested endpoint is the authentication endpoint. 
        /// This supports all endopoints starting with AuthorizationEndpointPath (eg "/account/authorize"
        /// </summary>
        public override Task MatchEndpoint(MatchEndpointContext context)
        {
            if (context.Options.AuthorizationEndpointPath.HasValue
             && context.Request.Path.StartsWithSegments(context.Options.AuthorizationEndpointPath))
            {
                context.MatchesAuthorizationEndpoint();
            }

            return Task.FromResult(true);
        }

        private static async Task<TResult> ExecuteMessage<TResult>(BaseContext context, IMessage<TResult> message)
        {
            var messageDispatcher = context.HttpContext.RequestServices.GetMessageDispatcher();
            return await messageDispatcher.Execute(message);
        }

        private static IConfiguration Configuration(BaseContext context)
        {
            return context.HttpContext.RequestServices.GetService(typeof(IConfiguration)) as IConfiguration;
        }
    }
}