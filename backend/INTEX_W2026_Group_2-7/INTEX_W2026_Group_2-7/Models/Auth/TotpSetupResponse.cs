namespace INTEX_W2026_Group_2_7.Models.Auth;

public sealed record TotpSetupResponse(
    string SecretKey,
    string OtpAuthUri);
