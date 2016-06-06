using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Primitives;

namespace Soloco.RealTimeWeb.Common.Tests.Unit.ContainerSpecifications
{
    public class DummyConfiguration : IConfigurationRoot
    {
        private readonly IDictionary<string, string> _items = new Dictionary<string, string>();

        public IConfigurationSection GetSection(string key)
        {
            throw new System.NotImplementedException();
        }

        public IEnumerable<IConfigurationSection> GetChildren()
        {
            throw new System.NotImplementedException();
        }

        public IChangeToken GetReloadToken()
        {
            throw new System.NotImplementedException();
        }

        public string this[string key]
        {
            get { return _items.ContainsKey(key) ? _items[key] : null; }
            set { _items[key] = value; }
        }

        public void Reload()
        {
            throw new System.NotImplementedException();
        }
    }
}