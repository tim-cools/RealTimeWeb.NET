using System;
using System.Web.Http.Dependencies;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;

namespace Soloco.RealTimeWeb
{
    internal static class ServiceProviderExtensions
    {
        public static IMessageDispatcher GetMessageDispatcher(this IServiceProvider serviceProvider)
        {
            if (serviceProvider == null) throw new ArgumentNullException(nameof(serviceProvider));

            var service = serviceProvider.GetService(typeof(IMessageDispatcher)) as IMessageDispatcher;
            if (service == null)
            {
                throw new InvalidOperationException("MessageDispatcher not registered in container.");
            }

            return service;
        }
    }
}