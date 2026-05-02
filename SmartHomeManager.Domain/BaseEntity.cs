namespace SmartHomeManager.Models
{
    /// <summary>
    /// Provides the shared identity contract for all persisted entities.
    /// Additional cross-cutting state such as audit fields can be layered on top later
    /// without changing every entity signature again.
    /// </summary>
    public abstract class BaseEntity
    {
        public int Id { get; set; }
    }
}
