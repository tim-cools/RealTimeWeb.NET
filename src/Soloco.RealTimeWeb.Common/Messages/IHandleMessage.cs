
using System.Threading.Tasks;

namespace Soloco.RealTimeWeb.Common.Messages
{
    public interface IHandleMessage<in TMessage, TResult> where TMessage : IMessage<TResult>
    {
        Task<TResult> Handle(TMessage query);
    }
}