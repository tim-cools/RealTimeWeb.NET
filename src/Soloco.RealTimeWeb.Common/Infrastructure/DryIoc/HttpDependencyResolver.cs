using System;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    public static class ContainerExetensions
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
                return _container.Resolve(serviceType, IfUnresolved.ReturnDefault);
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
            private readonly ContainerServiceProvider _serviceProvider;

            public IServiceProvider ServiceProvider => _serviceProvider;

            public ContainerServiceScope(IContainer container)
            {
                _container = container;
                container.RegisterInstance(typeof(IServiceProvider), _serviceProvider);
                _serviceProvider = new ContainerServiceProvider(container);
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

            container.RegisterInstance(typeof(IServiceProvider), provider);
            container.RegisterInstance(typeof(IServiceScopeFactory), new ContainerServiceScopeFactory(container));
            container.RegisterServices(descriptors);

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
            var reuse = GetReuse(descriptor.Lifetime);
            if (descriptor.ImplementationType != null)
            {
                container.Register(descriptor.ServiceType, descriptor.ImplementationType, reuse);
            }
            else if (descriptor.ImplementationFactory != null)
            {
                container.RegisterDelegate(descriptor.ServiceType, resolver =>
                {
                    var serviceProvider = (IServiceProvider)resolver.Resolve(typeof(IServiceProvider));
                    return descriptor.ImplementationFactory(serviceProvider);
                }, reuse);
            }
            else
            {
                container.RegisterInstance(descriptor.ServiceType, descriptor.ImplementationInstance, reuse);
            }
        }

        private static IReuse GetReuse(ServiceLifetime lifetime)
        {
            switch (lifetime)
            {
                case ServiceLifetime.Scoped:
                    return Reuse.InResolutionScope;
                case ServiceLifetime.Singleton:
                    return Reuse.Singleton;
                case ServiceLifetime.Transient:
                    return Reuse.Transient;
                default:
                    throw new InvalidOperationException("Invalid ServiceLifetime: " + lifetime);
            }
        }
    }
}