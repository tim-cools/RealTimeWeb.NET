using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Infrastructure.Documentation
{
    public class DocumentsQueryHandler : IHandleMessage<DocumentsQuery, DocumentHeader[]>
    {
        private readonly IDocumentationFiles _documentationFiles;

        public DocumentsQueryHandler(IDocumentationFiles documentationFiles)
        {
            _documentationFiles = documentationFiles;
        }

        public Task<DocumentHeader[]> Handle(DocumentsQuery query)
        {
            var files = _documentationFiles.GetFiles();
            var headers = Map(files);

            return Task.FromResult(headers);
        }

        private DocumentHeader[] Map(IEnumerable<string> files)
        {
            var headers = files.Select(DocumentHeader.ParseFile)
                .OrderBy(header => header.Order)
                .ToArray();

            return MapRootHeaders(headers).ToArray();
        }

        private IEnumerable<DocumentHeader> MapRootHeaders(DocumentHeader[] headers)
        {
            return headers
                .Where(header => header.IsRoot())
                .Select(header => AddChildren(header, headers));
        }

        private DocumentHeader AddChildren(DocumentHeader parent, IEnumerable<DocumentHeader> headers)
        {
            var children = headers.Where(parent.IsParentOf);
            return parent.AddChildren(children);
        }
    }
}