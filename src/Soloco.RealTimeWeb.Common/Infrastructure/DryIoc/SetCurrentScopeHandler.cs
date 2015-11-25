namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Delegate to get new scope from old/existing current scope.</summary>
    /// <param name="oldScope">Old/existing scope to change.</param>
    /// <returns>New scope or old if do not want to change current scope.</returns>
    public delegate IScope SetCurrentScopeHandler(IScope oldScope);
}