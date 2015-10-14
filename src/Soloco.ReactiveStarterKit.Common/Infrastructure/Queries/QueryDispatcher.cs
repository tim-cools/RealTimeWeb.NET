using System;
using Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.Queries
{
    public class QueryDispatcher : IQueryDispatcher
    {
        private readonly IContainer _container;

        public QueryDispatcher(IContainer container)
        {
            if (container == null) throw new ArgumentNullException("container");

            _container = container;
        }

        public TResult Execute<TResult>(IQuery<TResult> query) 
        {
            if (query == null) throw new ArgumentNullException("query");

            var handler = GetQueryHandler(query);

            return handler.Handle((dynamic) query);
        }

        private dynamic GetQueryHandler<TResult>(IQuery<TResult> query) 
        {
            var handlerType = typeof (IHandleQuery<,>)
                .MakeGenericType(query.GetType(), typeof (TResult));

            return _container.Resolve(handlerType);
        }
    }
}