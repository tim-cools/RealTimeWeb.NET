using System;
using Marten;
using Microsoft.AspNet.Identity;
using Microsoft.Extensions.Logging;
using Soloco.RealTimeWeb.Common.Infrastructure.DryIoc;
using Soloco.RealTimeWeb.Membership.CommandHandlers;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.QueryHandlers;
using Soloco.RealTimeWeb.Membership.Services;

namespace Soloco.RealTimeWeb.Membership
{
    public static class ContainerInitialize
    {
        private class DummyLogger : ILogger<UserManager<User>>, IDisposable
        {
            public void Log(LogLevel logLevel, int eventId, object state, Exception exception, Func<object, Exception, string> formatter)
            {
            }

            public bool IsEnabled(LogLevel logLevel)
            {
                return false;
            }

            public IDisposable BeginScopeImpl(object state)
            {
                return this;
            }

            public void Dispose()
            {
            }
        }

        public static IContainer RegisterMembership(this IContainer container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            container
                .RegisterServicesInNamespace(typeof(InitializeDatabaseCommandHandler))
                .RegisterServicesInNamespace(typeof(ClientByKeyQueryHandler))
                .RegisterServicesInNamespace(Reuse.Singleton, typeof(OAuthConfiguration));

            container
                .RegisterDelegate<UserManager<User>>(UserManagerFactory, Reuse.InResolutionScope);

            return container;
        }

        private static UserManager<User> UserManagerFactory(IResolver resolver)
        {
            var documentSession = resolver.Resolve<IDocumentSession>();
            var store = new UserStore(documentSession);
            var passwordHasher = new PasswordHasher<User>();
            var logger = new DummyLogger(); // get the real deal
            var manager = new UserManager<User>(store, null, passwordHasher, null, null, null, null, null, logger, null);
            return manager;
        }
    }
}