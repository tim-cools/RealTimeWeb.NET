using System;
using System.Collections.Generic;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Facility for creating concrete factories from some template/prototype. Example: 
    /// creating closed-generic type reflection factory from registered open-generic prototype factory.</summary>
    public interface IConcreteFactoryGenerator
    {
        /// <summary>Returns factories created by <see cref="GenerateFactoryOrDefault"/> so far.</summary>
        IEnumerable<KV<Type, object>> ServiceTypeAndKeyOfGeneratedFactories { get; }

        /// <summary>Method applied for factory provider, returns new factory per request.</summary>
        /// <param name="request">Request to resolve.</param> <returns>Returns new factory per request.</returns>
        Factory GenerateFactoryOrDefault(Request request);
    }
}