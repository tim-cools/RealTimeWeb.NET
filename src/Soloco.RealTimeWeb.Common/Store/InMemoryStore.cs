using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Marten;
using Marten.Events;
using Marten.Linq;
using Marten.Schema;
using Marten.Services;
using Marten.Services.BatchQuerying;
using Marten.Services.Includes;
using Npgsql;

namespace Soloco.RealTimeWeb.Common.Store
{
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

            public Task<IList<T>> ByIdAsync<TKey>(params TKey[] keys)
            {
                throw new NotImplementedException();
            }

            IList<T> ILoadByKeys<T>.ById<TKey>(IEnumerable<TKey> keys)
            {
                throw new NotImplementedException();
            }

            public Task<IList<T>> ByIdAsync<TKey>(IEnumerable<TKey> keys, CancellationToken token = new CancellationToken())
            {
                throw new NotImplementedException();
            }

            IList<T> ILoadByKeys<T>.ById<TKey>(params TKey[] keys)
            {
                throw new NotImplementedException();
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

        public Task<T> LoadAsync<T>(string id, CancellationToken token = new CancellationToken()) where T : class
        {
            throw new NotImplementedException();
        }

        public T Load<T>(ValueType id) where T : class
        {
            var collection = GetCollection<T>();
            return collection?.FirstOrDefault(document => document.Id == (Guid)id);
        }

        public Task<T> LoadAsync<T>(ValueType id, CancellationToken token = new CancellationToken()) where T : class
        {
            throw new NotImplementedException();
        }

        public string FindJsonById<T>(string id) where T : class
        {
            throw new NotImplementedException();
        }

        public string FindJsonById<T>(ValueType id) where T : class
        {
            throw new NotImplementedException();
        }

        public Task<string> FindJsonByIdAsync<T>(string id, CancellationToken token = new CancellationToken()) where T : class
        {
            throw new NotImplementedException();
        }

        public Task<string> FindJsonByIdAsync<T>(ValueType id, CancellationToken token = new CancellationToken()) where T : class
        {
            throw new NotImplementedException();
        }

        IMartenQueryable<T> IQuerySession.Query<T>()
        {
            throw new NotImplementedException();
        }

        IList<T> IQuerySession.Query<T>(string sql, params object[] parameters)
        {
            throw new NotImplementedException();
        }

        public Task<IList<T>> QueryAsync<T>(string sql, CancellationToken token = new CancellationToken(), params object[] parameters)
        {
            throw new NotImplementedException();
        }

        public IBatchedQuery CreateBatchQuery()
        {
            throw new NotImplementedException();
        }

        public TOut Query<TDoc, TOut>(ICompiledQuery<TDoc, TOut> query)
        {
            throw new NotImplementedException();
        }

        public Task<TOut> QueryAsync<TDoc, TOut>(ICompiledQuery<TDoc, TOut> query, CancellationToken token = new CancellationToken())
        {
            throw new NotImplementedException();
        }

        public IList<T> LoadMany<T>(params string[] ids) where T : class
        {
            throw new NotImplementedException();
        }

        public IList<T> LoadMany<T>(params Guid[] ids) where T : class
        {
            throw new NotImplementedException();
        }

        public IList<T> LoadMany<T>(params int[] ids) where T : class
        {
            throw new NotImplementedException();
        }

        public IList<T> LoadMany<T>(params long[] ids) where T : class
        {
            throw new NotImplementedException();
        }

        public Task<IList<T>> LoadManyAsync<T>(params string[] ids) where T : class
        {
            throw new NotImplementedException();
        }

        public Task<IList<T>> LoadManyAsync<T>(params Guid[] ids) where T : class
        {
            throw new NotImplementedException();
        }

        public Task<IList<T>> LoadManyAsync<T>(params int[] ids) where T : class
        {
            throw new NotImplementedException();
        }

        public Task<IList<T>> LoadManyAsync<T>(params long[] ids) where T : class
        {
            throw new NotImplementedException();
        }

        public Task<IList<T>> LoadManyAsync<T>(CancellationToken token, params string[] ids) where T : class
        {
            throw new NotImplementedException();
        }

        public Task<IList<T>> LoadManyAsync<T>(CancellationToken token, params Guid[] ids) where T : class
        {
            throw new NotImplementedException();
        }

        public Task<IList<T>> LoadManyAsync<T>(CancellationToken token, params int[] ids) where T : class
        {
            throw new NotImplementedException();
        }

        public Task<IList<T>> LoadManyAsync<T>(CancellationToken token, params long[] ids) where T : class
        {
            throw new NotImplementedException();
        }

        public NpgsqlConnection Connection { get; }
        public IMartenSessionLogger Logger { get; set; }
        public int RequestCount { get; }
        public IDocumentStore DocumentStore { get; }

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

        public void DeleteWhere<T>(Expression<Func<T, bool>> expression)
        {
            throw new NotImplementedException();
        }

        public void SaveChanges()
        {
        }

        public Task SaveChangesAsync(CancellationToken token = new CancellationToken())
        {
            throw new NotImplementedException();
        }

        public void Store<T>(params T[] entities)
        {
            throw new NotImplementedException();
        }

        public void StoreObjects(IEnumerable<object> documents)
        {
            throw new NotImplementedException();
        }

        public IUnitOfWork PendingChanges { get; }
        public IEventStore Events { get; }
        public IEnumerable<IChangeSet> Commits { get; }
        public IChangeSet LastCommit { get; }

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

        public void BulkInsert<T>(T[] documents, BulkInsertMode mode = BulkInsertMode.InsertsOnly, int batchSize = 1000)
        {
            throw new NotImplementedException();
        }

        public IDocumentSession OpenSession(DocumentTracking tracking = DocumentTracking.IdentityOnly, IsolationLevel isolationLevel = IsolationLevel.ReadCommitted)
        {
            throw new NotImplementedException();
        }

        public IDocumentSession LightweightSession(IsolationLevel isolationLevel = IsolationLevel.ReadCommitted)
        {
            throw new NotImplementedException();
        }

        public IDocumentSession DirtyTrackedSession(IsolationLevel isolationLevel = IsolationLevel.ReadCommitted)
        {
            throw new NotImplementedException();
        }

        public IQuerySession QuerySession()
        {
            return this;
        }

        public void BulkInsertDocuments(IEnumerable<object> documents, BulkInsertMode mode = BulkInsertMode.InsertsOnly, int batchSize = 1000)
        {
            throw new NotImplementedException();
        }

        public IDocumentSchema Schema
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public AdvancedOptions Advanced => new AdvancedOptions(this, new StoreOptions(), new JsonNetSerializer(), Schema);

        public IDiagnostics Diagnostics
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public IEventStoreAdmin EventStore { get; }

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

        public void DeleteAllEventData()
        {
            throw new NotImplementedException();
        }
    }

    internal struct Wrapper<T> : IMartenQueryable<T>
    {
        private readonly IQueryable<T> _query;

        public Wrapper(IQueryable<T> query)
        {
            _query = query;

            Expression = null;
            ElementType = null;
            Provider = null;
            Includes = null;
            Statistics = null;
        }

        public IEnumerator<T> GetEnumerator()
        {
            return _query.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public Expression Expression { get; }
        public Type ElementType { get; set; }
        public IQueryProvider Provider { get; set; }

        public IEnumerable<IIncludeJoin> Includes { get; set; }
        public QueryStatistics Statistics { get; set; }

        public Task<IList<TResult>> ToListAsync<TResult>(CancellationToken token)
        {
            throw new NotImplementedException();
        }

        public Task<bool> AnyAsync(CancellationToken token)
        {
            throw new NotImplementedException();
        }

        public Task<int> CountAsync(CancellationToken token)
        {
            throw new NotImplementedException();
        }

        public Task<long> CountLongAsync(CancellationToken token)
        {
            throw new NotImplementedException();
        }

        public Task<TResult> FirstAsync<TResult>(CancellationToken token)
        {
            throw new NotImplementedException();
        }

        public Task<TResult> FirstOrDefaultAsync<TResult>(CancellationToken token)
        {
            throw new NotImplementedException();
        }

        public Task<TResult> SingleAsync<TResult>(CancellationToken token)
        {
            throw new NotImplementedException();
        }

        public Task<TResult> SingleOrDefaultAsync<TResult>(CancellationToken token)
        {
            throw new NotImplementedException();
        }

        public Task<TResult> SumAsync<TResult>(CancellationToken token)
        {
            throw new NotImplementedException();
        }

        public Task<TResult> MinAsync<TResult>(CancellationToken token)
        {
            throw new NotImplementedException();
        }

        public Task<TResult> MaxAsync<TResult>(CancellationToken token)
        {
            throw new NotImplementedException();
        }

        public Task<double> AverageAsync(CancellationToken token)
        {
            throw new NotImplementedException();
        }

        public QueryPlan Explain(FetchType fetchType = FetchType.FetchMany)
        {
            throw new NotImplementedException();
        }

        public IMartenQueryable<T> Include<TInclude>(Expression<Func<T, object>> idSource, Action<TInclude> callback, JoinType joinType = JoinType.Inner) where TInclude : class
        {
            throw new NotImplementedException();
        }

        public IMartenQueryable<T> Include<TInclude>(Expression<Func<T, object>> idSource, IList<TInclude> list, JoinType joinType = JoinType.Inner) where TInclude : class
        {
            throw new NotImplementedException();
        }

        public IMartenQueryable<T> Include<TInclude, TKey>(Expression<Func<T, object>> idSource, IDictionary<TKey, TInclude> dictionary, JoinType joinType = JoinType.Inner) where TInclude : class
        {
            throw new NotImplementedException();
        }

        public IMartenQueryable<T> Stats(out QueryStatistics stats)
        {
            throw new NotImplementedException();
        }
    }
}