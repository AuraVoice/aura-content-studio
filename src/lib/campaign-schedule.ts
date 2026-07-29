export const DAILY_CAMPAIGN_START_DATE = "2026-07-29";
export const DAILY_CAMPAIGN_END_DATE = "2026-08-27";

export type CampaignScheduleStatus =
  | "active"
  | "before_campaign_window"
  | "after_campaign_window";

export function campaignScheduleStatus(date: string): CampaignScheduleStatus {
  if (date < DAILY_CAMPAIGN_START_DATE) return "before_campaign_window";
  if (date > DAILY_CAMPAIGN_END_DATE) return "after_campaign_window";
  return "active";
}
