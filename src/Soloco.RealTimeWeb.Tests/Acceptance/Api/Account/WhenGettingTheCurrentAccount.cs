using System.Net;
using RestSharp;
using Shouldly;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Xunit;

namespace Soloco.RealTimeWeb.Tests.Acceptance.Api.Account
{
    public class WhenGettingTheCurrentAccount : ServiceTestBase<IMessageDispatcher>,
        IClassFixture<WebIntegrationTestFixture>
    {
        private string _userName;
        private string _accessToken;
        private dynamic _result;

        public WhenGettingTheCurrentAccount(WebIntegrationTestFixture fixture)
            : base(fixture)
        {
        }

        protected override void Given(TestContext<IMessageDispatcher> context)
        {
            _userName = "123456"; //Guid.NewGuid().ToString("n");
            var password = "Aa-123456"; //Guid.NewGuid().ToString("n");

            //todo: because the data is stored in memory creating the user in a different process in not possible
            //enable when a real db is enabled
            //var command = new RegisterUserCommand(_userName, _userName + "@realtimeweb.net", password);
            //context.Service.Execute(command);

            _accessToken = GetAccessToken(_userName, password, context);
        }

        private string GetAccessToken(string userName, string password, TestContext<IMessageDispatcher> context)
        {
            var client = new RestClient(context.Configuration.ApiHostName());
            var request = new RestRequest("token");

            request.AddParameter("grant_type", "password");
            request.AddParameter("username", userName);
            request.AddParameter("password", password);
            request.AddParameter("client_id", context.Configuration.ApiClientId());
            request.AddParameter("client_secret", context.Configuration.ApiClientSecret());

            var response = client.Post(request);
            response.StatusCode.ShouldBe(HttpStatusCode.OK);

            dynamic content = SimpleJson.DeserializeObject(response.Content);
            return content.access_token;
        }

        protected override void When(TestContext<IMessageDispatcher> context)
        {
            var client = new RestClient(context.Configuration.ApiHostName());
            var request = new RestRequest("api/account");
            request.AddHeader("Authorization", "Bearer " + _accessToken);

            var response = client.Get(request);
            response.StatusCode.ShouldBe(HttpStatusCode.OK);

            _result = SimpleJson.DeserializeObject(response.Content);
        }

        [Fact]
        [Trait("category", "acceptance")]
        public void ThenCurrentUserDetailsShouldBeReturned()
        {
            DynamicShould.HaveProperty(_result, "EMail");
            DynamicShould.HaveProperty(_result, "Name");
            DynamicShould.HaveProperty(_result, "UserName");

            (_result.EMail as string).ShouldBe("tim@soloco.be");
            (_result.Name as string).ShouldBe("123 456");
            (_result.UserName as string).ShouldBe("123456");

            //todo should be
            //_result.EMail.ShouldBe(_userName + "@realtimeweb.net");
            //_result.Name.ShouldBe(_userName);
            //_result.UserName.ShouldBe(_userName);
        }
    }
}