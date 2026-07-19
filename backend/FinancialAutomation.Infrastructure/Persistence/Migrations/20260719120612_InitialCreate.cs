using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinancialAutomation.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Role = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Owner"),
                    CompanyName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamptz", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    VendorName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    InvoiceDate = table.Column<DateOnly>(type: "date", nullable: true),
                    TotalAmount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: true),
                    TaxAmount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Pending"),
                    FailureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamptz", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.Id);
                    table.CheckConstraint("CK_Invoices_TotalAmount", "\"TotalAmount\" >= 0");
                    table.ForeignKey(
                        name: "FK_Invoices_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Action = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Details = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Logs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Predictions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    MetricType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ForecastDate = table.Column<DateOnly>(type: "date", nullable: false),
                    PredictedValue = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    LowerBound = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: true),
                    UpperBound = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: true),
                    GeneratedAt = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Predictions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Predictions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReportType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PeriodStart = table.Column<DateOnly>(type: "date", nullable: false),
                    PeriodEnd = table.Column<DateOnly>(type: "date", nullable: false),
                    FilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    GeneratedAt = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reports", x => x.Id);
                    table.CheckConstraint("CK_Reports_PeriodEnd", "\"PeriodEnd\" >= \"PeriodStart\"");
                    table.ForeignKey(
                        name: "FK_Reports_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Transactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    InvoiceId = table.Column<Guid>(type: "uuid", nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    TransactionDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CategoryConfidence = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: true),
                    ShapExplanationJson = table.Column<string>(type: "jsonb", nullable: true),
                    OverriddenByUser = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transactions", x => x.Id);
                    table.CheckConstraint("CK_Transactions_CategoryConfidence", "\"CategoryConfidence\" IS NULL OR (\"CategoryConfidence\" >= 0 AND \"CategoryConfidence\" <= 1)");
                    table.ForeignKey(
                        name: "FK_Transactions_Invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalTable: "Invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Transactions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Anomalies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TransactionId = table.Column<Guid>(type: "uuid", nullable: false),
                    AnomalyScore = table.Column<decimal>(type: "numeric(6,5)", precision: 6, scale: 5, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Reviewed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ReviewedAt = table.Column<DateTime>(type: "timestamptz", nullable: true),
                    DetectedAt = table.Column<DateTime>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Anomalies", x => x.Id);
                    table.CheckConstraint("CK_Anomalies_AnomalyScore", "\"AnomalyScore\" >= 0 AND \"AnomalyScore\" <= 1");
                    table.ForeignKey(
                        name: "FK_Anomalies_Transactions_TransactionId",
                        column: x => x.TransactionId,
                        principalTable: "Transactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_anomalies_severity_reviewed",
                table: "Anomalies",
                columns: new[] { "Severity", "Reviewed" });

            migrationBuilder.CreateIndex(
                name: "ux_anomalies_transactionid",
                table: "Anomalies",
                column: "TransactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_invoices_uploadedat",
                table: "Invoices",
                column: "UploadedAt",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "ix_invoices_userid_status",
                table: "Invoices",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "ix_logs_userid_timestamp",
                table: "Logs",
                columns: new[] { "UserId", "Timestamp" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "ux_predictions_user_metric_date",
                table: "Predictions",
                columns: new[] { "UserId", "MetricType", "ForecastDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_reports_userid_generatedat",
                table: "Reports",
                columns: new[] { "UserId", "GeneratedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "ix_transactions_category",
                table: "Transactions",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_InvoiceId",
                table: "Transactions",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "ix_transactions_userid_date",
                table: "Transactions",
                columns: new[] { "UserId", "TransactionDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Anomalies");

            migrationBuilder.DropTable(
                name: "Logs");

            migrationBuilder.DropTable(
                name: "Predictions");

            migrationBuilder.DropTable(
                name: "Reports");

            migrationBuilder.DropTable(
                name: "Transactions");

            migrationBuilder.DropTable(
                name: "Invoices");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
