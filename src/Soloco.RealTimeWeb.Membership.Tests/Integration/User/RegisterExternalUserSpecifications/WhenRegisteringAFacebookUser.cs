using System;
using System.Linq;
using Marten;
using Shouldly;
using Xunit;
using Soloco.RealTimeWeb.Common.Infrastructure;
using Soloco.RealTimeWeb.Common.Infrastructure.DryIoc;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;
using Soloco.RealTimeWeb.Membership.Tests.Integration.Infrastructure;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.User.RegisterExternalUserSpecifications
{
    public class WhenRegisteringAFacebookUser : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private CommandResult _result;
        private RegisterExternalUserCommand _command;
        private string _name;

        public WhenRegisteringAFacebookUser(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            _name = Guid.NewGuid().ToString("n");
            _command = new RegisterExternalUserCommand(_name, LoginProvider.Facebook, ExternalAccessTokens.Facebook);

            _result = dispatcher.ExecuteNowWithTimeout(_command);
        }

        [Fact]
        public void ThenTheResultShouldSucceed()
        {
            _result.Succeeded.ShouldBeTrue();
        }

        [Fact]
        public void ThenTheResultShouldHaveNoErrors()
        {
            if (_result.Errors.Any())
            {
                var errors = _result.Errors.Aggregate(string.Empty, (value, result) => $"{result}, {value}");
                throw new InvalidOperationException(errors);
            }
        }

        //[Fact]
        //public void ThenAUserShouldBeStored()
        //{
        //    var userByNameQuery = new UserByNameQuery(_command.UserName);
        //    var user = Service.ExecuteNowWithTimeout(userByNameQuery);

        //    Assert.IsNotNull(user);
        //}

        [Fact]
        public void ThenAUserShouldBeAbleToLogin()
        {
            SessionScope((dispatcher, session, container) =>
            {
                var query = new VerifyExternalUserQuery(LoginProvider.Facebook, ExternalAccessTokens.Facebook);
                var result = dispatcher.ExecuteNowWithTimeout(query);

                result.Registered.ShouldBeTrue();
                result.UserName.ShouldBe(_name);
            });
        }

        //[Fact]
        //public void ThenADifferentPasswordShouldFailToLogin()
        //{
        //    var query = new ValidUserLoginQuery(_command.UserName, "wrong password");
        //    var valid = Service.ExecuteNowWithTimeout(query);

        //    Assert.That(valid, Is.False);
        //}
    }
}
