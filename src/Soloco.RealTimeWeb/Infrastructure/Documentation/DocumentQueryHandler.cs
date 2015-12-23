using System.Threading.Tasks;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Infrastructure.Documentation
{
    public class DocumentQueryHandler : IHandleMessage<DocumentQuery, Document>
    {
        private readonly IDocumentationFiles _documentationFiles;

        public DocumentQueryHandler(IDocumentationFiles documentationFiles)
        {
            _documentationFiles = documentationFiles;
        }

        public Task<Document> Handle(DocumentQuery query)
        {
            var content = _documentationFiles.ReadFile(query.Id);
            var document = new Document(content);

            return Task.FromResult(document);
        }
    }
}