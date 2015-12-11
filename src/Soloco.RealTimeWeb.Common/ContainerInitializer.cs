using System;
using System.Collections.Generic;
using System.Linq;
using Marten;
using Marten.Linq;
using Marten.Schema;
using Marten.Services;
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
                .RegisterServicesInNamespace(typeof(ConnectionStringParser))
                .RegisterServicesInNamespace(typeof(MessageDispatcher))
                .RegisterMarten();

            return container;
        }

        private static IContainer RegisterMarten(this IContainer container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            var store = new InMemoryStore();

            container.Register<IDocumentSchema, DocumentSchema>(Reuse.Singleton);
            container.RegisterDelegate<IDocumentStore>(resolver =>
            {
                //var connectionString = resolver.Resolve<ConnectionStringParser>().GetString();
                //return DocumentStore.For(connectionString);
                return store;
            }, Reuse.Singleton);

            container.RegisterDelegate<IQuerySession>(resolver => resolver.Resolve<IDocumentSession>()); //resolver.Resolve<IDocumentStore>().QuerySession());
            container.RegisterDelegate<IDocumentSession>(resolver => store); //resolver.Resolve<IDocumentStore>().DirtyTrackedSession(), Reuse.InResolutionScope);

            container.Register<ISerializer, JsonNetSerializer>();
            container.Register<IDocumentSchemaCreation, DevelopmentSchemaCreation>();
            container.Register<ICommandRunner, CommandRunner>();
            container.Register<IDocumentCleaner, DocumentCleaner>();
            container.Register<IMartenQueryExecutor, MartenQueryExecutor>();


            return container;
        }
    }

    internal class InMemoryStore : IDocumentSession, IDocumentStore, IDocumentCleaner
    {
        private class LoadByKeys<T> : ILoadByKeys<T>
        {
            private readonly IList<dynamic> _collection;

            public LoadByKeys(IList<dynamic> collection)
            {
                _collection = collection;
            }

            public IEnumerable<T> ById<TKey>(params TKey[] keys)
            {
                return _collection.Where(document => keys.Contains((TKey)document.Id))
                    .Cast<T>()
                    .ToArray();
            }

            public IEnumerable<T> ById<TKey>(IEnumerable<TKey> keys)
            {
                return _collection.Where(document => keys.Contains((TKey)document.Id))
                    .Cast<T>()
                    .ToArray();

            }
        }

        private IDictionary<Type, IList<dynamic>> _collections = new Dictionary<Type, IList<dynamic>>();

        public void Dispose()
        {
        }

        public T Load<T>(string id) where T : class
        {
            var collection = GetCollection<T>();
            return collection?.FirstOrDefault(document => document.Id == id);
        }

        public T Load<T>(ValueType id) where T : class
        {
            var collection = GetCollection<T>();
            return collection?.FirstOrDefault(document => document.Id == (Guid)id);
        }

        public ILoadByKeys<T> Load<T>() where T : class
        {
            var collection = GetCollection<T>();
            return new LoadByKeys<T>(collection);
        }

        public IQueryable<T> Query<T>()
        {
            var collection = GetCollection<T>();
            return collection.Cast<T>().AsQueryable();
        }

        public IEnumerable<T> Query<T>(string sql, params object[] parameters)
        {
            throw new NotImplementedException();
        }

        public void Delete<T>(T entity)
        {
            var collection = GetCollection<T>();
            collection.Remove(entity);
        }

        public void Delete<T>(ValueType id)
        {
            var collection = GetCollection<T>();
            var entity = collection.FirstOrDefault(document => document.Id == (Guid)id);
            collection.Remove(entity);
        }

        public void Delete<T>(string id)
        {
            var collection = GetCollection<T>();
            var entity = collection.FirstOrDefault(document => document.Id == id);
            collection.Remove(entity);
        }

        public void SaveChanges()
        {
        }

        public void Store<T>(T entity) where T : class
        {
            var collection = GetCollection<T>();
            var existing = collection.FirstOrDefault(document => document.Id == ((dynamic)entity).Id);
            if (existing != null)
            {
                collection.Remove(entity);
            }
            collection.Add(entity);
        }

        private IList<dynamic> GetCollection<T>()
        {
            IList<dynamic> collection;
            if (!_collections.TryGetValue(typeof(T), out collection))
            {
                collection = new List<dynamic>();
                _collections.Add(typeof(T), collection);
            }
            return collection;
        }

        public void BulkInsert<T>(T[] documents, int batchSize = 1000)
        {
            throw new NotImplementedException();
        }

        public IDocumentSession OpenSession(DocumentTracking tracking = DocumentTracking.IdentityOnly)
        {
            return this;
        }

        public IDocumentSession LightweightSession()
        {
            return this;
        }

        public IDocumentSession DirtyTrackedSession()
        {
            return this;
        }

        public IQuerySession QuerySession()
        {
            return this;
        }

        public IDocumentSchema Schema
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public AdvancedOptions Advanced => new AdvancedOptions(this);

        public IDiagnostics Diagnostics
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public void DeleteAllDocuments()
        {
            _collections = new Dictionary<Type, IList<dynamic>>();
        }

        public void DeleteDocumentsFor(Type documentType)
        {
            throw new NotImplementedException();
        }

        public void DeleteDocumentsExcept(params Type[] documentTypes)
        {
            throw new NotImplementedException();
        }

        public void CompletelyRemove(Type documentType)
        {
            throw new NotImplementedException();
        }

        public void CompletelyRemoveAll()
        {
            throw new NotImplementedException();
        }
    }
}