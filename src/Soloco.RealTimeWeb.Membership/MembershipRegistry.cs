using System;
using Marten;
using Microsoft.AspNet.Identity;
using Microsoft.Extensions.Logging;
using Soloco.RealTimeWeb.Common.StructureMap;
using Soloco.RealTimeWeb.Membership.Clients.Handlers;
using Soloco.RealTimeWeb.Membership.Infrastructure;
using Soloco.RealTimeWeb.Membership.Services;
using Soloco.RealTimeWeb.Membership.Users.Domain;
using StructureMap;
using StructureMap.Graph;

namespace Soloco.RealTimeWeb.Membership
{
    public class MembershipRegistry : Registry
    {
        public MembershipRegistry()
        {
            Scan(options => { 
                options.TheCallingAssembly();
                options.Include(type => type.Name.EndsWith("Handler"));
                options.IncludeNamespaceContainingType<UserStore>();
                options.Convention<AllInterfacesConvention>();
            });

            For<UserManager<User>>().Use("Create UserManagerFactory", UserManagerFactory);
        }

        //todo use normal injection
        private UserManager<User> UserManagerFactory(IContext resolver)
        {
            var documentSession = resolver.GetInstance<IDocumentSession>();
            var store = new UserStore(documentSession);
            var passwordHasher = new PasswordHasher<User>();
            var logger = new DummyLogger(); // get the real deal
            var manager = new UserManager<User>(store, null, passwordHasher, null, null, null, null, null, logger, null);
            return manager;
        }

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

    }
}