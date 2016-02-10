using System;
using System.Linq;
using Amazon.ECS;
using Amazon.ECS.Model;
using Amazon.Runtime;
using Soloco.RealTimeWeb.Environment.Core;
using Soloco.RealTimeWeb.Environment.Core.Configuration;

namespace Soloco.RealTimeWeb.Environment.Migrations
{
    public class M20160209213000_CreateECSWebTask : IMigration, IDisposable
    {
        private readonly MigrationContext _context;
        private readonly IAmazonECS _client;
        private readonly TasksSettings _task;

        public M20160209213000_CreateECSWebTask(MigrationContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _context = context;
            _client = CreateClient();
            _task = _context.Settings.Cluster.GetTask("web");
        }

        public void Up()
        {
            var task = TaskExists();
            if (task != null)
            {
                CreateTask();
            }
        }

        public void Down()
        {
            var task = TaskExists();
            if (task != null)
            {
                DeleteTask(task);
            }
        }

        private Task TaskExists()
        {
            var response = _client.DescribeTasks(new DescribeTasksRequest
            {
                Cluster = _context.Settings.Cluster.Name
            });
            return response.Tasks.FirstOrDefault(criteria => criteria.Containers.Any(container => container.Name == _task.Name));
        }

        public void CreateTask()
        {
            var request = new RegisterTaskDefinitionRequest
            {
                ContainerDefinitions =
                {
                    new ContainerDefinition
                    {
                        Name = _task.Name,
                        Image = _task.Image,
                        Memory = 350,
                        PortMappings =
                        {
                            new PortMapping
                            {
                                ContainerPort = 80,
                                HostPort = _task.HostPort,
                                Protocol  = TransportProtocol.Tcp
                            }
                        }
                    }
                }
            };
            _client.RegisterTaskDefinition(request);
        }

        private void DeleteTask(Task task)
        {
            var request = new DeregisterTaskDefinitionRequest
            {
                TaskDefinition = task.TaskDefinitionArn
            };
            _client.DeregisterTaskDefinition(request);
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
