using Moq;
using Shouldly;
using Soloco.RealTimeWeb.Infrastructure.Documentation;
using Xunit;

namespace Soloco.RealTimeWeb.Tests.Unit.Documents.DocumentsControllerSpecifications
{
    public class WhenGettingDocuments
    {
        [Fact]
        public void ThenTheDocumentMessageHandlerShouldBeGettable()
        {
            var documentationFiles = new Mock<IDocumentationFiles>();
            var files = new[]
            {
                @"C:/_/Soloco.RealTimeWeb/git/src/Soloco.RealTimeWeb/wwwroot/documentation/0-Overview-2-Monitoring.md",
                @"C:/_/Soloco.RealTimeWeb/git/src/Soloco.RealTimeWeb/wwwroot/documentation/0-Overview-0-Identity.md",
                @"C:/_/Soloco.RealTimeWeb/git/src/Soloco.RealTimeWeb/wwwroot/documentation/0-Overview.md",
                @"C:/_/Soloco.RealTimeWeb/git/src/Soloco.RealTimeWeb/wwwroot/documentation/1-Getting Started.md",
                @"C:/_/Soloco.RealTimeWeb/git/src/Soloco.RealTimeWeb/wwwroot/documentation/2-Front End-0-Asp.Net 5.md",
                @"C:/_/Soloco.RealTimeWeb/git/src/Soloco.RealTimeWeb/wwwroot/documentation/0-Overview-1-Orders.md",
                @"C:/_/Soloco.RealTimeWeb/git/src/Soloco.RealTimeWeb/wwwroot/documentation/2-Front End.md",
                @"C:/_/Soloco.RealTimeWeb/git/src/Soloco.RealTimeWeb/wwwroot/documentation/3-Environment.md"
            };

            documentationFiles.Setup(mock => mock.GetFiles()).Returns(files);
            var handler = new DocumentsQueryHandler(documentationFiles.Object);

            var documents = handler.Handle(new DocumentsQuery());
            documents.Result.Length.ShouldBe(4);

            Verify(documents.Result, 0, "0-Overview", "Overview");
            Verify(documents.Result[0].Children, 0, "0-Overview-0-Identity", "Identity");
            Verify(documents.Result[0].Children, 1, "0-Overview-1-Orders", "Orders");
            Verify(documents.Result[0].Children, 2, "0-Overview-2-Monitoring", "Monitoring");
            Verify(documents.Result, 1, "1-Getting Started", "Getting Started");
            Verify(documents.Result, 2, "2-Front End", "Front End");
            Verify(documents.Result[2].Children, 0, "2-Front End-0-Asp.Net 5", "Asp.Net 5");
            Verify(documents.Result, 3, "3-Environment", "Environment");
        }

        private void Verify(DocumentHeader[] list, int index, string id, string name)
        {
            list.Length.ShouldBeGreaterThanOrEqualTo(index);
            var item = list[index];
            item.ShouldNotBeNull(name);
            item.Id.ShouldBe(id);
            item.Name.ShouldBe(name);
        }
    }
}
