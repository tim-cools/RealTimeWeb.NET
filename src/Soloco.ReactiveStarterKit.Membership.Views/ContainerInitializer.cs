using System;
using System.Reflection;
using Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc;
using Soloco.ReactiveStarterKit.Membership.Client.QueryHandlers;

namespace Soloco.ReactiveStarterKit.Membership.Client
{
    public static class ContainerInitializer
    {
        public static IContainer RegisterMembershipViews(this IContainer container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            container.RegisterServicesInNamespace(typeof(ClientByKeyQueryHandler));

            return container;
        }
    }
}