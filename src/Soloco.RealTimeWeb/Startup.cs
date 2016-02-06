using System;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Cors.Infrastructure;
using Microsoft.AspNet.Hosting;
using Microsoft.AspNet.SignalR;
using Microsoft.Data.Entity.ChangeTracking.Internal;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.PlatformAbstractions;
using StructureMap;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Infrastructure;
using Soloco.RealTimeWeb.Membership;
using Soloco.RealTimeWeb.Membership.Users.Domain;

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
                .AddJsonFile("appsettings.private.json", optional: true)
                .AddEnvironmentVariables();

            return builder.Build();
        }

        public IServiceProvider ConfigureServices(IServiceCollection services)
        {
            if (services == null) throw new ArgumentNullException(nameof(services));

            services.AddIdentity<User, Role>();
            services.AddCaching();
            services.AddAuthentication(options =>  { options.SignInScheme = "ServerCookie"; });
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
                configuration.For<IConfiguration>().Use(_configuration);
                configuration.For<IApplicationEnvironment>().Use(_applicationEnvironment);

                configuration.AddRegistry<WebRegistry>();
                configuration.AddRegistry<CommonRegistry>();
                configuration.AddRegistry<MembershipRegistry>();
            });
            
            container.Populate(services);

            return container.GetInstance<IServiceProvider>();
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory, IApplicationLifetime lifetime)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            if (env == null) throw new ArgumentNullException(nameof(env));
            if (loggerFactory == null) throw new ArgumentNullException(nameof(loggerFactory));

            ConfigureLogging(loggerFactory);

            if (_configuration.GeneralConfigured())
            {
                app.InitalizeDatabase()
                    .InitalizeBus(_configuration, lifetime);
            }

            ConfigureWebApp(app, env);
        }

        private void ConfigureLogging(ILoggerFactory loggerFactory)
        {
            loggerFactory
                .AddConsole(_configuration.GetSection("Logging"))
                .AddDebug();
        }

        private void ConfigureWebApp(IApplicationBuilder app, IHostingEnvironment env)
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
               .UseSignalR()
               .ConfigureAuthentication(_configuration)
               .UseCors(defaultName)
               .UseMvc(routes =>
               {
                   routes.MapRoute(name: defaultName, template: "{controller=Home}/{action=Index}/{id?}");
                   routes.MapRoute(name: "vehicles", template: "vehicles", defaults: 
                       new { controller = "Home", action = "Index"}
                       );
               });
        }
        
        public static void Main(string[] args) => WebApplication.Run<Startup>(args);
    }
}