import axios from "axios";
import twilio from "twilio";
import { NextApiRequest, NextApiResponse } from "next";
import { TwilioWhatsAppWebhookBody } from "@/types";

const parseThousands = (number: number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default async function handler(
  req: NextApiRequest & { body: TwilioWhatsAppWebhookBody },
  res: NextApiResponse
) {
  try {
    // Validate request method
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const domain = req.body.Body?.toLowerCase().trim();
    if (!domain) {
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("Please provide a valid domain name");
      res.setHeader("Content-Type", "text/xml");
      return res.status(400).send(twiml.toString());
    }

    const response = await axios
      .post("https://webz.io/api/get_report", {
        domain,
      })
      .catch((error) => {
        throw new Error(`Failed to fetch report: ${error.message}`);
      });

    const customerReport = response.data.customerReport;
    const companyReport = response.data.companyReport;
    const riskScore = customerReport.riskScore;
    const lastExposureDate = customerReport.lastExposureDate;
    const timeFromLastExposure = customerReport.timeFromLastExposure;
    const mostRecentInfoStealers = customerReport.mostRecentInfoStealers;
    const totals = customerReport.totals;
    const leakCount = customerReport.leakCount;
    const stolenCookies = customerReport.stolenCookies;
    const mostRecentLocation = customerReport.mostRecentLocation;
    const companyRiskScore = companyReport.riskScore;
    const companyLeakCount = companyReport.leakCount;
    const companyStolenCookies = companyReport.stolenCookies;
    const companyMostRecentInfoStealers = companyReport.mostRecentInfoStealers;
    const companyTotals = companyReport.totals;
    const companyCompromisedFields = companyReport.compromisedFields;

    // Define interface for totals
    interface Total {
      interval: string;
      label: string;
      total: number;
      totalStealers?: number;
      totalLeaks?: number;
    }

    // Function to format ISO duration string to readable format
    const formatDuration = (duration: string) => {
      if (!duration) return "N/A";
      const matches = duration.match(
        /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)(?:\.\d+)?S)?/
      );
      if (!matches) return duration;

      const [_, years, months, days, hours, minutes, seconds] = matches;
      const parts = [];

      if (Number(years) > 0)
        parts.push(`${years} year${Number(years) !== 1 ? "s" : ""}`);
      if (Number(months) > 0)
        parts.push(`${months} month${Number(months) !== 1 ? "s" : ""}`);
      if (Number(days) > 0)
        parts.push(`${days} day${Number(days) !== 1 ? "s" : ""}`);
      if (Number(hours) > 0)
        parts.push(`${hours} hour${Number(hours) !== 1 ? "s" : ""}`);
      if (Number(minutes) > 0)
        parts.push(`${minutes} minute${Number(minutes) !== 1 ? "s" : ""}`);
      if (Number(seconds) > 0)
        parts.push(
          `${Math.floor(Number(seconds))} second${
            Math.floor(Number(seconds)) !== 1 ? "s" : ""
          }`
        );

      return parts.join(", ") || "just now";
    };

    const message = `*Domain Report for ${domain}*

📊 *Customer Report*
• Risk Score: ${riskScore}/5
• Last Exposure: ${
      lastExposureDate ? new Date(lastExposureDate).toLocaleDateString() : "N/A"
    }
• Time Since Exposure: ${formatDuration(timeFromLastExposure)}
• Recent Info Stealers: ${
      mostRecentInfoStealers?.length
        ? mostRecentInfoStealers.join(", ")
        : "None"
    }
• Total Leaks: ${parseThousands(leakCount || 0)}
• Cookies Stolen: ${stolenCookies ? "Yes ⚠️" : "No ✅"}
• Location: ${mostRecentLocation || "Unknown"}

📈 *Customer Totals*
${totals
  .map(
    (t: Total) =>
      `• ${t.label}: ${parseThousands(t.total)} leak${t.total !== 1 ? "s" : ""}`
  )
  .join("\n")}

🏢 *Company Report*
• Risk Score: ${companyRiskScore}/5
• Total Leaks: ${parseThousands(companyLeakCount || 0)}
• Cookies Stolen: ${companyStolenCookies ? "Yes ⚠️" : "No ✅"}
• Recent Info Stealers: ${
      companyMostRecentInfoStealers?.length
        ? companyMostRecentInfoStealers.join(", ")
        : "None"
    }

📊 *Company Totals*
${companyTotals
  .map(
    (t: Total) =>
      `• ${t.label}: ${parseThousands(t.total)} leak${t.total !== 1 ? "s" : ""}`
  )
  .join("\n")}`;

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(message);

    res.setHeader("Content-Type", "text/xml");
    return res.status(200).send(twiml.toString());
  } catch (error) {
    console.error("Error processing request:", error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(
      "Sorry, there was an error processing your request. Please try again later."
    );
    res.setHeader("Content-Type", "text/xml");
    return res.status(500).send(twiml.toString());
  }
}
