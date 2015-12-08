using System;
using System.Linq;
using Microsoft.AspNet.Authentication;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Hosting;
using Microsoft.AspNet.Mvc.Razor;
using Microsoft.AspNet.Mvc.Razor.Directives;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.PlatformAbstractions;
using Soloco.RealTimeWeb.Common.Infrastructure.DryIoc;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Membership;

namespace Soloco.RealTimeWeb
{
    public class Startup
    {
        public Startup(IHostingEnvironment env, IApplicationEnvironment appEnv)
        {
            // Set up configuration sources.
            var builder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true);

            if (env.IsDevelopment())
            {
                // For more details on using the user secret store see http://go.microsoft.com/fwlink/?LinkID=532709
                builder.AddUserSecrets();
            }

            builder.AddEnvironmentVariables();
            Configuration = builder.Build();
        }

        public IConfigurationRoot Configuration { get; set; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.Configure<SharedAuthenticationOptions>(options => {
                options.SignInScheme = "ServerCookie";
            });

            services.AddCaching();
            services.AddAuthentication();
            services.AddMvc();

        //    ReplaceRazorServiceDescription(services);

            var container = new Container();

            container
                .RegisterCommon()
                .RegisterMembership();

            ///return container.CreateServiceProvider(services);
        }

        private static void ReplaceRazorServiceDescription(IServiceCollection services)
        {
            var razorHost = services.FirstOrDefault(descriptor => descriptor.ServiceType == typeof (IMvcRazorHost));
            services.Remove(razorHost);
            services.Add(new ServiceDescriptor(typeof (IMvcRazorHost),
                provider => new MvcRazorHost((IChunkTreeCache) provider.GetService(typeof (IChunkTreeCache))),
                razorHost.Lifetime));
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddDebug();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseIISPlatformHandler(options => options.AuthenticationDescriptions.Clear());
            
            app.UseStaticFiles();
            app.ConfigureOAuth();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });
        }

        // Entry point for the application.
        public static void Main(string[] args) => Microsoft.AspNet.Hosting.WebApplication.Run<Startup>(args);
    }
}