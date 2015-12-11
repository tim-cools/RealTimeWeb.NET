using System.Diagnostics;
using Shouldly;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Infrastructure;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using StructureMap;
using Xunit;

namespace Soloco.RealTimeWeb.Membership.Tests.Unit
{
    public class ContainerTest
    {
        [Fact]
        public void ThenMessageHandlerShouldBeGettable()
        {
            var container = new Container(config =>
            {
                config.AddRegistry<CommonRegistry>();
                config.AddRegistry<TestRegistry>();
                config.AddRegistry<MembershipRegistry>();
                config.For<IContext>().Use("Return context", context => context);

                //config.For<IConfigurationRoot>().Use(configuration);
            });

            Debug.WriteLine(container.WhatDidIScan());

            container.GetInstance<IHandleMessage<DeleteRefreshTokenCommand, CommandResult>>()
                .ShouldNotBeNull();
        }
    }
}
