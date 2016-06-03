using System;
using Microsoft.Extensions.Configuration;

namespace Soloco.RealTimeWeb.Environment.Core.Configuration
{
    public static class ConfigurationExtensions
    {
        public static T Get<T>(this IConfiguration configuration, string key) where T : new()
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));

            var configurationSection = configuration.GetSection(key);

            var section = new T();
            configurationSection.Bind(section);
            return section;
        }
    }
}