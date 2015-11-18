using System;

namespace Soloco.ReactiveStarterKit.Common.Tests.Storage
{
    internal static class Environment
    {
        internal static bool IsRunningOnMono { get; } = Type.GetType("Mono.Runtime") != null;
    }
}