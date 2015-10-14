using System;
using System.Collections.Generic;
using System.Linq;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure
{
    public static class IdentifyableExtensions
    {
        public static bool ContainsId(this IEnumerable<IIdentifyable> items, Guid id)
        {
            return items.Any(element => element.Id == id);
        }
    }
}