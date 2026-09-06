using System.ComponentModel.DataAnnotations;
using FinanceManager.API.Models;

namespace FinanceManager.API.DTOs.Categories;

public class CreateCategoryRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public CategoryType Type { get; set; }
}