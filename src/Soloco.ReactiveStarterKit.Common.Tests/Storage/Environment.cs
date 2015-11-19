using System;

namespace Soloco.ReactiveStarterKit.Common.Tests.Storage
{
    internal static class Environment
    {
        internal static bool IsRunningOnMono { get; } = Type.GetType("Mono.Runtime") != null;

        public static bool IsLinux
        {
            get
            {
                var p = (int)System.Environment.OSVersion.Platform;
                return (p == 4) || (p == 6) || (p == 128);
            }
        }
    }
}