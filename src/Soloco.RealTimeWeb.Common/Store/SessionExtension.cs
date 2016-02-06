using System;
using System.Linq;
using System.Linq.Expressions;
using Marten;

namespace Soloco.RealTimeWeb.Common.Store
{
    public static class SessionExtension
    {
        public static T GetFirst<T>(this IQuerySession session, Expression<Func<T, bool>> predicate)
            where T : class
        {
            if (session == null) throw new ArgumentNullException(nameof(session));
            if (predicate == null) throw new ArgumentNullException(nameof(predicate));

            return session.Query<T>()
                .FirstOrDefault(predicate);
        }
    }
}