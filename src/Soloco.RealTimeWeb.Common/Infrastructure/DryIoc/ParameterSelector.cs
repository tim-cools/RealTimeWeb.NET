using System;
using System.Reflection;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Specifies how to get parameter info for injected parameter and resolved request</summary>
    /// <remarks>Request is for parameter method owner not for parameter itself.</remarks>
    /// <param name="request">Request for parameter method/constructor owner.</param>
    /// <returns>Service info describing how to inject parameter.</returns>
    public delegate Func<ParameterInfo, ParameterServiceInfo> ParameterSelector(Request request);
}