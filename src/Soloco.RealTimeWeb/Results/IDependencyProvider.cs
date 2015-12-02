using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Formatting;

namespace Soloco.RealTimeWeb.Results
{
    internal interface IDependencyProvider
    {
        IContentNegotiator ContentNegotiator { get; }

        HttpRequestMessage Request { get; }

        IEnumerable<MediaTypeFormatter> Formatters { get; }
    }
}