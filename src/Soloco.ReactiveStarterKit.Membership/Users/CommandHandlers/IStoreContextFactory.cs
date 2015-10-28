using System;

namespace Soloco.ReactiveStarterKit.Membership.Users.CommandHandlers
{
    public interface IStoreContextFactory
    {
        IDisposable Commit();
    }
}