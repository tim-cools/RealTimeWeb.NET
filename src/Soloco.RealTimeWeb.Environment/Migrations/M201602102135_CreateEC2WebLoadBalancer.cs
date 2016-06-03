using System;
using System.Collections.Generic;
using System.Linq;
using Amazon.EC2;
using Amazon.EC2.Model;
using Amazon.ElasticLoadBalancing;
using Amazon.ElasticLoadBalancing.Model;
using Amazon.Runtime;
using System.Threading.Tasks;
using Soloco.RealTimeWeb.Environment.Core;
using Soloco.RealTimeWeb.Environment.Core.Configuration;

namespace Soloco.RealTimeWeb.Environment.Migrations
{
    public class M201602102135_CreateEC2WebLoadBalancer : IMigration, IDisposable
    {
        private readonly MigrationContext _context;
        private readonly IAmazonElasticLoadBalancing _client;
        private readonly IAmazonEC2 _ec2client;
        private readonly TaskSettings _task;
        private readonly ClusterSettings _cluster;

        public M201602102135_CreateEC2WebLoadBalancer(MigrationContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _context = context;
            _client = CreateClient();
            _ec2client = CreateEc2Client();
            _cluster = _context.Settings.Cluster;
            _task = _cluster.GetTask("web");
        }

        public async Task Up()
        {
            if (await LoadBalancerExists())
            {
                await CreateLoadBalancer();
            }
        }

        public async Task Down()
        {
            if (await LoadBalancerExists())
            {
                await DeleteLoadBalancer();
            }
        }

        private async Task<bool> LoadBalancerExists()
        {
            var request = new DescribeLoadBalancersRequest();
            var response = await _client.DescribeLoadBalancersAsync(request);
            return response.LoadBalancerDescriptions.Any(criteria => criteria.LoadBalancerName == _task.Name);
        }

        public async Task CreateLoadBalancer()
        {
            _context.Logger.WriteLine("CreateLoadBalancer");

            var subNets = await GetSubNets();
            var securityGroups = await GetSecurityGroups();

            var request = new CreateLoadBalancerRequest
            {
                LoadBalancerName = _task.Name,
                AvailabilityZones = _cluster.AvailabilityZones.ToList(),
                Subnets = subNets,
                Listeners =
                {
                    new Listener("http", _task.HostPort, _task.HostPort)
                },
                Scheme = "internet-facing",
                SecurityGroups = securityGroups
            };
            await _client.CreateLoadBalancerAsync(request);
        }

        private async Task<List<String>> GetSecurityGroups()
        {
            var request = new DescribeSecurityGroupsRequest
            {
                GroupNames = { _cluster.Name }
            };
            var response = await _ec2client.DescribeSecurityGroupsAsync(request);
            return response.SecurityGroups
                .Select(value => value.GroupId)
                .ToList();
        }

        private async Task<List<string>> GetSubNets()
        {
            var vpcId = await GetVpcId();

            var request = new DescribeSubnetsRequest();
            var response = await _ec2client.DescribeSubnetsAsync(request);

            return response.Subnets
                .Where(criteria => criteria.VpcId == vpcId)
                .Select(value => value.SubnetId)
                .ToList();
        }

        private async Task<string> GetVpcId()
        {
            var request = new DescribeVpcsRequest
            {
                VpcIds = {_cluster.VpcCidr}
            };

            var response = await _ec2client.DescribeVpcsAsync(request);
            var vpc = response.Vpcs.FirstOrDefault();
            if (vpc == null)
            {
                throw new InvalidOperationException($"Vpc not found: {_cluster.VpcCidr}");
            }
            return vpc.VpcId;
        }

        private async Task DeleteLoadBalancer()
        {
            _context.Logger.WriteLine("DeleteLoadBalancer");

            var request = new DeleteLoadBalancerRequest
            {
                LoadBalancerName = _task.Name
            };
            await _client.DeleteLoadBalancerAsync(request);
        }

        private IAmazonElasticLoadBalancing CreateClient()
        {
            var credentials = new BasicAWSCredentials(_context.Settings.Amazon.AccessKey, _context.Settings.Amazon.SecretKey);
            return new AmazonElasticLoadBalancingClient(credentials, _context.Settings.Amazon.Region);
        }

        private IAmazonEC2 CreateEc2Client()
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
