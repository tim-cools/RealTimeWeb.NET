namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Specifies result of <see cref="Resolver.ResolveMany{TService}"/>: either dynamic(lazy) or fixed view.</summary>
    public enum ResolveManyBehavior
    {
        /// <summary>Lazy/dynamic item resolve.</summary>
        AsLazyEnumerable,
        /// <summary>Fixed array of item at time of resolve, newly registered/removed services won't be listed.</summary>
        AsFixedArray
    }
}