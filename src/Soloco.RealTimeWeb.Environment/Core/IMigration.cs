using System.Threading.Tasks;

namespace Soloco.RealTimeWeb.Environment.Core
{
    internal interface IMigration
    {
        Task Up();
        Task Down();
    }
}