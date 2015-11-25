using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using Shouldly;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Common.Tests;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Tests.Integration.Queries
{
    [TestFixture]
    public class WhenQueryingRefreshTokens : ServiceTestBase<IMessageDispatcher>
    {
        private IEnumerable<RefreshToken> _result;
        private RefreshTokensQuery _query;

        protected override void Given()
        {
            base.Given();

            var command = new CreateRefreshTokenCommand(
                Guid.NewGuid().ToString(),
                Guid.NewGuid().ToString(),
                Guid.NewGuid().ToString(),
                Guid.NewGuid().ToString(),
                DateTimeOffset.Now, 
                DateTimeOffset.Now);

            Service.ExecuteNowWithTimeout(command).Succeeded.ShouldBeTrue();
        }

        protected override void When()
        {
            base.When();

            _query = new RefreshTokensQuery();
            _result = Service.ExecuteNowWithTimeout(_query);
        }

        [Test]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            Assert.That(_result, Is.Not.Null);
        }

        [Test]
        public void ThenAsLeastOnRefreshTokenShouldBeReturned()
        {
            _result.Count().ShouldBeGreaterThanOrEqualTo(1);
        }
    }
}