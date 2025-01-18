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

    const message = `*Domain Report for ${domain}*

📊 *Customer Report*
• Risk Score: ${riskScore}/5
• Last Exposure: ${
      lastExposureDate ? new Date(lastExposureDate).toLocaleDateString() : "N/A"
    }
• Time Since Exposure: ${timeFromLastExposure || "N/A"}
• Recent Info Stealers: ${
      mostRecentInfoStealers?.length
        ? mostRecentInfoStealers.join(", ")
        : "None"
    }
• Total Leaks: ${leakCount || 0}
• Cookies Stolen: ${stolenCookies ? "Yes ⚠️" : "No ✅"}
• Location: ${mostRecentLocation || "Unknown"}

🏢 *Company Report*
• Risk Score: ${companyRiskScore}/5
• Total Leaks: ${companyLeakCount || 0}
• Cookies Stolen: ${companyStolenCookies ? "Yes ⚠️" : "No ✅"}
• Recent Info Stealers: ${
      companyMostRecentInfoStealers?.length
        ? companyMostRecentInfoStealers.join(", ")
        : "None"
    }`;

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
