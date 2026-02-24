export interface SeedProduct {
  name: string;
  slug: string;
  website_url: string;
  g2_url: string;
  category_slug: string;
}

export const seedProducts: SeedProduct[] = [
  // Project Management
  { name: "Asana", slug: "asana", website_url: "https://asana.com", g2_url: "https://www.g2.com/products/asana/reviews", category_slug: "project-management" },
  { name: "Monday.com", slug: "monday-com", website_url: "https://monday.com", g2_url: "https://www.g2.com/products/monday-com/reviews", category_slug: "project-management" },
  { name: "Trello", slug: "trello", website_url: "https://trello.com", g2_url: "https://www.g2.com/products/trello/reviews", category_slug: "project-management" },
  { name: "ClickUp", slug: "clickup", website_url: "https://clickup.com", g2_url: "https://www.g2.com/products/clickup/reviews", category_slug: "project-management" },
  { name: "Wrike", slug: "wrike", website_url: "https://www.wrike.com", g2_url: "https://www.g2.com/products/wrike/reviews", category_slug: "project-management" },

  // CRM Software
  { name: "Salesforce", slug: "salesforce", website_url: "https://www.salesforce.com", g2_url: "https://www.g2.com/products/salesforce-crm/reviews", category_slug: "crm" },
  { name: "HubSpot CRM", slug: "hubspot-crm", website_url: "https://www.hubspot.com/products/crm", g2_url: "https://www.g2.com/products/hubspot-crm/reviews", category_slug: "crm" },
  { name: "Pipedrive", slug: "pipedrive", website_url: "https://www.pipedrive.com", g2_url: "https://www.g2.com/products/pipedrive/reviews", category_slug: "crm" },
  { name: "Zoho CRM", slug: "zoho-crm", website_url: "https://www.zoho.com/crm", g2_url: "https://www.g2.com/products/zoho-crm/reviews", category_slug: "crm" },

  // Communication
  { name: "Slack", slug: "slack", website_url: "https://slack.com", g2_url: "https://www.g2.com/products/slack/reviews", category_slug: "communication" },
  { name: "Microsoft Teams", slug: "microsoft-teams", website_url: "https://www.microsoft.com/en-us/microsoft-teams", g2_url: "https://www.g2.com/products/microsoft-teams/reviews", category_slug: "communication" },
  { name: "Discord", slug: "discord", website_url: "https://discord.com", g2_url: "https://www.g2.com/products/discord/reviews", category_slug: "communication" },
  { name: "Zoom", slug: "zoom", website_url: "https://zoom.us", g2_url: "https://www.g2.com/products/zoom/reviews", category_slug: "communication" },

  // E-Commerce
  { name: "Shopify", slug: "shopify", website_url: "https://www.shopify.com", g2_url: "https://www.g2.com/products/shopify/reviews", category_slug: "ecommerce" },
  { name: "WooCommerce", slug: "woocommerce", website_url: "https://woocommerce.com", g2_url: "https://www.g2.com/products/woocommerce/reviews", category_slug: "ecommerce" },
  { name: "BigCommerce", slug: "bigcommerce", website_url: "https://www.bigcommerce.com", g2_url: "https://www.g2.com/products/bigcommerce/reviews", category_slug: "ecommerce" },
  { name: "Squarespace", slug: "squarespace", website_url: "https://www.squarespace.com", g2_url: "https://www.g2.com/products/squarespace/reviews", category_slug: "ecommerce" },

  // Analytics & BI
  { name: "Google Analytics", slug: "google-analytics", website_url: "https://analytics.google.com", g2_url: "https://www.g2.com/products/google-analytics/reviews", category_slug: "analytics" },
  { name: "Mixpanel", slug: "mixpanel", website_url: "https://mixpanel.com", g2_url: "https://www.g2.com/products/mixpanel/reviews", category_slug: "analytics" },
  { name: "Amplitude", slug: "amplitude", website_url: "https://amplitude.com", g2_url: "https://www.g2.com/products/amplitude/reviews", category_slug: "analytics" },
  { name: "Heap", slug: "heap", website_url: "https://heap.io", g2_url: "https://www.g2.com/products/heap/reviews", category_slug: "analytics" },

  // Marketing Automation
  { name: "Mailchimp", slug: "mailchimp", website_url: "https://mailchimp.com", g2_url: "https://www.g2.com/products/mailchimp/reviews", category_slug: "marketing" },
  { name: "ActiveCampaign", slug: "activecampaign", website_url: "https://www.activecampaign.com", g2_url: "https://www.g2.com/products/activecampaign/reviews", category_slug: "marketing" },
  { name: "Marketo", slug: "marketo", website_url: "https://business.adobe.com/products/marketo/adobe-marketo.html", g2_url: "https://www.g2.com/products/adobe-marketo-engage/reviews", category_slug: "marketing" },
  { name: "Klaviyo", slug: "klaviyo", website_url: "https://www.klaviyo.com", g2_url: "https://www.g2.com/products/klaviyo/reviews", category_slug: "marketing" },

  // Help Desk
  { name: "Zendesk", slug: "zendesk", website_url: "https://www.zendesk.com", g2_url: "https://www.g2.com/products/zendesk-support-suite/reviews", category_slug: "help-desk" },
  { name: "Freshdesk", slug: "freshdesk", website_url: "https://www.freshworks.com/freshdesk", g2_url: "https://www.g2.com/products/freshdesk/reviews", category_slug: "help-desk" },
  { name: "Intercom", slug: "intercom", website_url: "https://www.intercom.com", g2_url: "https://www.g2.com/products/intercom/reviews", category_slug: "help-desk" },
  { name: "Help Scout", slug: "help-scout", website_url: "https://www.helpscout.com", g2_url: "https://www.g2.com/products/help-scout/reviews", category_slug: "help-desk" },

  // Accounting
  { name: "QuickBooks", slug: "quickbooks", website_url: "https://quickbooks.intuit.com", g2_url: "https://www.g2.com/products/quickbooks-online/reviews", category_slug: "accounting" },
  { name: "Xero", slug: "xero", website_url: "https://www.xero.com", g2_url: "https://www.g2.com/products/xero/reviews", category_slug: "accounting" },
  { name: "FreshBooks", slug: "freshbooks", website_url: "https://www.freshbooks.com", g2_url: "https://www.g2.com/products/freshbooks/reviews", category_slug: "accounting" },
  { name: "Wave", slug: "wave-accounting", website_url: "https://www.waveapps.com", g2_url: "https://www.g2.com/products/wave-accounting/reviews", category_slug: "accounting" },

  // HR Software
  { name: "BambooHR", slug: "bamboohr", website_url: "https://www.bamboohr.com", g2_url: "https://www.g2.com/products/bamboohr/reviews", category_slug: "hr" },
  { name: "Gusto", slug: "gusto", website_url: "https://gusto.com", g2_url: "https://www.g2.com/products/gusto/reviews", category_slug: "hr" },
  { name: "Workday", slug: "workday", website_url: "https://www.workday.com", g2_url: "https://www.g2.com/products/workday-hcm/reviews", category_slug: "hr" },
  { name: "Rippling", slug: "rippling", website_url: "https://www.rippling.com", g2_url: "https://www.g2.com/products/rippling/reviews", category_slug: "hr" },

  // Cloud Hosting
  { name: "AWS", slug: "aws", website_url: "https://aws.amazon.com", g2_url: "https://www.g2.com/products/amazon-web-services-aws/reviews", category_slug: "cloud-hosting" },
  { name: "Google Cloud", slug: "google-cloud", website_url: "https://cloud.google.com", g2_url: "https://www.g2.com/products/google-cloud/reviews", category_slug: "cloud-hosting" },
  { name: "Microsoft Azure", slug: "microsoft-azure", website_url: "https://azure.microsoft.com", g2_url: "https://www.g2.com/products/microsoft-azure/reviews", category_slug: "cloud-hosting" },
  { name: "DigitalOcean", slug: "digitalocean", website_url: "https://www.digitalocean.com", g2_url: "https://www.g2.com/products/digitalocean/reviews", category_slug: "cloud-hosting" },

  // SEO Tools
  { name: "Ahrefs", slug: "ahrefs", website_url: "https://ahrefs.com", g2_url: "https://www.g2.com/products/ahrefs/reviews", category_slug: "seo" },
  { name: "SEMrush", slug: "semrush", website_url: "https://www.semrush.com", g2_url: "https://www.g2.com/products/semrush/reviews", category_slug: "seo" },
  { name: "Moz Pro", slug: "moz-pro", website_url: "https://moz.com", g2_url: "https://www.g2.com/products/moz-pro/reviews", category_slug: "seo" },
  { name: "Surfer SEO", slug: "surfer-seo", website_url: "https://surferseo.com", g2_url: "https://www.g2.com/products/surfer/reviews", category_slug: "seo" },

  // Social Media Management
  { name: "Hootsuite", slug: "hootsuite", website_url: "https://www.hootsuite.com", g2_url: "https://www.g2.com/products/hootsuite/reviews", category_slug: "social-media" },
  { name: "Buffer", slug: "buffer", website_url: "https://buffer.com", g2_url: "https://www.g2.com/products/buffer/reviews", category_slug: "social-media" },
  { name: "Sprout Social", slug: "sprout-social", website_url: "https://sproutsocial.com", g2_url: "https://www.g2.com/products/sprout-social/reviews", category_slug: "social-media" },
  { name: "Later", slug: "later", website_url: "https://later.com", g2_url: "https://www.g2.com/products/later/reviews", category_slug: "social-media" },

  // Email Marketing
  { name: "ConvertKit", slug: "convertkit", website_url: "https://convertkit.com", g2_url: "https://www.g2.com/products/convertkit/reviews", category_slug: "email-marketing" },
  { name: "Constant Contact", slug: "constant-contact", website_url: "https://www.constantcontact.com", g2_url: "https://www.g2.com/products/constant-contact/reviews", category_slug: "email-marketing" },
  { name: "SendGrid", slug: "sendgrid", website_url: "https://sendgrid.com", g2_url: "https://www.g2.com/products/sendgrid/reviews", category_slug: "email-marketing" },
  { name: "Brevo", slug: "brevo", website_url: "https://www.brevo.com", g2_url: "https://www.g2.com/products/brevo/reviews", category_slug: "email-marketing" },

  // Graphic Design
  { name: "Canva", slug: "canva", website_url: "https://www.canva.com", g2_url: "https://www.g2.com/products/canva/reviews", category_slug: "graphic-design" },
  { name: "Figma", slug: "figma", website_url: "https://www.figma.com", g2_url: "https://www.g2.com/products/figma/reviews", category_slug: "graphic-design" },
  { name: "Adobe Photoshop", slug: "adobe-photoshop", website_url: "https://www.adobe.com/products/photoshop.html", g2_url: "https://www.g2.com/products/adobe-photoshop/reviews", category_slug: "graphic-design" },
  { name: "Sketch", slug: "sketch", website_url: "https://www.sketch.com", g2_url: "https://www.g2.com/products/sketch/reviews", category_slug: "graphic-design" },

  // Video Conferencing
  { name: "Google Meet", slug: "google-meet", website_url: "https://meet.google.com", g2_url: "https://www.g2.com/products/google-meet/reviews", category_slug: "video-conferencing" },
  { name: "Webex", slug: "webex", website_url: "https://www.webex.com", g2_url: "https://www.g2.com/products/webex/reviews", category_slug: "video-conferencing" },
  { name: "GoTo Meeting", slug: "goto-meeting", website_url: "https://www.goto.com/meeting", g2_url: "https://www.g2.com/products/goto-meeting/reviews", category_slug: "video-conferencing" },

  // AI Chatbots
  { name: "ChatGPT", slug: "chatgpt", website_url: "https://chat.openai.com", g2_url: "https://www.g2.com/products/chatgpt/reviews", category_slug: "ai-chatbots" },
  { name: "Google Gemini", slug: "google-gemini", website_url: "https://gemini.google.com", g2_url: "https://www.g2.com/products/google-gemini/reviews", category_slug: "ai-chatbots" },
  { name: "Claude", slug: "claude", website_url: "https://claude.ai", g2_url: "https://www.g2.com/products/claude/reviews", category_slug: "ai-chatbots" },
  { name: "Perplexity AI", slug: "perplexity-ai", website_url: "https://www.perplexity.ai", g2_url: "https://www.g2.com/products/perplexity/reviews", category_slug: "ai-chatbots" },

  // AI Writing
  { name: "Jasper", slug: "jasper", website_url: "https://www.jasper.ai", g2_url: "https://www.g2.com/products/jasper/reviews", category_slug: "ai-writing" },
  { name: "Copy.ai", slug: "copy-ai", website_url: "https://www.copy.ai", g2_url: "https://www.g2.com/products/copy-ai/reviews", category_slug: "ai-writing" },
  { name: "Writesonic", slug: "writesonic", website_url: "https://writesonic.com", g2_url: "https://www.g2.com/products/writesonic/reviews", category_slug: "ai-writing" },
  { name: "Grammarly", slug: "grammarly", website_url: "https://www.grammarly.com", g2_url: "https://www.g2.com/products/grammarly/reviews", category_slug: "ai-writing" },

  // AI Code Assistants
  { name: "GitHub Copilot", slug: "github-copilot", website_url: "https://github.com/features/copilot", g2_url: "https://www.g2.com/products/github-copilot/reviews", category_slug: "ai-code" },
  { name: "Cursor", slug: "cursor", website_url: "https://cursor.sh", g2_url: "https://www.g2.com/products/cursor/reviews", category_slug: "ai-code" },
  { name: "Tabnine", slug: "tabnine", website_url: "https://www.tabnine.com", g2_url: "https://www.g2.com/products/tabnine/reviews", category_slug: "ai-code" },
  { name: "Replit", slug: "replit", website_url: "https://replit.com", g2_url: "https://www.g2.com/products/replit/reviews", category_slug: "ai-code" },

  // AI Image Generators
  { name: "Midjourney", slug: "midjourney", website_url: "https://www.midjourney.com", g2_url: "https://www.g2.com/products/midjourney/reviews", category_slug: "ai-image-generators" },
  { name: "DALL-E", slug: "dall-e", website_url: "https://openai.com/dall-e-3", g2_url: "https://www.g2.com/products/dall-e/reviews", category_slug: "ai-image-generators" },
  { name: "Stable Diffusion", slug: "stable-diffusion", website_url: "https://stability.ai", g2_url: "https://www.g2.com/products/stable-diffusion/reviews", category_slug: "ai-image-generators" },
  { name: "Adobe Firefly", slug: "adobe-firefly", website_url: "https://www.adobe.com/products/firefly.html", g2_url: "https://www.g2.com/products/adobe-firefly/reviews", category_slug: "ai-image-generators" },

  // Developer Tools
  { name: "GitHub", slug: "github", website_url: "https://github.com", g2_url: "https://www.g2.com/products/github/reviews", category_slug: "development" },
  { name: "GitLab", slug: "gitlab", website_url: "https://about.gitlab.com", g2_url: "https://www.g2.com/products/gitlab/reviews", category_slug: "development" },
  { name: "VS Code", slug: "vs-code", website_url: "https://code.visualstudio.com", g2_url: "https://www.g2.com/products/visual-studio-code/reviews", category_slug: "development" },
  { name: "JetBrains", slug: "jetbrains", website_url: "https://www.jetbrains.com", g2_url: "https://www.g2.com/products/jetbrains/reviews", category_slug: "development" },

  // No-Code Platforms
  { name: "Bubble", slug: "bubble", website_url: "https://bubble.io", g2_url: "https://www.g2.com/products/bubble/reviews", category_slug: "no-code" },
  { name: "Webflow", slug: "webflow", website_url: "https://webflow.com", g2_url: "https://www.g2.com/products/webflow/reviews", category_slug: "no-code" },
  { name: "Airtable", slug: "airtable", website_url: "https://www.airtable.com", g2_url: "https://www.g2.com/products/airtable/reviews", category_slug: "no-code" },
  { name: "Zapier", slug: "zapier", website_url: "https://zapier.com", g2_url: "https://www.g2.com/products/zapier/reviews", category_slug: "no-code" },

  // Collaboration
  { name: "Notion", slug: "notion", website_url: "https://www.notion.so", g2_url: "https://www.g2.com/products/notion/reviews", category_slug: "collaboration" },
  { name: "Confluence", slug: "confluence", website_url: "https://www.atlassian.com/software/confluence", g2_url: "https://www.g2.com/products/confluence/reviews", category_slug: "collaboration" },
  { name: "Miro", slug: "miro", website_url: "https://miro.com", g2_url: "https://www.g2.com/products/miro/reviews", category_slug: "collaboration" },
  { name: "Loom", slug: "loom", website_url: "https://www.loom.com", g2_url: "https://www.g2.com/products/loom/reviews", category_slug: "collaboration" },

  // CMS
  { name: "WordPress", slug: "wordpress", website_url: "https://wordpress.org", g2_url: "https://www.g2.com/products/wordpress/reviews", category_slug: "cms" },
  { name: "Contentful", slug: "contentful", website_url: "https://www.contentful.com", g2_url: "https://www.g2.com/products/contentful/reviews", category_slug: "cms" },
  { name: "Strapi", slug: "strapi", website_url: "https://strapi.io", g2_url: "https://www.g2.com/products/strapi/reviews", category_slug: "cms" },
  { name: "Ghost", slug: "ghost", website_url: "https://ghost.org", g2_url: "https://www.g2.com/products/ghost/reviews", category_slug: "cms" },

  // Cybersecurity
  { name: "CrowdStrike", slug: "crowdstrike", website_url: "https://www.crowdstrike.com", g2_url: "https://www.g2.com/products/crowdstrike-falcon/reviews", category_slug: "security" },
  { name: "Palo Alto Networks", slug: "palo-alto-networks", website_url: "https://www.paloaltonetworks.com", g2_url: "https://www.g2.com/products/palo-alto-networks/reviews", category_slug: "security" },
  { name: "Okta", slug: "okta", website_url: "https://www.okta.com", g2_url: "https://www.g2.com/products/okta/reviews", category_slug: "security" },
  { name: "Cloudflare", slug: "cloudflare", website_url: "https://www.cloudflare.com", g2_url: "https://www.g2.com/products/cloudflare/reviews", category_slug: "security" },

  // Antivirus
  { name: "Norton", slug: "norton", website_url: "https://us.norton.com", g2_url: "https://www.g2.com/products/norton-360/reviews", category_slug: "antivirus" },
  { name: "Bitdefender", slug: "bitdefender", website_url: "https://www.bitdefender.com", g2_url: "https://www.g2.com/products/bitdefender/reviews", category_slug: "antivirus" },
  { name: "Malwarebytes", slug: "malwarebytes", website_url: "https://www.malwarebytes.com", g2_url: "https://www.g2.com/products/malwarebytes/reviews", category_slug: "antivirus" },

  // Password Management
  { name: "1Password", slug: "1password", website_url: "https://1password.com", g2_url: "https://www.g2.com/products/1password/reviews", category_slug: "password-management" },
  { name: "LastPass", slug: "lastpass", website_url: "https://www.lastpass.com", g2_url: "https://www.g2.com/products/lastpass/reviews", category_slug: "password-management" },
  { name: "Dashlane", slug: "dashlane", website_url: "https://www.dashlane.com", g2_url: "https://www.g2.com/products/dashlane/reviews", category_slug: "password-management" },
  { name: "Bitwarden", slug: "bitwarden", website_url: "https://bitwarden.com", g2_url: "https://www.g2.com/products/bitwarden/reviews", category_slug: "password-management" },

  // Bug Tracking
  { name: "Jira", slug: "jira", website_url: "https://www.atlassian.com/software/jira", g2_url: "https://www.g2.com/products/jira/reviews", category_slug: "bug-tracking" },
  { name: "Linear", slug: "linear", website_url: "https://linear.app", g2_url: "https://www.g2.com/products/linear/reviews", category_slug: "bug-tracking" },
  { name: "Bugzilla", slug: "bugzilla", website_url: "https://www.bugzilla.org", g2_url: "https://www.g2.com/products/bugzilla/reviews", category_slug: "bug-tracking" },
  { name: "Sentry", slug: "sentry", website_url: "https://sentry.io", g2_url: "https://www.g2.com/products/sentry/reviews", category_slug: "bug-tracking" },

  // CI/CD
  { name: "Jenkins", slug: "jenkins", website_url: "https://www.jenkins.io", g2_url: "https://www.g2.com/products/jenkins/reviews", category_slug: "ci-cd" },
  { name: "CircleCI", slug: "circleci", website_url: "https://circleci.com", g2_url: "https://www.g2.com/products/circleci/reviews", category_slug: "ci-cd" },
  { name: "GitHub Actions", slug: "github-actions", website_url: "https://github.com/features/actions", g2_url: "https://www.g2.com/products/github-actions/reviews", category_slug: "ci-cd" },
  { name: "Travis CI", slug: "travis-ci", website_url: "https://www.travis-ci.com", g2_url: "https://www.g2.com/products/travis-ci/reviews", category_slug: "ci-cd" },

  // API Management
  { name: "Postman", slug: "postman", website_url: "https://www.postman.com", g2_url: "https://www.g2.com/products/postman/reviews", category_slug: "api-management" },
  { name: "Swagger", slug: "swagger", website_url: "https://swagger.io", g2_url: "https://www.g2.com/products/swagger/reviews", category_slug: "api-management" },
  { name: "Kong", slug: "kong", website_url: "https://konghq.com", g2_url: "https://www.g2.com/products/kong/reviews", category_slug: "api-management" },
  { name: "Apigee", slug: "apigee", website_url: "https://cloud.google.com/apigee", g2_url: "https://www.g2.com/products/apigee/reviews", category_slug: "api-management" },

  // Database Management
  { name: "MongoDB", slug: "mongodb", website_url: "https://www.mongodb.com", g2_url: "https://www.g2.com/products/mongodb/reviews", category_slug: "database-management" },
  { name: "PostgreSQL", slug: "postgresql", website_url: "https://www.postgresql.org", g2_url: "https://www.g2.com/products/postgresql/reviews", category_slug: "database-management" },
  { name: "Redis", slug: "redis", website_url: "https://redis.io", g2_url: "https://www.g2.com/products/redis/reviews", category_slug: "database-management" },
  { name: "Firebase", slug: "firebase", website_url: "https://firebase.google.com", g2_url: "https://www.g2.com/products/firebase/reviews", category_slug: "database-management" },

  // Business Intelligence
  { name: "Tableau", slug: "tableau", website_url: "https://www.tableau.com", g2_url: "https://www.g2.com/products/tableau/reviews", category_slug: "business-intelligence" },
  { name: "Power BI", slug: "power-bi", website_url: "https://powerbi.microsoft.com", g2_url: "https://www.g2.com/products/microsoft-power-bi/reviews", category_slug: "business-intelligence" },
  { name: "Looker", slug: "looker", website_url: "https://cloud.google.com/looker", g2_url: "https://www.g2.com/products/looker/reviews", category_slug: "business-intelligence" },
  { name: "Metabase", slug: "metabase", website_url: "https://www.metabase.com", g2_url: "https://www.g2.com/products/metabase/reviews", category_slug: "business-intelligence" },

  // Data Visualization
  { name: "D3.js", slug: "d3-js", website_url: "https://d3js.org", g2_url: "https://www.g2.com/products/d3-js/reviews", category_slug: "data-visualization" },
  { name: "Grafana", slug: "grafana", website_url: "https://grafana.com", g2_url: "https://www.g2.com/products/grafana/reviews", category_slug: "data-visualization" },
  { name: "Plotly", slug: "plotly", website_url: "https://plotly.com", g2_url: "https://www.g2.com/products/plotly/reviews", category_slug: "data-visualization" },

  // Chatbot Platforms
  { name: "Drift", slug: "drift", website_url: "https://www.drift.com", g2_url: "https://www.g2.com/products/drift/reviews", category_slug: "chatbots" },
  { name: "Tidio", slug: "tidio", website_url: "https://www.tidio.com", g2_url: "https://www.g2.com/products/tidio/reviews", category_slug: "chatbots" },
  { name: "ManyChat", slug: "manychat", website_url: "https://manychat.com", g2_url: "https://www.g2.com/products/manychat/reviews", category_slug: "chatbots" },

  // Live Chat
  { name: "LiveChat", slug: "livechat", website_url: "https://www.livechat.com", g2_url: "https://www.g2.com/products/livechat/reviews", category_slug: "live-chat" },
  { name: "Olark", slug: "olark", website_url: "https://www.olark.com", g2_url: "https://www.g2.com/products/olark/reviews", category_slug: "live-chat" },
  { name: "Crisp", slug: "crisp", website_url: "https://crisp.chat", g2_url: "https://www.g2.com/products/crisp/reviews", category_slug: "live-chat" },

  // Customer Success
  { name: "Gainsight", slug: "gainsight", website_url: "https://www.gainsight.com", g2_url: "https://www.g2.com/products/gainsight-cs/reviews", category_slug: "customer-success" },
  { name: "ChurnZero", slug: "churnzero", website_url: "https://churnzero.com", g2_url: "https://www.g2.com/products/churnzero/reviews", category_slug: "customer-success" },
  { name: "Totango", slug: "totango", website_url: "https://www.totango.com", g2_url: "https://www.g2.com/products/totango/reviews", category_slug: "customer-success" },

  // Document Management
  { name: "Google Docs", slug: "google-docs", website_url: "https://docs.google.com", g2_url: "https://www.g2.com/products/google-docs/reviews", category_slug: "document-management" },
  { name: "Dropbox", slug: "dropbox", website_url: "https://www.dropbox.com", g2_url: "https://www.g2.com/products/dropbox/reviews", category_slug: "document-management" },
  { name: "Box", slug: "box", website_url: "https://www.box.com", g2_url: "https://www.g2.com/products/box/reviews", category_slug: "document-management" },
  { name: "SharePoint", slug: "sharepoint", website_url: "https://www.microsoft.com/en-us/microsoft-365/sharepoint", g2_url: "https://www.g2.com/products/sharepoint/reviews", category_slug: "document-management" },

  // E-Signature
  { name: "DocuSign", slug: "docusign", website_url: "https://www.docusign.com", g2_url: "https://www.g2.com/products/docusign/reviews", category_slug: "e-signature" },
  { name: "HelloSign", slug: "hellosign", website_url: "https://www.hellosign.com", g2_url: "https://www.g2.com/products/hellosign/reviews", category_slug: "e-signature" },
  { name: "PandaDoc", slug: "pandadoc", website_url: "https://www.pandadoc.com", g2_url: "https://www.g2.com/products/pandadoc/reviews", category_slug: "e-signature" },
  { name: "SignNow", slug: "signnow", website_url: "https://www.signnow.com", g2_url: "https://www.g2.com/products/signnow/reviews", category_slug: "e-signature" },

  // Contract Management
  { name: "Ironclad", slug: "ironclad", website_url: "https://ironcladapp.com", g2_url: "https://www.g2.com/products/ironclad/reviews", category_slug: "contract-management" },
  { name: "ContractWorks", slug: "contractworks", website_url: "https://www.contractworks.com", g2_url: "https://www.g2.com/products/contractworks/reviews", category_slug: "contract-management" },
  { name: "Juro", slug: "juro", website_url: "https://juro.com", g2_url: "https://www.g2.com/products/juro/reviews", category_slug: "contract-management" },

  // Time Tracking
  { name: "Toggl Track", slug: "toggl-track", website_url: "https://toggl.com/track", g2_url: "https://www.g2.com/products/toggl-track/reviews", category_slug: "time-tracking" },
  { name: "Clockify", slug: "clockify", website_url: "https://clockify.me", g2_url: "https://www.g2.com/products/clockify/reviews", category_slug: "time-tracking" },
  { name: "Harvest", slug: "harvest", website_url: "https://www.getharvest.com", g2_url: "https://www.g2.com/products/harvest/reviews", category_slug: "time-tracking" },
  { name: "Hubstaff", slug: "hubstaff", website_url: "https://hubstaff.com", g2_url: "https://www.g2.com/products/hubstaff/reviews", category_slug: "time-tracking" },

  // ERP
  { name: "SAP", slug: "sap", website_url: "https://www.sap.com", g2_url: "https://www.g2.com/products/sap-s-4hana/reviews", category_slug: "erp" },
  { name: "Oracle NetSuite", slug: "oracle-netsuite", website_url: "https://www.netsuite.com", g2_url: "https://www.g2.com/products/oracle-netsuite/reviews", category_slug: "erp" },
  { name: "Odoo", slug: "odoo", website_url: "https://www.odoo.com", g2_url: "https://www.g2.com/products/odoo/reviews", category_slug: "erp" },

  // LMS
  { name: "Moodle", slug: "moodle", website_url: "https://moodle.org", g2_url: "https://www.g2.com/products/moodle/reviews", category_slug: "lms" },
  { name: "Canvas LMS", slug: "canvas-lms", website_url: "https://www.instructure.com/canvas", g2_url: "https://www.g2.com/products/canvas-lms/reviews", category_slug: "lms" },
  { name: "Teachable", slug: "teachable", website_url: "https://teachable.com", g2_url: "https://www.g2.com/products/teachable/reviews", category_slug: "lms" },
  { name: "Thinkific", slug: "thinkific", website_url: "https://www.thinkific.com", g2_url: "https://www.g2.com/products/thinkific/reviews", category_slug: "lms" },

  // Payroll
  { name: "ADP", slug: "adp", website_url: "https://www.adp.com", g2_url: "https://www.g2.com/products/adp-workforce-now/reviews", category_slug: "payroll" },
  { name: "Paychex", slug: "paychex", website_url: "https://www.paychex.com", g2_url: "https://www.g2.com/products/paychex/reviews", category_slug: "payroll" },
  { name: "Deel", slug: "deel", website_url: "https://www.deel.com", g2_url: "https://www.g2.com/products/deel/reviews", category_slug: "payroll" },

  // Expense Management
  { name: "Expensify", slug: "expensify", website_url: "https://www.expensify.com", g2_url: "https://www.g2.com/products/expensify/reviews", category_slug: "expense-management" },
  { name: "SAP Concur", slug: "sap-concur", website_url: "https://www.concur.com", g2_url: "https://www.g2.com/products/sap-concur/reviews", category_slug: "expense-management" },
  { name: "Brex", slug: "brex", website_url: "https://www.brex.com", g2_url: "https://www.g2.com/products/brex/reviews", category_slug: "expense-management" },

  // Invoicing
  { name: "Stripe Billing", slug: "stripe-billing", website_url: "https://stripe.com/billing", g2_url: "https://www.g2.com/products/stripe-billing/reviews", category_slug: "invoicing" },
  { name: "PayPal Invoicing", slug: "paypal-invoicing", website_url: "https://www.paypal.com/invoice", g2_url: "https://www.g2.com/products/paypal/reviews", category_slug: "invoicing" },
  { name: "Zoho Invoice", slug: "zoho-invoice", website_url: "https://www.zoho.com/invoice", g2_url: "https://www.g2.com/products/zoho-invoice/reviews", category_slug: "invoicing" },

  // Tax
  { name: "TurboTax", slug: "turbotax", website_url: "https://turbotax.intuit.com", g2_url: "https://www.g2.com/products/turbotax/reviews", category_slug: "tax" },
  { name: "H&R Block", slug: "hr-block", website_url: "https://www.hrblock.com", g2_url: "https://www.g2.com/products/h-r-block/reviews", category_slug: "tax" },
  { name: "TaxJar", slug: "taxjar", website_url: "https://www.taxjar.com", g2_url: "https://www.g2.com/products/taxjar/reviews", category_slug: "tax" },

  // Recruitment
  { name: "Greenhouse", slug: "greenhouse", website_url: "https://www.greenhouse.com", g2_url: "https://www.g2.com/products/greenhouse/reviews", category_slug: "recruitment" },
  { name: "Lever", slug: "lever", website_url: "https://www.lever.co", g2_url: "https://www.g2.com/products/lever/reviews", category_slug: "recruitment" },
  { name: "Workable", slug: "workable", website_url: "https://www.workable.com", g2_url: "https://www.g2.com/products/workable/reviews", category_slug: "recruitment" },
  { name: "Ashby", slug: "ashby", website_url: "https://www.ashbyhq.com", g2_url: "https://www.g2.com/products/ashby/reviews", category_slug: "recruitment" },

  // Employee Engagement
  { name: "Lattice", slug: "lattice", website_url: "https://lattice.com", g2_url: "https://www.g2.com/products/lattice/reviews", category_slug: "employee-engagement" },
  { name: "Culture Amp", slug: "culture-amp", website_url: "https://www.cultureamp.com", g2_url: "https://www.g2.com/products/culture-amp/reviews", category_slug: "employee-engagement" },
  { name: "15Five", slug: "15five", website_url: "https://www.15five.com", g2_url: "https://www.g2.com/products/15five/reviews", category_slug: "employee-engagement" },

  // Lead Generation
  { name: "Apollo.io", slug: "apollo-io", website_url: "https://www.apollo.io", g2_url: "https://www.g2.com/products/apollo-io/reviews", category_slug: "lead-generation" },
  { name: "ZoomInfo", slug: "zoominfo", website_url: "https://www.zoominfo.com", g2_url: "https://www.g2.com/products/zoominfo/reviews", category_slug: "lead-generation" },
  { name: "Lusha", slug: "lusha", website_url: "https://www.lusha.com", g2_url: "https://www.g2.com/products/lusha/reviews", category_slug: "lead-generation" },
  { name: "Hunter.io", slug: "hunter-io", website_url: "https://hunter.io", g2_url: "https://www.g2.com/products/hunter/reviews", category_slug: "lead-generation" },

  // Sales Engagement
  { name: "Outreach", slug: "outreach", website_url: "https://www.outreach.io", g2_url: "https://www.g2.com/products/outreach/reviews", category_slug: "sales-engagement" },
  { name: "SalesLoft", slug: "salesloft", website_url: "https://www.salesloft.com", g2_url: "https://www.g2.com/products/salesloft/reviews", category_slug: "sales-engagement" },
  { name: "Gong", slug: "gong", website_url: "https://www.gong.io", g2_url: "https://www.g2.com/products/gong/reviews", category_slug: "sales-engagement" },

  // Sales Intelligence
  { name: "Clearbit", slug: "clearbit", website_url: "https://clearbit.com", g2_url: "https://www.g2.com/products/clearbit/reviews", category_slug: "sales-intelligence" },
  { name: "Bombora", slug: "bombora", website_url: "https://bombora.com", g2_url: "https://www.g2.com/products/bombora/reviews", category_slug: "sales-intelligence" },
  { name: "6sense", slug: "6sense", website_url: "https://6sense.com", g2_url: "https://www.g2.com/products/6sense/reviews", category_slug: "sales-intelligence" },

  // Proposal
  { name: "Proposify", slug: "proposify", website_url: "https://www.proposify.com", g2_url: "https://www.g2.com/products/proposify/reviews", category_slug: "proposal" },
  { name: "Qwilr", slug: "qwilr", website_url: "https://qwilr.com", g2_url: "https://www.g2.com/products/qwilr/reviews", category_slug: "proposal" },
  { name: "Better Proposals", slug: "better-proposals", website_url: "https://betterproposals.io", g2_url: "https://www.g2.com/products/better-proposals/reviews", category_slug: "proposal" },

  // Survey
  { name: "SurveyMonkey", slug: "surveymonkey", website_url: "https://www.surveymonkey.com", g2_url: "https://www.g2.com/products/surveymonkey/reviews", category_slug: "survey" },
  { name: "Typeform", slug: "typeform", website_url: "https://www.typeform.com", g2_url: "https://www.g2.com/products/typeform/reviews", category_slug: "survey" },
  { name: "Google Forms", slug: "google-forms", website_url: "https://docs.google.com/forms", g2_url: "https://www.g2.com/products/google-forms/reviews", category_slug: "survey" },
  { name: "Qualtrics", slug: "qualtrics", website_url: "https://www.qualtrics.com", g2_url: "https://www.g2.com/products/qualtrics/reviews", category_slug: "survey" },

  // Inventory Management
  { name: "TradeGecko", slug: "tradegecko", website_url: "https://www.tradegecko.com", g2_url: "https://www.g2.com/products/tradegecko/reviews", category_slug: "inventory-management" },
  { name: "Cin7", slug: "cin7", website_url: "https://www.cin7.com", g2_url: "https://www.g2.com/products/cin7/reviews", category_slug: "inventory-management" },
  { name: "Fishbowl", slug: "fishbowl", website_url: "https://www.fishbowlinventory.com", g2_url: "https://www.g2.com/products/fishbowl/reviews", category_slug: "inventory-management" },

  // Supply Chain
  { name: "SAP SCM", slug: "sap-scm", website_url: "https://www.sap.com/products/scm.html", g2_url: "https://www.g2.com/products/sap-scm/reviews", category_slug: "supply-chain" },
  { name: "Oracle SCM Cloud", slug: "oracle-scm", website_url: "https://www.oracle.com/scm", g2_url: "https://www.g2.com/products/oracle-scm-cloud/reviews", category_slug: "supply-chain" },
  { name: "Coupa", slug: "coupa", website_url: "https://www.coupa.com", g2_url: "https://www.g2.com/products/coupa/reviews", category_slug: "supply-chain" },

  // Backup
  { name: "Veeam", slug: "veeam", website_url: "https://www.veeam.com", g2_url: "https://www.g2.com/products/veeam/reviews", category_slug: "backup" },
  { name: "Acronis", slug: "acronis", website_url: "https://www.acronis.com", g2_url: "https://www.g2.com/products/acronis/reviews", category_slug: "backup" },
  { name: "Backblaze", slug: "backblaze", website_url: "https://www.backblaze.com", g2_url: "https://www.g2.com/products/backblaze/reviews", category_slug: "backup" },

  // Text to Speech
  { name: "ElevenLabs", slug: "elevenlabs", website_url: "https://elevenlabs.io", g2_url: "https://www.g2.com/products/elevenlabs/reviews", category_slug: "text-to-speech" },
  { name: "Murf AI", slug: "murf-ai", website_url: "https://murf.ai", g2_url: "https://www.g2.com/products/murf-ai/reviews", category_slug: "text-to-speech" },
  { name: "Play.ht", slug: "play-ht", website_url: "https://play.ht", g2_url: "https://www.g2.com/products/play-ht/reviews", category_slug: "text-to-speech" },

  // VPN
  { name: "NordVPN", slug: "nordvpn", website_url: "https://nordvpn.com", g2_url: "https://www.g2.com/products/nordvpn/reviews", category_slug: "vpn" },
  { name: "ExpressVPN", slug: "expressvpn", website_url: "https://www.expressvpn.com", g2_url: "https://www.g2.com/products/expressvpn/reviews", category_slug: "vpn" },
  { name: "Surfshark", slug: "surfshark", website_url: "https://surfshark.com", g2_url: "https://www.g2.com/products/surfshark/reviews", category_slug: "vpn" },

  // Website Builder
  { name: "Wix", slug: "wix", website_url: "https://www.wix.com", g2_url: "https://www.g2.com/products/wix/reviews", category_slug: "website-builder" },
  { name: "Framer", slug: "framer", website_url: "https://www.framer.com", g2_url: "https://www.g2.com/products/framer/reviews", category_slug: "website-builder" },
  { name: "Carrd", slug: "carrd", website_url: "https://carrd.co", g2_url: "https://www.g2.com/products/carrd/reviews", category_slug: "website-builder" },
];

// Popular comparisons to auto-create
export const popularComparisons = [
  { products: ["asana", "monday-com"], title: "Asana vs Monday.com" },
  { products: ["asana", "clickup"], title: "Asana vs ClickUp" },
  { products: ["slack", "microsoft-teams"], title: "Slack vs Microsoft Teams" },
  { products: ["salesforce", "hubspot-crm"], title: "Salesforce vs HubSpot CRM" },
  { products: ["shopify", "woocommerce"], title: "Shopify vs WooCommerce" },
  { products: ["figma", "sketch"], title: "Figma vs Sketch" },
  { products: ["notion", "confluence"], title: "Notion vs Confluence" },
  { products: ["jira", "linear"], title: "Jira vs Linear" },
  { products: ["ahrefs", "semrush"], title: "Ahrefs vs SEMrush" },
  { products: ["zendesk", "freshdesk"], title: "Zendesk vs Freshdesk" },
  { products: ["quickbooks", "xero"], title: "QuickBooks vs Xero" },
  { products: ["github-copilot", "cursor"], title: "GitHub Copilot vs Cursor" },
  { products: ["chatgpt", "claude"], title: "ChatGPT vs Claude" },
  { products: ["midjourney", "dall-e"], title: "Midjourney vs DALL-E" },
  { products: ["1password", "lastpass"], title: "1Password vs LastPass" },
  { products: ["aws", "google-cloud"], title: "AWS vs Google Cloud" },
  { products: ["tableau", "power-bi"], title: "Tableau vs Power BI" },
  { products: ["mailchimp", "activecampaign"], title: "Mailchimp vs ActiveCampaign" },
  { products: ["docusign", "pandadoc"], title: "DocuSign vs PandaDoc" },
  { products: ["bamboohr", "rippling"], title: "BambooHR vs Rippling" },
  { products: ["hootsuite", "buffer"], title: "Hootsuite vs Buffer" },
  { products: ["wordpress", "ghost"], title: "WordPress vs Ghost" },
  { products: ["toggl-track", "clockify"], title: "Toggl Track vs Clockify" },
  { products: ["greenhouse", "lever"], title: "Greenhouse vs Lever" },
  { products: ["surveymonkey", "typeform"], title: "SurveyMonkey vs Typeform" },
  { products: ["mongodb", "postgresql"], title: "MongoDB vs PostgreSQL" },
  { products: ["zoom", "google-meet"], title: "Zoom vs Google Meet" },
  { products: ["canva", "adobe-photoshop"], title: "Canva vs Adobe Photoshop" },
  { products: ["github", "gitlab"], title: "GitHub vs GitLab" },
  { products: ["bubble", "webflow"], title: "Bubble vs Webflow" },
];
