using System;
using System.Linq;
using System.Threading.Tasks;
using Amazon.EC2;
using Amazon.EC2.Model;
using Amazon.Runtime;
using Soloco.RealTimeWeb.Environment.Core;
using Soloco.RealTimeWeb.Environment.Core.Configuration;
using Task = System.Threading.Tasks.Task;

namespace Soloco.RealTimeWeb.Environment.Migrations
{
    public class M201602102132_CreateVPC : IMigration, IDisposable
    {
        private readonly MigrationContext _context;
        private readonly IAmazonEC2 _client;
        private readonly TaskSettings _task;
        private readonly ClusterSettings _cluster;

        public M201602102132_CreateVPC(MigrationContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _context = context;
            _client = CreateClient();
            _cluster = _context.Settings.Cluster;
            _task = _cluster.GetTask("web");
        }

        public async Task Up()
        {
            var vpc = await VpcExists();
            if (vpc != null)
            {
                await CreateVpc();
            }
        }

        public async Task Down()
        {
            var vpc = await VpcExists();
            if (vpc != null)
            {
                await DeleteVpc(vpc);
            }
        }

        private async Task<Vpc> VpcExists()
        {
            var request = new DescribeVpcsRequest();
            var response = await _client.DescribeVpcsAsync(request);
            return response.Vpcs.FirstOrDefault(vpc => vpc.CidrBlock == _cluster.VpcCidr);
        }

        public async Task CreateVpc()
        {
            _context.Logger.WriteLine("CreateVpc");

            var request = new CreateVpcRequest
            {
                CidrBlock = _cluster.VpcCidr,
                InstanceTenancy = Tenancy.Default
            };

            var response = await _client.CreateVpcAsync(request);
            _context.Logger.WriteLine($"Vpc Created: {response.Vpc.CidrBlock} Id: {response.Vpc.VpcId}");
       }

        private async Task DeleteVpc(Vpc vpc)
        {
            _context.Logger.WriteLine($"DeleteVpc: {vpc.CidrBlock} Id: {vpc.VpcId}");

            var request = new DeleteVpcRequest
            {
                VpcId = vpc.VpcId
            };
            await _client.DeleteVpcAsync(request);
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
