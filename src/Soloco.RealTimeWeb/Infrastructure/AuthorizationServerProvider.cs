using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AspNet.Security.OpenIdConnect.Server;
using Microsoft.AspNet.Authentication;
using Microsoft.AspNet.Http.Authentication;
using Microsoft.Extensions.Primitives;
using Newtonsoft.Json.Linq;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using AspNet.Security.OpenIdConnect.Extensions;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Infrastructure
{
    public class AuthorizationServerProvider : OpenIdConnectServerProvider
    {
        private readonly IServiceProvider _serviceProvider;

        public AuthorizationServerProvider(IServiceProvider serviceProvider)
        {
            if (serviceProvider == null) throw new ArgumentNullException(nameof(serviceProvider));

            _serviceProvider = serviceProvider;
        }

        /// <summary>
        /// Validates whether the client is a valid known application in our system.
        /// </summary>
        public override async Task ValidateClientAuthentication(ValidateClientAuthenticationContext context)
        {
            var messageDispatcher = _serviceProvider.GetMessageDispatcher();

            var query = new ClientApplicationValidator(context.ClientId, context.ClientSecret);
            var result = await messageDispatcher.Execute(query);

            if (!result.Valid)
            {
                context.Rejected(
                    error: "invalid_client",
                    description: "Application not found in the database: ensure that your client_id is correct");

                return;
            }

            context.HttpContext.Items.Add("as:clientAllowedOrigin", result.AllowedOrigin);

            context.Validated();
        }

        /// <summary>
        /// Validates the userName and password provided by the user.
        /// </summary>
        public override async Task GrantResourceOwnerCredentials(GrantResourceOwnerCredentialsContext context)
        {
            var messageDispatcher = _serviceProvider.GetMessageDispatcher();

            var query = new UserNamePasswordLogin(context.UserName, context.Password);
            var result = await messageDispatcher.Execute(query);

            if (!result.Succeeded)
            {
                context.Rejected("invalid_grant", "The user name or password is incorrect.");
                return;
            }

            SetCorsHeader(context);

            var ticket = CreateAuthenticationTicket(result, context);
            context.Validated(ticket);
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

            var properties = new AuthenticationProperties(); // new Dictionary<string, string> { { "as:client_id", context.ClientId ?? string.Empty } });
            var principal = new ClaimsPrincipal(new[] { identity });

            return CreateAuthenticationTicket(principal, properties, context.Options);
        }

        /// <summary>
        /// Grant a new access_token based on the current refresh_token. Here we couldvalidate whether the 
        /// refresh token is still valid or revoked.
        /// </summary>
        public override Task GrantRefreshToken(GrantRefreshTokenContext context)
        {
            var originalClient = context.AuthenticationTicket.Properties.Items["client_id"];
            if (originalClient != context.ClientId)
            {
                context.Rejected("invalid_clientId", "Refresh token is issued to a different clientId.");
                return Task.FromResult(true);
            }

            var properties = context.AuthenticationTicket.Properties;
            var validator = new RefreshTokenValidator(context.Request.RefreshToken,
                properties.Items["client_id"],
                context.AuthenticationTicket.Principal.GetClaim(ClaimTypes.NameIdentifier));
            var messageDispatcher = _serviceProvider.GetMessageDispatcher();

            var result = messageDispatcher.Execute(validator);
            if (result.)


            var principal = new ClaimsPrincipal(context.AuthenticationTicket.Principal);
            var ticket = CreateAuthenticationTicket(principal, context.AuthenticationTicket.Properties, context.Options);

            context.Validated(ticket);

            return Task.FromResult(true);
        }

        private static AuthenticationTicket CreateAuthenticationTicket(ClaimsPrincipal principal, AuthenticationProperties authenticationProperties, OpenIdConnectServerOptions options)
        {
            var ticket = new AuthenticationTicket(principal, authenticationProperties, options.AuthenticationScheme);
            ticket.SetResources(new[] { Configuration.AuthenticationResource });
            return ticket;
        }

        public override Task TokenEndpointResponse(TokenEndpointResponseContext context)
        {
            AddCustomPropertiesTokenResponsePayload(context);
            return Task.FromResult(true);
        }

        private static void AddCustomPropertiesTokenResponsePayload(TokenEndpointResponseContext context)
        {
            foreach (var property in context.HttpContext.Items.Where(item => item.Key.ToString().StartsWith("as:")))
            {
                context.Payload.Add(property.Key as string, new JValue(property.Value));
            }
        }

        public override async Task SerializeRefreshToken(SerializeRefreshTokenContext context)
        {
            context.RefreshToken = await context.SerializeTicketAsync();

            await StoreRefreshToken(context);
        }

        private async Task StoreRefreshToken(SerializeRefreshTokenContext context)
        {
            var messageDispatcher = _serviceProvider.GetMessageDispatcher();

            var principal = context.AuthenticationTicket.Principal;
            var properties = context.AuthenticationTicket.Properties;

            var command = new CreateRefreshTokenCommand(
                context.RefreshToken,
                properties.Items["client_id"],
                principal.GetClaim(ClaimTypes.NameIdentifier),
                principal.GetClaim(ClaimTypes.Name),
                context.HttpContext.Connection.RemoteIpAddress.ToString(),
                properties.IssuedUtc,
                properties.ExpiresUtc);

            var result = await messageDispatcher.Execute(command);
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
    }
}