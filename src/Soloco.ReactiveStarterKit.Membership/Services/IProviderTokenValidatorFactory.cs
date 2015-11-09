namespace Soloco.ReactiveStarterKit.Membership.Services
{
    public interface IProviderTokenValidatorFactory
    {
        IProviderTokenValidator Create(string provider);
    }
}