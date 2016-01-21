
using System;
using System.Threading;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Domain;
using Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Services;

namespace Soloco.RealTimeWeb.Environment
{
    public class Program
    {
        static readonly ManualResetEvent _terminateApplication = new ManualResetEvent(false);

        static void Main(string[] args)
        {
            var configuration = BuildConfigurationRoot(args);
            var bus = CreateBus(configuration);
            var busHandle = bus.Start();

            var service = new SimulateVehicleDataService(bus, new RoutePlanner());
            StopOnCancelKeyPress(service);

            try
            {
                service.Start();
                _terminateApplication.WaitOne();
                service.Stop();
            }
            finally
            {
                service.Dispose();
                busHandle.Dispose();
            }
        }

        private static void StopOnCancelKeyPress(SimulateVehicleDataService service)
        {
            Console.WriteLine("To terminate, press CTRL+C or equivalent");
            Console.CancelKeyPress += (sender, arguments) =>
            {
                Console.WriteLine("Terminate application");

                _terminateApplication.Set();
                arguments.Cancel = true;
            };
        }

        public static IBusControl CreateBus(IConfigurationRoot configuration)
        {
            var host = new Uri(configuration["rabbitMq:hostName"]);
            var userName = configuration["rabbitMq:userName"];
            var password = configuration["rabbitMq:password"];

            var bus = Bus.Factory.CreateUsingRabbitMq(busConfigurator =>
            {
                busConfigurator.Host(host, hostConfigurator =>
                {
                    hostConfigurator.Username(userName);
                    hostConfigurator.Password(password);
                });
            });

            return bus;
        }

        private static IConfigurationRoot BuildConfigurationRoot(string[] values)
        {
            var builder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddJsonFile("appsettings.private.json", true)
                .AddEnvironmentVariables()
                .AddCommandLine(values);

            return builder.Build();
        }
    }
}
