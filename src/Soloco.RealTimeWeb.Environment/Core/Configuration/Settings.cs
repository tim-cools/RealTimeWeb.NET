using System.ComponentModel;
using Amazon;
using Microsoft.Extensions.Configuration;

namespace Soloco.RealTimeWeb.Environment.Core.Configuration
{
    public class Settings : ISettings
    {
        public ClusterSettings Cluster { get; }
        public AmazonSettings Amazon { get; }
        public DatabaseSettings Database { get; }

        public Settings(string[] args)
        {
            var configuration = BuildConfigurationRoot(args);

            AddCustomConverters();

            Cluster = configuration.Get<ClusterSettings>("cluster");
            Amazon = configuration.Get<AmazonSettings>("amazon");
            Database = configuration.Get<DatabaseSettings>("database");
        }

        private static void AddCustomConverters()
        {
            TypeDescriptor.AddAttributes(typeof (RegionEndpoint), new TypeConverterAttribute(typeof (AmazonRegionConverter)));
        }

        private static IConfigurationRoot BuildConfigurationRoot(string[] values)
        {
            var builder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddJsonFile("appsettings.private.json", true)
                .AddEnvironmentVariables()
                .AddCommandLine(values);

            return builder.Build();
        }
    }
}