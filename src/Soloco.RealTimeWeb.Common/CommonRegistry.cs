using Marten;
using Marten.Linq;
using Marten.Schema;
using Marten.Services;
using Soloco.RealTimeWeb.Common.Container;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Store;
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

            RegisterMarten();
        }

        private void RegisterMarten()
        {
            var store = new InMemoryStore();

            ForSingletonOf<IDocumentSchema>().Use<DocumentSchema>();
            ForSingletonOf<IDocumentStore>().Use("Create DocumentStore", context =>
            {
                //var connectionString = resolver.Resolve<ConnectionStringParser>().GetString();
                //return DocumentStore.For(connectionString);
                return store;
            });

            For<IQuerySession>().Use("Create QuerySession", context =>
            {
                //resolver.Resolve<IDocumentStore>().QuerySession());
                return context.GetInstance<IDocumentSession>();
            }).ContainerScoped();

            For<IDocumentSession>().Use("Create DocumentSession", context =>
            {
                //resolver.Resolve<IDocumentStore>().DirtyTrackedSession(), Reuse.InResolutionScope);
                return store;
            }).ContainerScoped();

            For<ISerializer>().Use<JsonNetSerializer>();
            For<IDocumentSchemaCreation>().Use<DevelopmentSchemaCreation>();
            For<ICommandRunner>().Use<CommandRunner>();
            For<IDocumentCleaner>().Use<DocumentCleaner>();
            For<IMartenQueryExecutor>().Use<MartenQueryExecutor>();
        }
    }
}