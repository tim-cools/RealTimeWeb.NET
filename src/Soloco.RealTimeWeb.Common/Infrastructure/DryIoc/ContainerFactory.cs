using System;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    public static class ContainerFactory
    {
        public static IContainer Create(Action<IContainer> initializer = null)
        {
            var container = new Container();

            initializer?.Invoke(container);

            container.RegisterInstance<IContainer>(container);

            return container;
        }
    }
}
