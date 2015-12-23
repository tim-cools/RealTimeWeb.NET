using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Infrastructure.Documentation
{
    public class DocumentQuery : IMessage<Document>
    {
        public string Id { get; }

        public DocumentQuery(string id)
        {
            Id = id;
        }
    }
}