using System;
using System.Threading.Tasks;
using Marten;

namespace Soloco.RealTimeWeb.Common.Infrastructure.Messages
{
    public abstract class CommandHandler<TCommand> : IHandleCommand<TCommand> 
        where TCommand : IMessage<CommandResult>
    {
        protected IDocumentSession Session { get; }

        protected CommandHandler(IDocumentSession session)
        {
            if (session == null) throw new ArgumentNullException(nameof(session));

            Session = session;
        }

        public async Task<CommandResult> Handle(TCommand command)
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

        protected abstract Task<CommandResult> Execute(TCommand command);
    }
}