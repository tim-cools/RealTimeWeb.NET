using System;
using System.Reflection;
using Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc;

namespace Soloco.ReactiveStarterKit.Membership.Client
{
    public static class ContainerInitializer
    {
        public static IContainer RegisterMembershipClient(this IContainer container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            container.RegisterAssemblyServices(Assembly.GetExecutingAssembly(),
                "Soloco.ReactiveStarterKit.Membership.Client.QueryHandlers");

            return container;
        }
    }
}