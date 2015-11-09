using System;
using System.Web.Http.Dependencies;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;

namespace Soloco.ReactiveStarterKit
{
    internal static class DependencyResolverExtensions
    {
        public static IMessageDispatcher GetMessageDispatcher(this IDependencyResolver dependencyResolver)
        {
            if (dependencyResolver == null) throw new ArgumentNullException(nameof(dependencyResolver));

            var service = dependencyResolver.GetService(typeof(IMessageDispatcher)) as IMessageDispatcher;
            if (service == null)
            {
                throw new InvalidOperationException("MessageDispatcher not registered in container.");
            }

            return service;
        }
    }
}