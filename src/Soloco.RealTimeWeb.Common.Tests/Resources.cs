using System;
using System.IO;

namespace Soloco.RealTimeWeb.Common.Tests
{
    public static class Resources
    {
        public static string ReadResourceString(this Type type, string name)
        {
            if (type == null) throw new ArgumentNullException(nameof(type));
            if (name == null) throw new ArgumentNullException(nameof(name));

            using (var stream = GetManifestResourceStream(type, name))
            using (var reader = new StreamReader(stream))
            {
                return reader.ReadToEnd();
            }
        }

        private static Stream GetManifestResourceStream(Type type, string name)
        {
            var fullName = $"{type.Namespace}.{name}";
            var manifestResourceStream = type.Assembly.GetManifestResourceStream(fullName);
            if (manifestResourceStream == null)
            {
                throw new InvalidOperationException($"Resource stream '{fullName}' not found. Did you set Build Action to Embedded Resource?");
            }
            return manifestResourceStream;
        }
    }
}