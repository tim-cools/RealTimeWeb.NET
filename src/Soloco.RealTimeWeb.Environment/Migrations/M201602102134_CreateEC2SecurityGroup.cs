using System;

using System.Threading.Tasks;
using Amazon.EC2;
using Amazon.EC2.Model;
using Amazon.Runtime;
using Soloco.RealTimeWeb.Environment.Core;
using Soloco.RealTimeWeb.Environment.Core.Configuration;
using System.Linq;

namespace Soloco.RealTimeWeb.Environment.Migrations
{
    public class M201602102134_CreateEC2SecurityGroup : IMigration, IDisposable
    {
        private readonly MigrationContext _context;
        private readonly IAmazonEC2 _client;
        private readonly ClusterSettings _cluster;
        private readonly string _groupName;

        public M201602102134_CreateEC2SecurityGroup(MigrationContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _context = context;
            _client = CreateClient();
            _cluster = _context.Settings.Cluster;
            _groupName = "securityGroup:" + _cluster.Name;
        }

        public async Task Up()
        {
            var group = await SecurityGroupExists();
            if (group == null)
            {
                await CreateSecurityGroup();
            }
        }

        public async Task Down()
        {
            var group = await SecurityGroupExists();
            if (group != null)
            {
                await DeleteSecurityGroup(group.GroupId);
            }
        }

        private async Task<SecurityGroup> SecurityGroupExists()
        {
            var request = new DescribeSecurityGroupsRequest();
            var response = await _client.DescribeSecurityGroupsAsync(request);
            return response.SecurityGroups.FirstOrDefault(criteria => criteria.GroupName == _groupName);
        }

        public async Task CreateSecurityGroup()
        {
            _context.Logger.WriteLine("CreateSecurityGroup");

            var vpcId = await GetVpcId();

            var request = new CreateSecurityGroupRequest
            {
                VpcId = vpcId,
                Description = $"{_groupName} Security Group",
                GroupName = _groupName
            };

            var response = await _client.CreateSecurityGroupAsync(request);
            await AddInboundRules(response.GroupId);
            await AddOutboundRules(response.GroupId);
        }

        private async Task AddInboundRules(String groupId)
        {
            var request = new AuthorizeSecurityGroupIngressRequest
            {
                GroupId = groupId,
                IpPermissions =
                {
                    new IpPermission { FromPort = -1, IpProtocol = "-1" }
                }
            };

            await _client.AuthorizeSecurityGroupIngressAsync(request);
        }

        private async Task AddOutboundRules(String groupId)
        {
            var request = new AuthorizeSecurityGroupEgressRequest
            {
                GroupId = groupId,
                IpPermissions =
                {
                    new IpPermission { FromPort = -1, IpProtocol = "-1" }
                }
            };

            await _client.AuthorizeSecurityGroupEgressAsync(request);
        }

        private async Task<string> GetVpcId()
        {
            var request = new DescribeVpcsRequest
            {
                VpcIds = {_cluster.VpcCidr}
            };

            var response = await _client.DescribeVpcsAsync(request);
            var vpc = response.Vpcs.FirstOrDefault();
            if (vpc == null)
            {
                throw new InvalidOperationException($"Vpc not found: {_cluster.VpcCidr}");
            }
            return vpc.VpcId;
        }

        private async Task DeleteSecurityGroup(string id)
        {
            _context.Logger.WriteLine("DeleteSecurityGroup");

            var request = new DeleteSecurityGroupRequest
            {
                GroupId = id
            };
            await _client.DeleteSecurityGroupAsync(request);
        }

        private IAmazonEC2 CreateClient()
        {
            var credentials = new BasicAWSCredentials(_context.Settings.Amazon.AccessKey, _context.Settings.Amazon.SecretKey);
            return new AmazonEC2Client(credentials, _context.Settings.Amazon.Region);
        }

        public void Dispose()
        {
            _client.Dispose();
        }
    }
}
