using System;
using Soloco.RealTimeWeb.Common.Infrastructure.DryIoc;
using Soloco.RealTimeWeb.Membership.CommandHandlers;
using Soloco.RealTimeWeb.Membership.QueryHandlers;
using Soloco.RealTimeWeb.Membership.Services;

namespace Soloco.RealTimeWeb.Membership
{
    public static class ContainerInitialize
    {
        public static IContainer RegisterMembership(this IContainer container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            return container
                .RegisterServicesInNamespace(typeof(InitializeDatabaseCommandHandler))
                .RegisterServicesInNamespace(typeof(ClientByKeyQueryHandler))
                .RegisterServicesInNamespace(Reuse.Singleton, typeof(OAuthConfiguration));
        }
    }
}