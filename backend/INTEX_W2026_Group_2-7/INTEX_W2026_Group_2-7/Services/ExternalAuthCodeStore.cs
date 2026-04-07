using System.Security.Cryptography;
using Microsoft.Extensions.Caching.Memory;

namespace INTEX_W2026_Group_2_7.Services;

public interface IExternalAuthCodeStore
{
    string Issue(string userId, string provider);

    bool TryConsume(string code, out ExternalAuthCodeValue value);
}

public sealed record ExternalAuthCodeValue(string UserId, string Provider);

public sealed class ExternalAuthCodeStore(IMemoryCache cache) : IExternalAuthCodeStore
{
    private static readonly TimeSpan CodeLifetime = TimeSpan.FromMinutes(5);

    public string Issue(string userId, string provider)
    {
        var code = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');

        cache.Set(
            GetCacheKey(code),
            new ExternalAuthCodeValue(userId, provider),
            new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = CodeLifetime
            });

        return code;
    }

    public bool TryConsume(string code, out ExternalAuthCodeValue value)
    {
        if (cache.TryGetValue<ExternalAuthCodeValue>(GetCacheKey(code), out var cachedValue) &&
            cachedValue is not null)
        {
            cache.Remove(GetCacheKey(code));
            value = cachedValue;
            return true;
        }

        value = default!;
        return false;
    }

    private static string GetCacheKey(string code) => $"external-auth:{code}";
}
