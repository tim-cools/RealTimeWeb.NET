using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Soloco.RealTimeWeb.Monitoring.Infrastructure;

namespace Soloco.RealTimeWeb.Monitoring
{
    public class Startup
    {
        private readonly IConfigurationRoot _configuration;

        public Startup(IHostingEnvironment env)
        {
            _configuration = SetupConfiguration();
        }

        private static IConfigurationRoot SetupConfiguration()
        {
            var builder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddEnvironmentVariables();
            return builder.Build();
        }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddMvc();
            services.AddSingleton<IMonitor, DatabaseMonitor>();            
            services.AddSingleton<IConfiguration>(provider => _configuration);
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            ConfigureLogging(loggerFactory);

            ConigureWebApp(app);
        }

        private void ConfigureLogging(ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole(_configuration.GetSection("Logging"));
            loggerFactory.AddDebug();
        }

        private static void ConigureWebApp(IApplicationBuilder app)
        {
            app.UseIISPlatformHandler();

            app.UseStaticFiles();

            app.UseMvc();
        }

        public static void Main(string[] args) => WebApplication.Run<Startup>(args);
    }
}
