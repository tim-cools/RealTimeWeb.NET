using System;
using System.Reflection;
using Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc;

namespace Soloco.ReactiveStarterKit.Membership
{
    public static class ContainerInitialize
    {
        public static IContainer RegisterMembership(this IContainer container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            container.RegisterAssemblyServices(Assembly.GetExecutingAssembly(),
                "Soloco.ReactiveStarterKit.Membership.Users.CommandHandlers");

            return container;
        }
    }
}