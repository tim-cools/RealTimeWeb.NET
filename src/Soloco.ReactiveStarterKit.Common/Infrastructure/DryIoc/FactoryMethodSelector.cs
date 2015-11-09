namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Declares delegate to get single factory method or constructor for resolved request.</summary>
    /// <param name="request">Request to resolve.</param>
    /// <returns>Factory method wrapper over constructor or method.</returns>
    public delegate FactoryMethod FactoryMethodSelector(Request request);
}