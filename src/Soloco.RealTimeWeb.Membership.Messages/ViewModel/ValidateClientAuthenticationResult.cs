namespace Soloco.RealTimeWeb.Membership.Messages.ViewModel
{
    public class ValidateClientAuthenticationResult
    {
        public bool Valid { get; }
        public string AllowedOrigin { get; }
        public int RefreshTokenLifeTime { get; }
        public string RedirectUri { get;  }

        public ValidateClientAuthenticationResult(bool valid, string allowedOrigin = null, int refreshTokenLifeTime = 0, string redirectUri = null)
        {
            Valid = valid;
            AllowedOrigin = allowedOrigin;
            RefreshTokenLifeTime = refreshTokenLifeTime;
            RedirectUri = redirectUri;
        }
    }
}