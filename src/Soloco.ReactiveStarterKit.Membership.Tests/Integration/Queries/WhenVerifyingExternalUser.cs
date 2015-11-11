using System;
using NUnit.Framework;
using Shouldly;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Common.Tests;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;
using Soloco.ReactiveStarterKit.Membership.Tests.Integration.Infrastructure;

namespace Soloco.ReactiveStarterKit.Membership.Tests.Integration.Queries
{
    [TestFixture]
    public class WhenVerifyingExternalUser : ServiceTestBase<IMessageDispatcher>
    {
        private VerifyExternalUserResult _result;
        private VerifyExternalUserQuery _query;

        protected override void When()
        {
            base.When();

            _query = new VerifyExternalUserQuery(LoginProvider.Facebook, ExternalAccessTokens.Facebook);

            _result = Service.ExecuteNowWithTimeout(_query);
        }

        [Test]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            _result.ShouldNotBeNull();
        }
    }
}