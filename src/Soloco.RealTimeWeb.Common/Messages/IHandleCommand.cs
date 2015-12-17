namespace Soloco.RealTimeWeb.Common.Messages
{
    public interface IHandleCommand<in TMessage> : IHandleMessage<TMessage, CommandResult>
        where TMessage : IMessage<CommandResult>
    {
    }
}