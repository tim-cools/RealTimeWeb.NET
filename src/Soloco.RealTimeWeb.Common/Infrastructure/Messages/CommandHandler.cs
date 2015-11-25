using System;
using System.Threading.Tasks;
using Marten;

namespace Soloco.RealTimeWeb.Common.Infrastructure.Messages
{
    public abstract class CommandHandler<TCommand> : IHandleCommand<TCommand> 
        where TCommand : IMessage<CommandResult>
    {
        private readonly IDisposable _scope;

        protected IDocumentSession Session { get; }

        protected CommandHandler(IDocumentSession session, IDisposable scope)
        {
            if (session == null) throw new ArgumentNullException(nameof(session));
            if (scope == null) throw new ArgumentNullException(nameof(scope));

            Session = session;
            _scope = scope;
        }

        public async Task<CommandResult> Handle(TCommand command)
        {
            using (_scope)
            {
                try
                {
                    var result = await Execute(command);
                    if (result.Succeeded)
                    {
                        Session.SaveChanges();
                    }
                    return result;
                }
                catch (BusinessException businessException)
                {
                    return new CommandResult(businessException.Errors);
                }
            }
        }

        protected abstract Task<CommandResult> Execute(TCommand command);
    }
}