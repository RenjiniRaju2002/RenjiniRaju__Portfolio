/**
 * CV approval gate — deploy as Web app (Execute as: Me, Who has access: Anyone).
 * 1) Paste your deployed Web App URL into WEB_APP_URL below, then deploy again.
 * 2) First deploy: leave WEB_APP_URL blank, deploy, copy URL from Manage deployments, paste here, redeploy.
 */
var OWNER_EMAIL = "renjiniraju14@gmail.com";
var WEB_APP_URL = ""; // e.g. https://script.google.com/macros/s/AKfycby.../exec

function doGet(e) {
  var p = e.parameter;
  var action = p.action;
  if (action === "request" && p.email) {
    return jsonOut(requestCv(String(p.email).trim()));
  }
  if (action === "approve" && p.token) {
    return htmlOut(approveToken(String(p.token).trim()));
  }
  if (action === "status" && p.token) {
    return jsonOut(statusToken(String(p.token).trim()));
  }
  return ContentService.createTextOutput("CV gate OK").setMimeType(ContentService.MimeType.TEXT);
}

function requestCv(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Invalid email" };
  }
  var token = Utilities.getUuid();
  var props = PropertiesService.getScriptProperties();
  props.setProperty("t_" + token, email);
  props.setProperty("t_" + token + "_ts", String(Date.now()));

  var base = WEB_APP_URL.replace(/\/$/, "");
  if (!base) {
    return { ok: false, error: "WEB_APP_URL not set in Code.gs — paste deployment URL and redeploy." };
  }
  var approveUrl = base + "?action=approve&token=" + encodeURIComponent(token);

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: "Portfolio CV — APPROVE download for " + email,
    body:
      "Someone requested your CV from your portfolio.\n\nVisitor email: " +
      email +
      "\n\nClick this link to approve (they can then download):\n" +
      approveUrl +
      "\n\nIf this was not you, ignore this email.",
  });

  return { ok: true, token: token };
}

function approveToken(token) {
  if (!token) {
    return "<p style='font-family:sans-serif'>Missing token.</p>";
  }
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty("t_" + token)) {
    return "<p style='font-family:sans-serif'>Invalid or unknown request.</p>";
  }
  props.setProperty("a_" + token, "1");
  return (
    "<p style='font-family:sans-serif;font-size:18px'><strong>Approved.</strong></p>" +
    "<p style='font-family:sans-serif'>The visitor can now use <strong>Check approval</strong> on the site (or wait for auto-check) and download your CV.</p>"
  );
}

function statusToken(token) {
  if (!token) {
    return { ok: false, approved: false, error: "missing token" };
  }
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty("a_" + token) === "1") {
    return { ok: true, approved: true };
  }
  return { ok: true, approved: false };
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function htmlOut(html) {
  return HtmlService.createHtmlOutput(html);
}
