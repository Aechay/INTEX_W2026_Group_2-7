namespace INTEX_W2026_Group_2_7.Models.Ml;

public sealed record SocialMediaPredictionRequest(
    string Platform,
    string PostType,
    string MediaType,
    string ContentTopic,
    string SentimentTone,
    string TimeBucket,
    int CaptionLength,
    int NumHashtags,
    int MentionsCount,
    int IsCta,
    int IsStory,
    int IsBoostedFlag,
    int FollowerCountAtPost,
    int IsWeekend,
    int PostHour);
