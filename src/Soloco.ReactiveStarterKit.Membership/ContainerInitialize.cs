using System;
using Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc;
using Soloco.ReactiveStarterKit.Membership.CommandHandlers;
using Soloco.ReactiveStarterKit.Membership.Services;

namespace Soloco.ReactiveStarterKit.Membership
{
    public static class ContainerInitialize
    {
        public static IContainer RegisterMembership(this IContainer container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            return container
                .RegisterServicesInNamespace(typeof(InitializeDatabaseCommandHandler))
                .RegisterServicesInNamespace(Reuse.Singleton, typeof(OAuthConfiguration));
        }
    }
}