using System;
using Microsoft.AspNet.Authentication;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.PlatformAbstractions;
using StructureMap;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Infrastructure;
using Soloco.RealTimeWeb.Membership;

namespace Soloco.RealTimeWeb
{
    public class Startup
    {
        public Startup(IHostingEnvironment env, IApplicationEnvironment appEnv)
        {
            Configuration = SetupConfiguration(env);
        }

        private IConfigurationRoot SetupConfiguration(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();

            return builder.Build();
        }

        public IConfigurationRoot Configuration { get; set; }

        public IServiceProvider ConfigureServices(IServiceCollection services)
        {
            services.Configure<SharedAuthenticationOptions>(options => {
                options.SignInScheme = "ServerCookie";
            });

            services.AddCaching();
            services.AddAuthentication();
            services.AddMvc();

            return CreateContainerServiceProvider(services); 
        }

        private IServiceProvider CreateContainerServiceProvider(IServiceCollection services)
        {
            var container = new Container(configuration =>
            {
                configuration.For<IConfigurationRoot>().Use(Configuration);
                configuration.AddRegistry<CommonRegistry>();
                configuration.AddRegistry<MembershipRegistry>();
            });

            container.Populate(services);

            return container.GetInstance<IServiceProvider>();
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            ConfigureLogging(loggerFactory);

            ConfigureWebApp(app, env);
        }

        private void ConfigureLogging(ILoggerFactory loggerFactory)
        {
            loggerFactory
                .AddConsole(Configuration.GetSection("Logging"))
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
               .UseMvc(routes => { routes.MapRoute(name: "default", template: "{controller=Home}/{action=Index}/{id?}"); });
        }

        public static void Main(string[] args) => WebApplication.Run<Startup>(args);
    }
}