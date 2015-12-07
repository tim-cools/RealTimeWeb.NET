namespace Soloco.RealTimeWeb.Models
{
    internal class ValidatClientResult
    {
        public string Error { get; }
        public string RedirectUri { get; }

        public ValidatClientResult(string error, string redirectUri = null)
        {
            Error = error;
            RedirectUri = redirectUri;
        }
    }
}