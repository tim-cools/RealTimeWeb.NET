using System;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Infrastructure
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