using System;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    [Serializable]
    internal sealed class ScopeEntry<T> : MarshalByRefObject
    {
        public readonly T Value;
        public ScopeEntry(T value) { Value = value; }
    }
}