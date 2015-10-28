using Elephanet;

namespace Soloco.ReactiveStarterKit.Membership.Users.CommandHandlers
{
    public interface ISessionScope
    {
        IDocumentSession Session { get; }
    }
}