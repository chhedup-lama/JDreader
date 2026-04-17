import { NextResponse } from "next/server";

export async function GET() {
  const adminKey = process.env.ANTHROPIC_ADMIN_API_KEY;

  if (!adminKey) {
    return NextResponse.json({ available: false });
  }

  // Fetch last 30 days of cost data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  const fmt = (d: Date) => d.toISOString().split(".")[0] + "Z";

  try {
    const [costRes, usageRes] = await Promise.all([
      fetch(
        `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${fmt(startDate)}&ending_at=${fmt(endDate)}&bucket_width=1d`,
        {
          headers: {
            "anthropic-version": "2023-06-01",
            "x-api-key": adminKey,
          },
        }
      ),
      fetch(
        `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${fmt(startDate)}&ending_at=${fmt(endDate)}&bucket_width=1d`,
        {
          headers: {
            "anthropic-version": "2023-06-01",
            "x-api-key": adminKey,
          },
        }
      ),
    ]);

    if (!costRes.ok || !usageRes.ok) {
      return NextResponse.json({ available: false, error: "Admin API request failed" });
    }

    const costData = await costRes.json();
    const usageData = await usageRes.json();

    // Sum total cost in cents
    const totalCostCents: number = (costData.data ?? []).reduce(
      (sum: number, bucket: { cost: string }) => sum + parseFloat(bucket.cost ?? "0"),
      0
    );

    // Sum total tokens
    let inputTokens = 0;
    let outputTokens = 0;
    for (const bucket of usageData.data ?? []) {
      inputTokens += (bucket.input_tokens ?? 0) + (bucket.cache_read_input_tokens ?? 0);
      outputTokens += bucket.output_tokens ?? 0;
    }

    return NextResponse.json({
      available: true,
      costUsd: (totalCostCents / 100).toFixed(2),
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      periodDays: 30,
    });
  } catch {
    return NextResponse.json({ available: false, error: "Failed to fetch usage data" });
  }
}
