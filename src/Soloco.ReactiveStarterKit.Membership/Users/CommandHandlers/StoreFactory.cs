using System;
using System.Configuration;
using Elephanet;
using Elephanet.Conventions;

namespace Soloco.ReactiveStarterKit.Membership.Users.CommandHandlers
{
    public class StoreFactory : IStoreFactory
    {
        private readonly DocumentStore _store;

        public StoreFactory()
        {
            var connectionString = GetConnectionString();
            var storeConventions = new StoreConventions();

            storeConventions.SetEntityNotFoundBehavior(EntityNotFoundBehavior.ReturnNull);
            _store = new DocumentStore(connectionString.ConnectionString, storeConventions);
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