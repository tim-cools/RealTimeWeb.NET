using System;
using System.Reflection;
using Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc;

namespace Soloco.ReactiveStarterKit.Common
{
    public static class ContainerInitializer
    {
        public static IContainer RegisterCommon(this IContainer container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            container.RegisterAssemblyServices(Assembly.GetExecutingAssembly(), 
                "Soloco.ReactiveStarterKit.Common.Infrastructure.Commands");

            return container;
        }
    }
}