using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Microsoft.AspNet.Mvc.ViewFeatures;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.OptionsModel;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    public static class DependencyInjectionContainerExtensions
    {
        private class ContainerServiceProvider : IServiceProvider
        {
            private readonly IResolver _container;

            public ContainerServiceProvider(IResolver container)
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

            container.RegisterDelegate(typeof(IResolver), resolver => resolver);
            container.RegisterDelegate(typeof(IServiceProvider), resolver => new ContainerServiceProvider(resolver));
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
            VerifyNotRegistered(container, descriptor);

            var name = descriptor.ServiceType.Name;
            Debug.WriteLine($"Register: {descriptor.ServiceType}");

            if (descriptor.ImplementationType != null)
            {
                container.Register(descriptor.ServiceType, descriptor.ImplementationType, GetReuse(descriptor.Lifetime));
            }
            else if (descriptor.ImplementationFactory != null)
            {
                container.RegisterDelegate(descriptor.ServiceType, resolver => descriptor.ImplementationFactory(resolver.Resolve< IServiceProvider>()), GetReuse(descriptor.Lifetime));
            }
            else
            {
                container.RegisterInstance(descriptor.ServiceType, descriptor.ImplementationInstance, GetReuse(descriptor.Lifetime));
            }
            LogRegistations(container);
        }

        private static void VerifyNotRegistered(Container container, ServiceDescriptor descriptor)
        {
            var registrations = container.GetServiceRegistrations();
            var registrationInfo = registrations.FirstOrDefault(registration => registration.ServiceType == descriptor.ServiceType);
            if (registrationInfo.ServiceType != null)
            {
                //container.Unregister(descriptor.ServiceType);
                Debug.WriteLine($"Duplicate (Registration: {descriptor.ServiceType}");
            }
        }
        private static void LogRegistations(Container container)
        {
            var registrations = container.GetServiceRegistrations();
            foreach (var registration in registrations)
            {
                Debug.WriteLine($"Log (Registration: {registration.ServiceType}");
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