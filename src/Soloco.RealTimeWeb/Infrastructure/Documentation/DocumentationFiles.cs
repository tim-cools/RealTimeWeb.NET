using System;
using System.IO;
using Microsoft.Extensions.PlatformAbstractions;

namespace Soloco.RealTimeWeb.Infrastructure.Documentation
{
    public class DocumentationFiles : IDocumentationFiles
    {
        private readonly IApplicationEnvironment _applicationEnvironment;

        public DocumentationFiles(IApplicationEnvironment applicationEnvironment)
        {
            if (applicationEnvironment == null) throw new ArgumentNullException(nameof(applicationEnvironment));
            _applicationEnvironment = applicationEnvironment;
        }

        private string GetFolder()
        {
            return Path.Combine(_applicationEnvironment.ApplicationBasePath, "wwwroot", "documentation");
        }

        public string[] GetFiles()
        {
            var documentationFolder = GetFolder();
            return Directory.GetFiles(documentationFolder, "*.md");
        }

        public string ReadFile(string id)
        {
            var documentationFolder = GetFolder();
            var file = Path.Combine(documentationFolder, id + ".md");
            return File.Exists(file) ? File.ReadAllText(file) : null;
        }
    }
}