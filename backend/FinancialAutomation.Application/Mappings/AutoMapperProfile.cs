using AutoMapper;
using FinancialAutomation.Application.DTOs.Anomaly;
using FinancialAutomation.Domain.Entities;

namespace FinancialAutomation.Application.Mappings;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        CreateMap<Anomaly, AnomalyDto>()
            .ForMember(d => d.Severity, o => o.MapFrom(s => s.Severity.ToString()));
    }
}