using System.Threading.Tasks;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Services
{
    public interface IProviderTokenValidator
    {
        LoginProvider Provider { get; }

        Task<ParsedExternalAccessToken> ValidateToken(string accessToken);
    }
}