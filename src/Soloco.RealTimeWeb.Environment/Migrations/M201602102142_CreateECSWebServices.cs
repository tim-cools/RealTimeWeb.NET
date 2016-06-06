using System;
using System.Linq;
using System.Threading.Tasks;
using Amazon.ECS;
using Amazon.ECS.Model;
using Amazon.Runtime;
using Soloco.RealTimeWeb.Environment.Core;
using Soloco.RealTimeWeb.Environment.Core.Configuration;
using Task = System.Threading.Tasks.Task;

namespace Soloco.RealTimeWeb.Environment.Migrations
{
    public class M201602102142_CreateECSWebServices : IMigration, IDisposable
    {
        private readonly MigrationContext _context;
        private readonly IAmazonECS _client;
        private readonly TaskSettings _task;
        private readonly ClusterSettings _cluster;

        public M201602102142_CreateECSWebServices(MigrationContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _context = context;
            _client = CreateClient();
            _cluster = _context.Settings.Cluster;
            _task = _cluster.GetTask("web");
        }

        public async Task Up()
        {
            if (await ServiceExists())
            {
                await CreateService();
            }
        }

        public async System.Threading.Tasks.Task Down()
        {
            if (await ServiceExists())
            {
                await DeleteService();
            }
        }

        private async Task<bool> ServiceExists()
        {
            var response = await _client.ListServicesAsync(new ListServicesRequest
            {
                Cluster = _context.Settings.Cluster.Name
            });
            return response.ServiceArns.Any(service => service == _task.Name);
        }

        public Task CreateService()
        {
            _context.Logger.WriteLine("CreateService");

            var request = new CreateServiceRequest
            {
                Cluster = _cluster.Name,
                DesiredCount = 2,
                ServiceName = _task.Name,
                Role = "ecsServiceRole",
                TaskDefinition = $"{_task.Name}:1",
                LoadBalancers =
                {
                    new LoadBalancer
                    {
                        ContainerName = _task.Name,
                        ContainerPort = _task.ContainerPort,
                        LoadBalancerName = _task.Name
                    }
                }
            };
            return _client.CreateServiceAsync(request);
        }

        private async Task DeleteService()
        {
            _context.Logger.WriteLine("DeleteService");

            var request = new DeleteServiceRequest
            {
                Cluster = _cluster.Name,
                Service = _task.Name
            };
            await _client.DeleteServiceAsync(request);
        }

        private IAmazonECS CreateClient()
        {
            var credentials = new BasicAWSCredentials(_context.Settings.Amazon.AccessKey, _context.Settings.Amazon.SecretKey);
            return new AmazonECSClient(credentials, _context.Settings.Amazon.Region);
        }

        public void Dispose()
        {
            _client.Dispose();
        }
    }
}
