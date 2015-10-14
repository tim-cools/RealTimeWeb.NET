namespace Soloco.ReactiveStarterKit.Common.Infrastructure.Queries
{
    public abstract class EntityById<T> : IQuery<T>
    {
        public string Id { get; private set; }

        protected EntityById(string id) 
        {
            Id = id;
        }
    }
}