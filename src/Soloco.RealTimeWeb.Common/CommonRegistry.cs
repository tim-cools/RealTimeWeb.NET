using Marten;
using Marten.Linq;
using Marten.Schema;
using Marten.Services;
using Microsoft.Extensions.Configuration;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Store;
using Soloco.RealTimeWeb.Common.StructureMap;
using StructureMap;
using StructureMap.Graph;

namespace Soloco.RealTimeWeb.Common
{
    public class CommonRegistry : Registry
    {
        public CommonRegistry()
        {
            Scan(options =>
            {
                options.TheCallingAssembly();
                options.IncludeNamespaceContainingType<ConnectionStringParser>();
                options.IncludeNamespaceContainingType<MessageDispatcher>();
                options.Convention<AllInterfacesConvention>();
            });

            RegisterMartenCommon();
            RegisterMartenSession();
        }

        private void RegisterMartenCommon()
        {
            ForSingletonOf<IDocumentSchema>().Use<DocumentSchema>();
            For<ISerializer>().Use<JsonNetSerializer>();
            For<IDocumentCleaner>().Use<DocumentCleaner>();
        }

        private void RegisterMartenSession()
        {
            var store = new InMemoryStore();

            ForSingletonOf<IDocumentStore>().Use("Create DocumentStore", context =>
            {
                var connectionString = context.GetInstance<ConnectionStringParser>().GetString();

                return !string.IsNullOrWhiteSpace(connectionString)
                    ? DocumentStore.For(connectionString)
                    : (IDocumentStore) store;
            });

            For<IQuerySession>()
                .Use("Create QuerySession", context =>
                {
                    var connectionString = context.GetInstance<ConnectionStringParser>().GetString();

                    return !string.IsNullOrWhiteSpace(connectionString) 
                        ? context.GetInstance<IDocumentStore>().QuerySession() 
                        : store;
                })
                .ContainerScoped();

            For<IDocumentSession>()
                .Use("Create DocumentSession", context =>
                {
                    var connectionString = context.GetInstance<ConnectionStringParser>().GetString();

                    return !string.IsNullOrWhiteSpace(connectionString)
                        ? context.GetInstance<IDocumentStore>().DirtyTrackedSession()
                        : store;
                })
                .ContainerScoped();
        }
    }
}