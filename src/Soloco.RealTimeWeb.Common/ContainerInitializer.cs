using System;
using Marten;
using Marten.Linq;
using Marten.Schema;
using Marten.Services;
using Remotion.Linq.Parsing.Structure;
using Soloco.RealTimeWeb.Common.Infrastructure.DryIoc;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Infrastructure.Store;

namespace Soloco.RealTimeWeb.Common
{
    public static class ContainerInitializer
    {
        public static IContainer RegisterCommon(this IContainer container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            container
                .RegisterServicesInNamespace(typeof(MessageDispatcher))
                .RegisterMarten();
            
            return container;
        }

        private static IContainer RegisterMarten(this IContainer container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            container.Register<IDocumentSchema, DocumentSchema>(Reuse.Singleton);
            container.Register<IDocumentStore, DocumentStore>(Reuse.Singleton);

            container.Register<IConnectionFactory, ConnectionFromConfig>();
            container.RegisterDelegate<IQuerySession>(resolver => resolver.Resolve<IDocumentStore>().QuerySession());
            container.RegisterDelegate<IDocumentSession>(resolver => resolver.Resolve<IDocumentStore>().DirtyTrackedSession());

            container.Register<ISerializer, JsonNetSerializer>();
            container.Register<IDocumentSchemaCreation, DevelopmentSchemaCreation>();
            container.Register<ICommandRunner, CommandRunner>();
            container.Register<IDocumentCleaner, DocumentCleaner>();
            container.Register<IMartenQueryExecutor, MartenQueryExecutor>();

            return container;
        }
    }
}