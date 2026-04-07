using System.Net;
using System.Net.Http.Json;
using INTEX_W2026_Group_2_7.Configuration.Ml;
using INTEX_W2026_Group_2_7.Models.Ml;
using Microsoft.Extensions.Options;

namespace INTEX_W2026_Group_2_7.Services.Ml;

public sealed class SocialMediaInferenceClient : ISocialMediaInferenceClient
{
    public const string HttpClientName = "SocialMediaInferenceClient";

    private static readonly TimeSpan[] RetryDelays =
    [
        TimeSpan.FromMilliseconds(200),
        TimeSpan.FromMilliseconds(500),
        TimeSpan.FromSeconds(1)
    ];

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<SocialMediaInferenceClient> _logger;
    private readonly SocialMediaInferenceOptions _options;

    public SocialMediaInferenceClient(
        IHttpClientFactory httpClientFactory,
        IOptions<SocialMediaInferenceOptions> options,
        ILogger<SocialMediaInferenceClient> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _options = options.Value;
    }

    public async Task<SocialMediaPredictionResponse> PredictAsync(
        SocialMediaPredictionRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.BaseUrl))
        {
            throw new InvalidOperationException(
                $"{SocialMediaInferenceOptions.SectionName}:BaseUrl must be configured.");
        }

        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        linkedCts.CancelAfter(TimeSpan.FromSeconds(Math.Max(_options.TimeoutSeconds, 1)));

        Exception? lastError = null;
        for (var attempt = 0; attempt <= RetryDelays.Length; attempt++)
        {
            try
            {
                using var client = _httpClientFactory.CreateClient(HttpClientName);
                client.BaseAddress = new Uri(_options.BaseUrl, UriKind.Absolute);

                using var requestMessage = new HttpRequestMessage(HttpMethod.Post, _options.Route)
                {
                    Content = JsonContent.Create(request)
                };

                if (!string.IsNullOrWhiteSpace(_options.SharedSecret))
                {
                    requestMessage.Headers.TryAddWithoutValidation("x-ml-shared-secret", _options.SharedSecret);
                }

                using var response = await client.SendAsync(
                    requestMessage,
                    HttpCompletionOption.ResponseHeadersRead,
                    linkedCts.Token);

                if (response.IsSuccessStatusCode)
                {
                    var payload = await response.Content.ReadFromJsonAsync<SocialMediaPredictionResponse>(
                        cancellationToken: linkedCts.Token);

                    return payload ?? throw new InvalidOperationException(
                        "The social media inference service returned an empty response.");
                }

                if (!IsRetryableStatusCode(response.StatusCode) || attempt == RetryDelays.Length)
                {
                    var body = await response.Content.ReadAsStringAsync(linkedCts.Token);
                    throw new HttpRequestException(
                        $"The social media inference service returned {(int)response.StatusCode}: {body}",
                        null,
                        response.StatusCode);
                }

                _logger.LogWarning(
                    "Retrying social media inference request after {StatusCode} on attempt {Attempt}.",
                    (int)response.StatusCode,
                    attempt + 1);
            }
            catch (Exception ex) when (attempt < RetryDelays.Length && IsRetryableException(ex))
            {
                lastError = ex;
                _logger.LogWarning(ex, "Retrying social media inference request on attempt {Attempt}.", attempt + 1);
            }

            if (attempt < RetryDelays.Length)
            {
                await Task.Delay(RetryDelays[attempt], cancellationToken);
            }
        }

        throw new InvalidOperationException(
            "The social media inference request failed after all retries.",
            lastError);
    }

    private static bool IsRetryableStatusCode(HttpStatusCode statusCode)
    {
        return statusCode is HttpStatusCode.RequestTimeout
            or HttpStatusCode.TooManyRequests
            or HttpStatusCode.BadGateway
            or HttpStatusCode.ServiceUnavailable
            or HttpStatusCode.GatewayTimeout
            || (int)statusCode >= 500;
    }

    private static bool IsRetryableException(Exception exception)
    {
        return exception is HttpRequestException or TaskCanceledException;
    }
}
