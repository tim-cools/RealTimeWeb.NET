using System;
using System.Collections.Generic;
using System.Web.Mvc;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    public class MvcDependencyResolver : IDependencyResolver
    {
        private readonly IContainer _container;

        public MvcDependencyResolver(IContainer container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            _container = container;
        }

        public object GetService(Type serviceType)
        {
            return _container.Resolve(serviceType, IfUnresolved.ReturnDefault);
        }

        public IEnumerable<object> GetServices(Type serviceType)
        {
            return (IEnumerable<object>) _container.Resolve(typeof(IEnumerable<>).MakeGenericType(serviceType), IfUnresolved.ReturnDefault);
        }
    }
}