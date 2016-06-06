using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
            configuration.For<IOptions<IdentityOptions>>().Use<OptionsProvider>();
            configuration.For<IOptions<PasswordHasherOptions>>().Use<OptionsProvider>();
            configuration.For<IServiceProvider>().Use(context => new ServiceProviderWrapper(context));
            configuration.For<IHttpContextAccessor>().Use<DummyHttpContextAccessor>();
            configuration.For(typeof(ILogger<>)).Use(typeof(DummyLogger<>));
            configuration.AddRegistry<MembershipRegistry>();
        }
    }


    public class DummyHttpContextAccessor : IHttpContextAccessor 
    {
        public HttpContext HttpContext { get; set; }
    }

    public class DummyLogger<T> : ILogger<T>, IDisposable
    {
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception exception, Func<TState, Exception, string> formatter)
        {
            
        }

        public bool IsEnabled(LogLevel logLevel)
        {
            return false;
        }

        public IDisposable BeginScope<TState>(TState state)
        {
            return this;
        }

        public void Dispose()
        {
        }
    }

    public class ServiceProviderWrapper : IServiceProvider
    {
        private readonly IContext _context;

        public ServiceProviderWrapper(IContext context)
        {
            _context = context;
        }

        public object GetService(Type serviceType)
        {
            return _context.GetInstance(serviceType);
        }
    }

    public class OptionsProvider : IOptions<IdentityOptions>, IOptions<PasswordHasherOptions>
    {
        IdentityOptions IOptions<IdentityOptions>.Value => new IdentityOptions();

        PasswordHasherOptions IOptions<PasswordHasherOptions>.Value => new PasswordHasherOptions();
    }
}