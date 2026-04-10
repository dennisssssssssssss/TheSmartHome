using SmartHomeManager.Dtos;
using SmartHomeManager.Models;

namespace SmartHomeManager.Services
{
    public interface IDeviceControlService
    {
        Task ExecuteCommandAsync(Device device, DeviceControlDto command);
    }
}