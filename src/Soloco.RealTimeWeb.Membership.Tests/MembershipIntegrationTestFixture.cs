using System;
using Microsoft.AspNet.Identity;
using StructureMap;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Membership.Users.Domain;

namespace Soloco.RealTimeWeb.Membership.Tests
{
    public class MembershipIntegrationTestFixture : IntegrationTestFixture
    {
        protected override void InitializeContainer(ConfigurationExpression configuration)
        {
            configuration.For<IdentityMarkerService>();
            configuration.For<IUserValidator<User>>().Use<UserValidator<User>>();
            configuration.For<IPasswordValidator<User>>().Use<PasswordValidator<User>>();
            configuration.For<IPasswordHasher<User>>().Use<PasswordHasher<User>>();
            configuration.For<ILookupNormalizer>().Use<UpperInvariantLookupNormalizer>();
            configuration.For<IRoleValidator<Role>>().Use<RoleValidator<Role>>();
            //configuration.For<IdentityErrorDescriber>(services);
            configuration.For<ISecurityStampValidator>().Use<SecurityStampValidator<User>>();
            configuration.For<IUserClaimsPrincipalFactory<User>>().Use<UserClaimsPrincipalFactory<User, Role>>();
            configuration.For<UserManager<User>>().Use<UserManager<User>>();
            configuration.For<SignInManager<User>>().Use<SignInManager<User>>();
            configuration.For<RoleManager<Role>>().Use<RoleManager<Role>>();
            configuration.AddRegistry<MembershipRegistry>();
        }
    }
}