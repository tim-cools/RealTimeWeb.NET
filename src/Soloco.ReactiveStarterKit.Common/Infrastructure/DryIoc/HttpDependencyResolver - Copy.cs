using System;
using System.Collections.Generic;
using System.Web.Http.Dependencies;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    public class HttpDependencyResolver : IDependencyResolver
    {
        private readonly Action<IContainer> _initializer;
        private readonly IContainer _container;

        public HttpDependencyResolver(Action<IContainer> initializer)
        {
            _initializer = initializer;
            _container = ContainerFactory.Create(initializer);
        }

        public object GetService(Type serviceType)
        {
            return _container.Resolve(serviceType, IfUnresolved.ReturnDefault);
        }

        public IEnumerable<object> GetServices(Type serviceType)
        {
            var enumerableType = typeof(IEnumerable<>).MakeGenericType(serviceType);

            return (IEnumerable<object>)_container.Resolve(enumerableType, IfUnresolved.ReturnDefault);
        }

        public IDependencyScope BeginScope()
        {
            return new HttpDependencyResolver(_initializer);
        }

        public void Dispose()
        {
            _container.Dispose();
        }
    }
}