using System;
using System.Web.Http;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    public static class HttpDependencyExtensions
    {
        public static HttpConfiguration RegisterDependencyResolver(this HttpConfiguration config, Action<IContainer> initializer)
        {
            if (config == null) throw new ArgumentNullException(nameof(config));

            var resolver = new HttpDependencyResolver(initializer);
            config.DependencyResolver = resolver;
            return config;
        }
    }
}