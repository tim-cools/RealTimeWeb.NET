
using System;
using Microsoft.Extensions.Configuration;

namespace Soloco.RealTimeWeb.Common
{
    public static class ConfigurationExtensions
    {
        public static string WebHostName(this IConfiguration configuration)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));
            return configuration["web:hostName"];
        }

        public static string ApiHostName(this IConfiguration configuration)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));
            return configuration["api:hostName"];
        }

        public static string ApiClientId(this IConfiguration configuration)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));
            return configuration["api:clientId"];
        }

        public static string ApiClientSecret(this IConfiguration configuration)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));
            return configuration["api:clientSecret"];
        }

        public static bool GeneralConfigured(this IConfiguration configuration)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));

            bool value;
            return bool.TryParse(configuration["general:configured"], out value) && value;
        }

        public static bool AuthenticationGoogleConfigured(this IConfiguration configuration)
        {
            return !string.IsNullOrWhiteSpace(configuration.AuthenticationGoogleClientId())
                && !string.IsNullOrWhiteSpace(configuration.AuthenticationFacebookAppSecret());
        }

        public static string AuthenticationGoogleClientId(this IConfiguration configuration)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));
            return configuration["authentication:google:clientId"];
        }

        public static string AuthenticationGoogleClientSecret(this IConfiguration configuration)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));
            return configuration["authentication:google:clientSecret"];
        }

        public static bool AuthenticationFacebookConfigured(this IConfiguration configuration)
        {
            return !string.IsNullOrWhiteSpace(configuration.AuthenticationFacebookAppId())
               && !string.IsNullOrWhiteSpace(configuration.AuthenticationFacebookAppSecret());
        }

        public static string AuthenticationFacebookAppId(this IConfiguration configuration)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));
            return configuration["authentication:facebook:appId"];
        }

        public static string AuthenticationFacebookAppSecret(this IConfiguration configuration)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));
            return configuration["authentication:facebook:appSecret"];
        }

        public static string ConnectionString(this IConfiguration configuration, string name = "documentStore")
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));
            
            return configuration[$"connectionStrings:{name}"];
        }
    }
}