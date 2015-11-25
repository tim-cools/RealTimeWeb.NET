namespace Soloco.ReactiveStarterKit.Membership.Messages.ViewModel
{
    public class VerifyExternalUserResult
    {
        public bool Registered { get; }
        public string UserName { get; }

        public VerifyExternalUserResult(bool registered, string userName = null)
        {
            Registered = registered;
            UserName = userName;
        }
    }
}