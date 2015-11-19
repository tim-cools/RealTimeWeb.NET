using System;
using Marten;
using Marten.Linq;
using Marten.Schema;
using Remotion.Linq.Parsing.Structure;
using Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Store;

namespace Soloco.ReactiveStarterKit.Common
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

            container.Register<IQueryParser, MartenQueryParser>(Reuse.Singleton);
            container.Register<IDocumentSchema, DocumentSchema>(Reuse.Singleton);

            container.Register<IConnectionFactory, ConnectionFromConfig>();
            container.Register<IDocumentSession, TrackingSession>();
            container.Register<ISerializer, JsonNetSerializer>();
            container.Register<IDocumentSchemaCreation, DevelopmentSchemaCreation>();
            container.Register<ICommandRunner, CommandRunner>();
            container.Register<IDocumentCleaner, DocumentCleaner>();
            container.Register<IMartenQueryExecutor, MartenQueryExecutor>();

            return container;
        }
    }
}