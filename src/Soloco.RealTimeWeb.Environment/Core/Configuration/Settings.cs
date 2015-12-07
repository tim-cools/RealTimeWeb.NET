using System.Collections.Generic;
using System.ComponentModel;
using Amazon;
using Microsoft.Extensions.Configuration;

namespace Soloco.RealTimeWeb.Environment.Core.Configuration
{
    public class Settings
    {
        public IAmazonSettings Amazon { get; private set; }
        public IDatabaseSettings Database { get; private set; }

        public Settings(string[] args)
        {
            var configuration = BuildConfigurationRoot(args);

            AddCustomConverters();

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