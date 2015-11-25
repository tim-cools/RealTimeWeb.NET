using System;
using Soloco.RealTimeWeb.Common.Infrastructure.DryIoc;
using Soloco.RealTimeWeb.Controllers;

namespace Soloco.RealTimeWeb
{
    internal static class ContainerInitialize
    {
        public static IContainer RegisterApiControllers(this IContainer container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            container.RegisterServicesInNamespace(typeof(AccountController));

            return container;
        }
    }
}