namespace Soloco.ReactiveStarterKit.Common.Infrastructure
{
    public class EmptyResult
    {
        private static readonly EmptyResult _singleton = new EmptyResult();

        public static EmptyResult Instance
        {
            get
            {
                return _singleton;
            }
        }
    }
}