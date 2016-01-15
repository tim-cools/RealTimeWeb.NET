using System.Net;
using RestSharp;
using Shouldly;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Xunit;

namespace Soloco.RealTimeWeb.Membership.Tests.Acceptance.Api.Documents
{
    public class WhenGettingTheDocuments : ServiceTestBase<IMessageDispatcher>,
        IClassFixture<WebIntegrationTestFixture>
    {
        private IRestResponse _response;

        public WhenGettingTheDocuments(WebIntegrationTestFixture fixture)
            : base(fixture)
        {
        }

        protected override void When(TestContext<IMessageDispatcher> context)
        {
            var client = new RestClient(context.Configuration.ApiHostName());
            var request = new RestRequest("api/documents");

            _response = client.Get(request);
        }

        [Fact]
        [Trait("category", "acceptance")]
        public void ThenTheDocumentsShouldBeReturned()
        {
            _response.StatusCode.ShouldBe(HttpStatusCode.OK);
            dynamic result = SimpleJson.DeserializeObject(_response.Content);
        }
    }
}