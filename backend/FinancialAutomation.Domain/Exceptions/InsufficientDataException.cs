namespace FinancialAutomation.Domain.Exceptions;

public class InsufficientDataException : Exception
{
    public InsufficientDataException(string message) : base(message) { }
}
