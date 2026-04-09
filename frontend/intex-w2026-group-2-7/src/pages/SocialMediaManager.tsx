import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CircleAlert,
  CloudUpload,
  ExternalLink,
  Eye,
  Facebook,
  FileBarChart2,
  HeartHandshake,
  ImagePlus,
  Instagram,
  LayoutDashboard,
  Loader2,
  Megaphone,
  PencilLine,
  Plus,
  Rocket,
  Sparkles,
  Trash2,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "@/auth/auth-api";
import useAuth from "@/auth/useAuth";
import AdminWorkspace, { type AdminNavItem } from "@/components/admin/AdminWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { withPathLanguage } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type SocialMediaPostSummary = {
  postId: number;
  platform: string;
  platformPostId: string | null;
  postUrl: string | null;
  publishStatus: string;
  createdAt: string;
  publishedAtUtc: string | null;
  postType: string;
  mediaType: string;
  caption: string;
  campaignName: string | null;
  contentTopic: string;
  sentimentTone: string;
  featuresResidentStory: boolean;
  hasCallToAction: boolean;
  callToActionType: string | null;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  donationReferrals: number;
  estimatedDonationValuePhp: number;
  predictedDonationValuePhp: number | null;
};

type SocialMediaPostDetail = {
  postId: number;
  platform: string;
  platformPostId: string | null;
  postUrl: string | null;
  publishStatus: string;
  createdAt: string;
  publishedAtUtc: string | null;
  dayOfWeek: string;
  postHour: number;
  postType: string;
  mediaType: string;
  caption: string;
  hashtags: string | null;
  numHashtags: number;
  mentionsCount: number;
  hasCallToAction: boolean;
  callToActionType: string | null;
  callToActionUrl: string | null;
  altText: string | null;
  mediaUrls: string[];
  contentTopic: string;
  sentimentTone: string;
  captionLength: number;
  featuresResidentStory: boolean;
  campaignName: string | null;
  isBoosted: boolean;
  boostBudgetPhp: number | null;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clickThroughs: number;
  videoViews: number | null;
  engagementRate: number;
  profileVisits: number;
  donationReferrals: number;
  estimatedDonationValuePhp: number;
  predictedDonationValuePhp: number | null;
  predictionModelVersion: string | null;
  predictionScoredAtUtc: string | null;
  followerCountAtPost: number;
  lastMetricsUpdatedAtUtc: string | null;
  watchTimeSeconds: number | null;
  avgViewDurationSeconds: number | null;
  subscriberCountAtPost: number | null;
  forwards: number | null;
};

type SocialMediaPostsPageResponse = {
  posts: SocialMediaPostSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  filterOptions: {
    platforms: string[];
    mediaTypes: string[];
    contentTopics: string[];
    publishStatuses: string[];
  };
};

type SocialMediaPublishResponse = {
  publishedPosts: SocialMediaPostDetail[];
  failures: Array<{
    platform: string;
    message: string;
  }>;
};

type SocialMediaAssetUploadResponse = {
  assets: SocialMediaUploadedAsset[];
};

type SocialMediaUploadedAsset = {
  assetId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  liveUrl: string;
};

type SocialMediaPredictionResponse = {
  predictedDonationPhp: number;
  modelVersion: string;
  scoredAt: string;
};

type WizardFormState = {
  platforms: string[];
  postType: string;
  mediaType: string;
  contentTopic: string;
  sentimentTone: string;
  caption: string;
  callToActionType: string;
  featuresResidentStory: boolean;
  campaignName: string;
  isBoosted: boolean;
  boostBudgetPhp: string;
  followerCountAtPost: string;
  altText: string;
  plannedPostHour: string;
  plannedWeekend: boolean;
};

type ComposerFeedback = {
  tone: "success" | "warning" | "error";
  title: string;
  description: string;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const humanizeValue = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .trim();

const platformOptions = [
  {
    id: "Instagram",
    label: "Instagram",
    description: "Best for image, carousel, and reel publishing with public media URLs.",
    icon: Instagram,
    accent: "from-pink-500/20 via-orange-400/15 to-transparent",
  },
  {
    id: "Facebook",
    label: "Facebook",
    description: "Best for feed posts, photo uploads, and image carousels to your Page.",
    icon: Facebook,
    accent: "from-sky-500/20 via-blue-500/15 to-transparent",
  },
] as const;

const manualPlatformOptions = [
  "Facebook",
  "Instagram",
  "Linked In",
  "Tik Tok",
  "Twitter",
  "Whats App",
  "You Tube",
];

const wizardSteps = [
  { id: "platforms", label: "Platforms" },
  { id: "postType", label: "Post Type" },
  { id: "topic", label: "Topic" },
  { id: "tone", label: "Tone" },
  { id: "media", label: "Media" },
  { id: "caption", label: "Caption" },
  { id: "review", label: "Review" },
] as const;

const postTypeOptions = ["ImpactStory", "Appeal", "CampaignUpdate", "Gratitude", "EventHighlight"];
const mediaTypeOptions = ["Photo", "Carousel", "Video", "Reel"];
const contentTopicOptions = ["Health", "SafehouseLife", "Reintegration", "Education", "DonorImpact"];
const sentimentToneOptions = ["Urgent", "Emotional", "Celebratory", "Hopeful", "Informative"];
const callToActionOptions = ["Donate", "LearnMore", "Volunteer", "Share", "ReadStory"];

const createDefaultWizardForm = (): WizardFormState => ({
  platforms: ["Instagram", "Facebook"],
  postType: "ImpactStory",
  mediaType: "Photo",
  contentTopic: "Health",
  sentimentTone: "Emotional",
  caption: "",
  callToActionType: "Donate",
  featuresResidentStory: true,
  campaignName: "",
  isBoosted: false,
  boostBudgetPhp: "",
  followerCountAtPost: "5000",
  altText: "",
  plannedPostHour: "9",
  plannedWeekend: false,
});

const formatCurrency = (value: number | null | undefined) =>
  value === null || value === undefined ? "No value yet" : `PHP ${currencyFormatter.format(value)}`;

const formatDateTime = (value: string | null | undefined) =>
  value ? dateTimeFormatter.format(new Date(value)) : "Not set";

const parsePositiveNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const parseOptionalPositiveNumber = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const countHashtags = (value: string) => (value.match(/#\w+/g) ?? []).length;

const parseMediaUrls = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const convertToJpg = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas conversion failed"));
      }, "image/jpeg", 0.9);
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = URL.createObjectURL(file);
  });
};

const toLocalDateTimeInput = (isoValue: string | null | undefined) => {
  if (!isoValue) {
    return "";
  }

  const date = new Date(isoValue);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

const fromLocalDateTimeInput = (value: string) => (value ? new Date(value).toISOString() : new Date().toISOString());

type SocialMediaManagerProps = {
  mode?: "library" | "composer";
};

const createDefaultNewPost = (): SocialMediaPostDetail => ({
  postId: 0,
  platform: "Facebook",
  platformPostId: null,
  postUrl: null,
  publishStatus: "Recorded",
  createdAt: new Date().toISOString(),
  publishedAtUtc: null,
  dayOfWeek: "",
  postHour: 0,
  postType: "ImpactStory",
  mediaType: "Photo",
  caption: "",
  hashtags: null,
  numHashtags: 0,
  mentionsCount: 0,
  hasCallToAction: false,
  callToActionType: "Donate",
  callToActionUrl: null,
  altText: null,
  mediaUrls: [],
  contentTopic: "Health",
  sentimentTone: "Emotional",
  captionLength: 0,
  featuresResidentStory: true,
  campaignName: null,
  isBoosted: false,
  boostBudgetPhp: null,
  impressions: 0,
  reach: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
  clickThroughs: 0,
  videoViews: null,
  engagementRate: 0,
  profileVisits: 0,
  donationReferrals: 0,
  estimatedDonationValuePhp: 0,
  predictedDonationValuePhp: null,
  predictionModelVersion: null,
  predictionScoredAtUtc: null,
  followerCountAtPost: 0,
  lastMetricsUpdatedAtUtc: new Date().toISOString(),
  watchTimeSeconds: null,
  avgViewDurationSeconds: null,
  subscriberCountAtPost: null,
  forwards: null,
});

const SocialMediaManager = ({ mode = "library" }: SocialMediaManagerProps) => {
  const auth = useAuth();
  const { i18n } = useTranslation("common");
  const { t: socialT } = useTranslation("socialMedia");
  const { t: dashboardT } = useTranslation("dashboard");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isComposerMode = mode === "composer";

  const [signOutPending, setSignOutPending] = useState(false);
  const [wizardStepIndex, setWizardStepIndex] = useState(0);
  const [wizard, setWizard] = useState<WizardFormState>(() => createDefaultWizardForm());
  const [uploadedAssets, setUploadedAssets] = useState<SocialMediaUploadedAsset[]>([]);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");
  const [pageSize, setPageSize] = useState("8");
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editLoadPending, setEditLoadPending] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPostDetail | null>(null);
  const [newPost, setNewPost] = useState<SocialMediaPostDetail | null>(null);
  const [composerFeedback, setComposerFeedback] = useState<ComposerFeedback | null>(null);

  // Reset wizard when entering composer
  useEffect(() => {
    if (isComposerMode) {
      setWizardStepIndex(0);
      setWizard(createDefaultWizardForm());
      setUploadedAssets([]);
      setComposerFeedback(null);
    }
  }, [isComposerMode]);

  const dashboardPath = withPathLanguage("/dashboard", i18n.resolvedLanguage);
  const socialMediaPath = withPathLanguage("/dashboard/social-media", i18n.resolvedLanguage);
  const caseloadPath = withPathLanguage("/dashboard/caseload", i18n.resolvedLanguage);
  const donationsPath = withPathLanguage("/dashboard/donations", i18n.resolvedLanguage);
  const processRecordingPath = withPathLanguage("/dashboard/process-recordings", i18n.resolvedLanguage);
  const homeVisitationPath = withPathLanguage("/dashboard/home-visitations", i18n.resolvedLanguage);
  const reportsPath = withPathLanguage("/dashboard/reports", i18n.resolvedLanguage);
  const socialMediaComposerPath = withPathLanguage("/dashboard/social-media/new", i18n.resolvedLanguage);

  const navigationItems: AdminNavItem[] = [
    { label: dashboardT("sidebar.dashboard"), icon: LayoutDashboard, to: dashboardPath },
    { label: dashboardT("sidebar.socialMedia"), icon: Megaphone, to: socialMediaPath, active: true },
    { label: dashboardT("sidebar.residents"), icon: UsersRound, to: caseloadPath },
    { label: dashboardT("sidebar.donations"), icon: HeartHandshake, to: donationsPath },
    { label: dashboardT("sidebar.processRecording"), icon: ClipboardList, to: processRecordingPath },
    { label: dashboardT("sidebar.caseConferences"), icon: CalendarClock, to: homeVisitationPath },
    { label: dashboardT("sidebar.reports"), icon: FileBarChart2, to: reportsPath },
  ];

  const handleLogout = async () => {
    setSignOutPending(true);
    try {
      await auth.logout();
    } finally {
      setSignOutPending(false);
    }
  };

  const mediaUrls = useMemo(() => uploadedAssets.map(a => a.liveUrl), [uploadedAssets]);
  const hashtagCount = useMemo(() => (wizard.caption.match(/#\w+/g) ?? []).length, [wizard.caption]);
  const mentionsCount = useMemo(() => (wizard.caption.match(/@\w+/g) ?? []).length, [wizard.caption]);
  const callToActionUrl = useMemo(() => (wizard.caption.match(/https?:\/\/[^\s]+/g) ?? [])[0] ?? "", [wizard.caption]);
  const hasCallToAction = useMemo(() => Boolean(callToActionUrl), [callToActionUrl]);

  const captionLength = useMemo(() => {
    let text = wizard.caption.trim();
    // Remove hashtags, mentions, and the first URL from the character count
    text = text.replace(/#\w+/g, "");
    text = text.replace(/@\w+/g, "");
    text = text.replace(/https?:\/\/[^\s]+/, "");
    return text.trim().length;
  }, [wizard.caption]);

  const plannedPostHour = parsePositiveNumber(wizard.plannedPostHour);
  const followerCountAtPost = parsePositiveNumber(wizard.followerCountAtPost);
  const boostBudgetPhp = parseOptionalPositiveNumber(wizard.boostBudgetPhp);

  const moveAsset = (index: number, direction: "up" | "down") => {
    setUploadedAssets((current) => {
      const updated = [...current];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return current;
      const [moved] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
  };

  const strategyChecks = useMemo(() => {
    const hour = Math.min(Math.max(Math.round(plannedPostHour), 0), 23);
    const timingStrong = (hour >= 7 && hour <= 11) || (hour >= 17 && hour <= 20);
    const hashtagsStrong = hashtagCount === 0 || (hashtagCount >= 5 && hashtagCount <= 8);
    const captionStrong = captionLength >= 160 && captionLength <= 219;
    const mentionStrong = mentionsCount >= 1 && mentionsCount <= 2;
    const mediaStrong = ["Reel", "Video", "Carousel"].includes(wizard.mediaType);
    const toneStrong = ["Urgent", "Emotional", "Celebratory"].includes(wizard.sentimentTone);
    const ctaStrong = !hasCallToAction || Boolean(callToActionUrl.trim());

    return [
      {
        label: "Resident-centered narrative",
        isStrong: wizard.featuresResidentStory,
        detail: "Posts with a resident story led the strongest average donation performance.",
      },
      {
        label: "High-converting format",
        isStrong: mediaStrong,
        detail: "Reels, video, and carousels outperformed static posts in the training set.",
      },
      {
        label: "Emotionally resonant tone",
        isStrong: toneStrong,
        detail: "Urgent, emotional, and celebratory tones delivered the best averages.",
      },
      {
        label: "Tight caption window",
        isStrong: captionStrong,
        detail: "The strongest caption band was 160 to 219 characters.",
      },
      {
        label: "Focused amplification",
        isStrong: mentionStrong && hashtagsStrong,
        detail: "The best posts used 1 to 2 mentions and either no hashtags or a deliberate 5 to 8.",
      },
      {
        label: "Timing and donation path",
        isStrong: timingStrong && ctaStrong,
        detail: "Morning and evening windows worked best, especially with a clear CTA path.",
      },
    ];
  }, [
    captionLength,
    hashtagCount,
    mentionsCount,
    plannedPostHour,
    callToActionUrl,
    wizard.featuresResidentStory,
    hasCallToAction,
    wizard.mediaType,
    wizard.sentimentTone,
  ]);

  const strategyScore = useMemo(() => {
    const satisfied = strategyChecks.filter((check) => check.isStrong).length;
    return Math.round((satisfied / strategyChecks.length) * 100);
  }, [strategyChecks]);

  const directPublishWarning = useMemo(() => {
    // Both Facebook and Instagram now support the requested formats via up-to-date API routes.
    return null;
  }, []);

  const uploadedAssetIdsInUse = useMemo(
    () => uploadedAssets.map((asset) => asset.assetId),
    [uploadedAssets],
  );

  const postsQuery = useQuery({
    queryKey: ["admin-social-media-posts", search, platformFilter, statusFilter, mediaTypeFilter, currentPage, pageSize],
    enabled: !isComposerMode,
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (platformFilter !== "all") params.set("platform", platformFilter);
      if (statusFilter !== "all") params.set("publishStatus", statusFilter);
      if (mediaTypeFilter !== "all") params.set("mediaType", mediaTypeFilter);
      params.set("page", currentPage.toString());
      params.set("pageSize", pageSize);
      return auth.authenticatedJson<SocialMediaPostsPageResponse>(`/api/admin/social-media/posts?${params.toString()}`);
    },
  });

  const uploadAssetsMutation = useMutation({
    mutationFn: async (files: FileList | File[]) => {
      const formData = new FormData();
      const processedFiles = await Promise.all(
        Array.from(files).map(async (file) => {
          if (file.type.startsWith("image/")) {
            const blob = await convertToJpg(file);
            return new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" });
          }
          return file;
        })
      );

      processedFiles.forEach((file) => {
        formData.append("files", file);
      });

      return auth.authenticatedJson<SocialMediaAssetUploadResponse>("/api/admin/social-media/assets", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (payload) => {
      setUploadedAssets((current) => [...current, ...payload.assets]);

      setWizard((current) => {
        const totalAssets = uploadedAssets.length + payload.assets.length;
        const hasVideo = [...uploadedAssets, ...payload.assets].some(a => a.contentType.startsWith("video/"));
        
        let detectedMediaType = current.mediaType;
        if (totalAssets > 1) {
          detectedMediaType = "Carousel";
        } else if (hasVideo) {
          detectedMediaType = "Video";
        } else if (totalAssets === 1) {
          detectedMediaType = "Photo";
        }

        return {
          ...current,
          mediaType: detectedMediaType,
        };
      });

      setComposerFeedback({
        tone: "success",
        title: "Upload successful",
        description: `${payload.assets.length} asset${payload.assets.length === 1 ? "" : "s"} processed and ready for publishing.`,
      });
    },
    onError: (error) => {
      setComposerFeedback({
        tone: "error",
        title: "Upload failed",
        description: getErrorMessage(error, "The image upload could not be completed."),
      });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (assetId: string) =>
      auth.authenticatedJson(`/api/admin/social-media/assets/${assetId}`, {
        method: "DELETE",
      }),
    onSuccess: (_, assetId) => {
      setUploadedAssets((current) => current.filter((a) => a.assetId !== assetId));
    },
  });

  const predictionMutation = useMutation({
    mutationFn: () =>
      auth.authenticatedJson<SocialMediaPredictionResponse>("/api/admin/ml/social-media/predict", {
        method: "POST",
        body: {
          platform: wizard.platforms[0] ?? "Instagram",
          postType: wizard.postType,
          mediaType: wizard.mediaType,
          contentTopic: wizard.contentTopic,
          sentimentTone: wizard.sentimentTone,
          timeBucket:
            plannedPostHour >= 5 && plannedPostHour <= 11
              ? "Morning"
              : plannedPostHour >= 12 && plannedPostHour <= 16
                ? "Afternoon"
                : plannedPostHour >= 17 && plannedPostHour <= 21
                  ? "Evening"
                  : "Night",
          captionLength,
          numHashtags: hashtagCount,
          mentionsCount,
          isCta: hasCallToAction ? 1 : 0,
          isStory: wizard.featuresResidentStory ? 1 : 0,
          isBoostedFlag: wizard.isBoosted ? 1 : 0,
          followerCountAtPost,
          isWeekend: wizard.plannedWeekend ? 1 : 0,
          postHour: Math.min(Math.max(Math.round(plannedPostHour), 0), 23),
        },
      }),
    onError: (error) => {
      setComposerFeedback({
        tone: "error",
        title: "Projection unavailable",
        description: getErrorMessage(error, "The donation projection model could not score this post right now."),
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      auth.authenticatedJson<SocialMediaPublishResponse>("/api/admin/social-media/posts/publish", {
        method: "POST",
        body: {
          platforms: wizard.platforms,
          postType: wizard.postType,
          mediaType: wizard.mediaType,
          caption: wizard.caption,
          mentionsCount,
          hasCallToAction,
          callToActionType: wizard.callToActionType || null,
          callToActionUrl: callToActionUrl || null,
          contentTopic: wizard.contentTopic,
          sentimentTone: wizard.sentimentTone,
          featuresResidentStory: wizard.featuresResidentStory,
          campaignName: wizard.campaignName || null,
          isBoosted: wizard.isBoosted,
          boostBudgetPhp,
          followerCountAtPost,
          altText: wizard.altText || null,
          mediaUrls,
          uploadedAssetIds: uploadedAssetIdsInUse,
          predictedDonationValuePhp: predictionMutation.data?.predictedDonationPhp ?? null,
          predictionModelVersion: predictionMutation.data?.modelVersion ?? null,
          predictionScoredAtUtc: predictionMutation.data?.scoredAt ?? null,
        },
      }),
    onSuccess: async (payload) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-social-media-posts"] });

      const publishedCount = payload.publishedPosts.length;
      if (payload.failures.length > 0) {
        setComposerFeedback({
          tone: "warning",
          title: `${publishedCount} post${publishedCount === 1 ? "" : "s"} published`,
          description: payload.failures.map((failure) => `${failure.platform}: ${failure.message}`).join(" "),
        });
      } else {
        setComposerFeedback({
          tone: "success",
          title: "Post published",
          description: `Created ${publishedCount} live social post record${publishedCount === 1 ? "" : "s"} and saved them to the library.`,
        });
      }

      resetComposer();
    },
    onError: (error) => {
      setComposerFeedback({
        tone: "error",
        title: "Publish failed",
        description: getErrorMessage(error, "The social post could not be published."),
      });
    },
  });

  const recordMutation = useMutation({
    mutationFn: async () => {
      const requestBodyBase = {
        createdAt: new Date().toISOString(),
        postType: wizard.postType,
        mediaType: wizard.mediaType,
        caption: wizard.caption,
        mentionsCount,
        hasCallToAction,
        callToActionType: wizard.callToActionType || null,
        callToActionUrl: callToActionUrl || null,
        contentTopic: wizard.contentTopic,
        sentimentTone: wizard.sentimentTone,
        featuresResidentStory: wizard.featuresResidentStory,
        campaignName: wizard.campaignName || null,
        isBoosted: wizard.isBoosted,
        boostBudgetPhp,
        followerCountAtPost,
        platformPostId: null,
        postUrl: null,
        altText: wizard.altText || null,
        mediaUrls,
        impressions: 0,
        reach: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        clickThroughs: 0,
        videoViews: null,
        engagementRate: null,
        profileVisits: 0,
        donationReferrals: 0,
        estimatedDonationValuePhp: 0,
        watchTimeSeconds: null,
        avgViewDurationSeconds: null,
        subscriberCountAtPost: null,
        forwards: null,
        predictedDonationValuePhp: predictionMutation.data?.predictedDonationPhp ?? null,
        predictionModelVersion: predictionMutation.data?.modelVersion ?? null,
        predictionScoredAtUtc: predictionMutation.data?.scoredAt ?? null,
      };

      const results = await Promise.allSettled(
        wizard.platforms.map((platform) =>
          auth.authenticatedJson<SocialMediaPostDetail>("/api/admin/social-media/posts", {
            method: "POST",
            body: {
              platform,
              ...requestBodyBase,
            },
          }),
        ),
      );

      return results;
    },
    onSuccess: async (results) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-social-media-posts"] });
      const successes = results.filter((result) => result.status === "fulfilled").length;
      const failures = results
        .filter((result): result is PromiseRejectedResult => result.status === "rejected")
        .map((result) => getErrorMessage(result.reason, "Failed to save a local record."));

      setComposerFeedback({
        tone: failures.length > 0 ? "warning" : "success",
        title: failures.length > 0 ? "Saved with issues" : "Record saved",
        description:
          failures.length > 0
            ? `${successes} record${successes === 1 ? "" : "s"} saved. ${failures.join(" ")}`
            : `Saved ${successes} social post record${successes === 1 ? "" : "s"} for manual follow-up.`,
      });
      resetComposer();
    },
    onError: (error) => {
      setComposerFeedback({
        tone: "error",
        title: "Save failed",
        description: getErrorMessage(error, "The social post record could not be created."),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (post: SocialMediaPostDetail) =>
      auth.authenticatedJson<SocialMediaPostDetail>(`/api/admin/social-media/posts/${post.postId}`, {
        method: "PUT",
        body: {
          platform: post.platform,
          createdAt: post.createdAt,
          postType: post.postType,
          mediaType: post.mediaType,
          caption: post.caption,
          hashtags: post.hashtags,
          mentionsCount: post.mentionsCount,
          hasCallToAction: post.hasCallToAction,
          callToActionType: post.callToActionType,
          callToActionUrl: post.callToActionUrl,
          contentTopic: post.contentTopic,
          sentimentTone: post.sentimentTone,
          featuresResidentStory: post.featuresResidentStory,
          campaignName: post.campaignName,
          isBoosted: post.isBoosted,
          boostBudgetPhp: post.boostBudgetPhp,
          followerCountAtPost: post.followerCountAtPost,
          platformPostId: post.platformPostId,
          postUrl: post.postUrl,
          altText: post.altText,
          mediaUrls: post.mediaUrls,
          impressions: post.impressions,
          reach: post.reach,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          saves: post.saves,
          clickThroughs: post.clickThroughs,
          videoViews: post.videoViews,
          engagementRate: post.engagementRate,
          profileVisits: post.profileVisits,
          donationReferrals: post.donationReferrals,
          estimatedDonationValuePhp: post.estimatedDonationValuePhp,
          watchTimeSeconds: post.watchTimeSeconds,
          avgViewDurationSeconds: post.avgViewDurationSeconds,
          subscriberCountAtPost: post.subscriberCountAtPost,
          forwards: post.forwards,
          predictedDonationValuePhp: post.predictedDonationValuePhp,
          predictionModelVersion: post.predictionModelVersion,
          predictionScoredAtUtc: post.predictionScoredAtUtc,
        },
      }),
    onSuccess: async (post) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-social-media-posts"] });
      setEditingPost(post);
      setComposerFeedback({
        tone: "success",
        title: "Metrics updated",
        description: "The post record was updated successfully.",
      });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      setComposerFeedback({
        tone: "error",
        title: "Update failed",
        description: getErrorMessage(error, "The post record could not be updated."),
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (post: SocialMediaPostDetail) =>
      auth.authenticatedJson<SocialMediaPostDetail>("/api/admin/social-media/posts", {
        method: "POST",
        body: {
          platform: post.platform,
          createdAt: post.createdAt,
          postType: post.postType,
          mediaType: post.mediaType,
          caption: post.caption,
          mentionsCount: post.mentionsCount,
          hasCallToAction: post.hasCallToAction,
          callToActionType: post.callToActionType,
          callToActionUrl: post.callToActionUrl,
          contentTopic: post.contentTopic,
          sentimentTone: post.sentimentTone,
          featuresResidentStory: post.featuresResidentStory,
          campaignName: post.campaignName,
          isBoosted: post.isBoosted,
          boostBudgetPhp: post.boostBudgetPhp,
          followerCountAtPost: post.followerCountAtPost,
          platformPostId: post.platformPostId,
          postUrl: post.postUrl,
          altText: post.altText,
          mediaUrls: post.mediaUrls,
          impressions: post.impressions,
          reach: post.reach,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          saves: post.saves,
          clickThroughs: post.clickThroughs,
          videoViews: post.videoViews,
          engagementRate: post.engagementRate,
          profileVisits: post.profileVisits,
          donationReferrals: post.donationReferrals,
          estimatedDonationValuePhp: post.estimatedDonationValuePhp,
          watchTimeSeconds: post.watchTimeSeconds,
          avgViewDurationSeconds: post.avgViewDurationSeconds,
          subscriberCountAtPost: post.subscriberCountAtPost,
          forwards: post.forwards,
          predictedDonationValuePhp: post.predictedDonationValuePhp,
          predictionModelVersion: post.predictionModelVersion,
          predictionScoredAtUtc: post.predictionScoredAtUtc,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-social-media-posts"] });
      setComposerFeedback({
        tone: "success",
        title: "Record created",
        description: "The manual post record was created successfully.",
      });
      setCreateDialogOpen(false);
      setNewPost(null);
    },
    onError: (error) => {
      setComposerFeedback({
        tone: "error",
        title: "Create failed",
        description: getErrorMessage(error, "The post record could not be created."),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: number) =>
      auth.authenticatedJson<void>(`/api/admin/social-media/posts/${postId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-social-media-posts"] });
      setComposerFeedback({
        tone: "success",
        title: "Record deleted",
        description: "The post was removed from the social media library.",
      });
      setEditDialogOpen(false);
      setEditingPost(null);
    },
    onError: (error) => {
      setComposerFeedback({
        tone: "error",
        title: "Delete failed",
        description: getErrorMessage(error, "The post record could not be deleted."),
      });
    },
  });

  const posts = postsQuery.data?.posts ?? [];
  const filterOptions = postsQuery.data?.filterOptions;

  const updateWizard = <K extends keyof WizardFormState>(key: K, value: WizardFormState[K]) => {
    setWizard((current) => ({ ...current, [key]: value }));
  };

  const togglePlatform = (platform: string) => {
    setWizard((current) => ({
      ...current,
      platforms: current.platforms.includes(platform)
        ? current.platforms.filter((candidate) => candidate !== platform)
        : [...current.platforms, platform],
    }));
  };

  const moveStep = (direction: 1 | -1) => {
    setWizardStepIndex((current) => Math.min(Math.max(current + direction, 0), wizardSteps.length - 1));
  };

  const openEditDialog = async (postId: number) => {
    setEditLoadPending(true);
    setComposerFeedback(null);

    try {
      const detail = await auth.authenticatedJson<SocialMediaPostDetail>(`/api/admin/social-media/posts/${postId}`);
      setEditingPost(detail);
      setEditDialogOpen(true);
    } catch (error) {
      setComposerFeedback({
        tone: "error",
        title: "Could not load post",
        description: getErrorMessage(error, "The selected post could not be loaded."),
      });
    } finally {
      setEditLoadPending(false);
    }
  };

  const openCreateDialog = () => {
    setNewPost(createDefaultNewPost());
    setCreateDialogOpen(true);
    setComposerFeedback(null);
  };

  const resetComposer = () => {
    setWizard(createDefaultWizardForm());
    setWizardStepIndex(0);
    setUploadedAssets([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <AdminWorkspace items={navigationItems} signOutPending={signOutPending} onSignOut={handleLogout}>
      <div className="space-y-6">
        {composerFeedback ? (
          <Card
            className={cn(
              "rounded-none border shadow-none relative",
              composerFeedback.tone === "success" && "border-primary/30 bg-primary/5",
              composerFeedback.tone === "warning" && "border-amber-500/30 bg-amber-500/10",
              composerFeedback.tone === "error" && "border-destructive/30 bg-destructive/10",
            )}
          >
            <CardContent className="flex items-start gap-3 p-4">
              {composerFeedback.tone === "error" ? (
                <CircleAlert className="mt-0.5 h-5 w-5 text-destructive" />
              ) : composerFeedback.tone === "warning" ? (
                <Sparkles className="mt-0.5 h-5 w-5 text-amber-600" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
              )}
              <div className="space-y-1 flex-1">
                <div className="font-medium text-foreground">{composerFeedback.title}</div>
                <div className="text-sm text-muted-foreground">{composerFeedback.description}</div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 -mt-1 -mr-1"
                onClick={() => setComposerFeedback(null)}
                aria-label={socialT("actions.dismiss")}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {isComposerMode ? (
          <div className="space-y-6 relative">
            {publishMutation.isPending && (
              <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm transition-all animate-in fade-in">
                <div className="flex flex-col items-center gap-4 text-center p-8 bg-card border border-border shadow-2xl">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="space-y-1">
                    <p className="text-xl font-semibold tracking-tight">Distributing Content</p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Publishing to social media platforms, this may take a minute...
                    </p>
                  </div>
                </div>
              </div>
            )}
          <Card className="rounded-none border border-border bg-card shadow-none">
            <CardHeader className="space-y-4 border-b border-border">
              <div className="flex items-center justify-between gap-6">
                <div className="flex flex-1 items-center gap-3">
                  <Megaphone className="h-5 w-5 text-primary" />
                  <div className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground">
                    Post Strategy: Step {wizardStepIndex + 1} of {wizardSteps.length}
                  </div>
                </div>
                <div className="hidden w-full max-w-xs md:block md:max-w-md">
                  <Progress value={((wizardStepIndex + 1) / wizardSteps.length) * 100} className="h-1.5 rounded-none" />
                </div>
                <div className="flex items-center gap-3">
                  <Button asChild variant="ghost" size="sm" className="rounded-none">
                    <Link to={socialMediaPath}>
                      <X className="mr-2 h-4 w-4" />
                      Exit Builder
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="md:hidden">
                <Progress value={((wizardStepIndex + 1) / wizardSteps.length) * 100} className="h-1.5 rounded-none" />
              </div>
            </CardHeader>

            <CardContent className="min-h-[400px] p-8">
              {wizardStepIndex === 0 ? (
                <div className="mx-auto max-w-2xl space-y-8">
                  <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-semibold tracking-tight">Select Publishing Platforms</h2>
                    <p className="text-sm text-muted-foreground">Where should this impact story live?</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {platformOptions.map((platform) => {
                      const Icon = platform.icon;
                      const selected = wizard.platforms.includes(platform.id);

                      return (
                        <button
                          key={platform.id}
                          type="button"
                          className={cn(
                            "group relative overflow-hidden border p-6 text-left transition-all",
                            selected ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-background hover:border-primary/50",
                          )}
                          onClick={() => togglePlatform(platform.id)}
                        >
                          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-100", platform.accent)} />
                          <div className="relative space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Icon className="h-6 w-6 text-foreground" />
                                <span className="font-semibold text-foreground">{platform.label}</span>
                              </div>
                              {selected ? <CheckCircle2 className="h-5 w-5 text-primary" /> : null}
                            </div>
                            <p className="text-sm text-muted-foreground">{platform.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-center pt-4">
                    <Button
                      size="lg"
                      className="min-w-40 rounded-none"
                      disabled={wizard.platforms.length === 0}
                      onClick={() => moveStep(1)}
                    >
                      Continue to Format
                    </Button>
                  </div>
                </div>
              ) : null}

              {wizardStepIndex === 1 ? (
                <div className="mx-auto max-w-2xl space-y-8">
                  <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-semibold tracking-tight">What is the focus of this post?</h2>
                    <p className="text-sm text-muted-foreground">Select the format that best fits your story.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {postTypeOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          "border p-6 text-left transition-all hover:border-primary",
                          wizard.postType === option ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-background",
                        )}
                        onClick={() => {
                          updateWizard("postType", option);
                          moveStep(1);
                        }}
                      >
                        <div className="font-semibold text-foreground">{humanizeValue(option)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {option === "ImpactStory" ? "Best for long-term donor engagement." : "Drive immediate action and support."}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Button variant="ghost" onClick={() => moveStep(-1)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  </div>
                </div>
              ) : null}

              {wizardStepIndex === 2 ? (
                <div className="mx-auto max-w-2xl space-y-8">
                  <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-semibold tracking-tight">Choose a Content Topic</h2>
                    <p className="text-sm text-muted-foreground">Categorize the story for better reporting.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {contentTopicOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          "border p-6 text-left transition-all hover:border-primary",
                          wizard.contentTopic === option ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-background",
                        )}
                        onClick={() => {
                          updateWizard("contentTopic", option);
                          moveStep(1);
                        }}
                      >
                        <div className="font-semibold text-foreground">{humanizeValue(option)}</div>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Button variant="ghost" onClick={() => moveStep(-1)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  </div>
                </div>
              ) : null}

              {wizardStepIndex === 3 ? (
                <div className="mx-auto max-w-2xl space-y-8">
                  <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-semibold tracking-tight">Set the Emotional Tone</h2>
                    <p className="text-sm text-muted-foreground">How should the audience feel when reading this?</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sentimentToneOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          "border p-6 text-left transition-all hover:border-primary",
                          wizard.sentimentTone === option ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-background",
                        )}
                        onClick={() => {
                          updateWizard("sentimentTone", option);
                          moveStep(1);
                        }}
                      >
                        <div className="font-semibold text-foreground">{humanizeValue(option)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {["Urgent", "Emotional", "Celebratory"].includes(option)
                            ? "This tone historically performs 2.4x better for donations."
                            : "Standard informative format."}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Button variant="ghost" onClick={() => moveStep(-1)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  </div>
                </div>
              ) : null}

              {wizardStepIndex === 4 ? (
                <div className="mx-auto max-w-3xl space-y-8">
                  <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-semibold tracking-tight">Upload Media</h2>
                    <p className="text-sm text-muted-foreground">Images will be converted to JPG and videos to MP4. Media is optional.</p>
                  </div>

                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-border p-12 transition-colors hover:border-primary/50">
                    <input
                      ref={fileInputRef}
                      hidden
                      multiple
                      accept="image/*,video/*"
                      type="file"
                      onChange={(event) => {
                        const files = event.target.files;
                        if (files && files.length > 0) {
                          uploadAssetsMutation.mutate(files);
                        }
                      }}
                    />
                    <CloudUpload className="mb-4 h-12 w-12 text-muted-foreground" />
                    <Button
                      size="lg"
                      type="button"
                      className="rounded-none"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadAssetsMutation.isPending}
                    >
                      {uploadAssetsMutation.isPending ? "Processing Assets..." : "Select Photos or Videos"}
                    </Button>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Max 10 files. Reorder or delete assets below.
                    </p>
                  </div>

                  {uploadedAssets.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {uploadedAssets.map((asset, index) => (
                        <div key={asset.assetId} className="group relative border border-border bg-card p-2">
                          <div className="aspect-square w-full overflow-hidden bg-muted">
                            {asset.contentType.startsWith("video/") ? (
                              <div className="flex h-full items-center justify-center">
                                <Rocket className="h-8 w-8 text-muted-foreground" />
                              </div>
                            ) : (
                              <img src={asset.liveUrl} alt={asset.fileName} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-1">
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => moveAsset(index, "up")}
                                disabled={index === 0}
                                aria-label={socialT("actions.moveUp")}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => moveAsset(index, "down")}
                                disabled={index === uploadedAssets.length - 1}
                                aria-label={socialT("actions.moveDown")}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => deleteAssetMutation.mutate(asset.assetId)}
                              disabled={deleteAssetMutation.isPending}
                              aria-label={socialT("actions.removeAsset")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No media attached. You can continue with a text-only post.
                    </div>
                  )}

                  <div className="flex justify-center pt-4">
                    <Button
                      size="lg"
                      variant="outline"
                      className="min-w-40 rounded-none mr-3"
                      onClick={() => moveStep(-1)}
                    >
                      Back
                    </Button>
                    <Button
                      size="lg"
                      className="min-w-40 rounded-none"
                      onClick={() => moveStep(1)}
                    >
                      Continue to Caption
                    </Button>
                  </div>
                </div>
              ) : null}

              {wizardStepIndex === 5 ? (
                <div className="mx-auto max-w-3xl space-y-8">
                  <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-semibold tracking-tight">Draft Your Story</h2>
                    <p className="text-sm text-muted-foreground">
                      Write your <strong>{humanizeValue(wizard.sentimentTone)} {humanizeValue(wizard.postType)}</strong> about <strong>{humanizeValue(wizard.contentTopic)}</strong> below.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base">Caption & Strategy</Label>
                    <Textarea
                      className="min-h-48 rounded-none text-base p-4"
                      placeholder="Share the impact... #HopeShelter @partner"
                      value={wizard.caption}
                      onChange={(event) => updateWizard("caption", event.target.value)}
                    />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                      <div className={cn("border p-3 text-center transition-colors", captionLength >= 160 && captionLength <= 219 ? "border-primary bg-primary/5" : "border-border bg-muted/20")}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Length</div>
                        <div className={cn("text-lg font-bold", captionLength >= 160 && captionLength <= 219 ? "text-primary" : "text-foreground")}>{captionLength}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">Ideal: 160-219</div>
                      </div>
                      <div className={cn("border p-3 text-center transition-colors", hashtagCount >= 5 && hashtagCount <= 8 ? "border-primary bg-primary/5" : "border-border bg-muted/20")}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hashtags</div>
                        <div className={cn("text-lg font-bold", hashtagCount >= 5 && hashtagCount <= 8 ? "text-primary" : "text-foreground")}>{hashtagCount}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">Ideal: 5-8</div>
                      </div>
                      <div className={cn("border p-3 text-center transition-colors", mentionsCount >= 1 && mentionsCount <= 2 ? "border-primary bg-primary/5" : "border-border bg-muted/20")}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mentions</div>
                        <div className={cn("text-lg font-bold", mentionsCount >= 1 && mentionsCount <= 2 ? "text-primary" : "text-foreground")}>{mentionsCount}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">Ideal: 1-2</div>
                      </div>
                      <div className={cn("border p-3 text-center transition-colors", hasCallToAction ? "border-primary bg-primary/5" : "border-border bg-muted/20")}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CTA</div>
                        <div className={cn("text-lg font-bold", hasCallToAction ? "text-primary" : "text-foreground")}>
                          {hasCallToAction ? "Present" : "None"}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">Ideal: Always</div>
                      </div>
                    </div>

                    <div className="rounded-none border border-border bg-muted/40 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <CalendarClock className="h-4 w-4 text-primary" />
                        Ideal Timing Note
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Based on current signal data, publishing between <strong>9:00 AM - 11:00 AM</strong> or <strong>5:00 PM - 8:00 PM</strong> delivers the highest donation engagement.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button
                      size="lg"
                      variant="outline"
                      className="min-w-40 rounded-none mr-3"
                      onClick={() => moveStep(-1)}
                    >
                      Back
                    </Button>
                    <Button
                      size="lg"
                      className="min-w-40 rounded-none"
                      disabled={!wizard.caption.trim()}
                      onClick={() => moveStep(1)}
                    >
                      Review & Publish
                    </Button>
                  </div>
                </div>
              ) : null}

              {wizardStepIndex === 6 ? (
                <div className="mx-auto max-w-4xl space-y-8">
                  <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-semibold tracking-tight">Final Review</h2>
                    <p className="text-sm text-muted-foreground">Verify the details and run the donation projection.</p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-5">
                      <Card className="rounded-none border border-border bg-background shadow-none">
                        <CardHeader className="border-b border-border bg-muted/10">
                          <CardTitle className="text-lg">Draft Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="text-xs font-bold uppercase text-muted-foreground">Platforms</div>
                              <div className="font-medium">{wizard.platforms.join(", ")}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-bold uppercase text-muted-foreground">
                                {socialT("summary.format")}
                              </div>
                              <div className="font-medium">{humanizeValue(wizard.postType)} / {humanizeValue(wizard.mediaType)}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-bold uppercase text-muted-foreground">
                                {socialT("summary.topic")}
                              </div>
                              <div className="font-medium">{humanizeValue(wizard.contentTopic)}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-bold uppercase text-muted-foreground">
                                {socialT("summary.tone")}
                              </div>
                              <div className="font-medium">{humanizeValue(wizard.sentimentTone)}</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-xs font-bold uppercase text-muted-foreground">
                              {socialT("summary.captionPreview")}
                            </div>
                            <div className="rounded-none border border-border bg-muted/20 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                              {wizard.caption}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Button
                              type="button"
                              className="rounded-none"
                              onClick={() => predictionMutation.mutate()}
                              disabled={predictionMutation.isPending}
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              {predictionMutation.isPending
                                ? socialT("actions.scoring")
                                : socialT("actions.refreshProjection")}
                            </Button>
                            <Button
                              type="button"
                              className="rounded-none"
                              onClick={() => publishMutation.mutate()}
                              disabled={publishMutation.isPending || wizard.platforms.length === 0}
                            >
                              {publishMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Rocket className="mr-2 h-4 w-4" />
                              )}
                              {publishMutation.isPending
                                ? socialT("actions.publishing")
                                : socialT("actions.publishNow")}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-none"
                              onClick={() => recordMutation.mutate()}
                              disabled={recordMutation.isPending || wizard.platforms.length === 0}
                            >
                              <ClipboardList className="mr-2 h-4 w-4" />
                              {recordMutation.isPending
                                ? socialT("actions.saving")
                                : socialT("actions.saveRecordOnly")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-5">
                      <Card className="rounded-none border border-border bg-background shadow-none">
                        <CardHeader className="border-b border-border bg-muted/10">
                          <CardTitle className="text-lg">
                            {socialT("projection.title")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          {predictionMutation.data ? (
                            <div className="space-y-2 text-center">
                              <div className="text-4xl font-black tracking-tighter text-primary">
                                {formatCurrency(predictionMutation.data.predictedDonationPhp)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {socialT("projection.caption")}
                              </div>
                            </div>
                          ) : (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              {socialT("projection.empty")}
                            </div>
                          )}
                          
                          <div className="pt-4 space-y-3">
                            {strategyChecks.map((check) => (
                              <div key={check.label} className="flex items-start gap-3 text-xs">
                                {check.isStrong ? (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                                ) : (
                                  <CircleAlert className="h-4 w-4 shrink-0 text-amber-600" />
                                )}
                                <span>{check.label}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button
                      size="lg"
                      variant="outline"
                      className="min-w-40 rounded-none mr-3"
                      onClick={() => moveStep(-1)}
                    >
                      {socialT("actions.back")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {!isComposerMode ? (
        <Card className="rounded-none border border-border bg-card shadow-none">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-xl">{socialT("library.title")}</CardTitle>
                <CardDescription>
                  {socialT("library.subtitle")}
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <Button asChild className="rounded-none">
                  <Link to={socialMediaComposerPath}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {socialT("library.interactiveBuilder")}
                  </Link>
                </Button>
                <Button variant="outline" className="rounded-none" onClick={openCreateDialog}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  {socialT("library.recordOtherPost")}
                </Button>
                <Button type="button" variant="outline" className="rounded-none" onClick={() => void postsQuery.refetch()}>
                  {socialT("actions.refresh")}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.35fr_0.8fr_0.8fr_0.8fr_0.5fr]">
              <Input
                className="rounded-none"
                placeholder={socialT("filters.searchPlaceholder")}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
              />
              <Select
                value={platformFilter}
                onValueChange={(value) => {
                  setPlatformFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder={socialT("filters.platform")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{socialT("filters.allPlatforms")}</SelectItem>
                  {filterOptions?.platforms.map((option) => (
                    <SelectItem key={option} value={option}>
                      {humanizeValue(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={mediaTypeFilter}
                onValueChange={(value) => {
                  setMediaTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder={socialT("filters.mediaType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{socialT("filters.allMedia")}</SelectItem>
                  {filterOptions?.mediaTypes.map((option) => (
                    <SelectItem key={option} value={option}>
                      {humanizeValue(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder={socialT("filters.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{socialT("filters.allStatuses")}</SelectItem>
                  {filterOptions?.publishStatuses.map((option) => (
                    <SelectItem key={option} value={option}>
                      {humanizeValue(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={pageSize}
                onValueChange={(value) => {
                  setPageSize(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["8", "12", "24"].map((option) => (
                    <SelectItem key={option} value={option}>
                      {socialT("filters.perPage", { count: option })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {postsQuery.isLoading ? (
              <div className="grid gap-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse bg-muted" />
                ))}
              </div>
            ) : postsQuery.isError ? (
              <div className="flex items-start gap-3 rounded-none border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <CircleAlert className="mt-0.5 h-5 w-5" />
                <div>
                  {getErrorMessage(postsQuery.error, socialT("library.loadError"))}
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{socialT("table.posted")}</TableHead>
                        <TableHead>{socialT("table.platform")}</TableHead>
                        <TableHead>{socialT("table.format")}</TableHead>
                        <TableHead>{socialT("table.campaign")}</TableHead>
                        <TableHead>{socialT("table.reach")}</TableHead>
                        <TableHead>{socialT("table.donationValue")}</TableHead>
                        <TableHead>{socialT("table.status")}</TableHead>
                        <TableHead className="text-right">{socialT("table.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                            {socialT("library.empty")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        posts.map((post) => (
                          <TableRow key={post.postId}>
                            <TableCell>
                              <div className="font-medium text-foreground">{formatDateTime(post.createdAt)}</div>
                              <div className="text-xs text-muted-foreground">{humanizeValue(post.contentTopic)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-foreground">{post.platform}</div>
                              <div className="text-xs text-muted-foreground">
                                {post.platformPostId ?? socialT("table.localRecord")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-foreground">{humanizeValue(post.mediaType)}</div>
                              <div className="text-xs text-muted-foreground">{humanizeValue(post.postType)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate font-medium text-foreground">
                                {post.campaignName || post.caption}
                              </div>
                              <div className="text-xs text-muted-foreground">{humanizeValue(post.sentimentTone)}</div>
                            </TableCell>
                            <TableCell>{compactNumberFormatter.format(post.reach)}</TableCell>
                            <TableCell>
                              <div className="font-medium text-foreground">
                                {formatCurrency(post.estimatedDonationValuePhp)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Predicted {formatCurrency(post.predictedDonationValuePhp)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "rounded-none border-0",
                                  post.publishStatus === "Published"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {humanizeValue(post.publishStatus)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {post.postUrl ? (
                                  <Button asChild size="icon" variant="outline" className="rounded-none">
                                    <a
                                      href={post.postUrl}
                                      rel="noreferrer"
                                      target="_blank"
                                      aria-label={socialT("actions.openPost")}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                ) : null}
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="rounded-none"
                                  onClick={() => void openEditDialog(post.postId)}
                                  disabled={editLoadPending}
                                  aria-label={socialT("actions.editPost")}
                                >
                                  <PencilLine className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing page {postsQuery.data?.page ?? 1} of {postsQuery.data?.totalPages ?? 1} with{" "}
                    {postsQuery.data?.totalCount ?? 0} total posts.
                  </div>
                  <Pagination className="mx-0 w-auto justify-end">
                    <PaginationContent>
                      <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage((page) => Math.max(page - 1, 1));
                        }}
                        className={cn(
                          (postsQuery.data?.page ?? 1) === 1 ? "pointer-events-none opacity-50" : "",
                        )}
                        aria-label={socialT("pagination.previous")}
                      />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="px-3 text-sm text-muted-foreground">
                          Page {postsQuery.data?.page ?? 1} / {postsQuery.data?.totalPages ?? 1}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage((page) =>
                            Math.min(page + 1, postsQuery.data?.totalPages ?? page + 1),
                          );
                        }}
                        className={cn(
                          (postsQuery.data?.page ?? 1) >= (postsQuery.data?.totalPages ?? 1)
                            ? "pointer-events-none opacity-50"
                            : "",
                        )}
                        aria-label={socialT("pagination.next")}
                      />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        ) : null}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-none border-border bg-card">
          <DialogHeader>
            <DialogTitle>Edit Social Post Record</DialogTitle>
          </DialogHeader>

          {editingPost ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    value={editingPost.platform}
                    onValueChange={(value) => setEditingPost((current) => (current ? { ...current, platform: value } : current))}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {manualPlatformOptions.map((platform) => (
                        <SelectItem key={platform} value={platform}>
                          {platform}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Created at</Label>
                  <Input
                    type="datetime-local"
                    className="rounded-none"
                    value={toLocalDateTimeInput(editingPost.createdAt)}
                    onChange={(event) =>
                      setEditingPost((current) =>
                        current ? { ...current, createdAt: fromLocalDateTimeInput(event.target.value) } : current,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Campaign</Label>
                  <Input
                    className="rounded-none"
                    value={editingPost.campaignName ?? ""}
                    onChange={(event) =>
                      setEditingPost((current) =>
                        current ? { ...current, campaignName: event.target.value || null } : current,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Caption</Label>
                  <Textarea
                    className="min-h-36 rounded-none"
                    value={editingPost.caption}
                    onChange={(event) =>
                      setEditingPost((current) => (current ? { ...current, caption: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hashtags</Label>
                    <Textarea
                      className="min-h-24 rounded-none"
                      value={editingPost.hashtags ?? ""}
                      onChange={(event) =>
                        setEditingPost((current) =>
                          current ? { ...current, hashtags: event.target.value || null } : current,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Media URLs</Label>
                    <Textarea
                      className="min-h-24 rounded-none"
                      value={editingPost.mediaUrls.join("\n")}
                      onChange={(event) =>
                        setEditingPost((current) =>
                          current ? { ...current, mediaUrls: parseMediaUrls(event.target.value) } : current,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alt text</Label>
                    <Textarea
                      className="min-h-20 rounded-none"
                      value={editingPost.altText ?? ""}
                      onChange={(event) =>
                        setEditingPost((current) =>
                          current ? { ...current, altText: event.target.value || null } : current,
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Platform post id</Label>
                  <Input
                    className="rounded-none"
                    value={editingPost.platformPostId ?? ""}
                    onChange={(event) =>
                      setEditingPost((current) =>
                        current ? { ...current, platformPostId: event.target.value || null } : current,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Post URL</Label>
                  <Input
                    className="rounded-none"
                    value={editingPost.postUrl ?? ""}
                    onChange={(event) =>
                      setEditingPost((current) =>
                        current ? { ...current, postUrl: event.target.value || null } : current,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Follower count</Label>
                  <Input
                    type="number"
                    min={0}
                    className="rounded-none"
                    value={editingPost.followerCountAtPost}
                    onChange={(event) =>
                      setEditingPost((current) =>
                        current ? { ...current, followerCountAtPost: parsePositiveNumber(event.target.value) } : current,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Donation value (PHP)</Label>
                  <Input
                    type="number"
                    min={0}
                    className="rounded-none"
                    value={editingPost.estimatedDonationValuePhp}
                    onChange={(event) =>
                      setEditingPost((current) =>
                        current ? { ...current, estimatedDonationValuePhp: parsePositiveNumber(event.target.value) } : current,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {[
                  ["Impressions", "impressions"],
                  ["Reach", "reach"],
                  ["Likes", "likes"],
                  ["Comments", "comments"],
                  ["Shares", "shares"],
                  ["Saves", "saves"],
                  ["Click throughs", "clickThroughs"],
                  ["Profile visits", "profileVisits"],
                  ["Donation referrals", "donationReferrals"],
                ].map(([label, key]) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <Input
                      type="number"
                      min={0}
                      className="rounded-none"
                      value={String(editingPost[key as keyof SocialMediaPostDetail] ?? 0)}
                      onChange={(event) =>
                        setEditingPost((current) =>
                          current
                            ? {
                                ...current,
                                [key]: parsePositiveNumber(event.target.value),
                              }
                            : current,
                        )
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div className="text-sm text-muted-foreground">
                  Last metrics update: {formatDateTime(editingPost.lastMetricsUpdatedAtUtc)}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-none text-destructive"
                    onClick={() => {
                      if (window.confirm("Delete this social post record?")) {
                        deleteMutation.mutate(editingPost.postId);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  {editingPost.postUrl ? (
                    <Button asChild type="button" variant="outline" className="rounded-none">
                      <a
                        href={editingPost.postUrl}
                        rel="noreferrer"
                        target="_blank"
                        aria-label={socialT("actions.openPost")}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Open live post
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    className="rounded-none"
                    onClick={() => updateMutation.mutate(editingPost)}
                    disabled={updateMutation.isPending}
                  >
                    <PencilLine className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Select a post to edit.</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-none border-border bg-card">
          <DialogHeader>
            <DialogTitle>Create Social Post Record</DialogTitle>
          </DialogHeader>

          {newPost ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    value={newPost.platform}
                    onValueChange={(value) => setNewPost((current) => (current ? { ...current, platform: value } : current))}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {manualPlatformOptions.map((platform) => (
                        <SelectItem key={platform} value={platform}>
                          {platform}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Created at</Label>
                  <Input
                    type="datetime-local"
                    className="rounded-none"
                    value={toLocalDateTimeInput(newPost.createdAt)}
                    onChange={(event) =>
                      setNewPost((current) =>
                        current ? { ...current, createdAt: fromLocalDateTimeInput(event.target.value) } : current,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Campaign</Label>
                  <Input
                    className="rounded-none"
                    placeholder="Optional campaign name"
                    value={newPost.campaignName ?? ""}
                    onChange={(event) =>
                      setNewPost((current) =>
                        current ? { ...current, campaignName: event.target.value || null } : current,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Caption</Label>
                  <Textarea
                    className="min-h-36 rounded-none"
                    placeholder="Enter the post caption here..."
                    value={newPost.caption}
                    onChange={(event) =>
                      setNewPost((current) => (current ? { ...current, caption: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Media URLs</Label>
                    <Textarea
                      className="min-h-24 rounded-none"
                      placeholder="One URL per line"
                      value={newPost.mediaUrls.join("\n")}
                      onChange={(event) =>
                        setNewPost((current) =>
                          current ? { ...current, mediaUrls: parseMediaUrls(event.target.value) } : current,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alt text</Label>
                    <Textarea
                      className="min-h-20 rounded-none"
                      placeholder="Accessibility description"
                      value={newPost.altText ?? ""}
                      onChange={(event) =>
                        setNewPost((current) =>
                          current ? { ...current, altText: event.target.value || null } : current,
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Platform post id</Label>
                  <Input
                    className="rounded-none"
                    placeholder="External ID"
                    value={newPost.platformPostId ?? ""}
                    onChange={(event) =>
                      setNewPost((current) =>
                        current ? { ...current, platformPostId: event.target.value || null } : current,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Post URL</Label>
                  <Input
                    className="rounded-none"
                    placeholder="https://..."
                    value={newPost.postUrl ?? ""}
                    onChange={(event) =>
                      setNewPost((current) =>
                        current ? { ...current, postUrl: event.target.value || null } : current,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Follower count</Label>
                  <Input
                    type="number"
                    min={0}
                    className="rounded-none"
                    value={newPost.followerCountAtPost}
                    onChange={(event) =>
                      setNewPost((current) =>
                        current ? { ...current, followerCountAtPost: parsePositiveNumber(event.target.value) } : current,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Donation value (PHP)</Label>
                  <Input
                    type="number"
                    min={0}
                    className="rounded-none"
                    value={newPost.estimatedDonationValuePhp}
                    onChange={(event) =>
                      setNewPost((current) =>
                        current ? { ...current, estimatedDonationValuePhp: parsePositiveNumber(event.target.value) } : current,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {[
                  ["Impressions", "impressions"],
                  ["Reach", "reach"],
                  ["Likes", "likes"],
                  ["Comments", "comments"],
                  ["Shares", "shares"],
                  ["Saves", "saves"],
                  ["Click throughs", "clickThroughs"],
                  ["Profile visits", "profileVisits"],
                  ["Donation referrals", "donationReferrals"],
                ].map(([label, key]) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <Input
                      type="number"
                      min={0}
                      className="rounded-none"
                      value={String(newPost[key as keyof SocialMediaPostDetail] ?? 0)}
                      onChange={(event) =>
                        setNewPost((current) =>
                          current
                            ? {
                                ...current,
                                [key]: parsePositiveNumber(event.target.value),
                              }
                            : current,
                        )
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-none"
                  onClick={() => createMutation.mutate(newPost)}
                  disabled={createMutation.isPending || !newPost.caption.trim()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createMutation.isPending ? "Creating..." : "Create Record"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminWorkspace>
  );
};

export default SocialMediaManager;
