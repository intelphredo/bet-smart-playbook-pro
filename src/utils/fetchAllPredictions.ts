/**
 * Paginated fetch utility for algorithm_predictions table.
 * Bypasses Supabase's default 1000-row limit by fetching in pages.
 */

import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 1000;

interface FetchAllPredictionsOptions {
  /** Filter: predicted_at >= startDate */
  startDate?: string;
  /** Filter: predicted_at <= endDate */
  endDate?: string;
  /** Filter: algorithm_id = algorithmId */
  algorithmId?: string;
  /** Filter: league = league */
  league?: string;
  /** Filter: status in statuses */
  statuses?: string[];
  /** Exclude null predictions */
  excludeNullPrediction?: boolean;
  /** Sort ascending (default: false = descending) */
  ascending?: boolean;
  /** Or filter string (e.g. for date range unions) */
  orFilter?: string;
}

export async function fetchAllPredictions(options: FetchAllPredictionsOptions = {}) {
  const {
    startDate,
    endDate,
    algorithmId,
    league,
    statuses,
    excludeNullPrediction = false,
    ascending = false,
    orFilter,
  } = options;

  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("algorithm_predictions")
      .select("*")
      .order("predicted_at", { ascending })
      .range(from, to);

    if (startDate && !orFilter) {
      query = query.gte("predicted_at", startDate);
    }
    if (endDate) {
      query = query.lte("predicted_at", endDate);
    }
    if (algorithmId) {
      query = query.eq("algorithm_id", algorithmId);
    }
    if (league && league !== "all") {
      query = query.eq("league", league);
    }
    if (statuses && statuses.length > 0) {
      query = query.in("status", statuses);
    }
    if (excludeNullPrediction) {
      query = query.not("prediction", "is", null);
    }
    if (orFilter) {
      query = query.or(orFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching predictions page:", error);
      throw error;
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
      hasMore = data.length === PAGE_SIZE;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allData;
}
