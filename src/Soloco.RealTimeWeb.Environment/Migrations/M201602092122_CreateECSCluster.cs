using System;
using Amazon.ECS;
using Amazon.ECS.Model;
using Amazon.Runtime;
using Task = System.Threading.Tasks.Task;
using Soloco.RealTimeWeb.Environment.Core;
using System.Threading.Tasks;

namespace Soloco.RealTimeWeb.Environment.Migrations
{
    public class M201602092122_CreateECSCluster : IMigration, IDisposable
    {
        private readonly MigrationContext _context;
        private readonly IAmazonECS _client;

        public M201602092122_CreateECSCluster(MigrationContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _context = context;
            _client = CreateClient();
        }

        public async System.Threading.Tasks.Task Up()
        {
            if (!await ClusterExists())
            {
                await CreateCluster();
            }
        }

        public async System.Threading.Tasks.Task Down()
        {
            if (await ClusterExists())
            {
                await DeleteCluster();
            }
        }

        private async Task<bool> ClusterExists()
        {
            var response = await _client.ListClustersAsync(new ListClustersRequest());
            return response.ClusterArns.Contains(_context.Settings.Cluster.Name);
        }

        public async Task CreateCluster()
        {
            var request = new CreateClusterRequest
            {
                ClusterName = _context.Settings.Cluster.Name
            };
            await _client.CreateClusterAsync(request);
        }

        private async Task DeleteCluster()
        {
            var request = new DeleteClusterRequest
            {
                Cluster = _context.Settings.Cluster.Name
            };
            await _client.DeleteClusterAsync(request);
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
