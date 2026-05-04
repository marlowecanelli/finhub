import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: Math.abs(n) >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(n);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mode = (sp.get("mode") ?? "time-machine") as "time-machine" | "stress-test";
  const ticker = sp.get("ticker") ?? "AAPL";
  const date = sp.get("date") ?? "";
  const amount = Number(sp.get("amount") ?? 1000);
  const finalValue = Number(sp.get("final") ?? 0);
  const returnPct = Number(sp.get("ret") ?? 0);
  const scenario = sp.get("scenario") ?? "";
  const drawdown = Number(sp.get("dd") ?? 0);

  const isGain = mode === "time-machine";
  const accent = isGain ? "#c8a85a" : "#a8324a";
  const accentBg = isGain
    ? "linear-gradient(135deg, rgba(200,168,90,0.18) 0%, rgba(122,154,74,0.04) 70%)"
    : "linear-gradient(135deg, rgba(168,50,74,0.22) 0%, rgba(122,31,48,0.04) 70%)";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#080a10",
          backgroundImage: accentBg,
          padding: 64,
          color: "white",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: accent,
              fontWeight: 500,
            }}
          >
            FinHub · Hindsight
          </div>
          <div
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {isGain ? "Time Machine" : "Stress Test"}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            marginTop: 48,
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          {isGain ? (
            <>
              <div
                style={{
                  fontSize: 28,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                ${amount.toLocaleString()} in {ticker} on {date}
              </div>
              <div
                style={{
                  fontSize: 28,
                  marginTop: 4,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                would be worth
              </div>
              <div
                style={{
                  marginTop: 24,
                  fontSize: 180,
                  lineHeight: 1,
                  fontWeight: 400,
                  color: accent,
                  fontFamily: "Fraunces, serif",
                }}
              >
                ${fmt(finalValue)}
              </div>
              <div
                style={{
                  marginTop: 24,
                  fontSize: 36,
                  color: returnPct >= 0 ? "#9ec47a" : "#d76b80",
                  fontWeight: 500,
                }}
              >
                {returnPct >= 0 ? "+" : ""}
                {returnPct.toFixed(1)}% total return
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 28,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Your portfolio during the
              </div>
              <div
                style={{
                  marginTop: 16,
                  fontSize: 80,
                  fontFamily: "Fraunces, serif",
                  color: "white",
                  lineHeight: 1.05,
                }}
              >
                {scenario}
              </div>
              <div
                style={{
                  marginTop: 36,
                  fontSize: 28,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                Drawdown
              </div>
              <div
                style={{
                  fontSize: 200,
                  lineHeight: 1,
                  color: accent,
                  fontFamily: "Fraunces, serif",
                  marginTop: 8,
                }}
              >
                {drawdown.toFixed(1)}%
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 20,
          }}
        >
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>
            Past performance does not guarantee future results.
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            finhub.app/hindsight
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
