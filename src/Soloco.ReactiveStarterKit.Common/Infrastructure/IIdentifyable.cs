using System;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure
{
    public interface IIdentifyable
    {
        Guid Id { get; }
    }
}