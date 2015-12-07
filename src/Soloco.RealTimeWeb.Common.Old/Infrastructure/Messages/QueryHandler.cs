using System;
using System.Threading.Tasks;
using Marten;

namespace Soloco.RealTimeWeb.Common.Infrastructure.Messages
{
    public abstract class QueryHandler<TCommand, TResult> : IHandleMessage<TCommand, TResult> 
        where TCommand : IMessage<TResult>
    {
        private readonly IDisposable _scope;

        protected IQuerySession Session { get; }

        protected QueryHandler(IQuerySession session, IDisposable scope)
        {
            if (session == null) throw new ArgumentNullException(nameof(session));
            if (scope == null) throw new ArgumentNullException(nameof(scope));

            Session = session;
            _scope = scope;
        }

        public async Task<TResult> Handle(TCommand query)
        {
            using (_scope)
            {
                return await Execute(query);
            }
        }

        protected abstract Task<TResult> Execute(TCommand query);
    }
}