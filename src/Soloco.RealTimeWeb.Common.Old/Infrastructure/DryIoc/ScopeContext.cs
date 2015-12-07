using System.Diagnostics.CodeAnalysis;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    static partial class ScopeContext
    {
        [SuppressMessage("ReSharper", "RedundantAssignment", Justification = "ref is the only way for partial methods.")]
        static partial void GetDefaultScopeContext(ref IScopeContext resultContext)
        {
            resultContext = new AsyncExecutionFlowScopeContext();
        }
    }
}