using System;
using System.Collections.Generic;
using System.Diagnostics;
using Microsoft.AspNet.Mvc.ViewFeatures;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.OptionsModel;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    public static class DependencyInjectionContainerExtensions
    {
        private class ContainerServiceProvider : IServiceProvider
        {
            private readonly IContainer _container;

            public ContainerServiceProvider(IContainer container)
            {
                if (container == null) throw new ArgumentNullException(nameof(container));

                _container = container;
            }

            public object GetService(Type serviceType)
            {
                var name = serviceType.FullName;
                var returnDefault = IfUnresolved.Throw;
                try
                {
                    return _container.Resolve(serviceType, returnDefault);
                }
                catch (Exception exception)
                {
                    //We need this logging in case the container can't resolve a dependency that is registered.
                    //Todo update dryico in order to remove this construction
                    Debug.WriteLine(exception);
                    return null;
                }
            }
        }

        private class ContainerServiceScopeFactory : IServiceScopeFactory
        {
            private readonly IContainer _container;

            public ContainerServiceScopeFactory(IContainer container)
            {
                if (container == null) throw new ArgumentNullException(nameof(container));

                _container = container;
            }

            public IServiceScope CreateScope()
            {
                return new ContainerServiceScope(_container.OpenScope());
            }
        }

        private class ContainerServiceScope : IServiceScope
        {
            private readonly IContainer _container;

            public IServiceProvider ServiceProvider { get; }

            public ContainerServiceScope(IContainer container)
            {
                _container = container;

                ServiceProvider = new ContainerServiceProvider(_container);

                _container.Unregister<IServiceProvider>();
                _container.Unregister<IContainer>();

                _container.RegisterInstance<IServiceProvider>(ServiceProvider);
                _container.RegisterInstance(typeof(IContainer), container);
            }

            public void Dispose()
            {
                _container.Dispose();
            }
        }

        public static IServiceProvider CreateServiceProvider(this Container container, IEnumerable<ServiceDescriptor> descriptors)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));
            if (descriptors == null) throw new ArgumentNullException(nameof(descriptors));

            var provider = new ContainerServiceProvider(container);

            container.RegisterInstance(typeof(IContainer), container);
            container.RegisterInstance(typeof(IServiceProvider), provider);
            container.RegisterInstance(typeof(IServiceScopeFactory), new ContainerServiceScopeFactory(container));
            container.RegisterServices(descriptors);
            //var resolve = container.Resolve(typeof(IOptions<Microsoft.AspNet.Mvc.MvcOptions>));
            var res1olve = container.Resolve(typeof(ViewResultExecutor));

            foreach (var registration in container.GetServiceRegistrations())
            {
                Debug.WriteLine($"Registration: {registration.ServiceType}");
            }
            return provider;
        }

        private static void RegisterServices(this Container container, IEnumerable<ServiceDescriptor> descriptors)
        {
            foreach (var descriptor in descriptors)
            {
                container.RegisterService(descriptor);
            }
        }

        private static void RegisterService(this Container container, ServiceDescriptor descriptor)
        {
            var serviceType = descriptor.ServiceType;
            var name = serviceType.Name;
            if (descriptor.ImplementationType != null)
            {
                container.Register(serviceType, descriptor.ImplementationType, GetReuse(descriptor.Lifetime));
            }
            else if (descriptor.ImplementationFactory != null)
            {
                container.RegisterDelegate(serviceType, resolver => descriptor.ImplementationFactory(resolver.Resolve< IServiceProvider>()), GetReuse(descriptor.Lifetime));
            }
            else
            {
                container.RegisterInstance(serviceType, descriptor.ImplementationInstance, GetReuse(descriptor.Lifetime));
            }
        }

        private static IReuse GetReuse(ServiceLifetime lifetime)
        {
            switch (lifetime)
            {
                case ServiceLifetime.Scoped:
                    return Reuse.InCurrentScope;
                case ServiceLifetime.Singleton:
                    return Reuse.Singleton;
                case ServiceLifetime.Transient:
                    return Reuse.Transient;
                default:
                    throw new ArgumentOutOfRangeException(nameof(lifetime), lifetime,
                        "Not supported lifetime");
            }
        }
    }
}