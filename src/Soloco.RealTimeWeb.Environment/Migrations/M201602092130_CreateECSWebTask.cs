using System;
using System.Linq;
using System.Threading.Tasks;
using Amazon.ECS;
using Amazon.ECS.Model;
using Amazon.Runtime;
using Soloco.RealTimeWeb.Environment.Core;
using Soloco.RealTimeWeb.Environment.Core.Configuration;

namespace Soloco.RealTimeWeb.Environment.Migrations
{
    public class M201602092130_CreateECSWebTask : IMigration, IDisposable
    {
        private readonly MigrationContext _context;
        private readonly IAmazonECS _client;
        private readonly TaskSettings _task;

        public M201602092130_CreateECSWebTask(MigrationContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _context = context;
            _client = CreateClient();
            _task = _context.Settings.Cluster.GetTask("web");
        }

        public async System.Threading.Tasks.Task Up()
        {
            var task = await TaskExists();
            if (task == null)
            {
                await CreateTask();
            }
        }

        public async System.Threading.Tasks.Task Down()
        {
            var task = await TaskExists();
            if (task != null)
            {
                await DeleteTask(task);
            }
        }

        private async Task<string> TaskExists()
        {
            var response = await _client.ListTasksAsync(new ListTasksRequest
            {
                Cluster = _context.Settings.Cluster.Name,
                Family = _task.Name,
            });
            return response.TaskArns.FirstOrDefault();
        }

        public async System.Threading.Tasks.Task CreateTask()
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
                                ContainerPort = _task.ContainerPort,
                                HostPort = _task.HostPort,
                                Protocol  = TransportProtocol.Tcp
                            }
                        }
                    }
                },
                Family = _task.Name
            };
            await _client.RegisterTaskDefinitionAsync(request);
        }

        private async System.Threading.Tasks.Task DeleteTask(string task)
        {
            var request = new DeregisterTaskDefinitionRequest
            {
                TaskDefinition = task
            };
            await _client.DeregisterTaskDefinitionAsync(request);
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
