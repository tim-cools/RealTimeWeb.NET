using System;
using System.Collections.Generic;
using System.Linq;

namespace Soloco.RealTimeWeb.Infrastructure.Documentation
{
    public class DocumentHeader
    {
        private readonly string[] _parts;
        private readonly string _path;

        internal string Order { get; }

        public string Id { get; }
        public string Name { get; }

        public DocumentHeader[] Children { get; }

        private DocumentHeader(string id, string[] parts, DocumentHeader[] children = null)
        {
            if (parts == null) throw new ArgumentNullException(nameof(parts));
            
            Id = id;
            Children = children ?? new DocumentHeader[0];

            _parts = parts;
            _path = string.Join("/", parts);

            Order = parts.Skip(parts.Length - 2).FirstOrDefault();
            Name = parts.Last();
        }

        public static DocumentHeader ParseFile(string file)
        {
            var fileName = System.IO.Path.GetFileNameWithoutExtension(file);
            var parts = fileName.Split('-');

            if (parts.Length <= 0) throw new InvalidOperationException("parts.Length <= 0: " + file);
            if (parts.Length % 2 != 0) throw new ArgumentException("parts.Length % 2 != 0" + file);

            return new DocumentHeader(fileName, parts.ToArray());
        }

        public bool IsParentOf(DocumentHeader header)
        {
            if (header == null) throw new ArgumentNullException(nameof(header));

            var parentPath = string.Join("/", header._parts.Take(header._parts.Length - 2));

            return _path == parentPath;
        }

        public DocumentHeader AddChildren(IEnumerable<DocumentHeader> children)
        {
            return new DocumentHeader(Id, _parts, children.OrderBy(child => child.Order).ToArray());
        }

        public bool IsRoot()
        {
            return _parts.Length == 2;
        }
    }
}