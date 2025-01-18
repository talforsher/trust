import axios from "axios";
import twilio from "twilio";
import { NextApiRequest, NextApiResponse } from "next";
import { TwilioWhatsAppWebhookBody } from "@/types";

export default async function handler(
  req: NextApiRequest & { body: TwilioWhatsAppWebhookBody },
  res: NextApiResponse
) {
  const domain = req.body.Body;

  const response = await axios.post("https://webz.io/api/get_report", {
    domain,
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

  const message = `*${domain}*
  *Risk Score:* ${riskScore}
  *Last Exposure Date:* ${lastExposureDate}
  *Time From Last Exposure:* ${timeFromLastExposure}
  *Most Recent Info Stealers:* ${mostRecentInfoStealers}
  *Totals:* ${totals}
  *Leak Count:* ${leakCount}
  *Stolen Cookies:* ${stolenCookies}
  *Most Recent Location:* ${mostRecentLocation}
  `;

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message);

  res.setHeader("Content-Type", "text/xml");
  res.status(200).send(twiml.toString());
}
