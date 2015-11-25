namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Returns reference to actual resolver implementation. 
    /// Minimizes dependency to Factory Delegate on container.</summary>
    public interface IResolverContext
    {
        /// <summary>Provides access to resolver implementation.</summary>
        IResolver Resolver { get; }

        /// <summary>Scopes access.</summary>
        IScopeAccess Scopes { get; }
    }
}