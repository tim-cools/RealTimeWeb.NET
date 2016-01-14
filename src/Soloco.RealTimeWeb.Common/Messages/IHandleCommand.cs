namespace Soloco.RealTimeWeb.Common.Messages
{
    public interface IHandleCommand<in TMessage> : IHandleMessage<TMessage, Result>
        where TMessage : IMessage<Result>
    {
    }
}