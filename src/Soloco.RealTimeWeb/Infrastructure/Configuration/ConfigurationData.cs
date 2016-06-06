using System;
using System.IO;
using System.Linq;

namespace Soloco.RealTimeWeb.Infrastructure.Configuration
{
    public static class ConfigurationData
    {
        const string fileName = "appsettings.private.json";

        public static string GetFileName(string applicationBasePath)
        {
            return Path.Combine(applicationBasePath, fileName);
        }

        public static string GetSolutionConfigFileName(string applicationBasePath)
        {
            if (applicationBasePath == null) throw new ArgumentNullException(nameof(applicationBasePath));

            var parts = applicationBasePath.Split(Path.DirectorySeparatorChar);
            for (var index = parts.Length - 1; index >= 1; index--)
            {
                if (IsBinFolder(parts, index))
                {
                    var folder = String.Join(Path.DirectorySeparatorChar.ToString(), parts.Take(index).ToArray());
                    return GetFileName(folder);
                }
            }
            return null;
        }

        private static bool IsBinFolder(string[] parts, int index0)
        {
            return parts[index0].Equals("bin", StringComparison.InvariantCultureIgnoreCase);
        }
    }
}