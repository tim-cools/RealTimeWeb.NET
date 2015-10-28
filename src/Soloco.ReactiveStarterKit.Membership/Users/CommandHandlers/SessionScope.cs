using System;
using Elephanet;

namespace Soloco.ReactiveStarterKit.Membership.Users.CommandHandlers
{
    public class SessionScope : ISessionScope, IDisposable
    {
        public IDocumentSession Session { get; private set; }

        public SessionScope(IStoreFactory storeFactory)
        {
            Session = storeFactory.Create();
        }

        public void Dispose()
        {
            Session.Dispose();
        }
    }
}