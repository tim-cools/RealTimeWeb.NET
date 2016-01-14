using System;
using Soloco.RealTimeWeb.Membership.Clients.Domain;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Clients
{
    public static class ClientFactory
    {
        public static Client Create()
        {
            return new Client
            {
                Id = Guid.NewGuid(),
                RedirectUri = "http://localhost",
                Key = Guid.NewGuid().ToString(),
                Active = true
            };
        }
    }
}