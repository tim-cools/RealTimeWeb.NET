
using Soloco.RealTimeWeb.Common.StructureMap;
using Soloco.RealTimeWeb.Membership.Services;
using StructureMap;
using StructureMap.Graph;

namespace Soloco.RealTimeWeb.Membership
{
    public class MembershipRegistry : Registry
    {
        public MembershipRegistry()
        {
            Scan(options => { 
                options.TheCallingAssembly();
                options.Include(type => type.Name.EndsWith("Handler"));
                options.IncludeNamespaceContainingType<UserStore>();
                options.Convention<AllInterfacesConvention>();
            });
        }
    }
}