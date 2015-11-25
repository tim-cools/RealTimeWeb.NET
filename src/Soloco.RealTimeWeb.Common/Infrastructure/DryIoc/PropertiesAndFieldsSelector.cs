using System.Collections.Generic;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Specifies what properties or fields to inject and how.</summary>
    /// <param name="request">Request for property/field owner.</param>
    /// <returns>Corresponding service info for each property/field to be injected.</returns>
    public delegate IEnumerable<PropertyOrFieldServiceInfo> PropertiesAndFieldsSelector(Request request);
}