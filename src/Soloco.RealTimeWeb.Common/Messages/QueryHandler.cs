using System;
using System.Threading.Tasks;
using Marten;

namespace Soloco.RealTimeWeb.Common.Messages
{
    public abstract class QueryHandler<TCommand, TResult> : IHandleMessage<TCommand, TResult> 
        where TCommand : IMessage<TResult>
    {
        protected IQuerySession Session { get; }

        protected QueryHandler(IQuerySession session)
        {
            if (session == null) throw new ArgumentNullException(nameof(session));

            Session = session;
        }

        public async Task<TResult> Handle(TCommand query)
        {
            return await Execute(query);
        }

        protected abstract Task<TResult> Execute(TCommand query);
    }
}