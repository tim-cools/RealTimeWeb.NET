using System;
using System.ComponentModel;
using System.Globalization;
using Amazon;

namespace Soloco.RealTimeWeb.Environment.Core.Configuration
{
    public class AmazonRegionConverter : TypeConverter
    {
        public override bool CanConvertFrom(ITypeDescriptorContext context, Type sourceType)
        {
            return sourceType == typeof(string) || base.CanConvertFrom(context, sourceType);
        }

        public override object ConvertFrom(ITypeDescriptorContext context, CultureInfo culture, object value)
        {
            var text = value as string;
            return text != null ? RegionEndpoint.GetBySystemName(text) : base.ConvertFrom(context, culture, value);
        }
    }
}