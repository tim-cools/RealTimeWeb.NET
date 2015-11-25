using System;
using System.Collections.Generic;
using System.Web.Http.Dependencies;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    public class HttpDependencyResolver : IDependencyResolver
    {
        private readonly IContainer _container;

        public HttpDependencyResolver(Action<IContainer> initializer)
        {
            _container = ContainerFactory.Create(initializer);
        }

        private HttpDependencyResolver(IContainer container)
        {
            _container = container;
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
            return new HttpDependencyResolver(_container.OpenScope());
        }

        public void Dispose()
        {
            _container.Dispose();
        }
    }
}