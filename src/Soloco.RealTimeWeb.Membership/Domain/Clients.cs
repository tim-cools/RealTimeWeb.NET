using System;
using System.Collections.Generic;
using Soloco.RealTimeWeb.Common.Security;

namespace Soloco.RealTimeWeb.Membership.Domain
{
    public static class Clients
    {
        public static IEnumerable<Client> Get()
        {
            return new List<Client>
            {
                new Client
                {
                    Id = Guid.NewGuid(),
                    Key = "realTimeWebClient",
                    Name = "React front-end Application",
                    ApplicationType = ApplicationTypes.JavaScript,
                    Active = true,
                    RefreshTokenLifeTime = 7200,
                    AllowedOrigin = "http://localhost:3000"
                },
                new Client
                {
                    Id = Guid.NewGuid(),
                    Key = "automatedTests",
                    Secret = Hasher.ComputeSHA256("123@abc"),
                    Name = "Console Application",
                    ApplicationType = ApplicationTypes.NativeConfidential,
                    Active = true,
                    RefreshTokenLifeTime = 14400,
                    AllowedOrigin = "*"
                }
            };
        }
    }
}