using AutoMapper;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;

namespace SmartHomeManager.Mapping
{
    public class EntityMappingProfile : Profile
    {
        public EntityMappingProfile()
        {
            CreateMap<Device, DeviceReadDto>()
                .ForMember(destination => destination.Name, options => options.MapFrom(source => source.Nume))
                .ForMember(destination => destination.Type, options => options.MapFrom(source => source.Tip))
                .ForMember(destination => destination.IsOn, options => options.MapFrom(source => source.EstePornit))
                .ForMember(destination => destination.Value, options => options.MapFrom(source => source.Valoare))
                .ForMember(destination => destination.RoomName, options => options.MapFrom(source => source.Room != null ? source.Room.Name : null));

            CreateMap<Room, RoomReadDto>()
                .ForMember(destination => destination.DeviceCount, options => options.MapFrom(source => source.Devices.Count));

            CreateMap<AutomationRule, AutomationReadDto>();
            CreateMap<Notification, NotificationReadDto>();
            CreateMap<ActivityLog, ActivityLogReadDto>();
        }
    }
}
