using System;
using Amazon.ECS;
using Amazon.ECS.Model;
using Amazon.Runtime;
using Soloco.RealTimeWeb.Environment.Core;

namespace Soloco.RealTimeWeb.Environment.Migrations
{
    public class M20160209_CreateECSCluster : IMigration, IDisposable
    {
        private readonly MigrationContext _context;
        private readonly IAmazonECS _client;

        public M20160209_CreateECSCluster(MigrationContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _context = context;
            _client = CreateClient();
        }

        public void Up()
        {
            if (!ClusterExists())
            {
                CreateCluster();
            }
        }

        public void Down()
        {
            if (ClusterExists())
            {
                DeleteCluster();
            }
        }

        private bool ClusterExists()
        {
            var response = _client.ListClusters(new ListClustersRequest());
            return response.ClusterArns.Contains(_context.Settings.Cluster.Name);
        }

        public void CreateCluster()
        {
            var request = new CreateClusterRequest
            {
                ClusterName = _context.Settings.Cluster.Name
            };
            _client.CreateCluster(request);
        }

        private void DeleteCluster()
        {
            var request = new DeleteClusterRequest
            {
                Cluster = _context.Settings.Cluster.Name
            };
            _client.DeleteCluster(request);
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
