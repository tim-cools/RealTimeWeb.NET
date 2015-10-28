using Elephanet;

namespace Soloco.ReactiveStarterKit.Membership.Users.CommandHandlers
{
    public interface IStoreFactory
    {
        IDocumentSession Create();
    }
}