using System.Threading.Tasks;
using Soloco.ReactiveStarterKit.Membership.Domain;

namespace Soloco.ReactiveStarterKit.Membership.Services
{
    public interface IProviderTokenValidator
    {
        string Name { get; }

        Task<ParsedExternalAccessToken> ValidateToken(string accessToken);
    }
}