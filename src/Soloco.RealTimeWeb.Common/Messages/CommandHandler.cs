using System;
using System.Threading.Tasks;
using Marten;

namespace Soloco.RealTimeWeb.Common.Messages
{
    public abstract class CommandHandler<TCommand, TResult> : IHandleMessage<TCommand, TResult>
        where TCommand : IMessage<TResult>
        where TResult : Result, new()
    {
        protected IDocumentSession Session { get; }

        protected CommandHandler(IDocumentSession session)
        {
            if (session == null) throw new ArgumentNullException(nameof(session));

            Session = session;
        }

        public async Task<TResult> Handle(TCommand query)
        {
            try
            {
                var result = await Execute(query);
                if (result.Succeeded)
                {
                    Session.SaveChanges();
                }
                return result;
            }
            catch (BusinessException businessException)
            {
                return new TResult { Succeeded = false, Errors = businessException.Errors };
            }
        }

        protected abstract Task<TResult> Execute(TCommand command);
    }

    public abstract class CommandHandler<TCommand> : CommandHandler<TCommand, Result> 
        where TCommand : IMessage<Result>
    {
        protected CommandHandler(IDocumentSession session) : base(session)
        {
        }
    }
}