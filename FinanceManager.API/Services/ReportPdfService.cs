
using System.Globalization;
using FinanceManager.API.DTOs.Reports;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace FinanceManager.API.Services;

public class ReportPdfService
{
    private static readonly CultureInfo Br =
        CultureInfo.GetCultureInfo("pt-BR");

    public byte[] Generate(
        ReportResponse report,
        DateTime? startDate,
        DateTime? endDate)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(25);
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header().Column(column =>
                {
                    column.Item()
                        .Text("FinanceManager")
                        .FontSize(20)
                        .Bold()
                        .FontColor("#241D47");

                    column.Item()
                        .Text("RELATÓRIO FINANCEIRO")
                        .FontSize(10)
                        .FontColor(Colors.Grey.Darken2);

                    column.Item()
                        .PaddingTop(8)
                        .Text(
                            $"Período: {FormatDate(startDate)} até {FormatDate(endDate)}"
                        );

                    column.Item()
                        .PaddingTop(15)
                        .LineHorizontal(1)
                        .LineColor("#DDDDDD");
                });

                page.Content().PaddingTop(15).Column(column =>
                {
                    column.Spacing(15);

                    column.Item().Row(row =>
                    {
                        AddSummaryCard(
                            row,
                            "RECEITAS",
                            report.TotalIncome,
                            "#16803C");

                        AddSummaryCard(
                            row,
                            "DESPESAS",
                            report.TotalExpense,
                            "#C0392B");

                        AddSummaryCard(
                            row,
                            "RESULTADO",
                            report.Balance,
                            report.Balance >= 0
                                ? "#16803C"
                                : "#C0392B");
                    });

                    column.Item()
                        .Text($"Movimentações financeiras ({report.TransactionCount})")
                        .FontSize(12)
                        .Bold();

                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(65);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(1.5f);
                            columns.RelativeColumn(1.5f);
                            columns.ConstantColumn(55);
                            columns.ConstantColumn(90);
                        });

                        table.Header(header =>
                        {
                            void AddHeader(string value)
                            {
                                header.Cell()
                                    .Background("#EEEAFB")
                                    .Padding(6)
                                    .Text(value)
                                    .Bold();
                            }

                            AddHeader("Data");
                            AddHeader("Descrição");
                            AddHeader("Conta");
                            AddHeader("Categoria");
                            AddHeader("Tipo");
                            AddHeader("Valor");
                        });

                        foreach (var transaction in report.Transactions)
                        {
                            AddBodyCell(
                                table,
                                transaction.Date.ToString("dd/MM/yyyy", Br));

                            AddBodyCell(table, transaction.Description);
                            AddBodyCell(table, transaction.Account);
                            AddBodyCell(table, transaction.Category);

                            AddBodyCell(
                                table,
                                transaction.Type == 1
                                    ? "Receita"
                                    : "Despesa");

                            AddBodyCell(
                                table,
                                $"{(transaction.Type == 1 ? "+" : "-")} {FormatCurrency(transaction.Amount)}");
                        }
                    });
                });

                page.Footer()
                    .AlignRight()
                    .Text(text =>
                    {
                        text.Span("FinanceManager | Página ");
                        text.CurrentPageNumber();
                        text.Span(" de ");
                        text.TotalPages();
                    });
            });
        });

        return document.GeneratePdf();
    }

    private static void AddSummaryCard(
        RowDescriptor row,
        string title,
        decimal amount,
        string color)
    {
        row.RelativeItem()
            .PaddingRight(8)
            .Background("#F3F0FF")
            .Border(1)
            .BorderColor("#D8D0F0")
            .Padding(12)
            .Column(column =>
            {
                column.Item()
                    .Text(title)
                    .FontSize(8)
                    .FontColor(Colors.Grey.Darken2);

                column.Item()
                    .PaddingTop(5)
                    .Text(FormatCurrency(amount))
                    .FontSize(14)
                    .Bold()
                    .FontColor(color);
            });
    }

    private static void AddHeaderCell(
    TableDescriptor table,
    string value)
    {
        table.Cell()
            .Background("#EEEAFB")
            .Padding(6)
            .Text(value)
            .Bold();
    }

    private static void AddBodyCell(
        TableDescriptor table,
        string value)
    {
        table.Cell()
            .BorderBottom(0.5f)
            .BorderColor("#E5E5E5")
            .Padding(6)
            .Text(value ?? "");
    }

    private static string FormatCurrency(decimal value)
    {
        return value.ToString("C", Br);
    }

    private static string FormatDate(DateTime? value)
    {
        return value?.ToString("dd/MM/yyyy", Br)
            ?? "Não informado";
    }
}
