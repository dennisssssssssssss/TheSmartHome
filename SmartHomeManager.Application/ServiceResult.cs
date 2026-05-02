namespace SmartHomeManager.Common
{
    public enum ServiceResultStatus
    {
        Success,
        NotFound,
        ValidationError,
        Conflict,
        Unauthorized,
        Failure
    }

    public class ServiceResult
    {
        public ServiceResultStatus Status { get; init; }
        public string? Message { get; init; }
        public IReadOnlyDictionary<string, string[]> Errors { get; init; } = new Dictionary<string, string[]>();
        public bool IsSuccess => Status == ServiceResultStatus.Success;

        public static ServiceResult Success(string? message = null) =>
            new() { Status = ServiceResultStatus.Success, Message = message };

        public static ServiceResult NotFound(string? message = null) =>
            new() { Status = ServiceResultStatus.NotFound, Message = message };

        public static ServiceResult Conflict(string? message = null) =>
            new() { Status = ServiceResultStatus.Conflict, Message = message };

        public static ServiceResult Unauthorized(string? message = null) =>
            new() { Status = ServiceResultStatus.Unauthorized, Message = message };

        public static ServiceResult Validation(string message, IReadOnlyDictionary<string, string[]>? errors = null) =>
            new()
            {
                Status = ServiceResultStatus.ValidationError,
                Message = message,
                Errors = errors ?? new Dictionary<string, string[]>(),
            };

        public static ServiceResult Failure(string message) =>
            new() { Status = ServiceResultStatus.Failure, Message = message };
    }

    public class ServiceResult<T> : ServiceResult
    {
        public T? Data { get; init; }

        public static ServiceResult<T> Success(T data, string? message = null) =>
            new() { Status = ServiceResultStatus.Success, Data = data, Message = message };

        public static new ServiceResult<T> NotFound(string? message = null) =>
            new() { Status = ServiceResultStatus.NotFound, Message = message };

        public static new ServiceResult<T> Conflict(string? message = null) =>
            new() { Status = ServiceResultStatus.Conflict, Message = message };

        public static new ServiceResult<T> Unauthorized(string? message = null) =>
            new() { Status = ServiceResultStatus.Unauthorized, Message = message };

        public static new ServiceResult<T> Validation(string message, IReadOnlyDictionary<string, string[]>? errors = null) =>
            new()
            {
                Status = ServiceResultStatus.ValidationError,
                Message = message,
                Errors = errors ?? new Dictionary<string, string[]>(),
            };

        public static new ServiceResult<T> Failure(string message) =>
            new() { Status = ServiceResultStatus.Failure, Message = message };
    }
}
