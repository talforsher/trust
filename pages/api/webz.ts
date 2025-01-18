import axios from "axios";
import twilio from "twilio";
import { NextApiRequest, NextApiResponse } from "next";
import { TwilioWhatsAppWebhookBody } from "@/types";

export default async function handler(
  req: NextApiRequest & { body: TwilioWhatsAppWebhookBody },
  res: NextApiResponse
) {
  try {
    // Validate request method
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const domain = req.body.Body?.trim();
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

      if (years) parts.push(`${years} year${years !== "1" ? "s" : ""}`);
      if (months) parts.push(`${months} month${months !== "1" ? "s" : ""}`);
      if (days) parts.push(`${days} day${days !== "1" ? "s" : ""}`);
      if (hours) parts.push(`${hours} hour${hours !== "1" ? "s" : ""}`);
      if (minutes) parts.push(`${minutes} minute${minutes !== "1" ? "s" : ""}`);
      if (seconds)
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
• Total Leaks: ${leakCount || 0}
• Cookies Stolen: ${stolenCookies ? "Yes ⚠️" : "No ✅"}
• Location: ${mostRecentLocation || "Unknown"}

📈 *Customer Totals*
${totals
  .map((t: Total) => `• ${t.label}: ${t.total} leak${t.total !== 1 ? "s" : ""}`)
  .join("\n")}

🏢 *Company Report*
• Risk Score: ${companyRiskScore}/5
• Total Leaks: ${companyLeakCount || 0}
• Cookies Stolen: ${companyStolenCookies ? "Yes ⚠️" : "No ✅"}
• Recent Info Stealers: ${
      companyMostRecentInfoStealers?.length
        ? companyMostRecentInfoStealers.join(", ")
        : "None"
    }

📊 *Company Totals*
${companyTotals
  .map((t: Total) => `• ${t.label}: ${t.total} leak${t.total !== 1 ? "s" : ""}`)
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
