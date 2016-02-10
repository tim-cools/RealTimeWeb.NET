using System;
using System.Linq;
using Amazon;

namespace Soloco.RealTimeWeb.Environment.Core.Configuration
{
    public class ClusterSettings
    {
        public string Name { get; set; }
        public TasksSettings[] Tasks { get; set; }

        public TasksSettings GetTask(string name)
        {
            var task = Tasks.FirstOrDefault(criteria => criteria.Name == name);
            if (task == null)
            {
                throw new InvalidOperationException("Could not find task: " + name);
            }
            return task;
        }
    }
}