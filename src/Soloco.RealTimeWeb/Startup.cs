using System;
using Microsoft.AspNet.Authentication;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Cors.Infrastructure;
using Microsoft.AspNet.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.PlatformAbstractions;
using StructureMap;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Infrastructure;
using Soloco.RealTimeWeb.Membership;
using Soloco.RealTimeWeb.Membership.CommandHandlers;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Commands;

namespace Soloco.RealTimeWeb
{
    public class Startup
    {
        private const string defaultName = "default";

        private readonly IApplicationEnvironment _applicationEnvironment;
        private readonly IConfigurationRoot _configuration;

        public Startup(IHostingEnvironment env, IApplicationEnvironment applicationEnvironment)
        {
            if (env == null) throw new ArgumentNullException(nameof(env));
            if (applicationEnvironment == null) throw new ArgumentNullException(nameof(applicationEnvironment));

            _applicationEnvironment = applicationEnvironment;
            _configuration = SetupConfiguration(env);
        }

        private IConfigurationRoot SetupConfiguration(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();

            return builder.Build();
        }

        public IServiceProvider ConfigureServices(IServiceCollection services)
        {
            if (services == null) throw new ArgumentNullException(nameof(services));

            services.AddIdentity<User, Role>();
            services.AddCaching();
            services.AddAuthentication(options =>
            {
                options.SignInScheme = "ServerCookie";
            });
            services.AddMvc();
            services.AddCors(ConfigureCors);

            return CreateContainerServiceProvider(services);
        }

        private static void ConfigureCors(CorsOptions options)
        {
            options.AddPolicy(defaultName, policy =>
                policy.AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowAnyOrigin()
                    .AllowCredentials());
        }

        private IServiceProvider CreateContainerServiceProvider(IServiceCollection services)
        {
            var container = new Container(configuration =>
            {
                configuration.For<IConfigurationRoot>().Use(_configuration);
                configuration.For<IApplicationEnvironment>().Use(_applicationEnvironment);

                configuration.AddRegistry<WebRegistry>();
                configuration.AddRegistry<CommonRegistry>();
                configuration.AddRegistry<MembershipRegistry>();
            });

            container.Populate(services);

            return container.GetInstance<IServiceProvider>();
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            if (env == null) throw new ArgumentNullException(nameof(env));
            if (loggerFactory == null) throw new ArgumentNullException(nameof(loggerFactory));

            ConfigureLogging(loggerFactory);
            ConfigureWebApp(app, env);

            InitalizeDatabase(app);
        }

        private static void InitalizeDatabase(IApplicationBuilder app)
        {
            var messageDispatcher = app.ApplicationServices.GetMessageDispatcher();
            var command = new InitializeDatabaseCommand();

            messageDispatcher.Execute(command);
        }

        private void ConfigureLogging(ILoggerFactory loggerFactory)
        {
            loggerFactory
                .AddConsole(_configuration.GetSection("Logging"))
                .AddDebug();
        }

        private static void ConfigureWebApp(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseIISPlatformHandler(options => options.AuthenticationDescriptions.Clear())
               .UseStaticFiles()
               .ConfigureOAuth()
               .UseCors(defaultName)
               .UseMvc(routes => { routes.MapRoute(name: defaultName, template: "{controller=Home}/{action=Index}/{id?}"); });
        }

        public static void Main(string[] args) => WebApplication.Run<Startup>(args);
    }
}