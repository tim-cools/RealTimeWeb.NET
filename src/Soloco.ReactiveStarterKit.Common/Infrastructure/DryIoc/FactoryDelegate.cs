using System;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>The delegate type which is actually used to create service instance by container.
    /// Delegate instance required to be static with all information supplied by <paramref name="state"/> and <paramref name="scope"/>
    /// parameters. The requirement is due to enable compilation to DynamicMethod in DynamicAssembly, and also to simplify
    /// state management and minimizes memory leaks.</summary>
    /// <param name="state">All the state items available in resolution root.</param>
    /// <param name="r">Provides access to <see cref="IResolver"/> implementation to enable nested/dynamic resolve inside:
    /// registered delegate factory, <see cref="Lazy{T}"/>, and <see cref="LazyEnumerable{TService}"/>.</param>
    /// <param name="scope">Resolution root scope: initially passed value will be null, but then the actual will be created on demand.</param>
    /// <returns>Created service object.</returns>
    public delegate object FactoryDelegate(object[] state, IResolverContext r, IScope scope);
}