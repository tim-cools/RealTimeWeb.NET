using System;
using System.Linq;
using Marten;
using Shouldly;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Xunit;
using StructureMap;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;
using Soloco.RealTimeWeb.Membership.Tests.Integration.Infrastructure;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.User.RegisterExternalUserSpecifications
{
    public class WhenRegisteringAGoogleUser : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private CommandResult _result;
        private RegisterExternalUserCommand _command;
        private string _name;

        public WhenRegisteringAGoogleUser(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            _name = Guid.NewGuid().ToString("n");
            _command = new RegisterExternalUserCommand(_name, LoginProvider.Google, ExternalAccessTokens.Google);

            _result = dispatcher.ExecuteNowWithTimeout(_command);
        }

        [Fact(Skip = "The google access tokens expire really fast. We need a way to automate the retrieval of the token. (Selenium)")]
        public void ThenTheResultShouldSucceed()
        {
            _result.Succeeded.ShouldBeTrue();
        }

        [Fact(Skip = "The google access tokens expire really fast. We need a way to automate the retrieval of the token. (Selenium)")]
        public void ThenTheResultShouldHaveNoErrors()
        {
            if (_result.Errors.Any())
            {
                var errors = _result.Errors.Aggregate(string.Empty, (value, result) => $"{result}, {value}");
                throw new InvalidOperationException(errors);
            }
        }

        [Fact(Skip = "The google access tokens expire really fast. We need a way to automate the retrieval of the token. (Selenium)")]
        public void ThenAUserShouldBeAbleToLogin()
        {
            SessionScope((dispatcher, session, container) =>
            {
                var query = new VerifyExternalUserQuery(LoginProvider.Google, ExternalAccessTokens.Google);
                var result = dispatcher.ExecuteNowWithTimeout(query);

                result.Registered.ShouldBeTrue();
                result.UserName.ShouldBe(_name);
            });
        }
    }
}
