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

            try
            {
                return session.Query<T>()
                    .Where(predicate)
                    .Take(1)
                    .ToArray()
                    .FirstOrDefault();
            }
            catch (Exception exception)
            {
                //todo: improve elephanet and make exception public (or just use existing exception)
                //todo: let Elephanet return null when table does not exists, or initialize table on app startup
                var type = exception.GetType(); 
                if (type.Name == "NpgsqlException")
                {
                    var code = type.GetProperty("Code").GetValue(exception) as string;
                    if (code == "42P01") // relation "T" does not exist
                    {
                        return null;
                    }
                }
                throw;
            }
        }
    }
}