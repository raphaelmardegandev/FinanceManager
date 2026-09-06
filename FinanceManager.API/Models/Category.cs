namespace FinanceManager.API.Models;

public enum CategoryType
{
    Income = 1,
    Expense = 2
}

public class Category
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public CategoryType Type { get; set; }

    public bool Active { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}