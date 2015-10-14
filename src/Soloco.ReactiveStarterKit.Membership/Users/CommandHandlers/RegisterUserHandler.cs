using System;
using System.Configuration;
using Elephanet;
using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Commands;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;
using Soloco.ReactiveStarterKit.Membership.Models;

namespace Soloco.ReactiveStarterKit.Membership.Users.CommandHandlers
{
    public class RegisterUserHandler : IHandleMessage<RegisterUserCommand, EmptyResult>
    {
        private readonly IStoreFactory _storeFactory;

        public RegisterUserHandler(IStoreFactory storeFactory)
        {
            _storeFactory = storeFactory;
        }

        public EmptyResult Handle(RegisterUserCommand query)
        {
            using (var session = _storeFactory.Create())
            {
                var user = new IdentityUser();
                user.Id = query.UserId;

                session.Store(user);

                session.SaveChanges();
            }

            return EmptyResult.Instance;
        }
    }

    public interface IStoreFactory
    {
        IDocumentSession Create();
    }

    public class StoreFactory : IStoreFactory
    {
        private readonly DocumentStore _store;

        public StoreFactory()
        {
            var connectionString = GetConnectionString();
            _store = new DocumentStore(connectionString.ConnectionString);
        }

        public IDocumentSession Create()
        {
            return _store.OpenSession();
        }

        private static ConnectionStringSettings GetConnectionString()
        {
            var connectionString = ConfigurationManager.ConnectionStrings["documentStore"];
            if (string.IsNullOrWhiteSpace(connectionString?.ConnectionString))
            {
                throw new InvalidOperationException("ConnectionString 'documentStore' not found in app.config");
            }
            return connectionString;
        }
    }
}