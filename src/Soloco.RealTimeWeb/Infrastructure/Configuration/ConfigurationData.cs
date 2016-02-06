using System.IO;

namespace Soloco.RealTimeWeb.Infrastructure.Configuration
{
    public static class ConfigurationData
    {
        public static string GetFileName(string applicationBasePath)
        {
            const string fileName = "appsettings.private.json";
            return Path.Combine(applicationBasePath, fileName);
        }
    }
}