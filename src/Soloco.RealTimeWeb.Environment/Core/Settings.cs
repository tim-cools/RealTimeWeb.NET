using System;
using System.Collections.Generic;
using System.Configuration;
using System.Dynamic;
using Amazon;

namespace Soloco.RealTimeWeb.Environment.Core
{
    public class Settings : DynamicObject
    {
        private readonly IDictionary<string, string> _values;

        public string AmazonAccessKey => Get("AmazonAccessKey");
        public string AmazonSecretKey => Get("AmazonSecretKey");

        public string DatabaseName => Get("DatabaseName");
        public int DatabaseBackupRetentionPeriod => GetInt("DatabaseBackupRetentionPeriod");
        public string DatabaseMasterUsername => Get("DatabaseMasterUsername");
        public string DatabaseMasterPassword => Get("DatabaseMasterPassword");
        public RegionEndpoint AmazonRegion => GetRegionEndpoint("AmazonRegion");
        public string DatabaseInstanceClass => Get("DatabaseInstanceClass");

        public Settings(IDictionary<string, string> values)
        {
            if (values == null) throw new ArgumentNullException(nameof(values));

            _values = values;
        }

        private string Get(string key)
        {
            if (_values.ContainsKey(key))
            {
                return _values[key];
            }
            var appSetting = ConfigurationManager.AppSettings[key];
            if (appSetting == null)
            {
                throw new InvalidOperationException($"Setting not found: {key}");
            }
            Console.WriteLine($"Setting: {key}={appSetting}");
            return appSetting;
        }

        private int GetInt(string key)
        {
            var stringValue = Get(key);
            int intValue;
            if (!int.TryParse(stringValue, out intValue))
            {
                throw new InvalidOperationException($"Could not parse int setting: {key} (value: {stringValue})");
            }
            return intValue;
        }

        private RegionEndpoint GetRegionEndpoint(string key)
        {
            var stringValue = Get(key);
            return RegionEndpoint.GetBySystemName(stringValue);
        }
    }
}