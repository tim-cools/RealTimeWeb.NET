using System;
using System.Diagnostics;
using System.Linq;
using System.Linq.Expressions;
using Elephanet;
using Npgsql;

namespace Soloco.ReactiveStarterKit.Membership.Users.CommandHandlers
{
    public static class SessionExtension
    {
        public static T GetFirst<T>(this IDocumentSession session, Expression<Func<T, bool>> predicate)
            where T : class
        {
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
                //todo: let ellepanet return null when table does not exists, or initialize table on app startup
                var type = exception.GetType(); 
                if (type.AssemblyQualifiedName == "Npgsql.NpgsqlException, Elephanet, Version=0.1.2.0, Culture=neutral, PublicKeyToken=null")
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